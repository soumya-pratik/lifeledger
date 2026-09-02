# Spending patterns stay inside the expense tracker

- **Date:** 2026-09-01
- **Type:** decision
- **Status:** shipped

## Summary

Charts for spending patterns are a tab of the expense tracker, not a separate product module or sidebar feature. Route is `/expenses/insights`. `/insights` redirects there.

## What changed

- [`src/features/expenses/screens/InsightsPage.tsx`](../../src/features/expenses/screens/InsightsPage.tsx), [`src/features/expenses/insights.ts`](../../src/features/expenses/insights.ts), [`src/shared/ui/charts.tsx`](../../src/shared/ui/charts.tsx).
- [`src/features/expenses/screens/ExpensesLayout.tsx`](../../src/features/expenses/screens/ExpensesLayout.tsx) — Ledger / Statements / Patterns.
- [`src/shared/config/features.ts`](../../src/shared/config/features.ts) — only Home + Expense tracker in nav/home (D01: expenses as first vertical, not a second app).

## Why / rejected

A standalone Insights feature in nav implied a second module. Patterns belong with ledger and statement import under one tracker.

## Follow-ups

None.
