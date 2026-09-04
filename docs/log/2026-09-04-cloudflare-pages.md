# Cloudflare Pages hosting

- **Date:** 2026-09-04
- **Type:** feature
- **Status:** shipped

## Summary

Documented Cloudflare Pages as the test/production host and added an SPA fallback so client routes work on hard reload.

## What changed

- `public/_redirects` — `/*` → `/index.html` 200 for Pages
- `README.md` — Pages build settings, `VITE_SUPABASE_*` env, Supabase/Google URL allow-list
- `docs/09_Workflows.md` — deploy is Pages, not intent-only

Depends on D02 / D20 (static Vite PWA on Cloudflare Pages).

## Follow-ups

Create the Pages project in the Cloudflare dashboard and paste anon keys there; not stored in git.
