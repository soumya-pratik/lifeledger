# 04 — APIs

There is **no first-party REST server**. “APIs” are TypeScript module functions plus one external HTTP API.

Authentication for Dexie functions: **none** — whoever has the browser profile can read the DB. Cloud RLS applies only after Supabase Auth exists.

Retry: none except user retry. Outbox is persistence for future flush, not an automatic retry loop.

---

## expenses/api.ts

### `listCategories(ledgerId)`

Returns non-archived categories for the ledger, name-sorted.

### `addManualExpense(userId, input)`

**Input:** ledgerId, amountMinor, currency, spentOn, categoryId, note, paymentMethod (no id/origin/fingerprint).

**Behavior:** UUID, origin manual, fingerprint from note or `"manual"`, insert expense + outbox `expense.upsert`.

**Response:** full `Expense`.

**Errors:** Dexie constraint errors (unhandled beyond throw).

### `listExpenses(ledgerId)`

Live rows (`deletedAt == null`) only.

### `monthTotals(ledgerId, ym)`

**ym:** `YYYY-MM`. Returns `{ manual, statement, all, count, rows }` sums of `amountMinor`.

### `buildMonthSummary(ledgerId, ledgerName, ym)`

Returns `MonthSummary` for LLM. Category name lookup; unknown → Uncategorized.

### `proposeImported(userId, drafts)`

**Input:** `ExpenseDraft[]` with `importBatchId` required in practice.

**Skip when:** live expense same fingerprint+ledger OR proposal same fingerprint+ledger with status not `rejected`.

**Response:** `{ created, skippedFingerprints }`.

### `listProposals(ledgerId, status = 'pending')`

### `acceptProposal(userId, proposalId)`

**Response:** `Expense` or `null` if missing/not pending.

**Side effects:** transaction expenses + proposal status + outbox.

### `rejectProposal(proposalId)`

Sets status `rejected`.

### `acceptAllPending(userId, ledgerId)`

Sequential accepts; returns count succeeded.

### `softDeleteExpense(userId, id)`

Sets `deletedAt`, `updatedBy`, `updatedAt`. No UI.

---

## imports/api.ts

### `importStatementFile({ userId, ledgerId, file, categories, useLlmFallback })`

**Response:** `{ batch, created, skipped, warnings }`.

**Extractor:** `csv` or `llm`.

**Batch status:** always `parsed` today (`reviewed`/`committed` unused).

### `listBatches(ledgerId)`

Newest `createdAt` first.

### `reviewMonthWithLlm(summary: MonthSummary)`

Passthrough to adapter. Throws if no key or HTTP error.

---

## imports/parseCsv.ts

### `parseCsvStatement({ text, ledgerId, importBatchId, categories })`

**Response:** `{ drafts, extractor: 'csv', warnings }`.

---

## imports/contract.ts

### `parseDrafts(raw, { ledgerId, importBatchId })`

Coerces unknown JSON array through Zod. Forces origin statement and ledger/batch ids. Generates id if missing. Drops invalid elements silently.

---

## imports/llm.ts

### `llmAdapter.extractTransactions(text, ctx)`

POST OpenAI. See below.

### `llmAdapter.reviewMonth(summary)`

### `hasLlmKey()` / `saveLlmKey(key)`

localStorage `lifeledger.llmKey`. Empty string clears.

---

## External: OpenAI Chat Completions

- **URL:** `https://api.openai.com/v1/chat/completions`
- **Method:** POST
- **Auth:** `Authorization: Bearer <user key>`
- **Body:**
  - `model`: `gpt-4o-mini`
  - `temperature`: 0
  - `response_format`: `{ type: "json_object" }`
  - `messages`: system + user
- **Success:** parse `choices[0].message.content` as JSON
- **Errors:** missing key (app Error); non-OK status (`LLM request failed (code)`); empty content; `JSON.parse` throw
- **Retry:** none
- **Extract user message:** ask for `{ "rows": [...] }` then redacted statement (max 24k chars)
- **Review user message:** `DATA FOLLOWS\n` + `JSON.stringify(summary)`

---

## Planned: Supabase

Client: `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)` when both set; else `supabase = null`.

No tables are queried from TS yet. Intended operations: Auth magic link; select/upsert on `ledgers`, `ledger_members`, `expense_categories`, `expenses`, `import_batches`, `expense_proposals` under RLS; RPC `accept_ledger_invite(token)` **to be created** — do not client-insert members for other users.

---

## shared/auth/workspace.ts

### `ensureLocalWorkspace()`

Returns `{ userId, email, ledger }`.

### `setActiveLedger(ledgerId)`

Updates session `activeLedgerId`.
