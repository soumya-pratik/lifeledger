# LifeLedger is a super-app of per-user submodules

- **Date:** 2026-09-02
- **Type:** decision
- **Status:** intent

## Summary

The base product plan: LifeLedger is the super-app. Expense tracker (and every later vertical) is a submodule inside it, not a separate product. Users should be able to turn modules on or off for themselves. Module *data* for expenses stays on the ledger (D04).

## What changed

- [`docs/DECISIONS.md`](../DECISIONS.md) — D01 rewritten (super-app + per-user config intent).
- [`docs/00_Project_Overview.md`](../00_Project_Overview.md) — purpose paragraph.
- Registry today is still global: [`src/shared/config/features.ts`](../../src/shared/config/features.ts).

## Why / rejected

One shell for life areas; avoid a new app per module. Per-user enablement so not everyone is forced onto every submodule. Rejected: always-on modules for all accounts; sibling apps.

## Follow-ups

Persist per-user module flags (Dexie + later sync) and filter `listFeatures()` by the signed-in user. Do not mix that with ledger membership.
