import { Binary } from "polkadot-api"
import { GroupedObservable, Observable } from "rxjs"
import { BountyWithoutDescription, MultiAddress } from "./bounties-descriptors"
import { OngoingReferendum } from "./referenda-sdk-types"

export interface Bounty extends BountyWithoutDescription {
  id: number
  description: Binary | null
}

export interface BountiesSdk {
  watchBounties(): {
    bounties$: Observable<Map<number, Bounty>>
    bountyIds$: Observable<number[]>
    getBountyById$: (key: number) => GroupedObservable<number, Bounty>
  }
  getBounties(): Observable<Bounty[]>
  referendaFilter: {
    approving: (
      ongoingReferenda: OngoingReferendum[],
      bountyId: number,
    ) => Promise<OngoingReferendum[]>
    proposingCurator: (
      ongoingReferenda: OngoingReferendum[],
      bountyId: number,
    ) => Promise<
      {
        referendum: OngoingReferendum
        proposeCuratorCalls: {
          curator: MultiAddress
          fee: bigint
        }[]
      }[]
    >
  }
  scheduledChanges: {
    approved: (bountyId: number) => Promise<number[]>
    curatorProposed: (bountyId: number) => Promise<
      {
        height: number
        proposeCuratorCalls: {
          curator: MultiAddress
          fee: bigint
        }[]
      }[]
    >
  }
}
