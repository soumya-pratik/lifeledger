# 02 — Project structure

Repository is a **single package** (not a monorepo). Path alias `@/` → `src/`.

```text
lifeledger/
  docs/                         This blueprint
  public/
    favicon.svg
    sample-hdfc-style.csv       Golden-ish sample for CSV import
  src/
    app/                        Shell, router, settings (cross-cutting UI)
    features/
      expenses/                 Expense bounded context
        api.ts                  Dexie writes/reads, proposals, summaries
        screens/ExpensesPage.tsx
      imports/                  Statement + LLM bounded context
        api.ts                  Orchestrates parse → propose
        parseCsv.ts
        contract.ts             Zod for LLM JSON → ExpenseDraft
        llm.ts                  BYOK OpenAI adapter
        screens/ImportPage.tsx
      journal/                  Placeholder only — do not implement yet
    shared/
      domain/                   Types: expense, ledger, monthReview
      lib/                      money, dates, id, fingerprint/redact
      db/dexie.ts
      auth/                     local workspace + SessionProvider
      supabase/client.ts        null if env missing
    main.tsx
    index.css
    vite-env.d.ts
  supabase/migrations/001_init.sql
  index.html
  package.json
  vite.config.ts
  tsconfig*.json
  tailwind.config.js
  postcss.config.js
  .env.example
  README.md
```

## Folder responsibilities

| Path | Responsibility |
|------|----------------|
| `src/app` | Chrome: title, nav, routes, settings. No domain math. |
| `src/features/expenses` | Book of record for spends. Only module that inserts `expenses`. |
| `src/features/imports` | Files, parsers, LLM. Calls `proposeImported`. |
| `src/features/journal` | Reserved name for later vertical. |
| `src/shared/domain` | Canonical types. No I/O. |
| `src/shared/lib` | Pure helpers. |
| `src/shared/db` | Dexie schema version 1. |
| `src/shared/auth` | Ensure personal ledger; session context. |
| `src/shared/supabase` | Browser client factory. |
| `supabase/migrations` | Cloud schema + RLS; source of truth for Postgres. |
| `docs/` | Human/AI blueprint — not imported by the app. |

## Build tools

- **Vite 7** — dev server and SPA bundle
- **TypeScript project references** — `tsconfig.json` references `tsconfig.app.json` (src) and `tsconfig.node.json` (vite.config)
- **PostCSS + Tailwind 3** — utilities
- **vite-plugin-pwa** — injects service worker (`registerType: autoUpdate`, `injectRegister: auto`)
- Scripts: `dev`, `build` (`tsc -b && vite build`), `preview`

## Config files of note

- `vite.config.ts`: alias `@`, PWA manifest (name LifeLedger, theme `#0b1220`, display standalone, start `/`)
- `tailwind.config.js`: content `index.html` + `src/**/*.{ts,tsx}`; colors `ink.950–700`; font DM Sans
- `index.html`: viewport-fit, theme-color, Google fonts DM Sans

## What not to add to structure

Do not introduce `apps/web` or `packages/ui` until a second deployable exists. Do not put LLM code under expenses.
