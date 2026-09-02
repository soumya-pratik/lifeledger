# Monthly income vs spend

- **Date:** 2026-09-01
- **Type:** feature
- **Status:** shipped

## Summary

Income is logged per ledger and calendar month as one or more sources. The ledger shows Income / Spent / Left (or Over), a spend-of-income bar, and a monthly income card. Month review JSON includes income and remaining (D11: aggregates only).

## What changed

- [`src/shared/domain/income.ts`](../../src/shared/domain/income.ts).
- Dexie `incomes` store (version 2). [`src/features/expenses/api.ts`](../../src/features/expenses/api.ts) — `addIncome`, `listIncomes`, `listAllIncomes`, `deleteIncome`.
- [`src/features/expenses/screens/ExpensesPage.tsx`](../../src/features/expenses/screens/ExpensesPage.tsx) — income section and stats.
- [`supabase/migrations/003_monthly_income.sql`](../../supabase/migrations/003_monthly_income.sql).

## Why / rejected

Income is not an expense with a negative amount. CSV still skips credits as spends (D10).

## Follow-ups

None.
