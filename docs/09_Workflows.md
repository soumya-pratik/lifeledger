# 09 — Workflows, errors, integrations, DX

## Workflow: first run

1. Browser opens `/`
2. `SessionProvider` calls `ensureLocalWorkspace`
3. Dexie creates ledger graph if empty
4. `ExpensesPage` loads categories and empty lists
5. User can add a manual expense immediately

## Workflow: CSV import to book

1. Navigate `/import`
2. Choose CSV (see sample file)
3. Submit without LLM
4. Parser skips credits; drafts get fingerprints
5. Duplicate fingerprints skipped
6. User opens `/` and accepts proposals
7. Totals: statement bucket increases; `all` increases; manual unchanged

## Workflow: LLM extract

1. Settings save `sk-` key
2. Import a file that yields zero CSV spends (no debit columns / garbage)
3. Check fallback
4. Redacted text sent; Zod keeps valid rows only
5. Same proposal confirm path

## Workflow: month review

1. Some committed expenses exist in current month
2. Review this month
3. Summary JSON (not CSV) sent
4. Bullets/anomalies render; Dexie unchanged

## Workflow: planned household invite

1. Create `shared` ledger (owner)
2. Insert hashed invite (not built)
3. Invitee magic-links in
4. RPC `accept_ledger_invite` inserts `ledger_members`
5. Switcher appears (`ledgers.length > 1`)
6. Import always targets **active** ledger

## Workflow: planned sync

1. Mutation → Dexie + outbox
2. Online drain outbox upserts by UUID
3. Pull remote rows; LWW `updated_at`; delete wins vs concurrent edit
4. 401 → refresh session, do not tight-loop retry

---

## Error handling

- **No React error boundary** in current code. Uncaught render errors white-screen.
- **Validation:** money helpers throw `Error` with short messages; form catch → `error` string. Zod `safeParse` drops bad LLM rows (silent omit).
- **CSV:** warnings array, not fatal unless thrown elsewhere.
- **LLM:** throw Error; UI `setError` / `setMessage`. Ledger not mutated on review failure. Extract failure aborts import after possible empty CSV (no batch if throw happens **after** parse — note: LLM throw occurs **before** batch insert if CSV empty). If CSV empty and LLM throws, **no batch** is written.
- **Logging:** console not standardized; no Sentry.
- **Idempotent retries:** safe for propose (fingerprints); review is read-only; accept twice of same proposal returns null second time.

---

## Performance (current)

- No route lazy loading (`React.lazy` unused) — bundle is small.
- No list virtualization — fine for hundreds of month rows; add when a year of daily imports is slow.
- Month totals: load **all** ledger expenses then filter in memory (not indexed month query).
- LLM body truncated to 24k characters.
- Fonts: Google Fonts extra request (PWA offline may miss fonts; system fallback `ui-sans-serif`).
- Memo: `catName` Map via `useMemo` on expenses page.

---

## Third-party integrations

| Package | Why |
|---------|-----|
| react, react-dom | UI |
| react-router-dom v7 | Client routes |
| dexie | IndexedDB |
| papaparse | CSV headers |
| zod v3 | LLM JSON contract |
| @supabase/supabase-js | Future Auth/DB (constructed if env) |
| openai HTTP | Not an SDK; raw fetch |
| vite, @vitejs/plugin-react | Build |
| tailwindcss 3, postcss, autoprefixer | Style |
| vite-plugin-pwa | SW + manifest |
| TypeScript | Types |

Do not add Firebase, Prisma, axios, or Redux without a new ADR.

---

## Developer workflow

**Setup**

```bash
cd lifeledger
npm install
cp .env.example .env   # optional
npm run dev
```

**Build:** `npm run build` (typecheck + vite).  
**Preview:** `npm run preview`.  
**Tests:** none. Add vitest next to `shared/lib` and `parseCsv`.  
**Deploy (intent):** static `dist/` to Cloudflare Pages; env vars for public Supabase anon only.  
**Cloud schema:** paste `supabase/migrations/001_init.sql` in SQL editor.  
**PWA:** HTTPS in prod; localhost OK for SW in Vite.

**Git:** initialize if missing; never commit `.env` or LLM keys.

---

## Authentication & authorization (target vs now)

**Now:** implicit device possession = access. Demo user constants.

**Target:**

- AuthN: Supabase magic link; JWT in supabase-js storage
- AuthZ: RLS `is_ledger_member` / `is_ledger_writer`
- Viewers: SELECT only
- Personal ledger: no invites
- Account delete: remove memberships; anonymize `created_by` on remaining shared rows; delete personal ledger data

**Secrets:** never `service_role` in Vite. LLM key browser-only.
