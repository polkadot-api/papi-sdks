import { SdkDefinition } from "@polkadot-api/common-sdk-utils"
import {
  ApisTypedef,
  Binary,
  Enum,
  FixedSizeBinary,
  PalletsTypedef,
  SS58String,
  StorageDescriptor,
  TypedApi,
} from "polkadot-api"

export type IdentityJudgement = Enum<{
  Unknown: undefined
  FeePaid: bigint
  Reasonable: undefined
  KnownGood: undefined
  OutOfDate: undefined
  LowQuality: undefined
  Erroneous: undefined
}>

export type IdentityData = Enum<{
  None: undefined
  Raw0: undefined
  Raw1: number
  Raw2: FixedSizeBinary<2>
  Raw3: FixedSizeBinary<3>
  Raw4: FixedSizeBinary<4>
  Raw5: FixedSizeBinary<5>
  Raw6: FixedSizeBinary<6>
  Raw7: FixedSizeBinary<7>
  Raw8: FixedSizeBinary<8>
  Raw9: FixedSizeBinary<9>
  Raw10: FixedSizeBinary<10>
  Raw11: FixedSizeBinary<11>
  Raw12: FixedSizeBinary<12>
  Raw13: FixedSizeBinary<13>
  Raw14: FixedSizeBinary<14>
  Raw15: FixedSizeBinary<15>
  Raw16: FixedSizeBinary<16>
  Raw17: FixedSizeBinary<17>
  Raw18: FixedSizeBinary<18>
  Raw19: FixedSizeBinary<19>
  Raw20: FixedSizeBinary<20>
  Raw21: FixedSizeBinary<21>
  Raw22: FixedSizeBinary<22>
  Raw23: FixedSizeBinary<23>
  Raw24: FixedSizeBinary<24>
  Raw25: FixedSizeBinary<25>
  Raw26: FixedSizeBinary<26>
  Raw27: FixedSizeBinary<27>
  Raw28: FixedSizeBinary<28>
  Raw29: FixedSizeBinary<29>
  Raw30: FixedSizeBinary<30>
  Raw31: FixedSizeBinary<31>
  Raw32: FixedSizeBinary<32>
  BlakeTwo256: FixedSizeBinary<32>
  Sha256: FixedSizeBinary<32>
  Keccak256: FixedSizeBinary<32>
  ShaThree256: FixedSizeBinary<32>
}>

export type IdentityInfo = {
  display: IdentityData
  legal: IdentityData
  web: IdentityData
  matrix: IdentityData
  email: IdentityData
  pgp_fingerprint?: FixedSizeBinary<20> | undefined
  image: IdentityData
  twitter: IdentityData
  github: IdentityData
  discord: IdentityData
}

export type OldIdentityValue = [
  {
    judgements: Array<[number, IdentityJudgement]>
    deposit: bigint
    info: IdentityInfo
  },
  Binary | undefined,
]
export type IdentityValue = {
  judgements: Array<[number, IdentityJudgement]>
  deposit: bigint
  info: IdentityInfo
}

type IdentitySdkPallets = PalletsTypedef<
  {
    Identity: {
      /**
       * Information that is pertinent to identify the entity behind an account.
       * First item is the registration, second is the account's primary
       * username.
       *
       * TWOX-NOTE: OK ― `AccountId` is a secure hash.
       */ IdentityOf: StorageDescriptor<
        [Key: SS58String],
        OldIdentityValue | IdentityValue,
        true,
        never
      >
      /**
       * The super-identity of an alternative "sub" identity together with its
       * name, within that context. If the account is not some other account's
       * sub-identity, then just `None`.
       */
      SuperOf: StorageDescriptor<
        [Key: SS58String],
        [SS58String, IdentityData],
        true,
        never
      >
    }
  },
  {},
  {},
  {},
  {},
  {}
>
type IdentitySdkDefinition = SdkDefinition<IdentitySdkPallets, ApisTypedef<{}>>
export type IdentitySdkTypedApi = TypedApi<IdentitySdkDefinition>
