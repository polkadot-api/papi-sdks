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
   * Statement was rejected because the store is full or priority is too low.
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
       * Attempting to replace a channel message with lower or equal priority.
       */
      reason: "channelPriorityTooLow"
      /**
       * The priority of the submitted statement.
       */
      submitted_priority: number
      /**
       * The minimum priority of the existing channel message.
       */
      min_priority: number
    }
  | {
      /**
       * Account reached its statement limit and submitted priority is too low
       * to evict existing.
       */
      reason: "accountFull"
      /**
       * The priority of the submitted statement.
       */
      submitted_priority: number
      /**
       * The minimum priority of the existing statement.
       */
      min_priority: number
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
