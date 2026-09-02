# Custom categories with LLM-picked icons

- **Date:** 2026-09-01
- **Type:** feature
- **Status:** shipped

## Summary

Users can add expense categories from the add-expense form. Each category stores an icon id from a fixed catalog. OpenAI (BYOK) picks the id from the name and kind; without a key, a name heuristic is used. Seeded categories have preset icons; older Dexie rows without `icon` are backfilled on list.

## What changed

- [`src/shared/domain/ledger.ts`](../../src/shared/domain/ledger.ts) — `Category.icon`.
- [`src/shared/domain/categoryIcon.ts`](../../src/shared/domain/categoryIcon.ts), [`src/shared/ui/CategoryIcon.tsx`](../../src/shared/ui/CategoryIcon.tsx).
- [`src/features/imports/llm.ts`](../../src/features/imports/llm.ts) — `pickCategoryIcon` (D11 BYOK).
- [`src/features/expenses/api.ts`](../../src/features/expenses/api.ts) — `addCategory`; icon backfill in `listCategories`.
- [`supabase/migrations/002_category_icon.sql`](../../supabase/migrations/002_category_icon.sql).

## Why / rejected

Icons are catalog ids, not free-form SVG from the model, so the UI stays consistent if the LLM returns a bad value.

## Follow-ups

None.
