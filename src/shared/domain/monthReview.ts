export type MonthBucket = {
  categoryId: string | null;
  categoryName: string;
  totalMinor: number;
  count: number;
};

export type MonthSummary = {
  ledgerName: string;
  month: string;
  currency: string;
  totals: { manual: number; statement: number; all: number; income: number; remaining: number | null };
  byCategory: MonthBucket[];
  outliers: { spentOn: string; amountMinor: number; note: string }[];
};

export type MonthReviewResult = {
  summary: string;
  bullets: string[];
  anomalies: string[];
};
