import { HexString } from "@polkadot-api/substrate-bindings"
import { SubmitResult, TopicFilter, StatementEvent } from "./types"

export type RequestFn = <Reply = any, Params extends Array<any> = any[]>(
  method: string,
  params: Params,
) => Promise<Reply>

export type SubscribeFn = <T = any, Params extends Array<any> = any[]>(
  method: string,
  params: Params,
  onMessage: (message: T) => void,
  onError: (error: Error) => void,
) => () => void

export const getApi = (req: RequestFn, subscribe: SubscribeFn) => ({
  submit: (stmt: HexString) =>
    req<SubmitResult, [HexString]>("statement_submit", [stmt]),

  subscribeStatement: (
    topicFilter: TopicFilter,
    onMessage: (event: StatementEvent) => void,
    onError: (error: Error) => void,
  ) =>
    subscribe<StatementEvent, [TopicFilter]>(
      "statement_subscribeStatement",
      [topicFilter],
      onMessage,
      onError,
    ),
})
