# Changelog

## Unreleased

## 0.4.0 2025-07-25

### Added

- Identity SDK
  - `getIdentity` will check for sub-identities.

### Fixed

- Identity SDK
  - Fix `Raw1` values not getting decoded properly.

## 0.3.0 2025-07-08

### Added

- Multisig providers
  - `subscanProvider(chain, apiKey)` for subscan.
  - `fallbackProviders(...providers)` to search for an account on multiple providers.
  - `throttleProvider(provider, maxConcurrent)` to limit the amount of requests for a provider.
  - `staticProvider(multisigs)` to find multisigs within an array of pre-defined ones.

### Fixed

- Support chains regardless of proxy enum type.

## 0.2.1 2025-05-29

### Fixed

- Support new types of identity pallet.
- Fix descriptor types after update to polkadot-api@1.11.0.

## 0.2.0 2025-05-15

### Changed

- `novasamaProvider` is now a function that takes an optional chain (kusama or polkadot) and returns a `MultisigProvider`

## 0.1.0 2025-05-06

### Added

- Identity SDK

## 0.0.1-1 2025-02-17

- Update deps

## 0.0.1-0 2025-01-13

Initial release
