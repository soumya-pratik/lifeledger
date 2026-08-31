# Instructions for another AI

You are recreating **LifeLedger**, a local-first PWA journal whose first vertical is expenses. You do **not** need the original source tree if you follow `docs/` especially `DECISIONS.md`.

## Non-negotiables

1. Vite + React + TypeScript SPA + Tailwind + PWA. Not Next.js, not React Native.
2. Dexie is what the UI reads. Supabase is optional sync.
3. Tenancy = **ledger**. Expenses have `ledgerId`, not “owner user” as the only key.
4. Two features: `expenses` (book) and `imports` (files/LLM). One type: `ExpenseDraft`. Imports call `proposeImported`. Expenses never import OpenAI.
5. CSV/parser drafts become **proposals**, then expenses with `origin: 'statement'`. Manual is `origin: 'manual'`. UI has two sections and three totals.
6. Money is integer paise. Currency INR. No floats.
7. LLM is BYOK, optional, redacted/truncated extract, aggregate month review. Never default-send raw PDF bytes. Never put `service_role` or LLM keys in git.
8. Skip bank scraping. File upload only. Skip credits when debit/credit columns exist.
9. Client UUIDs. Fingerprint SHA-256 for idempotency. Soft delete field on expenses.
10. Personal ledger on first run. Shared ledgers later; no invites on personal.

## Recommended implementation order

Follow `10_Rebuild_Roadmap.md` phases 0→5 for feature parity with the current repo; 6–8 for the architecture already in SQL.

## File-level checklist (parity with current app)

Create at least:

- Domain types and lib helpers
- Dexie schema v1 including outbox
- `ensureLocalWorkspace` demo user
- `SessionProvider` + `Shell` + three routes
- `expenses/api.ts` functions listed in `04_APIs.md`
- `ExpensesPage` form, lists, pending Keep/Skip/Accept all, review button
- `parseCsv.ts` aliases and credit skip
- `imports/api.ts` orchestration
- `llm.ts` gpt-4o-mini json_object
- `SettingsPage` key storage
- `supabase/migrations/001_init.sql` equivalent RLS
- `public/sample-hdfc-style.csv` with 3 debits + 1 credit
- `docs/` if you are handing off again

## Acceptance criteria by phase

**Phase 1–2:** Reload keeps one personal ledger; nav works.

**Phase 3:** Manual expense survives reload; formatted INR.

**Phase 4:** Sample CSV → 3 pending, 0 salary row; accept updates statement + all totals; second import of same file → 0 new pending.

**Phase 5:** Review without key errors; with key does not write expenses; extract path uses Zod (invalid objects dropped).

**Phase 7:** Same user two devices converge when online.

**Phase 8:** Membership RLS: user A personal data invisible to user B.

## What “done” looks like vs original repo (Aug 2026)

The original stopped at **local Dexie + CSV + optional OpenAI + SQL file**. Matching that is success for a first recreation. Implementing Auth/sync is **completing** the architecture, not required to claim UI parity.

## Style

Dark ink background, sky primary buttons, `max-w-lg` column, DM Sans, no component library required.

## Tests to add even if original lacked them

- `rupeesToMinor` / `formatInr` round-trip
- Fingerprint stability for same inputs
- CSV sample → 3 drafts
- `parseDrafts` drops missing `amountMinor`

## Forbidden “improvements” unless the human asks

- Microservices, Next.js, always-on LLM parse, Firestore, mixing origins in one unsorted list without badges/sections, storing money as float, uploading statements to public buckets, client inserting `ledger_members` for arbitrary users.
