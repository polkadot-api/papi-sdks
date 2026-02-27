import { HexString } from "@polkadot-api/substrate-bindings"
import {
  SubmitResult,
  TopicFilter,
  SubscriptionCallback,
  Unsubscribe,
  extractStatementEvent,
} from "./types"

/**
 * Simple request function type for basic RPC calls.
 */
export type RequestFn = <Reply = any, Params extends Array<any> = any[]>(
  method: string,
  params: Params,
) => Promise<Reply>

/**
 * Follow subscription handler for streaming results.
 */
export type FollowSubscription = (
  subscriptionId: string,
  handlers: {
    next: (event: unknown) => void
    error: (error: Error) => void
  },
) => void

/**
 * Extended request function type that supports subscriptions.
 * This matches the `client._request` signature from polkadot-api.
 */
export type SubscriptionRequestFn = <
  SubscriptionId extends string,
  _Result = unknown,
>(
  method: string,
  params: unknown[],
  handlers: {
    onSuccess: (
      subscriptionId: SubscriptionId,
      followSubscription: FollowSubscription,
    ) => void
    onError: (error: Error) => void
  },
) => Unsubscribe

export const getApi = (req: RequestFn) => ({
  submit: (stmt: HexString) =>
    req<SubmitResult | undefined, [HexString]>("statement_submit", [stmt]),

  dump: () => req<HexString[], []>("statement_dump", []),
})

/**
 * Create subscription API using the extended request function.
 * Use `client._request` from polkadot-api substrate-client.
 */
export const getSubscriptionApi = (req: SubscriptionRequestFn) => ({
  /**
   * Subscribe to statement events matching the given topic filter.
   * @param filter Topic filter ('any', { matchAll: [...] }, or { matchAny: [...] })
   * @param onEvent Callback for each statement event batch
   * @param onError Callback for subscription errors
   * @returns Unsubscribe function
   */
  subscribe: (
    filter: TopicFilter,
    onEvent: SubscriptionCallback,
    onError?: (error: Error) => void,
  ): Unsubscribe => {
    return req<string, unknown>(
      "statement_subscribeStatement",
      [filter],
      {
        onSuccess: (_subscriptionId, followSubscription) => {
          followSubscription(_subscriptionId, {
            next: (event: unknown) => {
              // Handle old single-statement format (backwards compatibility)
              if (typeof event === "string") {
                onEvent({ statements: [event] })
                return
              }

              // Try to extract StatementEvent from various formats
              const statementEvent = extractStatementEvent(event)
              if (statementEvent) {
                onEvent(statementEvent)
              }
            },
            error: (error: Error) => {
              onError?.(error)
            },
          })
        },
        onError: (error: Error) => {
          onError?.(error)
        },
      },
    )
  },
})
