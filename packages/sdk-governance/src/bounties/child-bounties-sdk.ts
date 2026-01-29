import { keyedMemo } from "@/util/memo"
import { partitionEntries } from "@/util/watchEntries"
import { combineKeys, toKeySet } from "@react-rxjs/utils"
import { Binary, CompatibilityLevel } from "polkadot-api"
import { combineLatest, distinctUntilChanged, map } from "rxjs"
import { getChildBountyAccount } from "./bounty-account"
import { getBountyDescriptions$ } from "./bounty-descriptions"
import {
  ChildBountiesSdkTypedApi,
  ChildBountiesV0Storage,
  ChildBountiesV1Storage,
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
      account: getChildBountyAccount(bounty.parent_bounty, id),
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
    const [getBountyById$, bountyKeyChanges$] = partitionEntries(
      typedApi.query.ChildBounties.ChildBounties.watchEntries(parentId),
    )

    const v0Api = typedApi as ChildBountiesSdkTypedApi<ChildBountiesV0Storage>
    const v1Api = typedApi as ChildBountiesSdkTypedApi<ChildBountiesV1Storage>
    const getEntries = async (): Promise<
      {
        keyArgs: [Key: number]
        value: Uint8Array
      }[]
    > => {
      const staticApis = await v0Api.getStaticApis()
      if (
        staticApis.compat.query.ChildBounties.ChildBountyDescriptions.isCompatible(
          CompatibilityLevel.Partial,
        )
      ) {
        return v0Api.query.ChildBounties.ChildBountyDescriptions.getEntries()
      }

      const result =
        await v1Api.query.ChildBounties.ChildBountyDescriptionsV1.getEntries(
          parentId,
        )
      return result.map((r) => ({
        keyArgs: [r.keyArgs[1]],
        value: r.value,
      }))
    }
    const getValues = async (
      keys: [number][],
    ): Promise<(Uint8Array | undefined)[]> => {
      const staticApis = await v0Api.getStaticApis()
      if (
        staticApis.compat.query.ChildBounties.ChildBountyDescriptions.isCompatible(
          CompatibilityLevel.Partial,
        )
      ) {
        return v0Api.query.ChildBounties.ChildBountyDescriptions.getValues(keys)
      }

      return v1Api.query.ChildBounties.ChildBountyDescriptionsV1.getValues(
        keys.map(([key]) => [parentId, key]),
      )
    }

    const descriptions$ = getBountyDescriptions$(
      getEntries,
      getValues,
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
        map(([bounty, description]) => enhanceBounty(bounty, description, id)),
      )

    return {
      bounties$: combineKeys(bountyIds$, getEnhancedBountyById$),
      getBountyById$: getEnhancedBountyById$,
      bountyIds$,
    }
  }

  async function getChildBounty(parentId: number, id: number) {
    const v0Api = typedApi as ChildBountiesSdkTypedApi<ChildBountiesV0Storage>
    const v1Api = typedApi as ChildBountiesSdkTypedApi<ChildBountiesV1Storage>

    const staticApis = await v1Api.getStaticApis()
    return Promise.all([
      typedApi.query.ChildBounties.ChildBounties.getValue(parentId, id),
      (async () => {
        const isCompat = staticApis.compat.query.ChildBounties.ChildBountyDescriptionsV1.isCompatible(
          CompatibilityLevel.Partial,
        )
        const r = isCompat
          ? await v1Api.query.ChildBounties.ChildBountyDescriptionsV1.getValue(
              parentId,
              id,
            )
          : await v0Api.query.ChildBounties.ChildBountyDescriptions.getValue(id)
        return r ? Binary.toText(r) : null
      })(),
    ]).then(([bounty, description]) =>
      bounty ? enhanceBounty(bounty, description, id) : null,
    )
  }

  async function getChildBounties(parentId: number) {
    const v0Api = typedApi as ChildBountiesSdkTypedApi<ChildBountiesV0Storage>
    const v1Api = typedApi as ChildBountiesSdkTypedApi<ChildBountiesV1Storage>

    const staticApis = await v1Api.getStaticApis()
    return Promise.all([
      typedApi.query.ChildBounties.ChildBounties.getEntries(parentId),
      (async () => {
        const isCompat = staticApis.compat.query.ChildBounties.ChildBountyDescriptionsV1.isCompatible(
          CompatibilityLevel.Partial,
        )
        return isCompat
          ? v1Api.query.ChildBounties.ChildBountyDescriptionsV1.getEntries(
              parentId,
            ).then((r) =>
              r.map(({ keyArgs, value }) => ({
                keyArgs: [keyArgs[1]],
                value,
              })),
            )
          : v0Api.query.ChildBounties.ChildBountyDescriptions.getEntries()
      })(),
    ]).then(([entries, descriptions]) => {
      const descriptionMap = Object.fromEntries(
        descriptions.map(({ keyArgs, value }) => [keyArgs[0], Binary.toText(value)]),
      )

      return entries
        .map(({ keyArgs: [, id], value }) => ({ bounty: value, id }))
        .sort((a, b) => a.id - b.id)
        .map(({ bounty, id }) =>
          enhanceBounty(bounty, descriptionMap[id] ?? null, id),
        )
    })
  }

  const watch: typeof watchChildBounties = keyedMemo(
    watchChildBounties,
    new Map(),
  )

  return {
    watch,
    getChildBounty,
    getChildBounties,
  }
}
