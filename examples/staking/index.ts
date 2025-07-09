import { dot } from "@polkadot-api/descriptors"
import { createStakingSdk } from "@polkadot-api/sdk-staking"
import { createClient } from "polkadot-api"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getWsProvider } from "polkadot-api/ws-provider/web"

const TARGET = "13UVJyLnbVp8c4FQeiGRMVBP7xph2wHCuf2RzvyxJomXJ7RL"

const client = createClient(
  withPolkadotSdkCompat(getWsProvider("wss://rpc.ibp.network/polkadot")),
)
const api = client.getTypedApi(dot)
// console.log(await api.query.System.ParentHash.getValue())

const sdk = createStakingSdk(api, { maxActiveNominators: 22_500 })
// const info = await api.query.Staking.Bonded.getEntries()
// console.log(info.filter(({ keyArgs: [stash], value }) => stash !== value))

const previousEra = await api.query.Staking.ActiveEra.getValue().then(
  (val) => val!.index - 1,
)

console.log("consulting era", previousEra)

console.log(
  "nominator status",
  await sdk.getNominatorStatus(TARGET, previousEra),
)

const nominatorRewards = await sdk.getNominatorRewards(TARGET, previousEra)
console.log("nominator rewards", nominatorRewards)

const [blockTime, epochDuration, sessionsPerEra] = await Promise.all([
  api.constants.Babe.ExpectedBlockTime(),
  api.constants.Babe.EpochDuration(),
  api.constants.Staking.SessionsPerEra(),
])
const eraDurationInMs = BigInt(sessionsPerEra) * epochDuration * blockTime
const erasInAYear = (365.25 * 24 * 60 * 60 * 1000) / Number(eraDurationInMs)

const rewardPct =
  Number(nominatorRewards.total) / Number(nominatorRewards.activeBond)
const apy = Math.pow(1 + rewardPct, erasInAYear) - 1

console.log("APY", (apy * 100).toLocaleString() + "%")

process.exit(0)
