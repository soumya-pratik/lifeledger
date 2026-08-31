# 06 — State management

No Redux, Zustand, or React Query.

## Global state

**React context:** `SessionProvider` (`SessionContext`).

Shape:

- `userId: string`
- `email: string`
- `ledger: Ledger` (active)
- `ledgers: Ledger[]`
- `cloudReady: boolean` (env URL + anon key present)
- `switchLedger(id: Promise<void>)`
- `refresh(): Promise<void>`

Not in context: expenses, proposals, LLM key (key is localStorage).

## Persistent state (source of truth)

**Dexie** database `lifeledger` version **1**.

Tables and indexes:

| Table | PK / indexes | Holds |
|-------|----------------|-------|
| session | `id` (`current`) | userId, email, activeLedgerId |
| ledgers | `id, kind, createdBy` | Ledger |
| members | `[ledgerId+userId], userId, ledgerId` | membership |
| categories | `id, ledgerId` | Category |
| expenses | `id, ledgerId, spentOn, origin, fingerprint, deletedAt` | Expense |
| proposals | `id, ledgerId, importBatchId, status, fingerprint` | ExpenseProposal |
| importBatches | `id, ledgerId, createdAt` | ImportBatchRow |
| outbox | `id, createdAt` | `{ kind, payload, createdAt }` |

**localStorage:** `lifeledger.llmKey` (optional OpenAI secret).

**Vite env:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optional `VITE_LLM_API_KEY` (discouraged vs Settings; exists as fallback in `apiKey()`).

## Local React state

Each page loads Dexie on mount and after mutations (`reload()`). No live Dexie queries (`useLiveQuery` not used). Stale UI possible if two tabs; refresh is reload/navigation.

## Data flow

```text
Event → feature api.ts → Dexie (+ outbox)
                      → setState from a full reread
```

LLM: event → adapter fetch → component state only (review) or Dexie proposals (extract via import pipeline).

## Caching

- PWA Workbox: hashed static assets.
- Dexie: all operational data.
- No HTTP cache for OpenAI.
- Do not cache Supabase JSON in the service worker when you add it.

## Reducers

None. Mutable Dexie updates + React `useState`.

## Future sync cache policy

Read Dexie always. Pull cloud on focus/online. Show sync chip (not built). Staleness accepted for inactive ledgers.
