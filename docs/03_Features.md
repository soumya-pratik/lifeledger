# 03 — Features

## F1 — Local workspace bootstrap

**Purpose:** App usable without cloud credentials.

**User flow:** Open app → “Opening ledger…” → expenses screen.

**Logic (`ensureLocalWorkspace`):** If Dexie `session` id `current` exists and ledger exists, reuse. Else create UUID ledger `Personal`, `kind: personal`, currency INR, member owner `local-demo-user`, seed categories, write session.

**State:** SessionProvider loads once on mount.

**Errors:** None surfaced; hang only if IndexedDB fails (unhandled).

**Not built:** Magic-link login, logout, account deletion.

---

## F2 — Manual expense capture

**Purpose:** Sub-10-second spend log.

**User flow:** Enter amount → date (default today) → pay method → category → note → Save to manual.

**Screen:** `ExpensesPage` form at top.

**API:** `addManualExpense`.

**Validation:** Amount required; `parseAmountToMinor` rejects empty/non-numeric; `amountMinor` must be > 0 after rounding. Date is `input type=date`.

**Errors:** Inline rose text on throw.

**State:** Local React state for form; lists reloaded from Dexie after save.

---

## F3 — Expense lists and month totals

**Purpose:** See the book split by origin.

**User flow:** Scroll sections. Stats: Manual, Statements, All for `currentMonthKey()` (device local month).

**Sections:**

- You entered: `origin === manual'`, not deleted
- From bank statements: pending proposals (amber) + committed `origin === statement`

**API:** `listExpenses`, `listProposals`, `monthTotals`.

**Sorting:** `spentOn` desc, then `createdAt` desc.

**Not built:** Month picker, edit/delete in UI (`softDeleteExpense` exists unused), pagination.

---

## F4 — Proposal review

**Purpose:** Keep LLM/CSV mistakes out of totals.

**User flow:** Keep / Skip per row, or Accept all.

**API:** `acceptProposal`, `rejectProposal`, `acceptAllPending`.

**Rules:** Accept only if `status === pending`. Creates new expense id. Reject does not delete fingerprint uniqueness for rejected rows — **rejected fingerprints can be imported again** (only pending/accepted proposals and live expenses block). Document this: skip condition is `existingProposal.status !== 'rejected'`.

---

## F5 — CSV statement import

**Purpose:** Bulk spends from bank export.

**User flow:** Statements tab → file input `.csv,.txt` → optional LLM checkbox → Import → message with counts → see batch list → go to Expenses to confirm.

**API:** `importStatementFile` → `parseCsvStatement` → `proposeImported`.

**Column aliases (case-insensitive headers):**

- Date: date, txn date, transaction date, value date, spent_on
- Description: description, narration, remarks, particulars, note
- Debit/spend: debit, withdrawal, withdrawals, amount
- Credit/skip: credit, deposit, deposits

**Rules:** Skip undated rows (warning). Prefer debit if present and > 0. Else credit > 0 is **not** an expense (skipped). Amount parse strips `₹` commas spaces.

**Category guess:** substring rules (Swiggy/Zomato→Food, Uber/Ola/metro/IRCTC/petrol→Transport, rent, utilities keywords, pharmacy/apollo/hospital→Health, NEFT/IMPS/self→Transfer, else Other).

**Payment:** UPI if narration matches `/upi/i`.

**Warnings:** PapaParse first 3 errors; skipped dates; bad amounts. UI shows first 8 warnings.

**Errors:** Thrown to page message (e.g. LLM fallback failures).

**Sample:** `public/sample-hdfc-style.csv` — three debits + one salary credit.

---

## F6 — LLM extract fallback

**Purpose:** Messy files when CSV yields **zero** drafts.

**User flow:** Check “If CSV yields zero spends, try LLM extract” + key in Settings.

**API:** `llmAdapter.extractTransactions`. Text redacted, sliced to 24_000 chars. Model must wrap array in `{ rows: [...] }` because `response_format: json_object`. Invalid rows dropped by Zod (no throw per row).

**Errors:** Missing key; HTTP not OK; empty content; JSON parse throw.

---

## F7 — LLM month review

**Purpose:** Second pair of eyes on **already stored** totals.

**User flow:** Expenses → Review this month.

**API:** `buildMonthSummary` then `reviewMonthWithLlm`.

**Payload:** ledgerName, month, INR, totals split, per-category totals/counts, top 8 outliers by amount (note truncated 80 chars).

**Errors:** Same as extract; shown on expenses page. Review result not written to `import_batches.reviewText` currently.

---

## F8 — Settings

**Purpose:** BYOK key; show local identity; ledger switcher if `ledgers.length > 1`.

**User flow:** Save/clear key. Switcher hidden for single personal ledger.

**Not built:** Create household ledger, invites, export JSON, Supabase login.

---

## F9 — PWA chrome

**Purpose:** Installable app, branded shell.

**User flow:** Browser install prompt (browser-dependent). Nav: Expenses `/`, Statements `/import`, Settings `/settings`.

**Header:** Product name, active ledger name, kind, currency, “local” vs “cloud ready”.
