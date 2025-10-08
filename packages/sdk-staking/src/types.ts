import type { SS58String } from "polkadot-api"

export interface EraRewardPoints {
  total: number
  individual: Record<SS58String, number>
}

// Validator => Nominator => Active bond
export type EraStakers = Record<SS58String, Record<SS58String, bigint>>

// Validator => overview
export type EraOverview = Record<
  SS58String,
  {
    total: bigint
    own: bigint
    nominator_count: number
  } | null
>

// Validator => prefs
export type EraValidatorPrefs = Record<
  SS58String,
  {
    commission: number
    blocked: boolean
  }
>

export const PERBILL = 1000000000n
