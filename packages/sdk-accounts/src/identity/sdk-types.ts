import { SS58String } from "polkadot-api"
import {
  IdentityInfo as DescriptorsIdentityInfo,
  IdentityJudgement,
} from "./descriptors"

export type IdentityInfo = {
  [K in keyof DescriptorsIdentityInfo]?: K extends "pgp_fingerprint"
    ? DescriptorsIdentityInfo[K]
    : string
}

export interface Identity {
  info: IdentityInfo
  judgements: Array<{
    registrar: number
    judgement: IdentityJudgement["type"]
    fee?: bigint
  }>
  verified: boolean
  subIdentity?: string
}

export interface IdentitySdk {
  getIdentity: (address: SS58String) => Promise<Identity | null>
}
