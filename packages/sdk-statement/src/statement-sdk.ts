import { SizedHex, HexString } from "@polkadot-api/substrate-bindings"
import { Statement, statementCodec } from "./codec"
import { toHex } from "@polkadot-api/utils"
import {
  getApi,
  getSubscriptionApi,
  RequestFn,
  SubscriptionRequestFn,
} from "./api"
import { filterDecKey, filterTopics } from "./utils"
import {
  SubmitResult,
  TopicFilter,
  Unsubscribe,
  StatementEvent,
} from "./types"

/**
 * Create statement sdk.
 *
 * @param {RequestFn} req  Takes a req-res function, which accepts Statement RPC
 *                         calls. This can be `client.request` (from
 *                         `@polkadot-api/substrate-client`)
 *                         or any other crafted by the consumer.
 */
export const createStatementSdk = (req: RequestFn) => {
  const api = getApi(req)
  return {
    /**
     * Submit a Statement to the store.
     * It must be signed to be accepted.
     */
    submit: (stmt: Statement): Promise<SubmitResult> =>
      api
        .submit(toHex(statementCodec.enc(stmt)))
        // TODO: remove in due time
        // prior to https://github.com/paritytech/polkadot-sdk/pull/10421
        // everything that was not `"new"` yielded an error, and `"new"` returned undefined
        // catching the errors is not an option since we can't feasibly know what is the actual error
        .then((v) => v ?? { status: "new" }),

    /**
     * Get all statements from store using dump, with optional filtering.
     * @param dest Filter by decryptionKey (null = no key, undefined = all)
     * @param topics Filter by topics (prefix match)
     */
    getStatements: async ({
      dest,
      topics,
    }: Partial<{
      topics: Array<SizedHex<32>>
      dest: SizedHex<32> | null
    }> = {}): Promise<Statement[]> => {
      const statements = (await api.dump()).map(
        (hex) => statementCodec.dec(hex) as Statement,
      )
      return statements
        .filter(filterDecKey(dest))
        .filter(filterTopics(topics))
    },

    /**
     * Get all statements from the store.
     */
    dump: (): Promise<Statement[]> =>
      req<HexString[], []>("statement_dump", []).then((res) =>
        res.map(statementCodec.dec),
      ),
  }
}

/**
 * Callback for decoded statement events.
 */
export type StatementCallback = (statements: Statement[]) => void

/**
 * Create statement subscription sdk for real-time updates.
 *
 * @param {SubscriptionRequestFn} req  Takes an extended request function that
 *                                     supports subscriptions. Use `client._request`
 *                                     from `@polkadot-api/substrate-client`.
 */
export const createStatementSubscriptionSdk = (req: SubscriptionRequestFn) => {
  const api = getSubscriptionApi(req)

  return {
    /**
     * Subscribe to statement events.
     * @param filter Topic filter ('any', { matchAll: [...] }, or { matchAny: [...] })
     * @param onStatements Callback for decoded statement batches
     * @param onError Optional error callback
     * @returns Unsubscribe function
     */
    subscribe: (
      filter: TopicFilter,
      onStatements: StatementCallback,
      onError?: (error: Error) => void,
    ): Unsubscribe => {
      return api.subscribe(
        filter,
        (event: StatementEvent) => {
          const statements = event.statements.map(
            (hex) => statementCodec.dec(hex) as Statement,
          )
          onStatements(statements)
        },
        onError,
      )
    },

    /**
     * Subscribe to raw statement events (hex-encoded).
     * @param filter Topic filter ('any', { matchAll: [...] }, or { matchAny: [...] })
     * @param onEvent Callback for raw statement event batches
     * @param onError Optional error callback
     * @returns Unsubscribe function
     */
    subscribeRaw: (
      filter: TopicFilter,
      onEvent: (event: StatementEvent) => void,
      onError?: (error: Error) => void,
    ): Unsubscribe => {
      return api.subscribe(filter, onEvent, onError)
    },
  }
}
