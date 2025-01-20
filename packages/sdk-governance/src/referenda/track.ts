import { keyBy } from "@/util/keyBy"
import {
  ReferendaSdkTypedApi,
  ReferendaTrackData as ReferendaTrackDescriptor,
  ReferendaTypesCurve,
} from "./descriptors"
import { ReferendaTrack, TrackFunctionDetails } from "./sdk-types"

export function enhanceTrack(track: ReferendaTrackDescriptor): ReferendaTrack {
  return {
    ...track,
    minApproval: curveToFunctionDetails(
      track.decision_period,
      track.min_approval,
    ),
    minSupport: curveToFunctionDetails(
      track.decision_period,
      track.min_support,
    ),
  }
}

export function trackFetcher(typedApi: ReferendaSdkTypedApi) {
  const referendaTracksPromise = typedApi.constants.Referenda.Tracks().then(
    (tracks) => {
      const byId = Object.fromEntries(tracks)
      const byName = keyBy(Object.values(byId), (v) => v.name)
      return { byId, byName }
    },
  )
  return async (id: number | string) => {
    const referendaTracks = await referendaTracksPromise
    const track =
      typeof id === "number"
        ? referendaTracks.byId[id]
        : referendaTracks.byName[id]
    if (!track) return null

    return enhanceTrack(track)
  }
}

const BILLION = 1_000_000_000_000
const BIG_BILLION = 1_000_000_000_000n
const blockToPerBill = (block: number, period: number) =>
  (block * BILLION) / period
const perBillToBlock = (perBillion: number, period: number) =>
  Math.ceil((perBillion * period) / BILLION)

function curveToFunctionDetails(
  period: number,
  curve: ReferendaTypesCurve,
): TrackFunctionDetails {
  const curveFn =
    curve.type === "LinearDecreasing"
      ? linearDecreasing(curve.value)
      : curve.type === "SteppedDecreasing"
        ? steppedDecreasing(curve.value)
        : reciprocal(curve.value)

  return {
    curve,
    getThreshold(at) {
      return curveFn.getValue(blockToPerBill(at, period)) / BILLION
    },
    getBlock(pct) {
      return perBillToBlock(curveFn.getTime(pct * BILLION), period)
    },
    getData(step = 1) {
      return curveFn
        .getData(blockToPerBill(Math.max(step, 1), period))
        .map(({ time, value }) => ({
          block: perBillToBlock(time, period),
          threshold: value / BILLION,
        }))
    },
  }
}

function linearDecreasing({
  length,
  floor,
  ceil,
}: {
  length: number
  floor: number
  ceil: number
}) {
  // v(x) = ceil + (x * (floor - ceil)) / length
  const getValue = (at: number) =>
    Math.max(
      floor,
      Math.min(ceil, Math.round(ceil + (at * (floor - ceil)) / length)),
    )

  const getTime = (value: number) => {
    if (value > ceil) return Number.NEGATIVE_INFINITY
    if (value < floor) return Number.POSITIVE_INFINITY
    return ((value - ceil) * length) / (floor - ceil)
  }
  const getData = () => [
    {
      time: 0,
      value: ceil,
    },
    {
      time: length,
      value: floor,
    },
    ...(BILLION > length
      ? [
          {
            time: BILLION,
            value: floor,
          },
        ]
      : []),
  ]
  return { getValue, getTime, getData }
}
function steppedDecreasing({
  begin,
  end,
  step,
  period,
}: {
  begin: number
  end: number
  step: number
  period: number
}) {
  const getValue = (at: number) =>
    Math.max(end, Math.min(begin, begin - (at % period) * step))
  const getTime = (value: number) => {
    if (value > begin) return Number.NEGATIVE_INFINITY
    if (value < end) return Number.POSITIVE_INFINITY
    return Math.ceil((begin - value) / step)
  }
  const getData = () => {
    const result: Array<{
      time: number
      value: number
    }> = []

    for (let k = 0, value = begin; value > end; value -= step) {
      result.push({
        time: k * period,
        value,
      })
    }
    if ((begin - end) % step != 0) {
      result.push({
        time: Math.ceil((begin - end) / step),
        value: end,
      })
    }
    if (result.at(-1)?.time! < BILLION) {
      result.push({
        time: BILLION,
        value: end,
      })
    }

    return result
  }
  return { getValue, getTime, getData }
}
function reciprocal({
  factor,
  x_offset,
  y_offset,
}: {
  factor: bigint
  x_offset: bigint
  y_offset: bigint
}) {
  // v(x) = factor/(x+x_offset)-y_offset
  const getValue = (at: number) =>
    Number(factor / (BigInt(Math.round(at)) + x_offset) - y_offset)
  const getTime = (value: number) => {
    const bigValue = BigInt(Math.round(value))
    // Below horizontal asymptote => +Infinity
    if (bigValue <= -y_offset) return Number.POSITIVE_INFINITY
    // Above y-axis cut => -Infinity
    // It needs to be multiplied by BIG_BILLION when dividing because we're working with perbillion
    if (
      x_offset != 0n &&
      bigValue > (BIG_BILLION * factor) / x_offset - y_offset
    )
      return Number.NEGATIVE_INFINITY

    return Number((BIG_BILLION * factor) / (bigValue + y_offset) - x_offset)
  }
  const getData = (step: number) => {
    const result: Array<{
      time: number
      value: number
    }> = []

    for (let time = 0; time <= BILLION; time += step) {
      result.push({ time, value: getValue(time) })
    }
    if (result.at(-1)?.time! < BILLION) {
      result.push({
        time: BILLION,
        value: getValue(BILLION),
      })
    }

    return result
  }
  return { getValue, getTime, getData }
}
