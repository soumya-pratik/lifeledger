# Income must initialize the month before expenses

- **Date:** 2026-09-02
- **Type:** decision
- **Status:** shipped

## Summary

A ledger month is initialized when it has at least one income row. The full income setup card shows only until then. After that it hides; **Edit income** remains for corrections. Manual expenses cannot be saved for a month with no income.

## What changed

- [`src/features/expenses/screens/ExpensesPage.tsx`](../../src/features/expenses/screens/ExpensesPage.tsx) — setup vs compact income UI; add-expense form locked until ready.
- [`src/features/expenses/api.ts`](../../src/features/expenses/api.ts) — `addManualExpense` checks `listIncomes` for `monthKey(spentOn)`.

## Why / rejected

Users should set the month’s income before recording spend. Rejected: always-visible income card after setup.

## Follow-ups

Statement import is not gated the same way yet.
