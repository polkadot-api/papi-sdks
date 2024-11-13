const isResult = (value: unknown): value is Result =>
  typeof value === "object" &&
  !!value &&
  "success" in value &&
  "value" in value &&
  typeof value.success === "boolean"

export type Result<S = unknown, E = unknown> =
  | { success: true; value: S }
  | { success: false; value: E }

/**
 * Flattens a nested Result<Result<Result<number>, ErrorA>, ErrorB>, ErrorC> into
 * { value: number } | null
 */
export const flattenValues = <T>(v: T): { value: FlattenValues<T> } | null => {
  const result = flattenResult(v)
  return result.success ? { value: result.value } : null
}
export type FlattenValues<T> =
  IsAny<T> extends true
    ? any
    : T extends Result
      ? FlattenValues<(T & { success: true })["value"]>
      : T

/**
 * Flattens a nested Result<Result<Result<number>, ErrorA>, ErrorB>, ErrorC> into
 * { error: ErrorA | ErrorB | ErrorC } | null
 */
export const flattenErrors = <T>(v: T): { error: FlattenErrors<T> } | null => {
  const result = flattenResult(v)
  return result.success ? null : { error: result.value }
}
export type FlattenErrors<T> =
  IsAny<T> extends true
    ? any
    : T extends Result
      ?
          | (T & { success: false })["value"]
          | FlattenErrors<(T & { success: true })["value"]>
      : never

/**
 * Flattens a nested Result<Result<Result<number>, ErrorA>, ErrorB>, ErrorC> into
 * Result<number, ErrorA | ErrorB | ErrorC>
 */
export const flattenResult = <T>(v: T): FlattenResult<T> =>
  isResult(v)
    ? v.success
      ? (flattenResult as any)(v.value)
      : { success: false, value: v.value }
    : { success: true, value: v }
export type FlattenResult<T> = T extends Result
  ? Result<FlattenValues<T>, FlattenErrors<T>>
  : never

// `any extends number ? true : false` ==> boolean. So we have to double-check
// setting the case for `false` to `boolean` for a bit more clarification.
type IsAny<T> = (any extends T ? true : boolean) extends true ? true : false

export function mapResult<SI, EI, SO = SI, EO = EI>(
  result: Result<SI, EI>,
  mapFns: {
    value?: (value: SI) => SO
    error?: (error: EI) => EO
  },
): Result<SO, EO> {
  return result.success
    ? {
        success: true,
        value: mapFns.value?.(result.value) ?? result.value,
      }
    : ({
        success: false,
        value: mapFns.error?.(result.value) ?? result.value,
      } as any)
}
