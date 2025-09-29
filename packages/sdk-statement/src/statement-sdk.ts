import { FixedSizeBinary, HexString } from "@polkadot-api/substrate-bindings"
import { Statement, statementCodec } from "./codec"
import { toHex } from "@polkadot-api/utils"
import { getApi, RequestFn } from "./api"
import { filterDecKey, filterTopics } from "./utils"

/**
 * Create statement sdk.
 *
 * @param {RequestFn} req Takes a req-res function, which accepts Statement RPC
 *                        calls. This can be `client._request` (from `polkadot-api`)
 *                        client, `client.request` (from `@polkadot-api/substrate-client`)
 *                        or any other crafted by the consumer.
 */
export const createStatementSdk = (req: RequestFn) => {
  const api = getApi(req)
  return {
    /**
     * Submit an Statement to the store.
     * Generally it must be signed to be accepted.
     */
    submit: (stmt: Statement): Promise<void> =>
      api.submit(toHex(statementCodec.enc(stmt))),

    /**
     * Get statements from store.
     * dest: `Binary` means to get all statements with that specific `decryptionKey` set.
     *       `null` means to get all statements with no `decryptionKey` set.
     *       `undefined` (or unset) means to get all statements disregarding `decryptionKey`.
     */
    getStatements: async ({
      dest,
      topics,
    }: Partial<{
      topics: Array<FixedSizeBinary<32>>
      dest: FixedSizeBinary<32> | null
    }> = {}): Promise<Statement[]> => {
      if (dest === null)
        return (await api.broadcasts(topics?.map((v) => v.asHex()) ?? [])).map(
          statementCodec.dec,
        )
      if (topics && dest)
        return (
          await api.posted(
            topics.map((v) => v.asHex()),
            dest.asHex(),
          )
        ).map(statementCodec.dec)
      return (await api.dump())
        .map(statementCodec.dec)
        .filter(filterDecKey(dest))
        .filter(filterTopics(topics))
    },

    dump: (): Promise<Statement[]> =>
      req<HexString[], []>("statement_dump", []).then((res) =>
        res.map(statementCodec.dec),
      ),
  }
}
