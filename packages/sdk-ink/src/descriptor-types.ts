import {
  Event,
  InkCallableDescriptor,
  InkStorageDescriptor,
} from "@polkadot-api/ink-contracts"
import { InkDescriptors } from "polkadot-api/ink"

export type GenericInkDescriptors = InkDescriptors<
  InkStorageDescriptor,
  InkCallableDescriptor,
  InkCallableDescriptor,
  Event
>
