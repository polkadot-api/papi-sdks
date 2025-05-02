import { Binary, SS58String } from "polkadot-api"
import {
  IdentityInfo as DescriptorsIdentityInfo,
  IdentityJudgement,
} from "./descriptors"

export type IdentityInfo = {
  [K in keyof DescriptorsIdentityInfo]?: DescriptorsIdentityInfo[K] extends
    | Binary
    | undefined
    ? DescriptorsIdentityInfo[K]
    : string
}

export interface Identity {
  displayName: {
    value: string
    verified: boolean
  } | null
  info: IdentityInfo
  judgements: Array<{
    registrar: number
    judgement: IdentityJudgement["type"]
    fee?: bigint
  }>
}

export interface IdentitySdk {
  getIdentity: (address: SS58String) => Promise<Identity | null>
}
