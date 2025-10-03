import { SS58String, TypedApi } from "polkadot-api"
import { Dot } from "../.papi/descriptors/dist"
import { AccountStatus, StakingSdk } from "./sdk-types"

export const getAccountStatus =
  (api: TypedApi<Dot>): StakingSdk["getAccountStatus"] =>
  async (addr: SS58String) => {
    const asyncBalance = getBalance(api, addr)
    const [balance, nomination, nominationPool] = await Promise.all([
      asyncBalance,
      getNomination(api, addr, asyncBalance),
      getNominationPool(api, addr),
    ])

    return { balance, nomination, nominationPool }
  }

const maxBigInt = (a: bigint, b: bigint) => (a > b ? a : b)

const getBalance = async (
  api: TypedApi<Dot>,
  addr: SS58String,
): Promise<AccountStatus["balance"]> => {
  const { data } = await api.query.System.Account.getValue(addr)
  const existentialDeposit = await api.constants.Balances.ExistentialDeposit()

  // https://wiki.polkadot.network/learn/learn-account-balances/
  // Total tokens in the account
  const total = data.reserved + data.free
  // Portion of "free" balance that can't be transferred.
  const untouchable =
    total == 0n
      ? 0n
      : maxBigInt(data.frozen - data.reserved, existentialDeposit)
  // Portion of "free" balance that can be transferred
  const spendable = data.free - untouchable
  // Portion of "total" balance that is somehow locked
  const locked = data.reserved + untouchable

  return {
    raw: {
      ...data,
      existentialDeposit: total > 0n ? existentialDeposit : 0n,
    },
    total,
    locked,
    untouchable,
    spendable,
  }
}

const getNomination = async (
  api: TypedApi<Dot>,
  addr: SS58String,
  asyncBalance: Promise<AccountStatus["balance"]>,
) => {
  const [balance, bonded, minNominationBond, lastMinRewardingBond, nominator] =
    await Promise.all([
      asyncBalance,
      api.query.Staking.Bonded.getValue(addr).then(async (controller) => {
        if (!controller) return null
        return {
          controller,
          ledger: await api.query.Staking.Ledger.getValue(controller),
        }
      }),
      api.query.Staking.MinNominatorBond.getValue(),
      api.query.Staking.MinimumActiveStake.getValue(),
      api.query.Staking.Nominators.getValue(addr),
    ])

  const currentBond = bonded?.ledger?.total ?? 0n
  const activeBond = bonded?.ledger?.active ?? 0n
  const unlocks = bonded?.ledger?.unlocking ?? []
  const maxBond =
    currentBond + balance.raw.free - balance.raw.existentialDeposit
  const canNominate = maxBond >= minNominationBond
  const nominating = nominator?.targets
    ? {
        validators: nominator.targets,
      }
    : null

  return {
    canNominate,
    minNominationBond,
    lastMinRewardingBond,
    controller: bonded?.controller ?? null,
    currentBond,
    activeBond,
    unlocks,
    maxBond,
    nominating,
  }
}

const getNominationPool = async (api: TypedApi<Dot>, addr: SS58String) => {
  const [member, pendingRewards] = await Promise.all([
    api.query.NominationPools.PoolMembers.getValue(addr),
    api.apis.NominationPoolsApi.pending_rewards(addr),
  ])

  if (!member) {
    return { currentBond: 0n, pendingRewards, pool: null, unlocks: [] }
  }

  const currentBond = await api.apis.NominationPoolsApi.points_to_balance(
    member.pool_id,
    member.points,
  )

  const unlocks = member.unbonding_eras.map(([era, value]) => ({ era, value }))

  return { currentBond, pendingRewards, pool: member.pool_id, unlocks }
}
