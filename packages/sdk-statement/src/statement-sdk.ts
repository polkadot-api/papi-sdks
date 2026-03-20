import { toHex } from "@polkadot-api/utils"
import {
  lastValueFrom,
  map,
  mergeAll,
  Observable,
  filter as rxjsFilter,
  scan,
  startWith,
  takeWhile,
} from "rxjs"
import { getApi } from "./api"
import { Statement, statementCodec } from "./codec"
import { SubmitResult, TopicFilter } from "./types"

/**
 * Create statement sdk.
 *
 * @param {string} endpoint  WebSocket endpoint to connect to, starting either
 *                           with `ws://` or `wss://`
 */
export const createStatementSdk = (endpoint: string) => {
  const api = getApi(endpoint)

  const getStatements$ = (
    filter: TopicFilter = "any",
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
  const getStatements = (filter?: TopicFilter): Promise<Statement[]> =>
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
        startWith([]),
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
    getStatement$: (filter?: TopicFilter): Observable<Statement> =>
      getStatements$(filter).pipe(
        map((v) => v.statements),
        mergeAll(),
      ),

    /**
     * Close the connection and clean resources.
     */
    destroy: api.destroy,
  }
}
