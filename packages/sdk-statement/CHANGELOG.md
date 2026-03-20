# Changelog

## Unreleased

### Changed

- Change API to new subscription-based statement store
  - `createStatementSdk` takes an endpoint URL rather than a `req` function.
  - Update `Statement` to new spec: replaces `priority` for `expiry`.
  - Removes `dump()`
  - `getStatements` takes a `topicFilter` parameter
  - Adds filtering functions for broadcasts and posted
  - Adds `subscribeStatements(topicFilter)` for subscribing

## 0.4.1 2026-03-16

### Fixed

- Update dependencies

## 0.4.0 2026-02-23

### Changed

- BREAKING!: Update to PAPI v2
- Changed all `FixedSizeBinary` interfaces to `SizedHex`

## 0.3.0 - 2025-12-16

### Added

- Add support for `submit` decoded result following https://github.com/paritytech/polkadot-sdk/pull/10421

## 0.2.0 - 2025-11-26

### Changed

- `StatementSigner.sign` is now async

### Removed

- Remove unwanted exports

## 0.1.0 - 2025-09-29

### Added

- Initial unstable release
