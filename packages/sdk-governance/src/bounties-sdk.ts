import { combineKeys, partitionByKey, toKeySet } from "@react-rxjs/utils"
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
import { BountiesSdk, Bounty } from "./bounties-sdk-types"
import { getPreimageResolver } from "./preimages"
import { OngoingReferendum } from "./referenda-sdk-types"

export function createBountiesSdk(typedApi: BountiesSdkTypedApi): BountiesSdk {
  const resolvePreimage = getPreimageResolver(
    typedApi.query.Preimage.PreimageFor.getValues,
  )

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
        ([bounty, description]): Bounty => ({
          ...bounty,
          id,
          description: description ?? null,
        }),
      ),
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

  return {
    watchBounties,
    getBounties,
    referendaFilter: {
      approving: findApprovingReferenda,
      proposingCurator: findProposingCuratorReferenda,
    },
    scheduledChanges: {
      approved: findScheduledApproved,
      curatorProposed: findScheduledCuratorProposed,
    },
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

const weakMemo = <Arg extends [object], R>(fn: (...arg: Arg) => R) => {
  const cache = new WeakMap<Arg[0], R>()
  return (...arg: Arg) => {
    if (cache.has(arg[0])) return cache.get(arg[0])!
    const result = fn(...arg)
    cache.set(arg[0], result)
    return result
  }
}

const memo = <Arg extends Array<unknown>, R>(fn: (...arg: Arg) => R) => {
  let cachedKey: Arg | null = null
  let cachedValue: R = null as any
  return (...arg: Arg) => {
    if (cachedKey && cachedKey.every((k, i) => k === arg[i])) {
      return cachedValue
    }
    cachedKey = arg
    cachedValue = fn(...arg)
    return cachedValue
  }
}
