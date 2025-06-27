import { StakingSdkTypedApi } from "./descriptors"
import { StakingSdk } from "./sdk-types"

const assertEra = (activeEra: number, depth: number, era: number) => {
  if (era <= activeEra - depth || era > activeEra) {
    throw new Error("Era info is not found on chain")
  }
}

export function createStakingSdk(
  api: StakingSdkTypedApi,
  _settings: { maxActiveNominators: number },
): StakingSdk {
  const getNominatorStatus: StakingSdk["getNominatorStatus"] = async (
    addr,
    era,
  ) => {
    const [activeEra, depth] = await Promise.all([
      api.query.Staking.ActiveEra.getValue().then((val) => val!.index),
      api.constants.Staking.HistoryDepth(),
    ])
    era ??= activeEra
    assertEra(activeEra, depth, era)
    const active = (
      await api.query.Staking.ErasStakersPaged.getEntries(era)
    ).flatMap(({ keyArgs: [, validator], value: { others } }) =>
      others
        .filter(({ who }) => who === addr)
        .map(({ value }) => ({ validator, activeBond: value })),
    )
    return { era, active }
  }
  // TODO: include VoterList check
  const canNominate: StakingSdk["canNominate"] = async (addr) => {
    const [{ data }, ledger, minBond, ed] = await Promise.all([
      api.query.System.Account.getValue(addr),
      api.query.Staking.Bonded.getValue(addr).then((controller) =>
        controller ? api.query.Staking.Ledger.getValue(controller) : undefined,
      ),
      api.query.Staking.MinNominatorBond.getValue(),
      api.constants.Balances.ExistentialDeposit(),
    ])
    const maxBond = data.free - (data.reserved < ed ? data.reserved - ed : 0n)

    const canNominate = maxBond >= minBond
    if (!canNominate) return { canNominate }
    return { canNominate, maxBond, currentBond: ledger?.total ?? 0n }
  }
  return {
    getNominatorStatus,
    canNominate,
  }
}
