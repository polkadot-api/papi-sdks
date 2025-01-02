import { combineKeys, partitionByKey, toKeySet } from "@react-rxjs/utils"
import { Binary, TxEvent } from "polkadot-api"
import {
  combineLatest,
  from,
  map,
  mergeMap,
  Observable,
  of,
  shareReplay,
  skip,
  startWith,
  switchMap,
} from "rxjs"
import {
  BountiesSdkTypedApi,
  BountyWithoutDescription,
  MultiAddress,
} from "./bounties-descriptors"
import {
  BountiesSdk,
  Bounty,
  GenericBounty,
  ProposedBounty,
} from "./bounties-sdk-types"
import { memo, weakMemo } from "./memo"
import { getPreimageResolver } from "./preimages"
import { OngoingReferendum } from "./referenda-sdk-types"

export function createBountiesSdk(typedApi: BountiesSdkTypedApi): BountiesSdk {
  const resolvePreimage = getPreimageResolver(
    typedApi.query.Preimage.PreimageFor.getValues,
  )

  const getDecodedSpenderReferenda = weakMemo(
    async (ongoingReferenda: OngoingReferendum[]) => {
      const spenderReferenda = ongoingReferenda.filter(
        (ref) =>
          (ref.origin.type === "Origins" &&
            spenderOrigins.includes(ref.origin.value.type)) ||
          (ref.origin.type === "system" && ref.origin.value.type === "Root"),
      )
      const response = await Promise.all(
        spenderReferenda.map((referendum) =>
          referendum.proposal
            .decodedCall()
            .then((call) => ({
              referendum,
              call,
            }))
            .catch((ex) => {
              console.error(ex)
              return null
            }),
        ),
      )
      return response.filter((v) => !!v)
    },
  )

  async function findApprovingReferenda(
    ongoingReferenda: OngoingReferendum[],
    bountyId: number,
  ) {
    const spenderReferenda = await getDecodedSpenderReferenda(ongoingReferenda)

    return spenderReferenda
      .filter(({ call }) =>
        findCalls(
          {
            pallet: "Bounties",
            name: "approve_bounty",
          },
          call,
        ).some((v) => v?.bounty_id === bountyId),
      )
      .map(({ referendum }) => referendum)
  }

  async function findProposingCuratorReferenda(
    ongoingReferenda: OngoingReferendum[],
    bountyId: number,
  ) {
    const spenderReferenda = await getDecodedSpenderReferenda(ongoingReferenda)

    return spenderReferenda
      .map(({ call, referendum }) => {
        const proposeCuratorCalls = findCalls(
          {
            pallet: "Bounties",
            name: "propose_curator",
          },
          call,
        )
          .filter(
            (v) =>
              v?.bounty_id === bountyId &&
              typeof v.curator === "object" &&
              typeof v.fee === "bigint",
          )
          .map((v) => ({
            curator: v.curator as MultiAddress,
            fee: v.fee as bigint,
          }))
        if (!proposeCuratorCalls.length) return null
        return { referendum, proposeCuratorCalls }
      })
      .filter((v) => v !== null)
  }

  const getScheduledCalls = memo(async () => {
    const agenda = await typedApi.query.Scheduler.Agenda.getEntries()
    const token = await typedApi.compatibilityToken

    const scheduled = agenda.flatMap(
      ({ keyArgs: [height], value: values }) =>
        values
          ?.filter((v) => !!v)
          .map((value) => ({
            height,
            call: value.call,
          })) ?? [],
    )

    const resolvedCalls = await Promise.all(
      scheduled.map(({ height, call }) =>
        resolvePreimage(call)
          .then(
            (callData) => typedApi.txFromCallData(callData, token).decodedCall,
          )
          .then((decodedCall) => ({ height, call: decodedCall }))
          .catch((ex) => {
            console.error(ex)
            return null
          }),
      ),
    )
    return resolvedCalls.filter((v) => !!v)
  })
  async function findScheduledApproved(bountyId: number) {
    const calls = await getScheduledCalls()

    return calls
      .filter(({ call }) =>
        findCalls({ pallet: "Bounties", name: "approve_bounty" }, call).some(
          (v) => v?.bounty_id === bountyId,
        ),
      )
      .map(({ height }) => height)
  }

  async function findScheduledCuratorProposed(bountyId: number) {
    const calls = await getScheduledCalls()

    return calls
      .map(({ call, height }) => {
        const proposeCuratorCalls = findCalls(
          {
            pallet: "Bounties",
            name: "propose_curator",
          },
          call,
        )
          .filter(
            (v) =>
              v?.bounty_id === bountyId &&
              typeof v.curator === "object" &&
              typeof v.fee === "bigint",
          )
          .map((v) => ({
            curator: v.curator as MultiAddress,
            fee: v.fee as bigint,
          }))
        if (!proposeCuratorCalls.length) return null
        return { height, proposeCuratorCalls }
      })
      .filter((v) => v !== null)
  }

  const enhanceBounty$ = (
    bounty$: Observable<BountyWithoutDescription>,
    id: number,
  ): Observable<Bounty> =>
    combineLatest([
      bounty$,
      from(typedApi.query.Bounties.BountyDescriptions.getValue(id)).pipe(
        startWith(null),
      ),
    ]).pipe(
      map(
        ([bounty, description]): GenericBounty => ({
          ...bounty,
          type: bounty.status.type,
          id,
          description: description ?? null,
        }),
      ),
      map((bounty): Bounty => {
        switch (bounty.status.type) {
          case "Proposed":
            return {
              ...bounty,
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
            return { ...bounty, type: "Approved" }
          case "Funded":
            return {
              ...bounty,
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
              ...bounty,
              ...bounty.status.value,
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
              ...bounty,
              type: "Active",
              curator: bounty.status.value.curator,
              updateDue: bounty.status.value.update_due,
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
              ...bounty,
              type: "PendingPayout",
              curator: bounty.status.value.curator,
              unlockAt: bounty.status.value.unlock_at,
              beneficiary: bounty.status.value.beneficiary,
              claim() {
                return typedApi.tx.Bounties.claim_bounty({ bounty_id: id })
              },
              unassignCurator() {
                return typedApi.tx.Bounties.unassign_curator({ bounty_id: id })
              },
            }
        }
      }),
    )

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
      (group$, id) => enhanceBounty$(group$.pipe(map((v) => v.value)), id),
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
    return from(typedApi.query.Bounties.Bounties.getValue(id)).pipe(
      mergeMap((bounty) =>
        bounty ? enhanceBounty$(of(bounty), id) : of(null),
      ),
    )
  }

  function getProposedBounty(
    txEvent: TxEvent,
  ): Observable<ProposedBounty | null> {
    if (!("events" in txEvent)) {
      return of(null)
    }
    const proposedBountyEvt = typedApi.event.Bounties.BountyProposed.filter(
      txEvent.events,
    )[0]
    if (!proposedBountyEvt) {
      return of(null)
    }
    const id = proposedBountyEvt.index
    const at = txEvent.type === "finalized" ? undefined : txEvent.block.hash

    return from(typedApi.query.Bounties.Bounties.getValue(id, { at })).pipe(
      mergeMap((bounty) =>
        bounty ? enhanceBounty$(of(bounty), id) : of(null),
      ),
      map((v) => (v?.type === "Proposed" ? v : null)),
    )
  }

  function getBounties() {
    return from(typedApi.query.Bounties.Bounties.getEntries()).pipe(
      mergeMap((entries) =>
        combineLatest(
          entries
            .map(({ keyArgs: [id], value }) => ({ bounty: value, id }))
            .sort((a, b) => a.id - b.id)
            .map(({ bounty, id }) => enhanceBounty$(of(bounty), id)),
        ),
      ),
      shareReplay(1),
    )
  }

  return {
    watchBounties,
    getBounties,
    getBounty,
    getProposedBounty,
  }
}

const spenderOrigins = [
  "Treasurer",
  "SmallSpender",
  "MediumSpender",
  "BigSpender",
  "SmallTipper",
  "BigTipper",
]

const findCalls = (call: { pallet: string; name: string }, obj: any): any[] => {
  if (typeof obj !== "object") return []
  if (Array.isArray(obj)) {
    const approves = []
    for (const item of obj) approves.push(...findCalls(call, item))
    return approves
  }
  if (obj?.type === call.pallet && obj?.value?.type === call.name) {
    return [obj.value.value]
  }
  const approves = []
  for (const key of Object.keys(obj))
    approves.push(...findCalls(call, obj[key]))
  return approves
}
