import { combineKeys, partitionByKey, toKeySet } from "@react-rxjs/utils"
import { Binary, TxEvent } from "polkadot-api"
import {
  combineLatest,
  distinctUntilChanged,
  map,
  mergeMap,
  takeWhile,
} from "rxjs"
import { getBountyDescriptions$ } from "./bounty-descriptions"
import { BountiesSdkTypedApi, BountyWithoutDescription } from "./descriptors"
import {
  findApprovingReferenda,
  findProposingCuratorReferenda,
} from "./find-referenda"
import { scheduledFinder } from "./find-scheduled"
import { BountiesSdk, Bounty, GenericBounty, ProposedBounty } from "./sdk-types"

export function createBountiesSdk(typedApi: BountiesSdkTypedApi): BountiesSdk {
  const { findScheduledApproved, findScheduledCuratorProposed } =
    scheduledFinder(typedApi)

  const enhanceBounty = (
    bounty: BountyWithoutDescription,
    description: string | null,
    id: number,
  ): Bounty => {
    const generic: GenericBounty = {
      ...bounty,
      type: bounty.status.type,
      id,
      description,
    }

    switch (generic.status.type) {
      case "Proposed":
        return {
          ...generic,
          type: "Proposed",
          approve() {
            return typedApi.tx.Bounties.approve_bounty({ bounty_id: id })
          },
          close() {
            return typedApi.tx.Bounties.close_bounty({ bounty_id: id })
          },
          filterApprovingReferenda(referenda) {
            return findApprovingReferenda(referenda, id)
          },
          getScheduledApprovals() {
            return findScheduledApproved(id)
          },
        }
      case "Approved":
        return { ...generic, type: "Approved" }
      case "Funded":
        return {
          ...generic,
          type: "Funded",
          proposeCurator(curator, fee) {
            return typedApi.tx.Bounties.propose_curator({
              bounty_id: id,
              curator: {
                type: "Id",
                value: curator,
              },
              fee,
            })
          },
          close() {
            return typedApi.tx.Bounties.close_bounty({ bounty_id: id })
          },
          filterProposingReferenda(referenda) {
            return findProposingCuratorReferenda(referenda, id)
          },
          getScheduledProposals() {
            return findScheduledCuratorProposed(id)
          },
        }
      case "CuratorProposed":
        return {
          ...generic,
          ...generic.status.value,
          type: "CuratorProposed",
          acceptCuratorRole() {
            return typedApi.tx.Bounties.accept_curator({ bounty_id: id })
          },
          unassignCurator() {
            return typedApi.tx.Bounties.unassign_curator({ bounty_id: id })
          },
          close() {
            return typedApi.tx.Bounties.close_bounty({ bounty_id: id })
          },
        }
      case "Active":
        return {
          ...generic,
          type: "Active",
          curator: generic.status.value.curator,
          updateDue: generic.status.value.update_due,
          extendExpiry(remark) {
            return typedApi.tx.Bounties.extend_bounty_expiry({
              bounty_id: id,
              remark: Binary.fromText(remark ?? ""),
            })
          },
          award(beneficiary) {
            return typedApi.tx.Bounties.award_bounty({
              bounty_id: id,
              beneficiary: {
                type: "Id",
                value: beneficiary,
              },
            })
          },
          unassignCurator() {
            return typedApi.tx.Bounties.unassign_curator({ bounty_id: id })
          },
          close() {
            return typedApi.tx.Bounties.close_bounty({ bounty_id: id })
          },
        }
      case "PendingPayout":
        return {
          ...generic,
          type: "PendingPayout",
          curator: generic.status.value.curator,
          unlockAt: generic.status.value.unlock_at,
          beneficiary: generic.status.value.beneficiary,
          claim() {
            return typedApi.tx.Bounties.claim_bounty({ bounty_id: id })
          },
          unassignCurator() {
            return typedApi.tx.Bounties.unassign_curator({ bounty_id: id })
          },
        }
    }
    throw new Error("Unreachable")
  }

  function watchBounties() {
    const [getBountyById$, bountyKeyChanges$] = partitionByKey(
      typedApi.query.Bounties.Bounties.watchEntries().pipe(
        mergeMap((v) =>
          v.deltas
            ? [
                ...v.deltas.deleted.map((d) => ({
                  id: d.args[0],
                  value: undefined,
                })),
                ...v.deltas.upserted.map((d) => ({
                  id: d.args[0],
                  value: d.value,
                })),
              ].sort((a, b) => a.id - b.id)
            : [],
        ),
      ),
      (res) => res.id,
      (group$, id) =>
        group$.pipe(
          takeWhile(({ value }) => Boolean(value), false),
          map((bounty) => ({
            id,
            bounty: bounty.value!,
          })),
        ),
    )
    const descriptions$ = getBountyDescriptions$(
      typedApi.query.Bounties.BountyDescriptions.getEntries,
      typedApi.query.Bounties.BountyDescriptions.getValues,
      bountyKeyChanges$,
    )

    const bountyIds$ = bountyKeyChanges$.pipe(
      toKeySet(),
      map((set) => [...set]),
    )

    const getEnhancedBountyById$ = (id: number) =>
      combineLatest([
        getBountyById$(id),
        descriptions$.pipe(
          map((r): string | null => r[id] ?? null),
          distinctUntilChanged(),
        ),
      ]).pipe(
        map(([{ id, bounty }, description]) =>
          enhanceBounty(bounty, description, id),
        ),
      )

    return {
      bounties$: combineKeys(bountyIds$, getEnhancedBountyById$),
      getBountyById$: getEnhancedBountyById$,
      bountyIds$,
    }
  }

  function getBounty(id: number, at?: string) {
    return Promise.all([
      typedApi.query.Bounties.Bounties.getValue(id, { at }),
      typedApi.query.Bounties.BountyDescriptions.getValue(id, { at }),
    ]).then(([bounty, description]) =>
      bounty
        ? enhanceBounty(bounty, description ? description.asText() : null, id)
        : null,
    )
  }

  async function getProposedBounty(
    txEvent: TxEvent,
  ): Promise<ProposedBounty | null> {
    if (!("events" in txEvent)) {
      return null
    }
    const proposedBountyEvt = typedApi.event.Bounties.BountyProposed.filter(
      txEvent.events,
    )[0]
    if (!proposedBountyEvt) {
      return null
    }
    const id = proposedBountyEvt.index
    const at = txEvent.type === "finalized" ? undefined : txEvent.block.hash

    const bounty = await getBounty(id, at)
    if (!bounty) return null

    return bounty.type === "Proposed" ? bounty : null
  }

  function getBounties() {
    return Promise.all([
      typedApi.query.Bounties.Bounties.getEntries(),
      typedApi.query.Bounties.BountyDescriptions.getEntries(),
    ]).then(([entries, descriptions]) => {
      const descriptionMap = Object.fromEntries(
        descriptions.map(({ keyArgs, value }) => [keyArgs[0], value.asText()]),
      )

      return entries
        .map(({ keyArgs: [id], value }) => ({ bounty: value, id }))
        .sort((a, b) => a.id - b.id)
        .map(({ bounty, id }) =>
          enhanceBounty(bounty, descriptionMap[id] ?? null, id),
        )
    })
  }

  return {
    watchBounties,
    getBounties,
    getBounty,
    getProposedBounty,
  }
}
