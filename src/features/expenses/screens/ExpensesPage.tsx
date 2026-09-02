import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSession } from "@/shared/auth/SessionProvider";
import type { Category } from "@/shared/domain/ledger";
import type { Expense, ExpenseProposal, PaymentMethod } from "@/shared/domain/expense";
import type { IncomeEntry } from "@/shared/domain/income";
import {
  acceptAllPending,
  acceptProposal,
  addCategory,
  addIncome,
  addManualExpense,
  buildMonthSummary,
  deleteIncome,
  listCategories,
  listExpenses,
  listIncomes,
  listProposals,
  rejectProposal,
  monthTotals,
} from "@/features/expenses/api";
import { reviewMonthWithLlm } from "@/features/imports/api";
import { hasLlmKey, llmAdapter } from "@/features/imports/llm";
import type { MonthReviewResult } from "@/shared/domain/monthReview";
import { currentMonthKey, monthLabel, todayIsoDate } from "@/shared/lib/dates";
import { formatInr, parseAmountToMinor } from "@/shared/lib/money";
import { CategoryIcon } from "@/shared/ui/CategoryIcon";
import { DEFAULT_CATEGORY_ICON, type CategoryIconId } from "@/shared/domain/categoryIcon";

const FORM_OPEN_KEY = "lifeledger.expenseFormOpen";

function readFormOpen(): boolean {
  const stored = localStorage.getItem(FORM_OPEN_KEY);
  if (stored === "0") return false;
  if (stored === "1") return true;
  return window.matchMedia("(min-width: 1024px)").matches;
}

export function ExpensesPage() {
  const { userId, ledger } = useSession();
  const [ym] = useState(currentMonthKey);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manual, setManual] = useState<Expense[]>([]);
  const [imported, setImported] = useState<Expense[]>([]);
  const [pending, setPending] = useState<ExpenseProposal[]>([]);
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [totals, setTotals] = useState({ manual: 0, statement: 0, all: 0 });
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<MonthReviewResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(readFormOpen);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [spentOn, setSpentOn] = useState(todayIsoDate());
  const [categoryId, setCategoryId] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("upi");

  async function reload() {
    const cats = await listCategories(ledger.id);
    setCategories(cats);
    if (!categoryId && cats[0]) setCategoryId(cats[0].id);
    const rows = await listExpenses(ledger.id);
    setManual(rows.filter((e) => e.origin === "manual"));
    setImported(rows.filter((e) => e.origin === "statement"));
    setPending(await listProposals(ledger.id, "pending"));
    setIncomes(await listIncomes(ledger.id, ym));
    setTotals(await monthTotals(ledger.id, ym));
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledger.id, ym]);

  function toggleForm(open: boolean) {
    setFormOpen(open);
    localStorage.setItem(FORM_OPEN_KEY, open ? "1" : "0");
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await addManualExpense(userId, {
        ledgerId: ledger.id,
        amountMinor: parseAmountToMinor(amount),
        currency: ledger.currency,
        spentOn,
        categoryId: categoryId || null,
        note,
        paymentMethod: method,
      });
      setAmount("");
      setNote("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    }
  }

  async function onReview() {
    setBusy(true);
    setError(null);
    try {
      const summary = await buildMonthSummary(ledger.id, ledger.name, ym);
      setReview(await reviewMonthWithLlm(summary));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed");
    } finally {
      setBusy(false);
    }
  }

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const monthReady = incomes.length > 0;
  const incomeTotal = useMemo(() => incomes.reduce((acc, r) => acc + r.amountMinor, 0), [incomes]);
  const remaining = incomeTotal > 0 ? incomeTotal - totals.all : null;
  const spentPct = incomeTotal > 0 ? Math.min(100, Math.round((totals.all / incomeTotal) * 100)) : 0;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1 space-y-8">
        <section className="grid grid-cols-3 gap-3">
          <Stat label="Income" value={incomeTotal > 0 ? formatInr(incomeTotal) : "—"} />
          <Stat label="Spent" value={formatInr(totals.all)} />
          <Stat
            label={remaining != null && remaining < 0 ? "Over" : "Left"}
            value={remaining == null ? "—" : formatInr(remaining)}
            accent={remaining != null && remaining >= 0}
            danger={remaining != null && remaining < 0}
          />
        </section>
        {incomeTotal > 0 ? (
          <div className="space-y-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-ll-border">
              <div
                className={`h-full ${remaining != null && remaining < 0 ? "bg-ll-danger" : "bg-ll-accent"}`}
                style={{ width: `${spentPct}%` }}
              />
            </div>
            <p className="text-center text-xs text-ll-muted">
              {monthLabel(ym)} · {spentPct}% of income · Manual {formatInr(totals.manual)} · Statements{" "}
              {formatInr(totals.statement)}
            </p>
          </div>
        ) : (
          <p className="text-center text-xs text-ll-muted">{monthLabel(ym)}</p>
        )}

        <IncomeSection
          setup={!monthReady}
          monthLabel={monthLabel(ym)}
          incomes={incomes}
          onAdd={async (amount, note) => {
            await addIncome(userId, {
              ledgerId: ledger.id,
              month: ym,
              amountMinor: parseAmountToMinor(amount),
              currency: ledger.currency,
              note,
            });
            await reload();
          }}
          onRemove={async (id) => {
            await deleteIncome(id);
            await reload();
          }}
        />

        {monthReady && !formOpen ? (
          <button
            type="button"
            onClick={() => toggleForm(true)}
            className="w-full rounded-xl border border-dashed border-ll-border px-3 py-2 text-sm text-ll-accent lg:hidden"
          >
            Add expense
          </button>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ll-text">You entered</h2>
            <span className="text-xs text-ll-muted">{manual.length}</span>
          </div>
          <ExpenseList rows={manual} catById={catById} empty="No manual expenses yet." />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ll-text">From bank statements</h2>
            {pending.length > 0 ? (
              <button
                type="button"
                className="text-xs text-ll-accent"
                onClick={() => void acceptAllPending(userId, ledger.id).then(reload)}
              >
                Accept all ({pending.length})
              </button>
            ) : null}
          </div>
          {pending.length > 0 ? (
            <div className="space-y-2 rounded-2xl p-4 shadow-[var(--ll-shadow)] ring-1 ring-ll-warn">
              <p className="text-xs font-medium text-ll-warn">Needs review</p>
              {pending.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                  <div>
                    <p className="text-ll-text">{formatInr(p.amountMinor)}</p>
                    <p className="text-xs text-ll-muted">
                      {p.spentOn} · {p.note}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded-lg bg-ll-bg px-2.5 py-1.5 text-xs font-medium text-ll-success hover:bg-ll-surface"
                      onClick={() => void acceptProposal(userId, p.id).then(reload)}
                    >
                      Keep
                    </button>
                    <button
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-ll-muted hover:bg-ll-bg hover:text-ll-text"
                      onClick={() => void rejectProposal(p.id).then(reload)}
                    >
                      Skip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <ExpenseList rows={imported} catById={catById} empty="No imported expenses yet. Use Statements in this tracker." />
        </section>

        <section className="space-y-3 rounded-2xl border border-ll-border bg-ll-surface p-5 shadow-[var(--ll-shadow)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">LLM month review</h2>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onReview()}
              className="rounded-full bg-ll-bg px-3 py-1 text-xs text-ll-accent disabled:opacity-50"
            >
              {busy ? "Reviewing…" : "Review this month"}
            </button>
          </div>
          <p className="text-xs text-ll-muted">
            Sends category totals and outliers only — not your raw statement. Requires a key in Settings.
          </p>
          {review ? (
            <div className="space-y-2 text-sm text-ll-text">
              <p>{review.summary}</p>
              <ul className="list-disc space-y-1 pl-4">
                {review.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              {review.anomalies.length ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-ll-warn">Anomalies</p>
                  <ul className="list-disc pl-4">
                    {review.anomalies.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      {!monthReady ? (
        <aside className="hidden w-full shrink-0 rounded-2xl border border-dashed border-ll-border bg-ll-surface p-4 text-sm text-ll-muted lg:sticky lg:top-4 lg:block lg:w-80">
          Save this month’s income to start recording expenses.
        </aside>
      ) : formOpen ? (
        <aside className="w-full shrink-0 lg:sticky lg:top-4 lg:w-80">
          <form onSubmit={(e) => void onAdd(e)} className="space-y-3 rounded-2xl border border-ll-border bg-ll-surface p-5 shadow-[var(--ll-shadow)]">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-ll-text">Add expense</p>
              <button
                type="button"
                onClick={() => toggleForm(false)}
                className="rounded-lg px-2 py-1 text-xs text-ll-muted hover:text-ll-text"
                aria-label="Collapse expense form"
              >
                Hide
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="col-span-2 text-xs text-ll-muted">
                Amount (₹)
                <input
                  required
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-ll-bg px-3 py-2 text-ll-text outline-none ring-1 ring-ll-border focus:ring-ll-accent"
                  placeholder="185.50"
                />
              </label>
              <label className="text-xs text-ll-muted">
                Date
                <input
                  type="date"
                  value={spentOn}
                  onChange={(e) => setSpentOn(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-ll-bg px-3 py-2 text-ll-text outline-none ring-1 ring-ll-border"
                />
              </label>
              <label className="text-xs text-ll-muted">
                Pay
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="mt-1 w-full rounded-xl bg-ll-bg px-3 py-2 text-ll-text outline-none ring-1 ring-ll-border"
                >
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <div className="col-span-2">
                <CategoryFields
                  ledgerId={ledger.id}
                  categories={categories}
                  categoryId={categoryId}
                  onCategoryId={setCategoryId}
                  onCreated={(cat) => {
                    setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
                    setCategoryId(cat.id);
                  }}
                  onError={setError}
                />
              </div>
              <label className="col-span-2 text-xs text-ll-muted">
                Note
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-ll-bg px-3 py-2 text-ll-text outline-none ring-1 ring-ll-border"
                  placeholder="Lunch"
                />
              </label>
            </div>
            {error ? <p className="text-sm text-ll-danger">{error}</p> : null}
            <button
              type="submit"
              className="w-full rounded-xl bg-ll-accent py-2.5 text-sm font-semibold text-ll-accent-fg"
            >
              Save to manual
            </button>
          </form>
        </aside>
      ) : (
        <button
          type="button"
          onClick={() => toggleForm(true)}
          className="hidden shrink-0 rounded-2xl border border-ll-border bg-ll-surface px-2 py-6 text-xs text-ll-accent lg:sticky lg:top-4 lg:block"
          aria-label="Open expense form"
          title="Add expense"
        >
          <span className="inline-block rotate-180 [writing-mode:vertical-rl]">Add expense</span>
        </button>
      )}
    </div>
  );
}

function CategoryFields({
  ledgerId,
  categories,
  categoryId,
  onCategoryId,
  onCreated,
  onError,
}: {
  ledgerId: string;
  categories: Category[];
  categoryId: string;
  onCategoryId: (id: string) => void;
  onCreated: (cat: Category) => void;
  onError: (msg: string | null) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<Category["kind"]>("unspecified");
  const [saving, setSaving] = useState(false);
  const selected = categories.find((c) => c.id === categoryId);

  async function createCategory() {
    onError(null);
    setSaving(true);
    try {
      const icon = await llmAdapter.pickCategoryIcon(newName.trim(), newKind);
      const cat = await addCategory({ ledgerId, name: newName, kind: newKind, icon });
      onCreated(cat);
      setNewName("");
      setNewKind("unspecified");
      setAdding(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not add category");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-ll-muted">Category</p>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ll-bg text-ll-accent ring-1 ring-ll-border">
          <CategoryIcon id={selected?.icon} className="h-4 w-4" />
        </span>
        <select
          value={categoryId}
          onChange={(e) => onCategoryId(e.target.value)}
          className="w-full rounded-xl bg-ll-bg px-3 py-2 text-sm text-ll-text outline-none ring-1 ring-ll-border"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {adding ? (
        <div className="space-y-2 rounded-xl bg-ll-bg p-2 ring-1 ring-ll-border">
          <label className="text-xs text-ll-muted">
            Name
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1 w-full rounded-xl bg-ll-surface px-3 py-2 text-sm text-ll-text outline-none ring-1 ring-ll-border"
              placeholder="Groceries"
            />
          </label>
          <label className="text-xs text-ll-muted">
            Type
            <select
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as Category["kind"])}
              className="mt-1 w-full rounded-xl bg-ll-surface px-3 py-2 text-sm text-ll-text outline-none ring-1 ring-ll-border"
            >
              <option value="need">Need</option>
              <option value="want">Want</option>
              <option value="unspecified">Unspecified</option>
            </select>
          </label>
          <p className="text-[11px] text-ll-muted">
            {hasLlmKey()
              ? "Icon is chosen from the category name via your LLM key."
              : "Icon is inferred from the name. Add an LLM key in Settings for a smarter pick."}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving || !newName.trim()}
              onClick={() => void createCategory()}
              className="rounded-xl bg-ll-accent px-3 py-1.5 text-xs font-semibold text-ll-accent-fg disabled:opacity-50"
            >
              {saving ? "Adding…" : "Add category"}
            </button>
            <button
              type="button"
              className="rounded-xl px-3 py-1.5 text-xs text-ll-muted"
              onClick={() => setAdding(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="text-xs text-ll-accent" onClick={() => setAdding(true)}>
          New category
        </button>
      )}
    </div>
  );
}

function IncomeSection({
  setup,
  monthLabel: label,
  incomes,
  onAdd,
  onRemove,
}: {
  setup: boolean;
  monthLabel: string;
  incomes: IncomeEntry[];
  onAdd: (amount: string, note: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (setup) setEditing(false);
  }, [setup]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await onAdd(amount, note);
      setAmount("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save income");
    } finally {
      setBusy(false);
    }
  }

  const body = (
    <>
      {incomes.length > 0 ? (
        <ul className="divide-y divide-ll-border overflow-hidden rounded-xl ring-1 ring-ll-border">
          {incomes.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 bg-ll-bg px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-ll-text">{row.note || "Income"}</p>
                <p className="text-xs tabular-nums text-ll-muted">{formatInr(row.amountMinor)}</p>
              </div>
              <button
                type="button"
                className="shrink-0 text-xs text-ll-muted hover:text-ll-danger"
                onClick={() => void onRemove(row.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ll-muted">No income logged this month yet.</p>
      )}
      <form onSubmit={(e) => void submit(e)} className="grid grid-cols-2 gap-2">
        <label className="text-xs text-ll-muted">
          Amount (₹)
          <input
            required
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-xl bg-ll-bg px-3 py-2 text-sm text-ll-text outline-none ring-1 ring-ll-border focus:ring-ll-accent"
            placeholder="75000"
          />
        </label>
        <label className="text-xs text-ll-muted">
          Source
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-xl bg-ll-bg px-3 py-2 text-sm text-ll-text outline-none ring-1 ring-ll-border"
            placeholder="Salary"
          />
        </label>
        {error ? <p className="col-span-2 text-sm text-ll-danger">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="col-span-2 rounded-xl bg-ll-accent py-2 text-sm font-semibold text-ll-accent-fg disabled:opacity-50"
        >
          {busy ? "Saving…" : "Add income"}
        </button>
      </form>
    </>
  );

  if (setup) {
    return (
      <section className="space-y-4 rounded-2xl border border-ll-accent bg-ll-surface p-5 shadow-[var(--ll-shadow)]">
        <div>
          <h2 className="text-sm font-semibold text-ll-text">Start {label}</h2>
          <p className="mt-0.5 text-xs text-ll-muted">
            This month is not initialized. Save income first, then you can record expenses.
          </p>
        </div>
        {body}
      </section>
    );
  }

  if (!editing) {
    return (
      <div className="flex justify-end">
        <button type="button" className="text-xs text-ll-muted hover:text-ll-accent" onClick={() => setEditing(true)}>
          Edit income
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-3 rounded-2xl border border-ll-border bg-ll-surface p-5 shadow-[var(--ll-shadow)]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ll-text">Monthly income</h2>
        <button type="button" className="text-xs text-ll-muted" onClick={() => setEditing(false)}>
          Done
        </button>
      </div>
      {body}
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
  danger,
}: {
  label: string;
  value: string;
  accent?: boolean;
  danger?: boolean;
}) {
  const ring = danger
    ? "border border-ll-danger bg-ll-surface"
    : accent
      ? "border border-ll-accent bg-ll-surface"
      : "border border-ll-border bg-ll-surface";
  return (
    <div className={`rounded-2xl p-4 shadow-[var(--ll-shadow)] ${ring}`}>
      <p className="text-[11px] uppercase tracking-wide text-ll-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold tabular-nums ${danger ? "text-ll-danger" : ""}`}>{value}</p>
    </div>
  );
}

function ExpenseList({
  rows,
  catById,
  empty,
}: {
  rows: Expense[];
  catById: Map<string, Category>;
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-ll-muted">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-ll-border overflow-hidden rounded-2xl border border-ll-border bg-ll-surface shadow-[var(--ll-shadow)]">
      {rows.map((e) => {
        const cat = e.categoryId ? catById.get(e.categoryId) : undefined;
        const icon = (cat?.icon ?? DEFAULT_CATEGORY_ICON) as CategoryIconId;
        const catName = cat?.name ?? "—";
        return (
          <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-ll-bg">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ll-bg text-ll-accent">
              <CategoryIcon id={icon} className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ll-text">{e.note || catName}</p>
              <p className="text-xs text-ll-muted">
                {e.spentOn} · {catName} · {e.paymentMethod}
              </p>
            </div>
            <p className="shrink-0 text-sm font-medium tabular-nums">{formatInr(e.amountMinor)}</p>
          </li>
        );
      })}
    </ul>
  );
}
