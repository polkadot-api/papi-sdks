import { combineKeys, partitionByKey, toKeySet } from "@react-rxjs/utils"
import {
  combineLatest,
  distinctUntilChanged,
  map,
  mergeMap,
  takeWhile,
} from "rxjs"
import { getBountyDescriptions$ } from "./bounty-descriptions"
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
    description: string | null,
    id: number,
  ): ChildBounty => {
    const generic: GenericChildBounty = {
      ...bounty,
      type: bounty.status.type,
      id,
      description,
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
              curator: {
                type: "Id",
                value: curator,
              },
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
    throw new Error("Unreachable")
  }

  function watchChildBounties(parentId: number) {
    const [getBountyById$, bountyKeyChanges$] = partitionByKey(
      typedApi.query.ChildBounties.ChildBounties.watchEntries(parentId).pipe(
        mergeMap((v) =>
          v.deltas
            ? [
                ...v.deltas.deleted.map((d) => ({
                  id: d.args[1],
                  value: undefined,
                })),
                ...v.deltas.upserted.map((d) => ({
                  id: d.args[1],
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
      typedApi.query.ChildBounties.ChildBountyDescriptions.getEntries,
      typedApi.query.ChildBounties.ChildBountyDescriptions.getValues,
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

  function getChildBounty(parentId: number, id: number) {
    return Promise.all([
      typedApi.query.ChildBounties.ChildBounties.getValue(parentId, id),
      typedApi.query.ChildBounties.ChildBountyDescriptions.getValue(id).then(
        (r) => (r ? r.asText() : null),
      ),
    ]).then(([bounty, description]) =>
      bounty ? enhanceBounty(bounty, description, id) : null,
    )
  }

  return {
    watchChildBounties,
    getChildBounty,
  }
}
