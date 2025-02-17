// .papi/descriptors/src/pas.ts
var toBinary = (() => {
  const table = new Uint8Array(128);
  for (let i = 0; i < 64; i++) table[i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i * 4 - 205] = i;
  return (base64) => {
    const n = base64.length, bytes = new Uint8Array((n - Number(base64[n - 1] === "=") - Number(base64[n - 2] === "=")) * 3 / 4 | 0);
    for (let i2 = 0, j = 0; i2 < n; ) {
      const c0 = table[base64.charCodeAt(i2++)], c1 = table[base64.charCodeAt(i2++)];
      const c2 = table[base64.charCodeAt(i2++)], c3 = table[base64.charCodeAt(i2++)];
      bytes[j++] = c0 << 2 | c1 >> 4;
      bytes[j++] = c1 << 4 | c2 >> 2;
      bytes[j++] = c2 << 6 | c3;
    }
    return bytes;
  };
})();
var descriptorValues = import("./descriptors.mjs").then((module) => module["Pas"]);
var metadataTypes = import("./metadataTypes.mjs").then(
  (module) => toBinary("default" in module ? module.default : module)
);
var asset = {};
var getMetadata = () => Promise.resolve(new Uint8Array());
var genesis = "0x77afd6190f1554ad45fd0d31aee62aacc33c6db0ea801129acb813f913e0764f";
var _allDescriptors = { descriptors: descriptorValues, metadataTypes, asset, getMetadata, genesis };
var pas_default = _allDescriptors;

// .papi/descriptors/src/pah.ts
var toBinary2 = (() => {
  const table = new Uint8Array(128);
  for (let i = 0; i < 64; i++) table[i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i * 4 - 205] = i;
  return (base64) => {
    const n = base64.length, bytes = new Uint8Array((n - Number(base64[n - 1] === "=") - Number(base64[n - 2] === "=")) * 3 / 4 | 0);
    for (let i2 = 0, j = 0; i2 < n; ) {
      const c0 = table[base64.charCodeAt(i2++)], c1 = table[base64.charCodeAt(i2++)];
      const c2 = table[base64.charCodeAt(i2++)], c3 = table[base64.charCodeAt(i2++)];
      bytes[j++] = c0 << 2 | c1 >> 4;
      bytes[j++] = c1 << 4 | c2 >> 2;
      bytes[j++] = c2 << 6 | c3;
    }
    return bytes;
  };
})();
var descriptorValues2 = import("./descriptors.mjs").then((module) => module["Pah"]);
var metadataTypes2 = import("./metadataTypes.mjs").then(
  (module) => toBinary2("default" in module ? module.default : module)
);
var asset2 = {};
var getMetadata2 = () => Promise.resolve(new Uint8Array());
var genesis2 = "0xd6eec26135305a8ad257a20d003357284c8aa03d0bdb2b357ab0a22371e11ef2";
var _allDescriptors2 = { descriptors: descriptorValues2, metadataTypes: metadataTypes2, asset: asset2, getMetadata: getMetadata2, genesis: genesis2 };
var pah_default = _allDescriptors2;

// .papi/descriptors/src/wnd.ts
var toBinary3 = (() => {
  const table = new Uint8Array(128);
  for (let i = 0; i < 64; i++) table[i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i * 4 - 205] = i;
  return (base64) => {
    const n = base64.length, bytes = new Uint8Array((n - Number(base64[n - 1] === "=") - Number(base64[n - 2] === "=")) * 3 / 4 | 0);
    for (let i2 = 0, j = 0; i2 < n; ) {
      const c0 = table[base64.charCodeAt(i2++)], c1 = table[base64.charCodeAt(i2++)];
      const c2 = table[base64.charCodeAt(i2++)], c3 = table[base64.charCodeAt(i2++)];
      bytes[j++] = c0 << 2 | c1 >> 4;
      bytes[j++] = c1 << 4 | c2 >> 2;
      bytes[j++] = c2 << 6 | c3;
    }
    return bytes;
  };
})();
var descriptorValues3 = import("./descriptors.mjs").then((module) => module["Wnd"]);
var metadataTypes3 = import("./metadataTypes.mjs").then(
  (module) => toBinary3("default" in module ? module.default : module)
);
var asset3 = {};
var getMetadata3 = () => Promise.resolve(new Uint8Array());
var genesis3 = "0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e";
var _allDescriptors3 = { descriptors: descriptorValues3, metadataTypes: metadataTypes3, asset: asset3, getMetadata: getMetadata3, genesis: genesis3 };
var wnd_default = _allDescriptors3;

// .papi/descriptors/src/wah.ts
var toBinary4 = (() => {
  const table = new Uint8Array(128);
  for (let i = 0; i < 64; i++) table[i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i * 4 - 205] = i;
  return (base64) => {
    const n = base64.length, bytes = new Uint8Array((n - Number(base64[n - 1] === "=") - Number(base64[n - 2] === "=")) * 3 / 4 | 0);
    for (let i2 = 0, j = 0; i2 < n; ) {
      const c0 = table[base64.charCodeAt(i2++)], c1 = table[base64.charCodeAt(i2++)];
      const c2 = table[base64.charCodeAt(i2++)], c3 = table[base64.charCodeAt(i2++)];
      bytes[j++] = c0 << 2 | c1 >> 4;
      bytes[j++] = c1 << 4 | c2 >> 2;
      bytes[j++] = c2 << 6 | c3;
    }
    return bytes;
  };
})();
var descriptorValues4 = import("./descriptors.mjs").then((module) => module["Wah"]);
var metadataTypes4 = import("./metadataTypes.mjs").then(
  (module) => toBinary4("default" in module ? module.default : module)
);
var asset4 = {};
var getMetadata4 = () => Promise.resolve(new Uint8Array());
var genesis4 = "0x67f9723393ef76214df0118c34bbbd3dbebc8ed46a10973a8c969d48fe7598c9";
var _allDescriptors4 = { descriptors: descriptorValues4, metadataTypes: metadataTypes4, asset: asset4, getMetadata: getMetadata4, genesis: genesis4 };
var wah_default = _allDescriptors4;

// .papi/descriptors/src/common-types.ts
import { _Enum } from "polkadot-api";
var PasXcmVersionedXcm = _Enum;
var XcmV2Instruction = _Enum;
var XcmV2MultiassetAssetId = _Enum;
var XcmV2MultilocationJunctions = _Enum;
var XcmV2Junction = _Enum;
var XcmV2NetworkId = _Enum;
var XcmV2BodyId = _Enum;
var XcmV2JunctionBodyPart = _Enum;
var XcmV2MultiassetFungibility = _Enum;
var XcmV2MultiassetAssetInstance = _Enum;
var XcmV2Response = _Enum;
var XcmV2TraitsError = _Enum;
var XcmV2OriginKind = _Enum;
var XcmV2MultiAssetFilter = _Enum;
var XcmV2MultiassetWildMultiAsset = _Enum;
var XcmV2MultiassetWildFungibility = _Enum;
var XcmV2WeightLimit = _Enum;
var XcmV3Instruction = _Enum;
var XcmV3MultiassetAssetId = _Enum;
var XcmV3Junctions = _Enum;
var XcmV3Junction = _Enum;
var XcmV3JunctionNetworkId = _Enum;
var XcmV3JunctionBodyId = _Enum;
var XcmV3MultiassetFungibility = _Enum;
var XcmV3MultiassetAssetInstance = _Enum;
var XcmV3Response = _Enum;
var XcmV3TraitsError = _Enum;
var XcmV3MaybeErrorCode = _Enum;
var XcmV3MultiassetMultiAssetFilter = _Enum;
var XcmV3MultiassetWildMultiAsset = _Enum;
var XcmV3WeightLimit = _Enum;
var XcmV4Instruction = _Enum;
var XcmV4Response = _Enum;
var XcmV4AssetAssetFilter = _Enum;
var XcmV4AssetWildAsset = _Enum;
var BagsListListListError = _Enum;
var PasXcmVersionedAssetId = _Enum;
var PasXcmVersionedLocation = _Enum;
var PasXcmVersionedAssets = _Enum;
var PolkadotRuntimeOriginCaller = _Enum;
var DispatchRawOrigin = _Enum;
var GovernanceOrigin = _Enum;
var ParachainsOrigin = _Enum;
var XcmPalletOrigin = _Enum;
var DigestItem = _Enum;
var BabeDigestsNextConfigDescriptor = _Enum;
var BabeAllowedSlots = _Enum;
var MultiAddress = _Enum;
var BalancesAdjustmentDirection = _Enum;
var StakingRewardDestination = _Enum;
var StakingPalletConfigOpBig = _Enum;
var StakingPalletConfigOp = _Enum;
var GrandpaEquivocation = _Enum;
var VersionedLocatableAsset = _Enum;
var ConvictionVotingVoteAccountVote = _Enum;
var VotingConviction = _Enum;
var PreimagesBounded = _Enum;
var TraitsScheduleDispatchTime = _Enum;
var ClaimsStatementKind = _Enum;
var NominationPoolsBondExtra = _Enum;
var NominationPoolsPoolState = _Enum;
var NominationPoolsConfigOp = _Enum;
var NominationPoolsClaimPermission = _Enum;
var NominationPoolsCommissionClaimPermission = _Enum;
var PolkadotPrimitivesV6ExecutorParamsExecutorParam = _Enum;
var PolkadotPrimitivesV6PvfPrepKind = _Enum;
var PvfExecKind = _Enum;
var ValidityAttestation = _Enum;
var PolkadotPrimitivesV6DisputeStatement = _Enum;
var PolkadotPrimitivesV6ValidDisputeStatementKind = _Enum;
var InvalidDisputeStatementKind = _Enum;
var SlashingOffenceKind = _Enum;
var MultiSigner = _Enum;
var MultiSignature = _Enum;
var BrokerCoretimeInterfaceCoreAssignment = _Enum;
var ParachainsInclusionAggregateMessageOrigin = _Enum;
var ParachainsInclusionUmpQueueId = _Enum;
var TokenError = _Enum;
var ArithmeticError = _Enum;
var TransactionalError = _Enum;
var DispatchClass = _Enum;
var PreimageEvent = _Enum;
var IndicesEvent = _Enum;
var BalanceStatus = _Enum;
var TransactionPaymentEvent = _Enum;
var StakingEvent = _Enum;
var StakingForcing = _Enum;
var OffencesEvent = _Enum;
var SessionEvent = _Enum;
var GrandpaEvent = _Enum;
var ConvictionVotingEvent = _Enum;
var CommonClaimsEvent = _Enum;
var VestingEvent = _Enum;
var BountiesEvent = _Enum;
var ChildBountiesEvent = _Enum;
var ElectionProviderMultiPhaseEvent = _Enum;
var ElectionProviderMultiPhaseElectionCompute = _Enum;
var ElectionProviderMultiPhasePhase = _Enum;
var BagsListEvent = _Enum;
var NominationPoolsEvent = _Enum;
var ParachainsInclusionEvent = _Enum;
var ParachainsParasEvent = _Enum;
var ParachainsHrmpEvent = _Enum;
var ParachainsDisputesEvent = _Enum;
var ParachainsDisputeLocation = _Enum;
var ParachainsDisputeResult = _Enum;
var CommonParasRegistrarEvent = _Enum;
var CommonSlotsEvent = _Enum;
var CommonAuctionsEvent = _Enum;
var PolkadotRuntimeParachainsCoretimeEvent = _Enum;
var XcmV4TraitsOutcome = _Enum;
var AssetRateEvent = _Enum;
var XcmVersionedXcm = _Enum;
var XcmV5Instruction = _Enum;
var XcmV5Junctions = _Enum;
var XcmV5Junction = _Enum;
var XcmV5NetworkId = _Enum;
var XcmV5AssetFilter = _Enum;
var XcmV5WildAsset = _Enum;
var XcmVersionedAssetId = _Enum;
var XcmVersionedLocation = _Enum;
var XcmVersionedAssets = _Enum;
var WestendRuntimeGovernanceOriginsPalletCustomOriginsOrigin = _Enum;
var IdentityData = _Enum;
var IdentityJudgement = _Enum;
var WestendRuntimeProxyType = _Enum;
var PolkadotRuntimeCommonAssignedSlotsSlotLeasePeriodStart = _Enum;
var RecoveryEvent = _Enum;
var PolkadotRuntimeCommonAssignedSlotsEvent = _Enum;
var RootTestingEvent = _Enum;
var PolkadotRuntimeCommonIdentityMigratorEvent = _Enum;
export {
  ArithmeticError,
  AssetRateEvent,
  BabeAllowedSlots,
  BabeDigestsNextConfigDescriptor,
  BagsListEvent,
  BagsListListListError,
  BalanceStatus,
  BalancesAdjustmentDirection,
  BountiesEvent,
  BrokerCoretimeInterfaceCoreAssignment,
  ChildBountiesEvent,
  ClaimsStatementKind,
  CommonAuctionsEvent,
  CommonClaimsEvent,
  CommonParasRegistrarEvent,
  CommonSlotsEvent,
  ConvictionVotingEvent,
  ConvictionVotingVoteAccountVote,
  DigestItem,
  DispatchClass,
  DispatchRawOrigin,
  ElectionProviderMultiPhaseElectionCompute,
  ElectionProviderMultiPhaseEvent,
  ElectionProviderMultiPhasePhase,
  GovernanceOrigin,
  GrandpaEquivocation,
  GrandpaEvent,
  IdentityData,
  IdentityJudgement,
  IndicesEvent,
  InvalidDisputeStatementKind,
  MultiAddress,
  MultiSignature,
  MultiSigner,
  NominationPoolsBondExtra,
  NominationPoolsClaimPermission,
  NominationPoolsCommissionClaimPermission,
  NominationPoolsConfigOp,
  NominationPoolsEvent,
  NominationPoolsPoolState,
  OffencesEvent,
  ParachainsDisputeLocation,
  ParachainsDisputeResult,
  ParachainsDisputesEvent,
  ParachainsHrmpEvent,
  ParachainsInclusionAggregateMessageOrigin,
  ParachainsInclusionEvent,
  ParachainsInclusionUmpQueueId,
  ParachainsOrigin,
  ParachainsParasEvent,
  PasXcmVersionedAssetId,
  PasXcmVersionedAssets,
  PasXcmVersionedLocation,
  PasXcmVersionedXcm,
  PolkadotPrimitivesV6DisputeStatement,
  PolkadotPrimitivesV6ExecutorParamsExecutorParam,
  PolkadotPrimitivesV6PvfPrepKind,
  PolkadotPrimitivesV6ValidDisputeStatementKind,
  PolkadotRuntimeCommonAssignedSlotsEvent,
  PolkadotRuntimeCommonAssignedSlotsSlotLeasePeriodStart,
  PolkadotRuntimeCommonIdentityMigratorEvent,
  PolkadotRuntimeOriginCaller,
  PolkadotRuntimeParachainsCoretimeEvent,
  PreimageEvent,
  PreimagesBounded,
  PvfExecKind,
  RecoveryEvent,
  RootTestingEvent,
  SessionEvent,
  SlashingOffenceKind,
  StakingEvent,
  StakingForcing,
  StakingPalletConfigOp,
  StakingPalletConfigOpBig,
  StakingRewardDestination,
  TokenError,
  TraitsScheduleDispatchTime,
  TransactionPaymentEvent,
  TransactionalError,
  ValidityAttestation,
  VersionedLocatableAsset,
  VestingEvent,
  VotingConviction,
  WestendRuntimeGovernanceOriginsPalletCustomOriginsOrigin,
  WestendRuntimeProxyType,
  XcmPalletOrigin,
  XcmV2BodyId,
  XcmV2Instruction,
  XcmV2Junction,
  XcmV2JunctionBodyPart,
  XcmV2MultiAssetFilter,
  XcmV2MultiassetAssetId,
  XcmV2MultiassetAssetInstance,
  XcmV2MultiassetFungibility,
  XcmV2MultiassetWildFungibility,
  XcmV2MultiassetWildMultiAsset,
  XcmV2MultilocationJunctions,
  XcmV2NetworkId,
  XcmV2OriginKind,
  XcmV2Response,
  XcmV2TraitsError,
  XcmV2WeightLimit,
  XcmV3Instruction,
  XcmV3Junction,
  XcmV3JunctionBodyId,
  XcmV3JunctionNetworkId,
  XcmV3Junctions,
  XcmV3MaybeErrorCode,
  XcmV3MultiassetAssetId,
  XcmV3MultiassetAssetInstance,
  XcmV3MultiassetFungibility,
  XcmV3MultiassetMultiAssetFilter,
  XcmV3MultiassetWildMultiAsset,
  XcmV3Response,
  XcmV3TraitsError,
  XcmV3WeightLimit,
  XcmV4AssetAssetFilter,
  XcmV4AssetWildAsset,
  XcmV4Instruction,
  XcmV4Response,
  XcmV4TraitsOutcome,
  XcmV5AssetFilter,
  XcmV5Instruction,
  XcmV5Junction,
  XcmV5Junctions,
  XcmV5NetworkId,
  XcmV5WildAsset,
  XcmVersionedAssetId,
  XcmVersionedAssets,
  XcmVersionedLocation,
  XcmVersionedXcm,
  pah_default as pah,
  pas_default as pas,
  wah_default as wah,
  wnd_default as wnd
};
