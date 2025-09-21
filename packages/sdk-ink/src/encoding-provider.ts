import {
  GenericEvent,
  getInkClient,
  getInkLookup,
} from "@polkadot-api/ink-contracts"
import {
  AbiConstructor,
  AbiFallback,
  AbiFunction,
  AbiParameter,
  AbiReceive,
} from "abitype"
import { Binary, FixedSizeBinary } from "polkadot-api"
import {
  Abi,
  decodeFunctionResult,
  encodeDeployData,
  encodeFunctionData,
} from "viem"
import { GenericInkDescriptors } from "./descriptor-types"

export interface EncodingProvider {
  isCompatible(codeHash: FixedSizeBinary<32>): boolean
  message(message: string): {
    encode: (value: unknown) => Binary
    decode: (value: Binary) => unknown
  }
  constructor(constructor: string): {
    encode: (value: unknown) => Binary
    decode: (value: Binary) => unknown
  }
  filterEvents(
    address: string,
    events?: Array<
      | {
          event: GenericEvent
          topics: Binary[]
        }
      | (GenericEvent & {
          topics: Binary[]
        })
    >,
  ): GenericEvent[]
  storage(key: string): {
    encode: (value: unknown) => Binary
    decode: (value: Binary) => unknown
  }
  storagePaths(): string[]
}

export const inkEncoding = (
  descriptors: GenericInkDescriptors,
): EncodingProvider => {
  if (!descriptors.metadata)
    throw new Error("ink encoding needs an ink contract")

  const inkClient = getInkClient(descriptors)
  const lookup = getInkLookup(descriptors.metadata)

  return {
    isCompatible(codeHash) {
      return codeHash ? codeHash.asHex() === lookup.metadata.source.hash : false
    },
    message(message) {
      const msg = inkClient.message(message)

      return {
        encode: (value) => msg.encode(value as any),
        decode: (data) => msg.decode({ data }),
      }
    },
    constructor(constructor) {
      const msg = inkClient.constructor(constructor)

      return {
        encode: (value) => msg.encode(value as any),
        decode: (data) => msg.decode({ data }),
      }
    },
    filterEvents(address, events) {
      return inkClient.event.filter(address, events)
    },
    storage(key) {
      const storage = inkClient.storage(key)

      return {
        encode: (value) => storage.encode(value as any),
        decode: (data) => storage.decode(data),
      }
    },
    storagePaths() {
      return Object.keys(lookup.storage)
    },
  }
}

type AbiCallable = AbiConstructor | AbiFallback | AbiFunction | AbiReceive

export const solEncoding = (
  descriptors: GenericInkDescriptors,
): EncodingProvider => {
  if (descriptors.abi == null)
    throw new Error("sol encoding needs an solidity contract")
  const abi = descriptors.abi as Abi

  // There are two objects that are different between papi and viem:
  // - function: { address: HexString, selector: HexString } <=> HexString
  // - bytes: Binary <=> HexString
  const valueToViem = (value: unknown, param: AbiParameter): unknown => {
    if (param.type === "function") {
      if (typeof value === "string" && value.startsWith("0x")) return value
      if (
        typeof value !== "object" ||
        !value ||
        !("address" in value) ||
        !("selector" in value)
      ) {
        throw new Error(
          "Expected FunctionRef in parameter " + (param.name ?? "(no name)"),
        )
      }

      return (value.address as string) + (value.selector as string).slice(2)
    }
    if (param.type.endsWith("]")) {
      if (!Array.isArray(value))
        throw new Error(
          "Expected array in parameter " + (param.name ?? "(no name)"),
        )
      const innerType = {
        ...param,
        type: param.type.slice(0, param.type.indexOf("[")),
      }
      return value.map((v) => valueToViem(v, innerType))
    }
    // TODO tuple

    if (param.type.startsWith("bytes")) {
      if (typeof value === "string" && value.startsWith("0x")) return value
      if (
        typeof value !== "object" ||
        !value ||
        !("asHex" in value) ||
        typeof value.asHex != "function"
      ) {
        throw new Error(
          "Expected Binary in parameter " + (param.name ?? "(no name)"),
        )
      }
      return value.asHex()
    }

    return value
  }
  const viemToValue = (value: unknown, param: AbiParameter): unknown => {
    const strValue = value as string
    if (param.type === "function") {
      const address = strValue.slice(0, 2 + 20 * 2)
      const selector = "0x" + strValue.slice(2 + 20 * 2)
      return { address, selector }
    }
    if (param.type.endsWith("]")) {
      const innerType = {
        ...param,
        type: param.type.slice(0, param.type.indexOf("[")),
      }
      return (value as any[]).map((v) => viemToValue(v, innerType))
    }
    if (param.type.startsWith("bytes")) {
      return Binary.fromHex(strValue)
    }

    return value
  }

  const inputsToViem = (
    value: unknown,
    inputs: readonly AbiParameter[],
  ): unknown[] => {
    const unnamedTypes = inputs.filter((v) => !v.name)
    const namedTypes = inputs.filter((v) => !!v.name)

    if (namedTypes.length == 0) {
      if (!unnamedTypes.length) return []

      if (unnamedTypes.length === 1) {
        return [valueToViem(value, unnamedTypes[0])]
      }

      if (!Array.isArray(value)) {
        throw new Error("Expected array as input")
      }
      return unnamedTypes.map((v, i) => valueToViem(value[i], v))
    }

    if (!value || typeof value !== "object") {
      throw new Error("Expected object as input")
    }
    const anyValue = value as any

    let iUnnamed = 0
    return inputs.map((v) => {
      if (v.name) {
        return valueToViem(anyValue[v.name], v)
      }
      return valueToViem(anyValue.args[iUnnamed++], v)
    })
  }
  const viemToOutputs = (
    value: unknown,
    outputs: readonly AbiParameter[],
  ): unknown => {
    // In case there's only one output, viem always flattens it out, even if it's named.

    const unnamedTypes = outputs.filter((v) => !v.name)
    const namedTypes = outputs.filter((v) => !!v.name)

    if (namedTypes.length == 0) {
      if (unnamedTypes.length === 1) {
        return viemToValue(value, unnamedTypes[0])
      }

      return unnamedTypes.map((v, i) => viemToValue((value as any)[i], v))
    }

    if (namedTypes.length === 1) {
      return {
        [namedTypes[0].name!]: viemToValue(value, namedTypes[0]),
      }
    }

    const result: Record<string, any> = {}
    const args: any[] = []
    const valueArr = value as any[]

    outputs.forEach((v, i) => {
      const value = viemToValue(valueArr[i], v)
      if (v.name) {
        result[v.name] = value
      } else {
        args.push(value)
      }
    })

    if (args.length) result.args = args

    return result
  }

  return {
    isCompatible() {
      return true
    },
    constructor() {
      const ctor = abi.find((v) => v.type === "constructor")

      return {
        encode(value) {
          return Binary.fromHex(
            ctor
              ? encodeDeployData({
                  abi,
                  args: inputsToViem(value, ctor.inputs ?? []),
                  bytecode: "0x",
                })
              : "0x",
          )
        },
        decode() {
          return null
        },
      }
    },
    message(message) {
      const msg = abi.find((v) =>
        message === "fallback" || message === "receive"
          ? v.type === message
          : "name" in v && v.name === message,
      ) as AbiCallable
      if (!msg) {
        throw new Error("Can't find message " + msg)
      }

      return {
        encode(value) {
          return Binary.fromHex(
            encodeFunctionData({
              abi,
              // TODO "receive"
              functionName: message === "fallback" ? undefined : message,
              args: inputsToViem(value, "inputs" in msg ? msg.inputs : []),
            }),
          )
        },
        decode(value) {
          const result = decodeFunctionResult({
            abi,
            functionName: message === "fallback" ? undefined : message,
            data: value.asHex() as `0x${string}`,
          })
          return viemToOutputs(result, "outputs" in msg ? msg.outputs : [])
        },
      }
    },
    filterEvents() {
      return []
    },
    storage() {
      throw new Error("Solidity contract storage unaccessible")
    },
    storagePaths() {
      throw new Error("Solidity contract storage unaccessible")
    },
  }
}
