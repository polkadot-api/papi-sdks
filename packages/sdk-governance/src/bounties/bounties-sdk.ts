import { combineKeys, partitionByKey, toKeySet } from "@react-rxjs/utils"
import { Binary, TxEvent } from "polkadot-api"
import { map, mergeMap, skip, startWith, switchMap } from "rxjs"
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
    id: number,
  ): Bounty => {
    const generic: GenericBounty = {
      ...bounty,
      type: bounty.status.type,
      id,
      description: () =>
        typedApi.query.Bounties.BountyDescriptions.getValue(id).then((r) =>
          r ? r.asText() : null,
        ),
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
              curator,
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
  }

  function watchBounties() {
    const [getBountyById$, bountyKeyChanges$] = partitionByKey(
      // TODO watchEntries
      typedApi.query.Bounties.BountyCount.watchValue().pipe(
        skip(1),
        startWith(null),
        switchMap(() => typedApi.query.Bounties.Bounties.getEntries()),
        mergeMap((v) => v.sort((a, b) => a.keyArgs[0] - b.keyArgs[0])),
      ),
      (res) => res.keyArgs[0],
      (group$, id) => group$.pipe(map((v) => enhanceBounty(v.value, id))),
    )

    const bountyIds$ = bountyKeyChanges$.pipe(
      toKeySet(),
      map((set) => [...set]),
    )

    return {
      bounties$: combineKeys(bountyIds$, getBountyById$),
      getBountyById$,
      bountyIds$,
    }
  }

  function getBounty(id: number) {
    return typedApi.query.Bounties.Bounties.getValue(id).then((bounty) =>
      bounty ? enhanceBounty(bounty, id) : null,
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

    const bounty = await typedApi.query.Bounties.Bounties.getValue(id, { at })
    if (!bounty) return null

    const enhanced = enhanceBounty(bounty, id)
    return enhanced.type === "Proposed" ? enhanced : null
  }

  function getBounties() {
    return typedApi.query.Bounties.Bounties.getEntries().then((entries) =>
      entries
        .map(({ keyArgs: [id], value }) => ({ bounty: value, id }))
        .sort((a, b) => a.id - b.id)
        .map(({ bounty, id }) => enhanceBounty(bounty, id)),
    )
  }

  return {
    watchBounties,
    getBounties,
    getBounty,
    getProposedBounty,
  }
}
