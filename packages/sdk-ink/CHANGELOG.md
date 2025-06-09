# Changelog

## Unreleased

### Added

- Deployer
  - `estimateAddress()`: Returns the estimated address for a deployment
- Utilities
  - `getDeploymentAddressWithNonce` to estimate a revive deployment address with an account nonce (equivalent to `create1` in polkadot-sdk)

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
