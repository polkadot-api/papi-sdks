import { MultisigProvider } from "../sdk-types"

/**
 * Throttles down the requests to the provider. By default it drops new requests
 * after the maximum concurrent requests has been reached.
 *
 * @param provider Multisig provider to throttle
 * @param maxConcurrent Maximum amount of concurrent requests
 * @param wait Queue requests instead of dropping them. It can cause backpressure.
 */
export function throttleMultisigProvider(
  provider: MultisigProvider,
  maxConcurrent: number,
  wait?: boolean,
): MultisigProvider {
  let ongoingReq = 0
  let pendingReq: Array<() => void> = []

  return async (address) => {
    if (ongoingReq >= maxConcurrent) {
      if (!wait) return null
      await new Promise<void>((resolve) => {
        pendingReq.push(resolve)
      })
    } else {
      ongoingReq++
    }

    try {
      return await provider(address)
    } finally {
      if (pendingReq.length) {
        pendingReq[0]()
        pendingReq = pendingReq.slice(1)
      } else {
        ongoingReq--
      }
    }
  }
}
