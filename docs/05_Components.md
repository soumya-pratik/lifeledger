# 05 — Components

The UI is **page-level**, not a design-system package. There is no shadcn install. Recreate with the same Tailwind patterns; names below are the React functions that exist.

## App

**Purpose:** Route table.  
**Props:** none.  
**Children:** `Shell` layout route; pages; splat → `/`.

## Shell

**Purpose:** Max-width phone column, brand header, bottom-ish nav pills.  
**State:** `useSession()` for ledger name/kind/currency and `cloudReady`.  
**Nav:** React Router `NavLink` to `/`, `/import`, `/settings`. Active = sky tint on dark pill bar.

## SessionProvider

**Purpose:** Global session.  
**Props:** `children`.  
**State:** `{ userId, email, ledger, ledgers }` after Dexie init.  
**Value extras:** `cloudReady`, `switchLedger(id)`, `refresh()`.  
**Loading UI:** full-viewport “Opening ledger…”.  
**Events:** none.

## ExpensesPage

**Purpose:** Capture + two lists + LLM review.  
**Local state:** month key (fixed to current month), categories, manual/imported arrays, pending proposals, totals, error, review result, busy, form fields.  
**Events:** submit add; Keep/Skip/Accept all; Review this month.  
**Child functions in-file:** `Stat`, `ExpenseList` (not exported).

### Stat

**Props:** `label`, `value`, optional `accent` (sky background for “All”).

### ExpenseList

**Props:** `rows: Expense[]`, `catName(id)`, `empty` string.  
**Render:** divided list; note or category as title; date · category · method; INR amount.

## ImportPage

**Purpose:** File import wizard.  
**Local state:** File, useLlm checkbox, busy, message, warnings, batches.  
**Events:** file input, checkbox, submit.

## SettingsPage

**Purpose:** Identity, optional ledger select, LLM key.  
**Local state:** password field, `saved` boolean.  
**Events:** save/clear key; `switchLedger` on select change.

## Recreate if missing

If splitting further, extract:

- `AmountField` (inputMode decimal)
- `PrimaryButton` (full width `bg-sky-400 text-ink-950`)
- `Card` (`rounded-2xl bg-ink-800 p-4`)

Do **not** add a modal/toast library for MVP; errors are inline text.

## Usage example (conceptual)

Expenses page composes: stats row → add form card → manual list → statement card (pending + list) → review card. Import page: form card + batch list. Settings: stacked cards.
