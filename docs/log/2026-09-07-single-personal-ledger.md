# One personal ledger on this device

- **Date:** 2026-09-07
- **Type:** feature
- **Status:** shipped

## Summary

Duplicate personal ledgers (from parallel sign-in seeding) are collapsed to a single book. The ledger with the most expenses/income is kept; extras and their rows are deleted. Workspace boot is serialized so two hydrates cannot create two Personal books.

## What changed

- [`src/shared/auth/workspace.ts`](../../src/shared/auth/workspace.ts) — `keepSingleLedger`, mutex around `ensureUserWorkspace`.
- Settings **Active ledger** only shows when more than one ledger remains (unchanged UI).

## Follow-ups

Household `shared` ledgers still out of scope. Merge-across-ledgers if someone split real data on purpose.
