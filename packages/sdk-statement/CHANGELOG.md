# Changelog

## Unreleased

### Changed

- BREAKING!: Updated codec to new statement store format
  - Replaced `priority` (u32) field with `expiry` (u64) field
  - `expiry` encodes timestamp (upper 32 bits) + sequence number (lower 32 bits)
  - Moved `decryptionKey` from index 1 to index 3
  - Moved `channel` from index 3 to index 6
  - Reduced max topics from 4 to 2
- BREAKING!: Removed `statement_broadcastsStatement` and `statement_postedStatement` RPC methods

### Added

- Added `createExpiry`, `createExpiryFromNow`, and `parseExpiry` helper functions
- Added `createStatementSubscriptionSdk` for real-time statement subscriptions
- Added `statement_subscribeStatement` subscription API support
- Added `TopicFilter`, `StatementEvent`, `SubscriptionCallback` types

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
