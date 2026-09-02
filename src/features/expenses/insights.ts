import type { Category } from "@/shared/domain/ledger";
import type { Expense } from "@/shared/domain/expense";
import type { IncomeEntry } from "@/shared/domain/income";
import type { CategoryIconId } from "@/shared/domain/categoryIcon";
import { DEFAULT_CATEGORY_ICON } from "@/shared/domain/categoryIcon";
import {
  addMonths,
  daysInMonth,
  inMonth,
  monthKey,
  monthsBackInclusive,
  todayIsoDate,
  weekdaySun0,
} from "@/shared/lib/dates";
import { formatInr } from "@/shared/lib/money";

export type CategorySlice = {
  id: string;
  name: string;
  icon: CategoryIconId;
  kind: Category["kind"] | "unspecified";
  totalMinor: number;
  pct: number;
  count: number;
};

export type TrendPoint = {
  month: string;
  spend: number;
  income: number;
};

export type DayPoint = { date: string; totalMinor: number };
export type WeekdayPoint = { label: string; totalMinor: number; count: number };
export type KindSlice = { kind: "need" | "want" | "unspecified"; totalMinor: number; pct: number };
export type MethodSlice = { method: string; totalMinor: number; pct: number };

export type SpendInsights = {
  month: string;
  spend: number;
  income: number;
  remaining: number | null;
  count: number;
  avgPerDay: number;
  peakDay: DayPoint | null;
  topCategory: CategorySlice | null;
  byCategory: CategorySlice[];
  byKind: KindSlice[];
  byMethod: MethodSlice[];
  byDay: DayPoint[];
  byWeekday: WeekdayPoint[];
  trend: TrendPoint[];
  vsPrevSpend: { prev: number; delta: number; pct: number | null } | null;
  headlines: string[];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export function buildSpendInsights(input: {
  expenses: Expense[];
  incomes: IncomeEntry[];
  categories: Category[];
  month: string;
  today?: string;
}): SpendInsights {
  const isoToday = input.today ?? todayIsoDate();
  const cats = new Map(input.categories.map((c) => [c.id, c]));
  const monthRows = input.expenses.filter((e) => inMonth(e.spentOn, input.month));
  const spend = monthRows.reduce((a, e) => a + e.amountMinor, 0);
  const income = input.incomes
    .filter((r) => r.month === input.month)
    .reduce((a, r) => a + r.amountMinor, 0);

  const catMap = new Map<string, CategorySlice>();
  for (const e of monthRows) {
    const id = e.categoryId ?? "_none";
    const cat = e.categoryId ? cats.get(e.categoryId) : undefined;
    const cur = catMap.get(id) ?? {
      id,
      name: cat?.name ?? "Uncategorized",
      icon: cat?.icon ?? DEFAULT_CATEGORY_ICON,
      kind: cat?.kind ?? "unspecified",
      totalMinor: 0,
      pct: 0,
      count: 0,
    };
    cur.totalMinor += e.amountMinor;
    cur.count += 1;
    catMap.set(id, cur);
  }
  const byCategory = [...catMap.values()]
    .map((c) => ({ ...c, pct: pct(c.totalMinor, spend) }))
    .sort((a, b) => b.totalMinor - a.totalMinor);

  const kindTotals: Record<KindSlice["kind"], number> = { need: 0, want: 0, unspecified: 0 };
  for (const c of byCategory) {
    kindTotals[c.kind] += c.totalMinor;
  }
  const byKind: KindSlice[] = (["need", "want", "unspecified"] as const)
    .map((kind) => ({ kind, totalMinor: kindTotals[kind], pct: pct(kindTotals[kind], spend) }))
    .filter((k) => k.totalMinor > 0);

  const methodMap = new Map<string, number>();
  for (const e of monthRows) {
    methodMap.set(e.paymentMethod, (methodMap.get(e.paymentMethod) ?? 0) + e.amountMinor);
  }
  const byMethod: MethodSlice[] = [...methodMap.entries()]
    .map(([method, totalMinor]) => ({ method, totalMinor, pct: pct(totalMinor, spend) }))
    .sort((a, b) => b.totalMinor - a.totalMinor);

  const dim = daysInMonth(input.month);
  const dayMap = new Map<string, number>();
  for (let d = 1; d <= dim; d++) {
    const date = `${input.month}-${String(d).padStart(2, "0")}`;
    dayMap.set(date, 0);
  }
  for (const e of monthRows) {
    dayMap.set(e.spentOn, (dayMap.get(e.spentOn) ?? 0) + e.amountMinor);
  }
  const byDay: DayPoint[] = [...dayMap.entries()].map(([date, totalMinor]) => ({ date, totalMinor }));
  const peakDay = [...byDay].sort((a, b) => b.totalMinor - a.totalMinor)[0];
  const peak = peakDay && peakDay.totalMinor > 0 ? peakDay : null;

  const weekdayAcc = WEEKDAYS.map((label) => ({ label, totalMinor: 0, count: 0 }));
  for (const e of monthRows) {
    const i = weekdaySun0(e.spentOn);
    weekdayAcc[i].totalMinor += e.amountMinor;
    weekdayAcc[i].count += 1;
  }

  const months = monthsBackInclusive(input.month, 6);
  const trend: TrendPoint[] = months.map((m) => ({
    month: m,
    spend: input.expenses.filter((e) => inMonth(e.spentOn, m)).reduce((a, e) => a + e.amountMinor, 0),
    income: input.incomes.filter((r) => r.month === m).reduce((a, r) => a + r.amountMinor, 0),
  }));

  const prevMonth = addMonths(input.month, -1);
  const prevSpend = input.expenses.filter((e) => inMonth(e.spentOn, prevMonth)).reduce((a, e) => a + e.amountMinor, 0);
  const vsPrevSpend =
    prevSpend === 0 && spend === 0
      ? null
      : {
          prev: prevSpend,
          delta: spend - prevSpend,
          pct: prevSpend > 0 ? pct(spend - prevSpend, prevSpend) : null,
        };

  const daysElapsed =
    monthKey(isoToday) === input.month
      ? Number(isoToday.slice(8, 10))
      : dim;
  const divisor = Math.max(1, daysElapsed);
  const avgPerDay = Math.round(spend / divisor);

  const headlines = buildHeadlines({
    spend,
    income,
    count: monthRows.length,
    byCategory,
    byKind,
    byWeekday: weekdayAcc,
    peak,
    vsPrevSpend,
    avgPerDay,
  });

  return {
    month: input.month,
    spend,
    income,
    remaining: income > 0 ? income - spend : null,
    count: monthRows.length,
    avgPerDay,
    peakDay: peak,
    topCategory: byCategory[0] ?? null,
    byCategory,
    byKind,
    byMethod,
    byDay,
    byWeekday: weekdayAcc,
    trend,
    vsPrevSpend,
    headlines,
  };
}

function buildHeadlines(input: {
  spend: number;
  income: number;
  count: number;
  byCategory: CategorySlice[];
  byKind: KindSlice[];
  byWeekday: WeekdayPoint[];
  peak: DayPoint | null;
  vsPrevSpend: SpendInsights["vsPrevSpend"];
  avgPerDay: number;
}): string[] {
  if (input.count === 0) {
    return ["No spends in this month yet. Add a few expenses to see where money goes."];
  }
  const lines: string[] = [];
  const top = input.byCategory[0];
  if (top && top.pct >= 25) {
    lines.push(`${top.name} is the main pattern — ${top.pct}% of spend (${formatInr(top.totalMinor)}).`);
  } else if (top) {
    lines.push(`Spend is spread out. Largest slice is ${top.name} at ${top.pct}%.`);
  }

  const need = input.byKind.find((k) => k.kind === "need");
  const want = input.byKind.find((k) => k.kind === "want");
  if (need && want && input.spend > 0) {
    if (want.pct > need.pct) {
      lines.push(`Wants (${want.pct}%) outpaced needs (${need.pct}%) this month.`);
    } else {
      lines.push(`Needs are ${need.pct}% of spend; wants are ${want.pct}%.`);
    }
  }

  const hot = [...input.byWeekday].sort((a, b) => b.totalMinor - a.totalMinor)[0];
  if (hot && hot.totalMinor > 0) {
    const weekend = input.byWeekday[0].totalMinor + input.byWeekday[6].totalMinor;
    const week = input.spend - weekend;
    if (weekend > week && input.spend > 0) {
      lines.push(`Weekends (Sat–Sun) took more money than the rest of the week combined.`);
    } else {
      lines.push(`${hot.label} is the heaviest weekday (${formatInr(hot.totalMinor)}).`);
    }
  }

  if (input.peak) {
    const day = Number(input.peak.date.slice(8, 10));
    lines.push(`Peak day was the ${day}${ordinal(day)} — ${formatInr(input.peak.totalMinor)}.`);
  }

  if (input.income > 0) {
    const used = pct(input.spend, input.income);
    if (input.spend > input.income) {
      lines.push(`Spend is over income by ${formatInr(input.spend - input.income)}.`);
    } else {
      lines.push(`You've used ${used}% of this month's income so far.`);
    }
  }

  if (input.vsPrevSpend && input.vsPrevSpend.prev > 0 && input.vsPrevSpend.pct != null) {
    const dir = input.vsPrevSpend.delta >= 0 ? "up" : "down";
    lines.push(`Total spend is ${dir} ${Math.abs(input.vsPrevSpend.pct)}% vs last month.`);
  }

  lines.push(`Pace is about ${formatInr(input.avgPerDay)} per day across ${input.count} transactions.`);
  return lines.slice(0, 6);
}

function ordinal(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}
