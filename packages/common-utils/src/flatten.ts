const isResult = (value: unknown): value is Result =>
  typeof value === "object" &&
  !!value &&
  "success" in value &&
  "value" in value &&
  typeof value.success === "boolean"

export type Result = { success: boolean; value: unknown }

/**
 * Flattens a nested Result<Result<Result<number>, ErrorA>, ErrorB>, ErrorC> into
 * { value: number } | null
 */
export const flattenValues = <T extends object>(
  v: T,
): { value: FlattenValues<T> } | null =>
  isResult(v)
    ? v.success
      ? (flattenValues as any)(v.value)
      : null
    : { value: v }
export type FlattenValues<T> = T extends { success: boolean; value: unknown }
  ? FlattenValues<(T & { success: true })["value"]>
  : T

/**
 * Flattens a nested Result<Result<Result<number>, ErrorA>, ErrorB>, ErrorC> into
 * { error: ErrorA | ErrorB | ErrorC } | null
 */
export const flattenErrors = <T extends object>(
  v: T,
): { error: FlattenErrors<T> } | null =>
  isResult(v)
    ? v.success
      ? (flattenErrors as any)(v.value)
      : {
          error: v.value,
        }
    : null
export type FlattenErrors<T> = T extends { success: boolean; value: unknown }
  ?
      | (T & { success: false })["value"]
      | FlattenErrors<(T & { success: true })["value"]>
  : never
