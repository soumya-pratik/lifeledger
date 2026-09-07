# Admin role, user list, per-user modules

- **Date:** 2026-09-07
- **Type:** feature
- **Status:** shipped

## Summary

Profiles have `admin` | `user`. Nav and Home use role plus `profile_modules`, not `plan_id`. Admins see every catalog module and `/admin`. An admin can change another person’s role and Expenses/Splits flags.

## What changed

- [`supabase/migrations/005_admin_roles.sql`](../../supabase/migrations/005_admin_roles.sql) — `role`, `profile_modules`, `is_admin()`, `admin_set_user_role` / `admin_set_user_modules` (last admin cannot be demoted), seed from Auth for the designated Gmail.
- [`src/shared/entitlements/`](../../src/shared/entitlements/) — fetch `role` + modules; admin = all enabled catalog ids.
- [`src/app/AdminPage.tsx`](../../src/app/AdminPage.tsx), `RequireRole`, Admin nav (sidebar, header, mobile).

## Follow-ups

Store `last_seen` instead of using `profiles.updated_at` as a login proxy. Stripe still unused; `plan_id` remains on the row for Settings.
