import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useSession } from "@/shared/auth/SessionProvider";
import { listAllIncomes, listCategories, listExpenses } from "@/features/expenses/api";
import { buildSpendInsights, type SpendInsights } from "@/features/expenses/insights";
import { addMonths, currentMonthKey, monthLabel, shortMonthLabel } from "@/shared/lib/dates";
import { formatInr, formatInrCompact } from "@/shared/lib/money";
import { CategoryIcon } from "@/shared/ui/CategoryIcon";
import { chartColor, DonutChart, GroupedBars, HBarChart, LineChart } from "@/shared/ui/charts";

export function InsightsPage() {
  const { ledger } = useSession();
  const [ym, setYm] = useState(currentMonthKey);
  const [data, setData] = useState<SpendInsights | null>(null);
  const now = currentMonthKey();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [expenses, incomes, categories] = await Promise.all([
        listExpenses(ledger.id),
        listAllIncomes(ledger.id),
        listCategories(ledger.id),
      ]);
      if (cancelled) return;
      setData(buildSpendInsights({ expenses, incomes, categories, month: ym }));
    })();
    return () => {
      cancelled = true;
    };
  }, [ledger.id, ym]);

  const categorySlices = useMemo(() => {
    if (!data) return [];
    const top = data.byCategory.slice(0, 6);
    const rest = data.byCategory.slice(6).reduce((a, c) => a + c.totalMinor, 0);
    const slices = top.map((c, i) => ({ label: c.name, value: c.totalMinor, color: chartColor(i) }));
    if (rest > 0) slices.push({ label: "Other", value: rest, color: chartColor(6) });
    return slices;
  }, [data]);

  if (!data) {
    return <p className="text-sm text-ll-muted">Loading patterns…</p>;
  }

  const kindColor: Record<string, string> = { need: "#0284c7", want: "#d97706", unspecified: "#64748b" };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ll-muted">
            Charts from this ledger’s expenses and monthly income — not the raw statement.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-ll-border bg-ll-surface p-1 shadow-[var(--ll-shadow)]">
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-ll-muted hover:bg-ll-bg hover:text-ll-text"
            onClick={() => setYm((m) => addMonths(m, -1))}
          >
            Prev
          </button>
          <span className="min-w-[9rem] text-center text-sm font-medium">{monthLabel(ym)}</span>
          <button
            type="button"
            disabled={ym >= now}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-ll-muted hover:bg-ll-bg hover:text-ll-text disabled:opacity-40"
            onClick={() => setYm((m) => addMonths(m, 1))}
          >
            Next
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Spent" value={formatInr(data.spend)} />
        <Stat label="Income" value={data.income > 0 ? formatInr(data.income) : "—"} />
        <Stat
          label={data.remaining != null && data.remaining < 0 ? "Over" : "Left"}
          value={data.remaining == null ? "—" : formatInr(data.remaining)}
          warn={data.remaining != null && data.remaining < 0}
        />
        <Stat label="Per day" value={formatInr(data.avgPerDay)} />
      </section>

      <section className="rounded-2xl border border-ll-border bg-ll-surface p-5 shadow-[var(--ll-shadow)]">
        <h2 className="text-sm font-semibold">What this month looks like</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ll-text">
          {data.headlines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {data.count === 0 ? (
          <Link to="/expenses" className="mt-3 inline-block text-sm text-ll-accent">
            Add expenses in the tracker
          </Link>
        ) : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="By category" subtitle="Where the rupees went">
          <DonutChart slices={categorySlices} center={data.count ? `${data.count} txn` : undefined} />
        </ChartCard>
        <ChartCard title="Category ranking" subtitle="Largest to smallest">
          <HBarChart
            rows={data.byCategory.slice(0, 8).map((c, i) => ({
              label: c.name,
              value: c.totalMinor,
              color: chartColor(i),
              hint: `${formatInrCompact(c.totalMinor)} · ${c.pct}%`,
            }))}
          />
        </ChartCard>
        <ChartCard title="Daily spend" subtitle="Each calendar day this month">
          <LineChart
            points={data.byDay.map((d) => d.totalMinor)}
            labels={data.byDay.map((d) => String(Number(d.date.slice(8, 10))))}
          />
          {data.peakDay ? (
            <p className="mt-2 text-xs text-ll-muted">
              Spike on {data.peakDay.date} · {formatInr(data.peakDay.totalMinor)}
            </p>
          ) : null}
        </ChartCard>
        <ChartCard title="Need vs want" subtitle="From category types you assigned">
          <DonutChart
            slices={data.byKind.map((k) => ({
              label: k.kind === "need" ? "Need" : k.kind === "want" ? "Want" : "Unspecified",
              value: k.totalMinor,
              color: kindColor[k.kind],
            }))}
          />
        </ChartCard>
        <ChartCard title="Weekday rhythm" subtitle="Which days tend to cost more">
          <HBarChart
            rows={data.byWeekday.map((d) => ({
              label: d.label,
              value: d.totalMinor,
              hint: d.count ? `${formatInrCompact(d.totalMinor)} · ${d.count}` : "—",
            }))}
          />
        </ChartCard>
        <ChartCard title="How you paid" subtitle="UPI, card, cash, other">
          <HBarChart
            rows={data.byMethod.map((m, i) => ({
              label: m.method.toUpperCase(),
              value: m.totalMinor,
              color: chartColor(i + 2),
              hint: `${formatInrCompact(m.totalMinor)} · ${m.pct}%`,
            }))}
          />
        </ChartCard>
      </div>

      <ChartCard title="Six-month trend" subtitle="Teal is income, blue is spend">
        <GroupedBars
          groups={data.trend.map((t) => ({
            label: shortMonthLabel(t.month),
            a: t.income,
            b: t.spend,
          }))}
        />
        {data.vsPrevSpend && data.vsPrevSpend.prev > 0 ? (
          <p className="mt-2 text-xs text-ll-muted">
            Last month spend {formatInr(data.vsPrevSpend.prev)} · this month{" "}
            {data.vsPrevSpend.delta >= 0 ? "up" : "down"} {formatInr(Math.abs(data.vsPrevSpend.delta))}
          </p>
        ) : (
          <p className="mt-2 text-xs text-ll-muted">Add a previous month of spends to compare the trend.</p>
        )}
      </ChartCard>

      {data.byCategory.length > 0 ? (
        <section className="rounded-2xl border border-ll-border bg-ll-surface p-5 shadow-[var(--ll-shadow)]">
          <h2 className="text-sm font-semibold">Category detail</h2>
          <ul className="mt-3 divide-y divide-ll-border">
            {data.byCategory.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ll-bg text-ll-accent">
                  <CategoryIcon id={c.icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ll-text">{c.name}</p>
                  <p className="text-xs text-ll-muted">
                    {c.count} {c.count === 1 ? "entry" : "entries"} · {c.kind}
                  </p>
                </div>
                <p className="text-sm tabular-nums">{formatInr(c.totalMinor)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-ll-border bg-ll-surface p-5 shadow-[var(--ll-shadow)]">
      <h2 className="text-sm font-semibold text-ll-text">{title}</h2>
      <p className="mt-0.5 text-xs text-ll-muted">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-ll-surface p-4 shadow-[var(--ll-shadow)] ${warn ? "border-ll-danger" : "border-ll-border"}`}>
      <p className="text-[11px] uppercase tracking-wide text-ll-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold tabular-nums ${warn ? "text-ll-danger" : ""}`}>{value}</p>
    </div>
  );
}
