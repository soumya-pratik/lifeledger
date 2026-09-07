# Split group create RPC and install banner stacking

- **Date:** 2026-09-07
- **Type:** feature
- **Status:** shipped

## Summary

New split groups are created via `create_split_group` so owner membership exists before RLS select. The install banner sits in the same mobile footer as the bottom nav, above it.

## What changed

- [`supabase/migrations/006_create_split_group.sql`](../../supabase/migrations/006_create_split_group.sql)
- [`src/features/splits/api.ts`](../../src/features/splits/api.ts) — RPC instead of insert+select then members.
- [`src/app/Shell.tsx`](../../src/app/Shell.tsx) — fixed footer column: banner then nav.
