import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSession } from "@/shared/auth/SessionProvider";
import type { Category } from "@/shared/domain/ledger";
import type { Expense, ExpenseProposal, PaymentMethod } from "@/shared/domain/expense";
import {
  acceptAllPending,
  acceptProposal,
  addManualExpense,
  buildMonthSummary,
  listCategories,
  listExpenses,
  listProposals,
  rejectProposal,
  monthTotals,
} from "@/features/expenses/api";
import { reviewMonthWithLlm } from "@/features/imports/api";
import type { MonthReviewResult } from "@/shared/domain/monthReview";
import { currentMonthKey, monthLabel, todayIsoDate } from "@/shared/lib/dates";
import { formatInr, parseAmountToMinor } from "@/shared/lib/money";

export function ExpensesPage() {
  const { userId, ledger } = useSession();
  const [ym] = useState(currentMonthKey);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manual, setManual] = useState<Expense[]>([]);
  const [imported, setImported] = useState<Expense[]>([]);
  const [pending, setPending] = useState<ExpenseProposal[]>([]);
  const [totals, setTotals] = useState({ manual: 0, statement: 0, all: 0 });
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<MonthReviewResult | null>(null);
  const [busy, setBusy] = useState(false);

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
    setTotals(await monthTotals(ledger.id, ym));
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledger.id, ym]);

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

  const catName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id: string | null) => (id ? map.get(id) ?? "—" : "—");
  }, [categories]);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-3 gap-2">
        <Stat label="Manual" value={formatInr(totals.manual)} />
        <Stat label="Statements" value={formatInr(totals.statement)} />
        <Stat label="All" value={formatInr(totals.all)} accent />
      </section>
      <p className="text-center text-xs text-ll-muted">{monthLabel(ym)}</p>

      <form onSubmit={(e) => void onAdd(e)} className="space-y-3 rounded-2xl border border-ll-border bg-ll-surface p-4">
        <p className="text-sm font-medium text-ll-text">Add expense</p>
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
          <label className="col-span-2 text-xs text-ll-muted">
            Category
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-xl bg-ll-bg px-3 py-2 text-ll-text outline-none ring-1 ring-ll-border"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
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

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ll-text">You entered</h2>
          <span className="text-xs text-ll-muted">{manual.length}</span>
        </div>
        <ExpenseList rows={manual} catName={catName} empty="No manual expenses yet." />
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
          <div className="space-y-2 rounded-2xl ring-1 ring-ll-warn p-3">
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
                    className="text-xs text-ll-success"
                    onClick={() => void acceptProposal(userId, p.id).then(reload)}
                  >
                    Keep
                  </button>
                  <button
                    className="text-xs text-ll-muted"
                    onClick={() => void rejectProposal(p.id).then(reload)}
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <ExpenseList rows={imported} catName={catName} empty="No imported expenses yet. Use Statements in this tracker." />
      </section>

      <section className="space-y-3 rounded-2xl border border-ll-border bg-ll-surface p-4">
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
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 ${accent ? "border border-ll-accent bg-ll-surface" : "border border-ll-border bg-ll-surface"}`}>
      <p className="text-[11px] uppercase tracking-wide text-ll-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ExpenseList({
  rows,
  catName,
  empty,
}: {
  rows: Expense[];
  catName: (id: string | null) => string;
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-ll-muted">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-ll-border overflow-hidden rounded-2xl bg-ll-surface">
      {rows.map((e) => (
        <li key={e.id} className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm text-ll-text">{e.note || catName(e.categoryId)}</p>
            <p className="text-xs text-ll-muted">
              {e.spentOn} · {catName(e.categoryId)} · {e.paymentMethod}
            </p>
          </div>
          <p className="text-sm font-medium tabular-nums">{formatInr(e.amountMinor)}</p>
        </li>
      ))}
    </ul>
  );
}
