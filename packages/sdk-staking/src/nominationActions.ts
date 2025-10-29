import { wrapAsyncTx } from "@polkadot-api/common-sdk-utils"
import { PolkadotClient, Transaction } from "polkadot-api"
import {
  dot,
  wndAh,
  MultiAddress,
  StakingRewardDestination,
} from "../.papi/descriptors/dist"
import { StakingSdk } from "./sdk-types"

export const stopNominationFn = (
  client: PolkadotClient,
): StakingSdk["stopNomination"] => {
  const api = client.getTypedApi(dot)
  const wndApi = client.getTypedApi(wndAh)
  const unsafeApi = client.getUnsafeApi()

  return (address) =>
    wrapAsyncTx(async () => {
      const [nominator, ledger, payee] = await Promise.all([
        api.query.Staking.Nominators.getValue(address),
        api.query.Staking.Bonded.getValue(address).then((controller) =>
          controller ? wndApi.query.Staking.Ledger.getValue(controller) : null,
        ),
        api.query.Staking.Payee.getValue(address),
      ])

      const txs: Transaction<any, any, any, any>[] = []
      // Chill only if it has targets selected
      if (nominator?.targets.length) {
        txs.push(api.tx.Staking.chill())
      }

      // Unbond only if it has active bond
      const currentBond = ledger?.active ?? 0n
      if (currentBond > 0n) {
        txs.push(
          api.tx.Staking.unbond({
            value: currentBond,
          }),
        )
      }

      // Move payee from staked to stash for the upcoming era payout
      if (payee?.type === "Staked") {
        txs.push(
          api.tx.Staking.set_payee({
            payee: StakingRewardDestination.Stash(),
          }),
        )
      }

      if (txs.length === 0) {
        throw new Error(`Account ${address} is not nominating`)
      }

      if (txs.length == 1) {
        return txs[0]
      }

      const calls = txs.map((tx) => tx.decodedCall)
      return unsafeApi.tx.Utility.batch_all({
        calls,
      }) as unknown as Transaction<any, any, any, any>
    })
}

export const upsertNominationFn = (
  client: PolkadotClient,
): StakingSdk["upsertNomination"] => {
  const api = client.getTypedApi(dot)
  const wndApi = client.getTypedApi(wndAh)
  const unsafeApi = client.getUnsafeApi()

  return (address, { bond, payee, validators }) =>
    wrapAsyncTx(async () => {
      const [nominator, ledger, currentPayee] = await Promise.all([
        api.query.Staking.Nominators.getValue(address),
        api.query.Staking.Bonded.getValue(address).then((controller) =>
          controller ? wndApi.query.Staking.Ledger.getValue(controller) : null,
        ),
        api.query.Staking.Payee.getValue(address),
      ])
      const currentBond = ledger?.active ?? 0n
      const totalLocked = ledger?.total ?? 0n
      const unlocking = totalLocked - currentBond

      const txs: Array<Transaction<any, any, any, any>> = []

      const bondDiff = bond != null ? bond - currentBond : 0n
      if (bondDiff > 0) {
        if (totalLocked == 0n) {
          txs.push(
            api.tx.Staking.bond({
              value: bondDiff,
              payee: payee ?? StakingRewardDestination.Stash(),
            }),
          )
        } else {
          const rebond = unlocking < bondDiff ? unlocking : bondDiff
          const bondAfterRebond = bondDiff - rebond

          if (rebond > 0) {
            txs.push(
              api.tx.Staking.rebond({
                value: rebond,
              }),
            )
          }
          if (bondAfterRebond > 0) {
            txs.push(
              api.tx.Staking.bond_extra({
                max_additional: bondAfterRebond,
              }),
            )
          }
        }
      } else if (bondDiff < 0) {
        txs.push(api.tx.Staking.unbond({ value: -bondDiff }))
      }

      if (validators) {
        const validatorSet = new Set(validators)

        const oldSelection = nominator?.targets ?? []
        const hasDifferentValidators =
          oldSelection.length != validatorSet.size ||
          oldSelection.some((old) => !validatorSet.has(old))
        if (hasDifferentValidators) {
          txs.push(
            api.tx.Staking.nominate({
              targets: validators.map((v) => MultiAddress.Id(v)),
            }),
          )
        }
      }

      if (
        payee != null &&
        // if we don't have a currentPayee, then we are already calling bond with payee
        currentPayee &&
        (payee.type != currentPayee.type || payee.value != currentPayee.value)
      ) {
        txs.push(
          api.tx.Staking.set_payee({
            payee,
          }),
        )
      }

      const calls = txs.map((tx) => tx.decodedCall)

      if (txs.length === 1) {
        return txs[0]
      }
      return unsafeApi.tx.Utility.batch_all({
        calls,
      }) as unknown as Transaction<any, any, any, any>
    })
}
