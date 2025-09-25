import type { InkStorageDescriptor } from "@polkadot-api/ink-contracts"
import type { ResultPayload } from "polkadot-api"
import type { GenericInkDescriptors, StorageError } from "./descriptor-types"
import { EncodingProvider } from "./encoding-provider"
import { ContractsProvider } from "./provider"

export type SdkStorage<
  S extends InkStorageDescriptor,
  StorageErr,
> = NestedStorage<S, StorageErr> & RootStorage<S, StorageErr>

export function getStorage<Addr, StorageErr, D extends GenericInkDescriptors>(
  provider: ContractsProvider<Addr, StorageErr>,
  encodingProvider: EncodingProvider,
  address: Addr,
): SdkStorage<D["__types"]["storage"], StorageErr> {
  type S = D["__types"]["storage"]

  const getStorage = async (
    label: string,
    key: unknown,
  ): Promise<ResultPayload<unknown, StorageErr>> => {
    const storage = encodingProvider.storage(label)
    const result = await provider.getStorage(
      address,
      storage.encode(key as any),
    )

    if (result.success) {
      return {
        success: true,
        value: result.value ? storage.decode(result.value) : undefined,
      }
    }
    return {
      success: false,
      value: result.value,
    }
  }

  return {
    async getNested<L extends string & Exclude<keyof S, "">>(
      label: L,
      ...args: S[L]["key"] extends undefined ? [] : [key: S[L]["key"]]
    ): Promise<ResultPayload<S[L]["value"], StorageErr>> {
      return getStorage(label, args[0])
    },
    async getRoot(): Promise<
      ResultPayload<S[""]["value"] & UnNest<Omit<S, "">>, StorageErr>
    > {
      const root = (await getStorage("", undefined)) as ResultPayload<
        S[""]["value"],
        StorageErr
      >
      if (!root.success) {
        return root
      }

      const value = root.value as S[""]["value"] & UnNest<Omit<S, "">>
      for (const path of encodingProvider.storagePaths()) {
        if (path === "") continue
        assignFnAtPath(value, path.split("."), (key: any) =>
          getStorage(path, key),
        )
      }

      return {
        success: true,
        value,
      }
    },
  }
}

const assignFnAtPath = (
  target: any,
  segments: string[],
  value: (...args: unknown[]) => unknown,
) => {
  const [current, ...rest] = segments
  if (rest.length === 0) {
    if (typeof target[current] === "object") {
      target[current] = Object.assign(value, target[current])
    } else {
      target[current] = value
    }
  } else {
    target[current] = current in target ? target[current] : {}
    assignFnAtPath(target[current], rest, value)
  }
}

type NestedStorage<S extends InkStorageDescriptor, StorageErr> =
  Exclude<keyof S, ""> extends never
    ? {}
    : {
        getNested<L extends string & Exclude<keyof S, "">>(
          label: L,
          ...args: S[L]["key"] extends undefined ? [] : [key: S[L]["key"]]
        ): Promise<ResultPayload<S[L]["value"], StorageErr>>
      }

type RootStorage<
  S extends InkStorageDescriptor,
  StorageErr,
> = "" extends keyof S
  ? {
      getRoot(): Promise<
        ResultPayload<S[""]["value"] & UnNest<Omit<S, "">>, StorageErr>
      >
    }
  : {}

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never

type BuildNested<K extends string, V> = K extends `${infer P}.${infer Rest}`
  ? { [Key in P]: BuildNested<Rest, V> }
  : K extends ""
    ? V
    : {
        [Key in K]: V
      }

type UnNest<S extends InkStorageDescriptor> = UnionToIntersection<
  {
    [K in string & keyof S]: BuildNested<
      K,
      (
        ...args: S[K]["key"] extends undefined ? [] : [key: S[K]["key"]]
      ) => Promise<ResultPayload<S[K]["value"], StorageError>>
    >
  }[string & keyof S]
>
