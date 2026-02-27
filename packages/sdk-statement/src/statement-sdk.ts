import { SizedHex } from "@polkadot-api/substrate-bindings"
import { Statement, statementCodec } from "./codec"
import { toHex } from "@polkadot-api/utils"
import { getApi, RequestFn, SubscribeFn } from "./api"
import { filterDecKey } from "./utils"
import { SubmitResult, TopicFilter, StatementEvent } from "./types"

const ANY_FILTER: TopicFilter = "any"

/**
 * Create statement sdk.
 *
 * @param {RequestFn} req        Takes a req-res function, which accepts Statement RPC
 *                               calls. This can be `client._request` (from
 *                               `polkadot-api`) client, `client.request` (from
 *                               `@polkadot-api/substrate-client`)
 *                               or any other crafted by the consumer.
 * @param {SubscribeFn} subscribe Takes a subscription function for RPC subscriptions.
 *                               This can be `client._subscribe` (from `polkadot-api`)
 *                               or any other crafted by the consumer.
 */
export const createStatementSdk = (req: RequestFn, subscribe: SubscribeFn) => {
  const api = getApi(req, subscribe)

  /**
   * Get statements from store matching the given filter.
   *
   * This method subscribes to the statement store, collects all existing
   * statements matching the filter, then unsubscribes and returns them.
   *
   * @param filter Topic filter for statements. Defaults to matching all.
   */
  const getStatements = (
    filter: TopicFilter = ANY_FILTER,
  ): Promise<Statement[]> =>
    new Promise((resolve, reject) => {
      const statements: Statement[] = []

      const unsubscribe = api.subscribeStatement(
        filter,
        (event: StatementEvent) => {
          if (event.event === "newStatements") {
            for (const encoded of event.data.statements) {
              try {
                statements.push(statementCodec.dec(encoded))
              } catch (e) {
                // Skip malformed statements
              }
            }

            // Initial dump complete when remaining is 0 or undefined
            if (
              event.data.remaining === 0 ||
              event.data.remaining === undefined
            ) {
              unsubscribe()
              resolve(statements)
            }
          }
        },
        (error: Error) => {
          unsubscribe()
          reject(error)
        },
      )
    })

  return {
    /**
     * Submit a Statement to the store.
     * It must be signed to be accepted.
     */
    submit: (stmt: Statement): Promise<SubmitResult> =>
      api.submit(toHex(statementCodec.enc(stmt))),

    getStatements,

    /**
     * Subscribe to statements matching the given filter.
     *
     * Unlike `getStatements`, this maintains an active subscription and
     * continues to receive new statements as they are added to the store.
     *
     * @param filter      Topic filter for statements.
     * @param onStatement Callback for each decoded statement.
     * @param onError     Callback for errors.
     * @returns Unsubscribe function.
     */
    subscribeStatements: (
      filter: TopicFilter,
      onStatement: (statement: Statement) => void,
      onError: (error: Error) => void,
    ): (() => void) =>
      api.subscribeStatement(
        filter,
        (event: StatementEvent) => {
          if (event.event === "newStatements") {
            for (const encoded of event.data.statements) {
              try {
                onStatement(statementCodec.dec(encoded))
              } catch (e) {
                // Skip malformed statements
              }
            }
          }
        },
        onError,
      ),

    /**
     * Get broadcasts (statements with no decryptionKey) matching topics.
     *
     * @param topics Topics to match (all must be present).
     */
    getBroadcasts: async (
      topics: Array<SizedHex<32>> = [],
    ): Promise<Statement[]> => {
      const filter: TopicFilter =
        topics.length > 0 ? { matchAll: topics } : ANY_FILTER
      const statements = await getStatements(filter)
      return statements.filter((stmt) => stmt.decryptionKey === undefined)
    },

    /**
     * Get posted statements (with decryptionKey) matching topics and destination.
     *
     * @param topics Topics to match (all must be present).
     * @param dest   Destination decryption key.
     */
    getPosted: async (
      topics: Array<SizedHex<32>>,
      dest: SizedHex<32>,
    ): Promise<Statement[]> => {
      const filter: TopicFilter =
        topics.length > 0 ? { matchAll: topics } : ANY_FILTER
      const statements = await getStatements(filter)
      return statements.filter(filterDecKey(dest))
    },
  }
}
