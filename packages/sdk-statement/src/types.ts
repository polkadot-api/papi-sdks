import { HexString, SizedHex } from "@polkadot-api/substrate-bindings"

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
      reason: "channelExpiryTooLow"
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
)

export type SubmitResult =
  | SubmitNew
  | SubmitKnown
  | SubmitRejected
  | SubmitInvalid

// ============================================================================
// Subscription Types
// ============================================================================

/**
 * Topic filter for statement subscriptions.
 * Use 'any' to match all statements, or specify matchAll/matchAny arrays.
 */
export type TopicFilter =
  | "any"
  | { matchAll: Array<SizedHex<32>> }
  | { matchAny: Array<SizedHex<32>> }

/**
 * StatementEvent returned by statement_subscribeStatement.
 * Contains batched statements and optional remaining count for initial sync.
 */
export interface StatementEvent {
  /** Array of SCALE-encoded statement hex strings */
  statements: HexString[]
  /** Optional count of remaining statements in the initial sync batch */
  remaining?: number | null
}

/**
 * Possible wrapped formats for StatementEvent (backwards compatibility).
 */
export interface WrappedStatementEvent {
  NewStatements?: StatementEvent
  newStatements?: StatementEvent
  data?: StatementEvent
}

/**
 * Callback for subscription events.
 */
export type SubscriptionCallback = (event: StatementEvent) => void

/**
 * Function to unsubscribe from a statement subscription.
 */
export type Unsubscribe = () => void

/**
 * Extract StatementEvent from various possible response formats.
 */
export function extractStatementEvent(data: unknown): StatementEvent | null {
  if (!data || typeof data !== "object") return null

  // Direct format: { statements: [...], remaining?: N }
  if ("statements" in data && Array.isArray((data as StatementEvent).statements)) {
    return data as StatementEvent
  }

  // Wrapped format: { NewStatements: { statements: [...] } }
  const wrapped = data as WrappedStatementEvent
  if (wrapped.NewStatements && Array.isArray(wrapped.NewStatements.statements)) {
    return wrapped.NewStatements
  }

  // Alternative wrapped format: { newStatements: { statements: [...] } }
  if (wrapped.newStatements && Array.isArray(wrapped.newStatements.statements)) {
    return wrapped.newStatements
  }

  // Data wrapped format: { data: { statements: [...] } }
  if (wrapped.data && Array.isArray(wrapped.data.statements)) {
    return wrapped.data
  }

  return null
}
