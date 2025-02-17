# Changelog

## Unreleased

## 0.0.1-2 2025-02-17

### Added

- **Bounties**
  - Add bounty and child bounty account.
- **Conviction Voting**
  - Add conviction voting SDK

### Changed

- **Referenda**
  - The SDK now returns all referenda instead of only the ongoing ones.

### Fixed

- **Referenda**
  - Fix reciprocal curve math.

## 0.0.1-1 - 2025-01-20

### Added

- **Referenda**
  - Add `getTrack()` to OngoingReferendum.
  - Add watch API
  - Add `getOngoingReferendum(id: number)`

### Changed

- **Referenda**
  - Make `enactment` of `createReferenda` optional.
- **Bounties**
  - Change watch API to share the inner subscription.

## 0.0.1-0 - 2025-01-13

Initial release
