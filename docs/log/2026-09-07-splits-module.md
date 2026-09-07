# Splits module and plan entitlements

- **Date:** 2026-09-07
- **Type:** feature
- **Status:** shipped (Phase 1)

## Summary

Splits is a LifeLedger submodule (not a second app) for group bills. Access is gated by backend plan (`profiles.plan_id` + `plan_modules`). Data lives on **split groups**, not the expense tracker ledger — a named exception to D04 for this vertical.

## What changed

- [`supabase/migrations/004_plans_and_splits.sql`](../../supabase/migrations/004_plans_and_splits.sql) — `plans`, `plan_modules`, `profiles`, split tables, RLS, `invite_split_group_member`.
- [`src/shared/entitlements/`](../../src/shared/entitlements/) — fetch plan, filter catalog.
- [`src/features/splits/`](../../src/features/splits/) — groups, bills, balances, settle up.
- Catalog id `splits` in [`src/shared/config/features.ts`](../../src/shared/config/features.ts).

Enable Splits: `update profiles set plan_id = 'plus' where user_id = …`.

## Why / rejected

Friends need a shared cloud book of record (Dexie-only would not work). Trademark name Splitwise is not used in the UI. Stripe checkout is not in Phase 1.

## Follow-ups

Phase 2+: 1:1 friends, simplify debts, comments, activity. Stripe on the same `plans` tables.
