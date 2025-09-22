import { HexString } from "@polkadot-api/substrate-bindings"
import { SignedStatement, Statement, statementCodec } from "./codec"
import { toHex } from "@polkadot-api/utils"

type RequestFn = <Reply = any, Params extends Array<any> = any[]>(
  method: string,
  params: Params,
) => Promise<Reply>

export const createStatementSdk = (req: RequestFn) => {
  return {
    submit: (stmt: SignedStatement): Promise<void> =>
      req<void, [HexString]>("statement_submit", [
        toHex(statementCodec.enc(stmt)),
      ]),

    dump: (): Promise<Statement[]> =>
      req<HexString[], []>("statement_dump", []).then((res) =>
        res.map(statementCodec.dec),
      ),
  }
}
