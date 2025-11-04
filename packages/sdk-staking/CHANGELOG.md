# Changelog

## Unreleased

### Fixed

- Rebond + bond_extra fails in case rebond results in a bond smaller than minBond.

## 0.3.2 2025-11-02

### Fixed

- Pool commissions not in per one.

## 0.3.1 2025-10-30

### Fixed

- `accountStatus$` not updating when starting a nomination.
- Receiving bonded rewards after calling `stopNomination`.
- Incompatible staking.ledger entry on other chains than polkadot.

## 0.3.0 2025-10-22

### Added

- `upsertNomination` that batches a transaction with the required changes to a nomination.
- `stopNomination` that batches a transaction to stop nominating.

### Fixed

- Remove console errors when an active validator has no points.

## 0.2.0 2025-10-21

### Added

- Expose active nominators through `getActiveNominators`

## 0.1.0 2025-10-21

Initial release
