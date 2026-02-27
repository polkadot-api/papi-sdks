import { HexString, SizedHex } from "@polkadot-api/substrate-bindings"

type SubmitNew = { status: "new" }
type SubmitKnown = { status: "known" }
type SubmitRejected = { status: "rejected"; reason: string; [key: string]: unknown }
type SubmitInvalid = { status: "invalid"; reason: string; [key: string]: unknown }

export type SubmitResult = SubmitNew | SubmitKnown | SubmitRejected | SubmitInvalid

export type TopicFilter =
  | "any"
  | { matchAll: Array<SizedHex<32>> }
  | { matchAny: Array<SizedHex<32>> }

export interface StatementEvent {
  statements: HexString[]
  remaining?: number | null
}

export type SubscriptionCallback = (event: StatementEvent) => void
export type Unsubscribe = () => void

export function extractStatementEvent(data: unknown): StatementEvent | null {
  if (!data || typeof data !== "object") return null

  const obj = data as Record<string, unknown>
  if ("statements" in obj && Array.isArray(obj.statements)) {
    return data as StatementEvent
  }

  for (const key of ["NewStatements", "newStatements", "data"]) {
    const wrapped = obj[key] as StatementEvent | undefined
    if (wrapped && Array.isArray(wrapped.statements)) return wrapped
  }

  return null
}
