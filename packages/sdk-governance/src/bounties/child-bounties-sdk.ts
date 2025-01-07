import { combineKeys, partitionByKey, toKeySet } from "@react-rxjs/utils"
import { map, mergeMap, skip, startWith, switchMap } from "rxjs"
import {
  ChildBountiesSdkTypedApi,
  ChildBountyWithoutDescription,
} from "./child-descriptors"
import {
  ChildBountiesSdk,
  ChildBounty,
  GenericChildBounty,
} from "./child-sdk-types"

export function createChildBountiesSdk(
  typedApi: ChildBountiesSdkTypedApi,
): ChildBountiesSdk {
  const enhanceBounty = (
    bounty: ChildBountyWithoutDescription,
    id: number,
  ): ChildBounty => {
    const generic: GenericChildBounty = {
      ...bounty,
      type: bounty.status.type,
      id,
      description: () =>
        typedApi.query.ChildBounties.ChildBountyDescriptions.getValue(id).then(
          (r) => (r ? r.asText() : null),
        ),
    }

    const idObj = {
      parent_bounty_id: bounty.parent_bounty,
      child_bounty_id: id,
    }
    switch (generic.status.type) {
      case "Added":
        return {
          ...generic,
          type: "Added",
          proposeCurator(curator, fee) {
            return typedApi.tx.ChildBounties.propose_curator({
              ...idObj,
              curator,
              fee,
            })
          },
          close() {
            return typedApi.tx.ChildBounties.close_child_bounty(idObj)
          },
        }
      case "CuratorProposed":
        return {
          ...generic,
          ...generic.status.value,
          type: "CuratorProposed",
          acceptCuratorRole() {
            return typedApi.tx.ChildBounties.accept_curator(idObj)
          },
          unassignCurator() {
            return typedApi.tx.ChildBounties.unassign_curator(idObj)
          },
          close() {
            return typedApi.tx.ChildBounties.close_child_bounty(idObj)
          },
        }
      case "Active":
        return {
          ...generic,
          type: "Active",
          curator: generic.status.value.curator,
          award(beneficiary) {
            return typedApi.tx.ChildBounties.award_child_bounty({
              ...idObj,
              beneficiary: {
                type: "Id",
                value: beneficiary,
              },
            })
          },
          unassignCurator() {
            return typedApi.tx.ChildBounties.unassign_curator(idObj)
          },
          close() {
            return typedApi.tx.ChildBounties.close_child_bounty(idObj)
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
            return typedApi.tx.ChildBounties.claim_child_bounty(idObj)
          },
          unassignCurator() {
            return typedApi.tx.ChildBounties.unassign_curator(idObj)
          },
        }
    }
  }

  function watchChildBounties(parentId: number) {
    const [getBountyById$, bountyKeyChanges$] = partitionByKey(
      // TODO watchEntries
      typedApi.query.ChildBounties.ParentChildBounties.watchValue(
        parentId,
      ).pipe(
        skip(1),
        startWith(null),
        switchMap(() =>
          typedApi.query.ChildBounties.ChildBounties.getEntries(parentId),
        ),
        mergeMap((v) => v.sort((a, b) => a.keyArgs[1] - b.keyArgs[1])),
      ),
      (res) => res.keyArgs[1],
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

  function getChildBounty(parentId: number, id: number) {
    return typedApi.query.ChildBounties.ChildBounties.getValue(
      parentId,
      id,
    ).then((bounty) => (bounty ? enhanceBounty(bounty, id) : null))
  }

  return {
    watchChildBounties,
    getChildBounty,
  }
}
