# Changelog

## Unreleased

## 0.3.3 2025-07-12

### Fixed

- Trim referenda track names from NULLs

## 0.3.2 2025-07-02

### Fixed

- `RuntimeOriginCaller` type not exposed.

## 0.3.1 2025-05-28

### Fixed

- `childBountiesSdk.getChildBounties` mixing descriptions from different bounties.

## 0.3.0 2025-05-27

### Added

- **ChildBounties**
  - Support ChildBountiesV1
  - Add `getChildBounties()` for a promise-based API

### Fixed

- Fix descriptor types after update to polkadot-api@1.11.0

## 0.2.0 2025-05-21

### Changed

- **Bounties**
  - `filterApprovingReferenda` returns an object with the proposed curators if it's an ApproveWithCurator.

## 0.1.0 2025-05-13

### Added

- **Bounties**
  - Support ApprovedWithCurator state

### Fixed

- **Referenda**
  - Support multiple origin types

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
