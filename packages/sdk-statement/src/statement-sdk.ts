import { SizedHex } from "@polkadot-api/substrate-bindings"
import { Statement, statementCodec } from "./codec"
import { toHex } from "@polkadot-api/utils"
import { getApi, getSubscriptionApi, RequestFn, SubscriptionRequestFn } from "./api"
import { filterDecKey, filterTopics } from "./utils"
import { SubmitResult, TopicFilter, Unsubscribe, StatementEvent } from "./types"

export const createStatementSdk = (req: RequestFn) => {
  const api = getApi(req)
  return {
    submit: (stmt: Statement): Promise<SubmitResult> =>
      api.submit(toHex(statementCodec.enc(stmt))).then((v) => v ?? { status: "new" }),

    getStatements: async ({
      dest,
      topics,
    }: Partial<{
      topics: Array<SizedHex<32>>
      dest: SizedHex<32> | null
    }> = {}): Promise<Statement[]> =>
      (await api.dump())
        .map((hex) => statementCodec.dec(hex) as Statement)
        .filter(filterDecKey(dest))
        .filter(filterTopics(topics)),
  }
}

export type StatementCallback = (statements: Statement[]) => void

export const createStatementSubscriptionSdk = (req: SubscriptionRequestFn) => {
  const api = getSubscriptionApi(req)
  return {
    subscribe: (
      filter: TopicFilter,
      onStatements: StatementCallback,
      onError?: (error: Error) => void,
    ): Unsubscribe =>
      api.subscribe(
        filter,
        (event: StatementEvent) =>
          onStatements(event.statements.map((hex) => statementCodec.dec(hex) as Statement)),
        onError,
      ),

    subscribeRaw: (
      filter: TopicFilter,
      onEvent: (event: StatementEvent) => void,
      onError?: (error: Error) => void,
    ): Unsubscribe => api.subscribe(filter, onEvent, onError),
  }
}
