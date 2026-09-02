# Two-pane expense ledger

- **Date:** 2026-09-01
- **Type:** feature
- **Status:** shipped

## Summary

The expense tracker ledger is a two-column layout: lists and totals on the left, add-expense form on the right. The form collapses and the choice is remembered in this browser.

## What changed

- [`src/features/expenses/screens/ExpensesPage.tsx`](../../src/features/expenses/screens/ExpensesPage.tsx) — left lists, right sticky form, Hide / Add expense rail.
- [`src/app/Shell.tsx`](../../src/app/Shell.tsx) — content max width `max-w-6xl` so two columns fit.
- Collapse key: `lifeledger.expenseFormOpen`.

## Follow-ups

None.
