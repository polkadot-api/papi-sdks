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

const BILLION = 1_000_000_000
export const BIG_BILLION = 1_000_000_000n
const blockToPerBill = (block: number, period: number) =>
  (BigInt(block) * BIG_BILLION) / BigInt(period)
const perBillToBlock = (perBillion: bigint | null, period: number) =>
  perBillion == null
    ? Number.POSITIVE_INFINITY
    : Number(bigDivCeil(perBillion * BigInt(period), BIG_BILLION))
const perBillToPct = (perBillion: bigint) => Number(perBillion) / BILLION

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
      return curveFn.getValue(blockToPerBill(at, period))
    },
    getBlock(pct) {
      return perBillToBlock(curveFn.getTime(pct), period)
    },
    getData(step = 1) {
      return curveFn
        .getData(blockToPerBill(Math.max(step, 1), period))
        .map(({ time, value }) => ({
          block: perBillToBlock(time, period),
          threshold: perBillToPct(value),
        }))
    },
  }
}

const bigCap = (
  value: bigint,
  cap: Partial<{ floor: bigint; ceil: bigint }>,
) => {
  if (cap.floor != null) value = value < cap.floor ? cap.floor : value
  if (cap.ceil != null) value = value < cap.ceil ? cap.ceil : value
  return value
}
const bigDivCeil = (a: bigint, b: bigint) => {
  const floor = a / b
  return a % b === 0n ? floor : floor + 1n
}

function linearDecreasing(params: {
  length: number
  floor: number
  ceil: number
}) {
  const { length, floor, ceil } = {
    length: BigInt(params.length),
    floor: BigInt(params.floor),
    ceil: BigInt(params.ceil),
  }

  // v(x) = ceil + (x * (floor - ceil)) / length
  const getValue = (at: bigint) =>
    bigCap(ceil + (at * (floor - ceil)) / length, {
      floor,
      ceil,
    })

  const getTime = (value: bigint) => {
    if (value > ceil) return 0n
    if (value < floor) return null
    return ((value - ceil) * length) / (floor - ceil)
  }
  const getData = () => [
    {
      time: 0n,
      value: ceil,
    },
    {
      time: length,
      value: floor,
    },
    ...(BIG_BILLION > length
      ? [
          {
            time: BIG_BILLION,
            value: floor,
          },
        ]
      : []),
  ]
  return { getValue, getTime, getData }
}
function steppedDecreasing(params: {
  begin: number
  end: number
  step: number
  period: number
}) {
  const { begin, end, step, period } = {
    begin: BigInt(params.begin),
    end: BigInt(params.end),
    step: BigInt(params.step),
    period: BigInt(params.period),
  }

  const getValue = (at: bigint) =>
    bigCap(begin - (at / period) * step, {
      ceil: begin,
      floor: end,
    })

  const getTime = (value: bigint) => {
    if (value > begin) return 0n
    if (value < end) return null
    return ((begin - value) / step) * period
  }
  const getData = () => {
    const result: Array<{
      time: bigint
      value: bigint
    }> = []

    for (let k = 0n, value = begin; value > end; value -= step) {
      result.push({
        time: k * period,
        value,
      })
    }
    if ((begin - end) % step != 0n) {
      result.push({
        time: ((begin - end) / step) * period,
        value: end,
      })
    }
    if (result.at(-1)?.time! < BIG_BILLION) {
      result.push({
        time: BIG_BILLION,
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
  const getValue = (at: bigint) =>
    (BIG_BILLION * factor) / (at + x_offset) + y_offset
  const getTime = (value: bigint) => {
    // Below horizontal asymptote => will never intersect
    if (value <= y_offset) return null
    // Above y-axis cut => 0
    // It needs to be multiplied by BIG_BILLION when dividing because we're working with perbillion
    if (x_offset != 0n && value > (BIG_BILLION * factor) / x_offset + y_offset)
      return 0n

    return (BIG_BILLION * factor) / (value - y_offset) - x_offset
  }
  const getData = (step: bigint) => {
    const result: Array<{
      time: bigint
      value: bigint
    }> = []

    for (let time = 0n; time <= BIG_BILLION; time += step) {
      result.push({ time, value: getValue(time) })
    }
    if (result.at(-1)?.time! < BIG_BILLION) {
      result.push({
        time: BIG_BILLION,
        value: getValue(BIG_BILLION),
      })
    }

    return result
  }
  return { getValue, getTime, getData }
}
