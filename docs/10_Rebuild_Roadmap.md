# 10 — Rebuild roadmap

Rebuild in this order. Do not start with LLM, PDF, or Kubernetes.

## Phase 0 — Tooling

- Vite + React + TS strict + path alias `@/`
- Tailwind 3 + DM Sans + dark ink theme
- PWA plugin, manifest, `favicon.svg`
- `.gitignore`, `.env.example`

**Accept:** `npm run dev` shows a blank themed page.

## Phase 1 — Domain + Dexie

- Types: expense, ledger, monthReview
- `money`, `dates`, `id`, `fingerprint`
- Dexie v1 stores as in `08_Data_Models.md`
- `ensureLocalWorkspace` seed

**Accept:** Refreshing the app does not create a second personal ledger; categories seed once.

## Phase 2 — Session + shell + routes

- SessionProvider
- Shell nav: `/`, `/import`, `/settings`
- Settings stub (email + local/cloud flag)

**Accept:** Navigation works; header shows Personal / INR.

## Phase 3 — Manual expenses

- `addManualExpense` + list + `formatInr` + month totals (manual only is fine)
- Form: amount, date, method, category, note

**Accept:** Save 185.50 → display `₹185.50`; persist across reload.

## Phase 4 — Import module without LLM

- CSV parser + aliases + skip credits
- `proposeImported` + pending UI + accept/reject
- Two sections + three totals
- Sample CSV in `public/`

**Accept:** Sample file → 3 proposals (not 4); accept → statement total matches those three; re-import skips all 3.

## Phase 5 — LLM adapter

- BYOK Settings
- Extract fallback only if zero CSV drafts
- Zod `parseDrafts`
- Month review from `buildMonthSummary`
- Redaction helper

**Accept:** Without key, review shows BYOK error and expenses unchanged. With key, review returns JSON fields. Garbage CSV + checkbox produces proposals only after valid Zod rows.

## Phase 6 — Postgres/RLS (can parallel Phase 3)

- Apply `001_init.sql`
- Client env
- Do not expose service role

**Accept:** Policies exist; anon cannot read another user’s ledger (test with two Auth users when Auth exists).

## Phase 7 — Auth + outbox flush

- Replace demo user with `auth.uid()`
- On signup: personal ledger + owner member + category seed (server trigger or client transaction)
- Flush outbox; pull on focus
- Sync chip

**Accept:** Two browsers, same account, see the same accepted expenses after online.

## Phase 8 — Household

- Create shared ledger UI
- Invites + SECURITY DEFINER accept RPC
- Block invites on personal
- Actor `updated_by` visible on edits
- Delete-wins documented and implemented on sync conflicts

**Accept:** Second user sees shared expenses only; cannot see inviter’s personal ledger.

## Phase 9 — Hardening (later)

- OFX + pdf.js text
- Column presets
- JSON export (IndexedDB disaster recovery)
- Vitest golden CSV
- Month picker, soft-delete UI
- Journal feature on `ledger_id`

**Do not** start Phase 9 before Phase 4 exists; the book of record must work offline without AI.
