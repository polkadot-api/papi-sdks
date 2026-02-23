import { dotAh } from "@polkadot-api/descriptors"
import { createStakingSdk } from "@polkadot-api/sdk-staking"
import { createClient } from "polkadot-api"
import { getWsProvider } from "polkadot-api/ws"

const TARGET = "13UVJyLnbVp8c4FQeiGRMVBP7xph2wHCuf2RzvyxJomXJ7RL"

const client = createClient(
  getWsProvider("wss://rpc-asset-hub-polkadot.luckyfriday.io"),
)
const api = client.getTypedApi(dotAh)

const sdk = createStakingSdk(client)
// const info = await api.query.Staking.Bonded.getEntries()
// console.log(info.filter(({ keyArgs: [stash], value }) => stash !== value))

const previousEra = await api.query.Staking.ActiveEra.getValue().then(
  (val) => val!.index - 1,
)

console.log("consulting era", previousEra)

console.log(
  "nominator status",
  await sdk.getNominatorActiveValidators(TARGET, previousEra),
)

const nominatorRewards = await sdk.getNominatorRewards(TARGET, previousEra)
console.log("nominator rewards", nominatorRewards)

const blockTime = 6000n
const epochDuration = 2400n
const sessionsPerEra = await api.constants.Staking.SessionsPerEra()
const eraDurationInMs = BigInt(sessionsPerEra) * epochDuration * blockTime
const erasInAYear = (365.25 * 24 * 60 * 60 * 1000) / Number(eraDurationInMs)

const rewardPct =
  Number(nominatorRewards.total) / Number(nominatorRewards.activeBond)
const apy = Math.pow(1 + rewardPct, erasInAYear) - 1

console.log("APY", (apy * 100).toLocaleString() + "%")

process.exit(0)
