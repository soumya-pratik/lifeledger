# Shareable app link in Settings

- **Date:** 2026-09-07
- **Type:** feature
- **Status:** shipped

## Summary

Settings shows a LifeLedger URL to copy or share. Recipients sign in with Google; module access stays admin-controlled.

## What changed

- [`src/app/SettingsPage.tsx`](../../src/app/SettingsPage.tsx) — Share LifeLedger: copy, and native share when the browser supports it.
- URL is `VITE_PUBLIC_APP_URL` when set, otherwise the current origin.
