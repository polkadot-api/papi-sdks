import { HexString } from "@polkadot-api/substrate-bindings"
import { fromHex } from "@polkadot-api/utils"
import { SubmitResult } from "./types"

export type RequestFn = <Reply = any, Params extends Array<any> = any[]>(
  method: string,
  params: Params,
) => Promise<Reply>

export const getApi = (req: RequestFn) => ({
  submit: (stmt: HexString) =>
    req<SubmitResult | undefined, [HexString]>("statement_submit", [stmt]),

  dump: () => req<HexString[], []>("statement_dump", []),

  broadcasts: (matchAllTopics: HexString[]) =>
    req<HexString[], [number[][]]>("statement_broadcastsStatement", [
      matchAllTopics.map((v) => [...fromHex(v)]),
    ]),

  posted: (matchAllTopics: HexString[], dest: HexString) =>
    req<HexString[], [number[][], number[]]>("statement_postedStatement", [
      matchAllTopics.map((v) => [...fromHex(v)]),
      [...fromHex(dest)],
    ]),
})
