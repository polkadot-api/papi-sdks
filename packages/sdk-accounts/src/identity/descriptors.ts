import { SdkDefinition } from "@polkadot-api/common-sdk-utils"
import {
  ApisTypedef,
  Enum,
  SizedHex,
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
  Raw2: SizedHex<2>
  Raw3: SizedHex<3>
  Raw4: SizedHex<4>
  Raw5: SizedHex<5>
  Raw6: SizedHex<6>
  Raw7: SizedHex<7>
  Raw8: SizedHex<8>
  Raw9: SizedHex<9>
  Raw10: SizedHex<10>
  Raw11: SizedHex<11>
  Raw12: SizedHex<12>
  Raw13: SizedHex<13>
  Raw14: SizedHex<14>
  Raw15: SizedHex<15>
  Raw16: SizedHex<16>
  Raw17: SizedHex<17>
  Raw18: SizedHex<18>
  Raw19: SizedHex<19>
  Raw20: SizedHex<20>
  Raw21: SizedHex<21>
  Raw22: SizedHex<22>
  Raw23: SizedHex<23>
  Raw24: SizedHex<24>
  Raw25: SizedHex<25>
  Raw26: SizedHex<26>
  Raw27: SizedHex<27>
  Raw28: SizedHex<28>
  Raw29: SizedHex<29>
  Raw30: SizedHex<30>
  Raw31: SizedHex<31>
  Raw32: SizedHex<32>
  BlakeTwo256: SizedHex<32>
  Sha256: SizedHex<32>
  Keccak256: SizedHex<32>
  ShaThree256: SizedHex<32>
}>

export type IdentityInfo = {
  display: IdentityData
  legal: IdentityData
  web: IdentityData
  matrix: IdentityData
  email: IdentityData
  pgp_fingerprint?: SizedHex<20> | undefined
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
  Uint8Array | undefined,
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
