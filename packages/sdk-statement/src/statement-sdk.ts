import { SizedHex } from "@polkadot-api/substrate-bindings"
import { toHex } from "@polkadot-api/utils"
import {
  lastValueFrom,
  map,
  mergeAll,
  Observable,
  filter as rxjsFilter,
  scan,
  takeWhile,
} from "rxjs"
import { getApi } from "./api"
import { Statement, statementCodec } from "./codec"
import { SubmitResult, TopicFilter } from "./types"

const ANY_FILTER: TopicFilter = "any"

/**
 * Create statement sdk.
 *
 * @param {string} endpoint  WebSocket endpoint to connect to, starting either
 *                           with `ws://` or `wss://`
 */
export const createStatementSdk = (endpoint: string) => {
  const api = getApi(endpoint)

  const getStatements$ = (
    filter: TopicFilter,
  ): Observable<{
    statements: Statement[]
    remaining?: number
  }> =>
    api.subscribeStatement(filter).pipe(
      map((evt) => {
        if (evt.event === "newStatements") {
          return {
            statements: evt.data.statements.map(statementCodec.dec),
            remaining: evt.data.remaining,
          }
        }
        return null
      }),
      rxjsFilter((v) => v !== null),
    )

  /**
   * Get statements from store matching the given filter.
   *
   * This method subscribes to the statement store, collects all existing
   * statements matching the filter, then unsubscribes and returns them.
   *
   * @param filter  Topic filter for statements. Defaults to matching all.
   */
  const getStatements = (
    filter: TopicFilter = ANY_FILTER,
  ): Promise<Statement[]> =>
    lastValueFrom(
      getStatements$(filter).pipe(
        scan(
          (acc: { statements: Statement[]; remaining: number }, evt) => ({
            statements: [...acc.statements, ...evt.statements],
            remaining: evt.remaining ?? 0,
          }),
          {
            statements: [],
            remaining: 0,
          },
        ),
        takeWhile((v) => v.remaining > 0, true),
        map((v) => v.statements),
      ),
    )

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
     * @param filter       Topic filter for statements.
     * @param onStatement  Callback for each decoded statement.
     * @param onError      Callback for errors.
     * @returns Unsubscribe function.
     */
    subscribeStatements: (filter: TopicFilter): Observable<Statement> =>
      getStatements$(filter).pipe(
        map((v) => v.statements),
        mergeAll(),
      ),

    /**
     * Get broadcasts (statements with no decryptionKey) matching topics.
     *
     * @param topics  Topics to match (all must be present).
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
     * Get posted statements (with decryptionKey) matching topics and
     * destination.
     *
     * @param topics  Topics to match (all must be present).
     * @param dest    Destination decryption key.
     */
    getPosted: async (
      topics: Array<SizedHex<32>>,
      dest: SizedHex<32>,
    ): Promise<Statement[]> => {
      const filter: TopicFilter =
        topics.length > 0 ? { matchAll: topics } : ANY_FILTER
      const statements = await getStatements(filter)
      return statements.filter((stmt) => stmt.decryptionKey === dest)
    },
  }
}
