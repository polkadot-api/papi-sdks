export type SdkDefinition<P, R> = {
  descriptors: Promise<any> & {
    pallets: P
    apis: R
  }
  asset: any
  metadataTypes: any
}
