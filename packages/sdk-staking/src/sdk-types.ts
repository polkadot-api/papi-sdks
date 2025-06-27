import { SS58String } from "polkadot-api"

export interface StakingSdk {
  /**
   * Get nominator status for specific era.
   * @param address Nominator address to check.
   * @param era Optionally pass era, defaults to ActiveEra.
   */
  getNominatorStatus: (
    address: SS58String,
    era?: number,
  ) => Promise<{
    era: number
    active: Array<{ validator: SS58String; activeBond: bigint }>
  }>

  canNominate: (address: SS58String) => Promise<
    | { canNominate: false }
    | {
        canNominate: true
        currentBond: bigint
        maxBond: bigint
      }
  >
}
