import { HexString } from "@polkadot-api/substrate-bindings"
import {
  SubmitResult,
  TopicFilter,
  SubscriptionCallback,
  Unsubscribe,
  extractStatementEvent,
} from "./types"

export type RequestFn = <Reply = any, Params extends Array<any> = any[]>(
  method: string,
  params: Params,
) => Promise<Reply>

export type FollowSubscription = (
  subscriptionId: string,
  handlers: { next: (event: unknown) => void; error: (error: Error) => void },
) => void

export type SubscriptionRequestFn = <SubscriptionId extends string>(
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

export const getSubscriptionApi = (req: SubscriptionRequestFn) => ({
  subscribe: (
    filter: TopicFilter,
    onEvent: SubscriptionCallback,
    onError?: (error: Error) => void,
  ): Unsubscribe =>
    req<string>("statement_subscribeStatement", [filter], {
      onSuccess: (_, followSubscription) => {
        followSubscription(_, {
          next: (event: unknown) => {
            if (typeof event === "string") {
              onEvent({ statements: [event] })
              return
            }
            const statementEvent = extractStatementEvent(event)
            if (statementEvent) onEvent(statementEvent)
          },
          error: (e) => onError?.(e),
        })
      },
      onError: (e) => onError?.(e),
    }),
})
