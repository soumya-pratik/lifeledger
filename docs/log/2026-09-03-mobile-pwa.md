# Mobile-ready PWA install experience

- **Date:** 2026-09-03
- **Type:** feature
- **Status:** shipped

## Summary

LifeLedger is now installable on mobile and desktop with proper PWA icons, a service worker, safe-area layout, bottom navigation, and an install prompt.

## What changed

- `vite.config.ts` — full web manifest (192/512 PNG + maskable icon, scope, orientation, categories).
- `public/icon.svg`, generated PNG icons, `scripts/generate-pwa-icons.mjs` — installable icon set.
- `index.html` — Apple touch icon, mobile meta tags, theme-color for light/dark.
- `src/shared/pwa/InstallBanner.tsx` — Chrome install prompt + iOS “Add to Home Screen” hint.
- `src/app/MobileBottomNav.tsx`, `Shell.tsx` — thumb-friendly bottom nav and safe-area padding on mobile.
- `src/index.css`, `AppHeader.tsx`, `LoginPage.tsx`, `ExpensesLayout.tsx` — notch/home-indicator spacing and scrollable module tabs.
- `SettingsPage.tsx` — install status and instructions.

## Why / rejected

Browsers require PNG icons (not SVG alone) and a registered service worker before showing an install prompt. A bottom nav was added instead of relying only on the hamburger menu for one-handed mobile use.
