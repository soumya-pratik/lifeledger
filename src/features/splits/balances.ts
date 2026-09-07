export type SplitExpenseRow = {
  id: string;
  payerId: string;
  amountMinor: number;
  deletedAt: string | null;
  shares: { userId: string; shareMinor: number }[];
};

export type SplitSettlementRow = {
  fromUser: string;
  toUser: string;
  amountMinor: number;
};

export type PairBalance = {
  fromUser: string;
  toUser: string;
  amountMinor: number;
};

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Net directed debts: fromUser owes toUser amountMinor (always positive). */
export function computePairBalances(
  expenses: SplitExpenseRow[],
  settlements: SplitSettlementRow[],
): PairBalance[] {
  const net = new Map<string, number>();

  function add(from: string, to: string, amount: number) {
    if (from === to || amount === 0) return;
    const key = pairKey(from, to);
    const signed = from < to ? amount : -amount;
    net.set(key, (net.get(key) ?? 0) + signed);
  }

  for (const e of expenses) {
    if (e.deletedAt) continue;
    for (const s of e.shares) {
      add(s.userId, e.payerId, s.shareMinor);
    }
  }
  for (const s of settlements) {
    add(s.fromUser, s.toUser, -s.amountMinor);
  }

  const out: PairBalance[] = [];
  for (const [key, signed] of net) {
    if (signed === 0) continue;
    const [a, b] = key.split("|");
    if (signed > 0) out.push({ fromUser: a, toUser: b, amountMinor: signed });
    else out.push({ fromUser: b, toUser: a, amountMinor: -signed });
  }
  return out.sort((x, y) => y.amountMinor - x.amountMinor);
}

export function balancesForUser(pairs: PairBalance[], userId: string) {
  const youOwe = pairs.filter((p) => p.fromUser === userId);
  const owedToYou = pairs.filter((p) => p.toUser === userId);
  const net =
    owedToYou.reduce((a, p) => a + p.amountMinor, 0) - youOwe.reduce((a, p) => a + p.amountMinor, 0);
  return { youOwe, owedToYou, net };
}
