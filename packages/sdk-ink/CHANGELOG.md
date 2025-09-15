# Changelog

## Unreleased

## 0.4.1 2025-09-15

### Fixed

- Fix compatibility error on revive ContractInfoOf
- Fix compatibility error on revive trace_call

## 0.4.0 2025-07-25

### Added

- `reviveAddressIsMapped()` standalone utility to have it without the need of specifiying a contract.

### Fixed

- `contract.query()` will decode debug `panic!()` and `return_value(REVERT, &"message")` messages as `{ success: false, value: { type: 'FlagReverted', value: { message, .. }}}`.

## 0.3.2 2025-07-16

### Fixed

- Add support for PAssetHub descriptors

## 0.3.1 2025-07-14

### Fixed

- queries will not load without `atBest` option.

## 0.3.0 2025-06-26

### Added

- `InkSdkOptions` parameter to `createInkSdk` and `createReviveSdk`, with `atBest` option to target the best block instead of the finalized.

## 0.2.0 2025-06-10

### Added

- Deployer
  - `estimateAddress()`: Returns the estimated address for a deployment
- Contract
  - `accountId` with the accountId (SS58) of the contract
- Utilities
  - `getDeploymentAddressWithNonce` to estimate a revive deployment address with an account nonce (equivalent to `create1` in polkadot-sdk)
  - `reviveSdk.addressIsMapped(addr): Promise<bool>` to check whether an address is ready to operate with pallet revive.

### Fixed

- decode events when dry-running in pallet revive.
- use variable-sized storage key for pallet revive.

## 0.1.0 2025-05-28

### Added

- `createReviveSdk` for ink!v6 (shared interface with `createInkSdk`).
- `deploy()` to dry-run deploy result to directly get the deployment transaction.
- `send()` to dry-run call result to directly get the call transaction.
- `.storageDeposit` to dry-run results.

### Changed

- `storageDepositLimit` is now required when sending or deploying if `origin` is not specified.
- `readDeploymentEvents` now returns an array of deployed contracts and their respective events.
- `salt` parameter is `FixedSizeBinary<32>`.

### Fixed

- Fix descriptor types after update to polkadot-api@1.11.0

## 0.0.1-1 2025-02-17

- Update deps

## 0.0.1-0 2025-01-13

Initial release
