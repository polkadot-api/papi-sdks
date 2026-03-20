import { HexString, SizedHex } from "@polkadot-api/substrate-bindings"

/**
 * Filter for subscribing to statements with different topics.
 */
export type TopicFilter =
  | "any"
  | { matchAll: Array<SizedHex<32>> }
  | { matchAny: Array<SizedHex<32>> }

/**
 * An item returned by the statement subscription stream.
 */
export type StatementEvent = {
  event: "newStatements"
  data: {
    statements: HexString[]
    remaining?: number
  }
}

type SubmitNew = {
  /**
   * Statement was accepted as new.
   */
  status: "new"
}
type SubmitKnown = {
  /**
   * Statement was already known.
   */
  status: "known"
}
type SubmitKnownExpired = {
  /**
   * Statement was already known but has expired.
   */
  status: "knownExpired"
}
type SubmitRejected = {
  /**
   * Statement was rejected because the store is full or expiry is too low.
   */
  status: "rejected"
} & (
  | {
      /**
       * Statement data exceeds the maximum allowed size for the account.
       */
      reason: "dataTooLarge"
      /**
       * The size of the submitted statement data.
       */
      submitted_size: number
      /**
       * Still available data size for the account.
       */
      available_size: number
    }
  | {
      /**
       * Attempting to replace a channel message with lower or equal expiry.
       */
      reason: "channelPriorityTooLow"
      /**
       * The expiry of the submitted statement.
       */
      submitted_expiry: bigint
      /**
       * The minimum expiry of the existing channel message.
       */
      min_expiry: bigint
    }
  | {
      /**
       * Account reached its statement limit and submitted expiry is too low
       * to evict existing.
       */
      reason: "accountFull"
      /**
       * The expiry of the submitted statement.
       */
      submitted_expiry: bigint
      /**
       * The minimum expiry of the existing statement.
       */
      min_expiry: bigint
    }
  | {
      /**
       * The global statement store is full and cannot accept new statements.
       */
      reason: "storeFull"
    }
  | {
      /**
       * Account has no allowance set.
       */
      reason: "noAllowance"
    }
)
type SubmitInvalid = {
  /**
   * Statement failed validation.
   */
  status: "invalid"
} & (
  | {
      /**
       * Statement has no proof.
       */
      reason: "noProof"
    }
  | {
      /**
       * Proof validation failed.
       */
      reason: "badProof"
    }
  | {
      /**
       * Statement exceeds max allowed statement size.
       */
      reason: "encodingTooLarge"
      /**
       * The size of the submitted statement encoding.
       */
      submitted_size: number
      /**
       * The maximum allowed size.
       */
      max_size: number
    }
  | {
      /**
       * Statement has already expired. The expiry field is in the past.
       */
      reason: "alreadyExpired"
    }
)
type SubmitInternalError = {
  /**
   * Internal store error.
   */
  status: "internalError"
  /**
   * Error message.
   */
  error: string
}

export type SubmitResult =
  | SubmitNew
  | SubmitKnown
  | SubmitKnownExpired
  | SubmitRejected
  | SubmitInvalid
  | SubmitInternalError
