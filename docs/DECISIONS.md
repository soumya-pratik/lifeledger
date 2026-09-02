# Architecture decision log

Every choice below is **locked unless a trigger in “Revisit when” fires**. Recreate the app by following these, not by re-litigating the stack.

Status: **Accepted** means implemented or schema-ready. **Intent** means the product rule is decided but UI/sync may still be incomplete.

---

## D01 — Product: LifeLedger super-app, modules as sub-apps

**Decision:** LifeLedger is the **super-app** (one PWA, one identity, one sync story). Life areas are **submodules** registered under it — expense tracker is the first. Every new module is a submodule of LifeLedger (`src/features/<name>`), not a second app, not a sibling product.

**Per-user configuration (intent):** Which submodules a person sees (nav, home, routes) is **configurable per user**. Expense *data* still belongs to a **ledger** (D04). Enabling “Expense tracker” for a user does not change tenancy; it only gates the module UI.

**Why:** Capture friction kills journals. One shell, many optional life areas. Users should not all be forced onto every module.

**Rejected:** Expense-only fintech clone; generic notes app with a spreadsheet tab; a new standalone app per vertical; hard-coding every module as always-on for all users.

**Current:** [`src/shared/config/features.ts`](../src/shared/config/features.ts) is a static `APP_FEATURES` list (`enabled` is global, not per user). Comment there already points at a future `GET /features` of the same shape.

**Revisit when:** A vertical needs a different tenancy model (e.g. medical records that must not sit on a household ledger); or module enablement must be per-ledger (household) instead of per-user.

---

## D02 — Client: Vite + React + TypeScript PWA

**Decision:** SPA via Vite 7, React 19, TypeScript strict. Installable PWA (`vite-plugin-pwa`, Workbox). Host later as static files (Cloudflare Pages or Vercel).

**Why:** Phone + laptop without app stores; offline app shell; solo-dev speed.

**Rejected:** Next.js SSR (no public SEO surface); React Native / stores; Electron-only.

**Trade-off:** Weaker background refresh than native. Revisit native only if receipt-camera is daily-critical.

---

## D03 — Local-first Dexie + optional Supabase

**Decision:** IndexedDB (Dexie database name `lifeledger`) is the **device source of truth**. UI always reads Dexie. Supabase (Postgres + Auth + RLS) is the **cloud copy** for multi-device sync. An `outbox` table records mutations for later flush.

**Why:** Expense capture must work on a train. Personal scale does not need a custom API server.

**Rejected:** Firebase/Firestore (painful category rollups); custom Express API; CRDT/PowerSync for v1.

**Current gap:** Outbox is written; **flush to Supabase is not implemented**. Auth is a local demo user until magic link is wired.

**Revisit when:** Two devices must stay in sync for daily use.

---

## D04 — Tenancy is ledger, not user

**Decision:** Expenses, categories, import batches, and future journal rows belong to a **ledger**. Users are **members** with roles `owner | editor | viewer`. Signup (or first local boot) creates a **personal** ledger and makes the user owner.

**Why:** Supports both SaaS-style isolated users (one personal ledger) and household sharing (additional `kind = shared` ledgers) without two schemas.

**Rejected:** `user_id` as the only FK on expenses; `shared_with` arrays; separate personal vs shared expense tables; microservices per tenant.

**Rules:**

- Unique one personal ledger per `created_by` (Postgres partial unique index).
- Personal ledgers are **not invitable**. Sharing requires a shared ledger.
- One **active ledger** in the UI; no cross-ledger blended totals by default.

**Current gap:** UI does not yet create shared ledgers or send invites. Schema includes `ledger_invites`. Invite accept **must** be a SECURITY DEFINER RPC, not a client insert into `ledger_members`.

**Revisit when:** B2B orgs/SSO appear (different product).

---

## D05 — AuthN / AuthZ

**Decision:** Target AuthN is Supabase magic link. Client uses **anon key only**. Authorization is **RLS**: member for read; owner/editor for writes. Viewers cannot import or mutate expenses.

**Why:** Client-side checks are not security. Multi-user IDOR is the real risk.

**Rejected:** Shared family password; service role in the PWA; public user directory / search-by-email of all users.

**Current:** Local demo user `local-demo-user` / `you@local` seeded in Dexie. `VITE_SUPABASE_*` only sets a “cloud ready” flag.

**Invite rule:** Email invite only; tokens hashed; expiry ~7 days; editor/viewer roles on invites, not owner.

---

## D06 — Money: integer minor units, INR

**Decision:** Store `amountMinor` as integer paise (`₹1 = 100`). Never IEEE floats. Default currency `INR`. Single currency per ledger for MVP.

**Why:** User timezone/context is India; floats lie.

**Rejected:** Multi-currency FX in MVP; storing decimal strings without a scale convention.

**Revisit when:** Travel / FX is a real need.

---

## D07 — Two feature modules, one expense contract

**Decision:**

- `features/expenses` owns persistence, lists, totals, `proposeImported`, accept/reject.
- `features/imports` owns file parse, optional LLM extract, month-review LLM call.
- Shared type `ExpenseDraft` lives in `shared/domain/expense.ts`.
- Dependency: **imports → expenses API**. Expenses **must not** import LLM/PDF/CSV parsers.

**Why:** LLM is an implementation detail of import, not a second book of record.

**Rejected:** Parallel `llm_expenses` table forever; expenses calling OpenAI; two backends.

---

## D08 — Staging proposals before committed expenses

**Decision:** Import produces `expense_proposals` (`pending`). User confirms in the expense UI. Accept creates an `expenses` row with `origin: 'statement'`. Reject leaves proposals rejected and does not create expenses.

**Why:** Parsers and LLMs hallucinate or mis-map. Unconfirmed rows must not enter month totals.

**Rejected:** LLM writing straight into `expenses`.

**Accept identity:** New expense UUID on accept (proposal id ≠ expense id). Fingerprint carries over for idempotency.

---

## D09 — UI: two sections, three totals

**Decision:** Expenses screen shows **You entered** (`origin = manual`) and **From bank statements** (pending proposals + committed statement expenses). Footer/stats always show **manual / statement / all**.

**Why:** User asked for visual separation; households still need one combined number.

**Rejected:** Hiding combined total; converting origin to manual on edit (origin stays `statement`).

---

## D10 — Parse order: deterministic CSV first, LLM fallback

**Decision:** PapaParse CSV with header aliases (Date/Debit/Credit/Narration family). Skip credits/deposits so salary does not become an expense. Keyword rules map narration → seeded categories. If **zero spend drafts** and user opts in, LLM extract on **redacted, truncated** text, then Zod `ExpenseDraft`.

**Why:** Trust and cost. Raw PDF/CSV must not be the default model payload.

**Rejected:** Always-LLM import; bank login scraping / Account Aggregator in MVP; 15 custom bank parsers (use column presets later).

**Not built yet:** OFX parser, PDF text (`pdf.js`), saved per-user column presets, Dexie schema already allows extractor `ofx | pdf-text | llm`.

**File handling:** Parse in the browser. Default: **do not upload statements to Storage**.

---

## D11 — LLM: BYOK, two calls only, no training of the ledger

**Decision:** OpenAI Chat Completions, model `gpt-4o-mini`, `temperature: 0`, JSON object response. Key from `localStorage` (`lifeledger.llmKey`) or optional `VITE_LLM_API_KEY`. Never stored in Supabase. Two operations: `extractTransactions`, `reviewMonth`.

**Month review payload:** App-built `MonthSummary` (category totals, top outliers, split totals) — not raw narrations dump. Prompt treats payload as untrusted (`DATA FOLLOWS`).

**Redaction:** Long digit runs, card-like groups, VPA-like `user@psp` before extract.

**Rejected:** Platform-held OpenAI key for all tenants (you become a processor of others’ bank data); five-vendor LLM abstraction; silent cron reviews.

**Revisit when:** Anthropic preferred for vendor policy; or local models.

---

## D12 — Idempotency: fingerprint + client UUIDs

**Decision:** Fingerprint = SHA-256 of `ledgerId | spentOn | amountMinor | normalized description | bankTxnId`. Unique per ledger among live expenses and among non-rejected proposals. Re-import skips matches.

**Sync (planned):** Client-generated UUIDs; last-write-wins on `updated_at` for the same row; **delete wins** if one device deletes and another edits (household). Soft delete `deleted_at`.

**Rejected:** CRDTs until a real lost-update incident with multiple editors.

---

## D13 — Categories belong to the ledger

**Decision:** Seeded list: Food, Transport, House Emi, Utilities, Health, Transfer, Other (need/want/unspecified). Keyword import mapping uses **names**, then resolves to ids. LLM category suggestions must use existing ids (when wired), not free-text names.

**Why:** Household reports die if everyone invents “Groceries” vs “Food”.

---

## D14 — Payment methods

**Decision:** Enum `upi | card | cash | other`. CSV sets `upi` if narration matches `/upi/i`, else `other`.

---

## D15 — Dates

**Decision:** Calendar dates as `YYYY-MM-DD` strings (local calendar, not UTC instants). CSV accepts ISO or `D/M/Y` and `D-M-Y` via `parseLooseDate`. Month key is `YYYY-MM`.

**Risk:** DMY vs MDY ambiguity for `01/02/2026`. India-first assumes day-month-year.

---

## D16 — Offline and PWA caching

**Decision:** Workbox caches static assets (app shell). **Do not** cache authenticated API JSON as source of truth. Dexie holds data. Offline = full capture/list from Dexie; LLM calls fail until online + key.

---

## D17 — Security defaults

**Decision:** HTTPS in production; RLS on all cloud tables; no `dangerouslySetInnerHTML`; Zod on LLM JSON; invite tokens not guessable ledger ids; no SW cache of private API; supply-chain lockfile when git exists.

**E2E encryption:** Not in MVP (breaks SQL reports). Revisit if journal notes are highly sensitive and still cloud-hosted.

---

## D18 — Stack exclusions (do not add without a trigger)

Do not add: Kubernetes, microservices, Next.js, Redis, Datadog/PagerDuty, Playwright until outbox has failed once, coverage gates, custom mail server, org/SCIM billing, realtime `postgres_changes` until two people edit the same day live.

---

## D19 — Testing (intent)

**Earn coverage:** `money.ts`, fingerprint merge/LWW/outbox, CSV golden files (anonymized HDFC-style sample already in `public/sample-hdfc-style.csv`), Dexie migration. Mock LLM adapter. No e2e of OpenAI.

**Current gap:** No automated tests in repo yet.

---

## D20 — Hosting and ops (intent)

Frontend: Cloudflare Pages (or Vercel). Backups: `pg_dump` once shared ledgers exist. Observability: last sync error in Settings later; no on-call.

---

## Decision index (quick)

| ID | Topic | Status |
|----|--------|--------|
| D01 | Super-app + per-user modules | Accepted / per-user config intent |
| D02 | Vite React TS PWA | Accepted |
| D03 | Dexie first, Supabase later | Accepted / sync incomplete |
| D04 | Ledger tenancy | Schema accepted / sharing UI incomplete |
| D05 | Magic link + RLS | Schema accepted / local demo now |
| D06 | Integer INR | Accepted |
| D07 | imports vs expenses modules | Accepted |
| D08 | Proposals staging | Accepted |
| D09 | Two UI sections + three totals | Accepted |
| D10 | CSV then LLM | CSV accepted / PDF-OFX later |
| D11 | BYOK LLM | Accepted |
| D12 | Fingerprint idempotency | Accepted |
| D13 | Ledger categories | Accepted |
| D14 | Payment enum | Accepted |
| D15 | ISO dates, DMY CSV | Accepted |
| D16 | SW shell only | Accepted |
| D17 | RLS, redact, no E2E crypto | Accepted |
| D18 | No premature infra | Accepted |
| D19 | Tests | Intent |
| D20 | Pages + dump | Intent |
