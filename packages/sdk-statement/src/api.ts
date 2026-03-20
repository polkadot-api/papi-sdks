import { HexString } from "@polkadot-api/substrate-bindings"
import { createClient, UnsubscribeFn } from "@polkadot-api/substrate-client"
import { getWsProvider } from "@polkadot-api/ws-provider"
import { Observable } from "rxjs"
import { StatementEvent, SubmitResult, TopicFilter } from "./types"

export const getApi = (endpoint: string) => {
  const client = createClient(getWsProvider(endpoint))

  const subscribe = <T>(
    method: string,
    unsubscribeMethod: string,
    params: any[],
  ) =>
    new Observable<T>((obs) => {
      let unsubInner: UnsubscribeFn | null = null
      let subId: string | null = null

      const sendUnsubscribe = () => {
        // Fire-and-forget
        subId != null && client.request(unsubscribeMethod, [subId])
      }

      client._request(method, params, {
        onSuccess: (res: string, follow) => {
          subId = res
          if (obs.closed) {
            sendUnsubscribe()
            return
          }
          unsubInner = follow(subId, {
            next: (data: any) => obs.next(data),
            error: (e) => obs.error(e),
          })
        },
        onError(e) {
          obs.error(e)
        },
      })

      return () => {
        sendUnsubscribe()
        unsubInner?.()
      }
    })

  return {
    submit: (stmt: HexString) =>
      client.request<SubmitResult>("statement_submit", [stmt]),

    subscribeStatement: (topicFilter: TopicFilter) =>
      subscribe<StatementEvent>(
        "statement_subscribeStatement",
        "statement_unsubscribeStatement",
        [topicFilter],
      ),
  }
}
