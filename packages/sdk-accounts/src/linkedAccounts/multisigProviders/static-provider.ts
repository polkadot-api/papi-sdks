import {
  AccountId,
  getMultisigAccountId,
  HexString,
} from "@polkadot-api/substrate-bindings"
import { SS58String } from "polkadot-api"
import { toHex } from "polkadot-api/utils"
import { MultisigProvider } from "../sdk-types"

const accId = AccountId()
type MultisigInfo = {
  multisigAddr?: SS58String
  addresses: SS58String[]
  threshold: number
}
export function staticProvider(
  multisigs: Array<MultisigInfo>,
): MultisigProvider {
  const accountIdCache = new WeakMap<MultisigInfo, HexString>()
  const getAccId = (info: MultisigInfo) => {
    if (!accountIdCache.has(info)) {
      accountIdCache.set(
        info,
        toHex(
          info.multisigAddr
            ? accId.enc(info.multisigAddr)
            : getMultisigAccountId({
                threshold: info.threshold,
                signatories: info.addresses.map(accId.enc),
              }),
        ),
      )
    }
    return accountIdCache.get(info)!
  }

  return async (address) => {
    const addressPk = toHex(accId.enc(address))

    return multisigs.find((ms) => getAccId(ms) === addressPk) ?? null
  }
}
