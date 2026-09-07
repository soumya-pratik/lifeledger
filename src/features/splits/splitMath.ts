export type SplitMode = "equal" | "exact" | "shares" | "percent";

export type ShareLine = { userId: string; shareMinor: number };

function remainderToFront(base: number[], leftover: number): number[] {
  const out = [...base];
  for (let i = 0; leftover > 0 && i < out.length; i += 1) {
    out[i] += 1;
    leftover -= 1;
  }
  return out;
}

/** Allocate amount_minor across users so shares always sum exactly. */
export function allocateShares(
  amountMinor: number,
  userIds: string[],
  mode: SplitMode,
  extra: Record<string, number> = {},
): ShareLine[] {
  if (amountMinor <= 0) throw new Error("Amount must be positive");
  if (userIds.length === 0) throw new Error("Select at least one person");
  const ids = [...new Set(userIds)];

  if (mode === "equal") {
    const n = ids.length;
    const base = Math.floor(amountMinor / n);
    const parts = remainderToFront(ids.map(() => base), amountMinor - base * n);
    return ids.map((userId, i) => ({ userId, shareMinor: parts[i] }));
  }

  if (mode === "exact") {
    const lines = ids.map((userId) => {
      const v = extra[userId];
      if (v == null || !Number.isInteger(v) || v < 0) throw new Error("Enter an exact amount for each person");
      return { userId, shareMinor: v };
    });
    const sum = lines.reduce((a, l) => a + l.shareMinor, 0);
    if (sum !== amountMinor) throw new Error("Exact amounts must add up to the bill");
    return lines;
  }

  if (mode === "shares") {
    const weights = ids.map((id) => {
      const w = extra[id] ?? 1;
      if (!Number.isFinite(w) || w < 0) throw new Error("Shares must be zero or more");
      return w;
    });
    const totalW = weights.reduce((a, w) => a + w, 0);
    if (totalW <= 0) throw new Error("Total shares must be greater than zero");
    const raw = weights.map((w) => Math.floor((amountMinor * w) / totalW));
    const sum = raw.reduce((a, n) => a + n, 0);
    const parts = remainderToFront(raw, amountMinor - sum);
    return ids.map((userId, i) => ({ userId, shareMinor: parts[i] }));
  }

  const percents = ids.map((id) => {
    const p = extra[id];
    if (p == null || !Number.isFinite(p) || p < 0) throw new Error("Enter a percent for each person");
    return p;
  });
  const totalP = percents.reduce((a, p) => a + p, 0);
  if (Math.abs(totalP - 100) > 0.01) throw new Error("Percents must add up to 100");
  const raw = percents.map((p) => Math.floor((amountMinor * p) / 100));
  const sum = raw.reduce((a, n) => a + n, 0);
  const parts = remainderToFront(raw, amountMinor - sum);
  return ids.map((userId, i) => ({ userId, shareMinor: parts[i] }));
}
