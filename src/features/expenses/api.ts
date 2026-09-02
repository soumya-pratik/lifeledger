import { db } from "@/shared/db/dexie";
import type { Category } from "@/shared/domain/ledger";
import type { Expense, ExpenseDraft, ExpenseProposal } from "@/shared/domain/expense";
import type { IncomeEntry } from "@/shared/domain/income";
import { heuristicCategoryIcon, isCategoryIconId, type CategoryIconId } from "@/shared/domain/categoryIcon";
import { expenseFingerprint } from "@/shared/lib/fingerprint";
import { newId } from "@/shared/lib/id";
import { inMonth, monthKey } from "@/shared/lib/dates";
import type { MonthSummary } from "@/shared/domain/monthReview";

function live(expense: Expense): boolean {
  return expense.deletedAt == null;
}

const RENT_NAME = /^rent$/i;
const HOUSE_EMI_NAME = "House Emi";

export async function renameRentToHouseEmi(): Promise<void> {
  const rows = await db.categories.toArray();
  const rentRows = rows.filter((c) => RENT_NAME.test(c.name));
  if (rentRows.length === 0) return;

  for (const rent of rentRows) {
    const houseEmi = rows.find(
      (c) =>
        c.ledgerId === rent.ledgerId &&
        c.id !== rent.id &&
        c.archivedAt == null &&
        c.name.toLowerCase() === HOUSE_EMI_NAME.toLowerCase(),
    );
    if (!houseEmi) {
      await db.categories.update(rent.id, { name: HOUSE_EMI_NAME });
      rent.name = HOUSE_EMI_NAME;
      continue;
    }
    const expenses = await db.expenses.where("ledgerId").equals(rent.ledgerId).toArray();
    for (const e of expenses) {
      if (e.categoryId === rent.id) await db.expenses.update(e.id, { categoryId: houseEmi.id });
    }
    const proposals = await db.proposals.where("ledgerId").equals(rent.ledgerId).toArray();
    for (const p of proposals) {
      if (p.categoryId === rent.id) await db.proposals.update(p.id, { categoryId: houseEmi.id });
    }
    await db.categories.update(rent.id, { archivedAt: new Date().toISOString(), name: HOUSE_EMI_NAME });
  }
}

export async function listCategories(ledgerId: string): Promise<Category[]> {
  await renameRentToHouseEmi();
  const rows = await db.categories.where("ledgerId").equals(ledgerId).toArray();
  const live = rows.filter((c) => c.archivedAt == null).sort((a, b) => a.name.localeCompare(b.name));
  for (const c of live) {
    if (isCategoryIconId(c.icon)) continue;
    const icon = heuristicCategoryIcon(c.name, c.kind);
    await db.categories.update(c.id, { icon });
    c.icon = icon;
  }
  return live;
}

export async function addCategory(input: {
  ledgerId: string;
  name: string;
  kind: Category["kind"];
  icon: CategoryIconId;
}): Promise<Category> {
  const name = input.name.trim();
  if (!name) throw new Error("Category name is required");
  const existing = await listCategories(input.ledgerId);
  if (existing.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    throw new Error("A category with that name already exists");
  }
  const row: Category = {
    id: newId(),
    ledgerId: input.ledgerId,
    name,
    kind: input.kind,
    icon: input.icon,
    archivedAt: null,
  };
  await db.categories.add(row);
  return row;
}

export async function addManualExpense(
  userId: string,
  input: Omit<ExpenseDraft, "id" | "origin" | "fingerprint">,
): Promise<Expense> {
  const monthIncomes = await listIncomes(input.ledgerId, monthKey(input.spentOn));
  if (monthIncomes.length === 0) {
    throw new Error("Add this month's income before recording expenses.");
  }
  const now = new Date().toISOString();
  const draft: ExpenseDraft = {
    ...input,
    id: newId(),
    origin: "manual",
    fingerprint: await expenseFingerprint({
      ledgerId: input.ledgerId,
      spentOn: input.spentOn,
      amountMinor: input.amountMinor,
      rawDescription: input.note || "manual",
    }),
  };
  const row: Expense = {
    ...draft,
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await db.expenses.add(row);
  await db.outbox.add({
    id: newId(),
    kind: "expense.upsert",
    payload: row,
    createdAt: now,
  });
  return row;
}

export async function listExpenses(ledgerId: string): Promise<Expense[]> {
  const rows = await db.expenses.where("ledgerId").equals(ledgerId).toArray();
  return rows.filter(live).sort((a, b) => b.spentOn.localeCompare(a.spentOn) || b.createdAt.localeCompare(a.createdAt));
}

export async function listIncomes(ledgerId: string, ym: string): Promise<IncomeEntry[]> {
  const rows = await db.incomes.where("[ledgerId+month]").equals([ledgerId, ym]).toArray();
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addIncome(
  userId: string,
  input: { ledgerId: string; month: string; amountMinor: number; currency: string; note: string },
): Promise<IncomeEntry> {
  if (input.amountMinor <= 0) throw new Error("Income must be greater than zero");
  const now = new Date().toISOString();
  const row: IncomeEntry = {
    id: newId(),
    ledgerId: input.ledgerId,
    month: input.month,
    amountMinor: input.amountMinor,
    currency: input.currency,
    note: input.note.trim(),
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  };
  await db.incomes.add(row);
  await db.outbox.add({
    id: newId(),
    kind: "income.upsert",
    payload: row,
    createdAt: now,
  });
  return row;
}

export async function listAllIncomes(ledgerId: string): Promise<IncomeEntry[]> {
  return db.incomes.where("ledgerId").equals(ledgerId).toArray();
}

export async function deleteIncome(id: string): Promise<void> {
  const row = await db.incomes.get(id);
  if (!row) return;
  await db.incomes.delete(id);
  await db.outbox.add({
    id: newId(),
    kind: "income.delete",
    payload: { id },
    createdAt: new Date().toISOString(),
  });
}

export async function monthTotals(ledgerId: string, ym: string) {
  const rows = (await listExpenses(ledgerId)).filter((e) => inMonth(e.spentOn, ym));
  const sum = (origin?: Expense["origin"]) =>
    rows.filter((e) => (origin ? e.origin === origin : true)).reduce((acc, e) => acc + e.amountMinor, 0);
  return {
    manual: sum("manual"),
    statement: sum("statement"),
    all: sum(),
    count: rows.length,
    rows,
  };
}

export async function buildMonthSummary(
  ledgerId: string,
  ledgerName: string,
  ym: string,
): Promise<MonthSummary> {
  const categories = await listCategories(ledgerId);
  const { manual, statement, all, rows } = await monthTotals(ledgerId, ym);
  const incomes = await listIncomes(ledgerId, ym);
  const income = incomes.reduce((acc, r) => acc + r.amountMinor, 0);
  const byCat = new Map<string, { totalMinor: number; count: number }>();
  for (const e of rows) {
    const key = e.categoryId ?? "_none";
    const cur = byCat.get(key) ?? { totalMinor: 0, count: 0 };
    cur.totalMinor += e.amountMinor;
    cur.count += 1;
    byCat.set(key, cur);
  }
  const byCategory = [...byCat.entries()].map(([id, v]) => ({
    categoryId: id === "_none" ? null : id,
    categoryName: categories.find((c) => c.id === id)?.name ?? "Uncategorized",
    ...v,
  }));
  const outliers = [...rows]
    .sort((a, b) => b.amountMinor - a.amountMinor)
    .slice(0, 8)
    .map((e) => ({ spentOn: e.spentOn, amountMinor: e.amountMinor, note: e.note.slice(0, 80) }));
  return {
    ledgerName,
    month: ym,
    currency: "INR",
    totals: { manual, statement, all, income, remaining: income > 0 ? income - all : null },
    byCategory,
    outliers,
  };
}

export async function proposeImported(
  userId: string,
  drafts: ExpenseDraft[],
): Promise<{ created: ExpenseProposal[]; skippedFingerprints: string[] }> {
  const created: ExpenseProposal[] = [];
  const skippedFingerprints: string[] = [];

  for (const draft of drafts) {
    const fp =
      draft.fingerprint ??
      (await expenseFingerprint({
        ledgerId: draft.ledgerId,
        spentOn: draft.spentOn,
        amountMinor: draft.amountMinor,
        rawDescription: draft.rawDescription || draft.note,
        bankTxnId: draft.bankTxnId,
      }));

    const existingExpense = await db.expenses
      .where("fingerprint")
      .equals(fp)
      .first();
    const existingProposal = await db.proposals
      .where("fingerprint")
      .equals(fp)
      .first();

    if (
      (existingExpense && existingExpense.ledgerId === draft.ledgerId && live(existingExpense)) ||
      (existingProposal && existingProposal.ledgerId === draft.ledgerId && existingProposal.status !== "rejected")
    ) {
      skippedFingerprints.push(fp);
      continue;
    }

    const row: ExpenseProposal = {
      ...draft,
      id: draft.id || newId(),
      origin: "statement",
      importBatchId: draft.importBatchId!,
      fingerprint: fp,
      status: "pending",
      createdBy: userId,
    };
    await db.proposals.add(row);
    created.push(row);
  }

  return { created, skippedFingerprints };
}

export async function listProposals(ledgerId: string, status: ExpenseProposal["status"] = "pending") {
  const rows = await db.proposals.where("ledgerId").equals(ledgerId).toArray();
  return rows.filter((p) => p.status === status);
}

export async function acceptProposal(userId: string, proposalId: string): Promise<Expense | null> {
  const proposal = await db.proposals.get(proposalId);
  if (!proposal || proposal.status !== "pending") return null;

  const now = new Date().toISOString();
  const expense: Expense = {
    id: newId(),
    ledgerId: proposal.ledgerId,
    amountMinor: proposal.amountMinor,
    currency: proposal.currency,
    spentOn: proposal.spentOn,
    categoryId: proposal.categoryId,
    note: proposal.note,
    paymentMethod: proposal.paymentMethod,
    origin: "statement",
    importBatchId: proposal.importBatchId,
    fingerprint: proposal.fingerprint,
    rawDescription: proposal.rawDescription,
    bankTxnId: proposal.bankTxnId,
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await db.transaction("rw", db.expenses, db.proposals, db.outbox, async () => {
    await db.expenses.add(expense);
    await db.proposals.update(proposalId, { status: "accepted" });
    await db.outbox.add({
      id: newId(),
      kind: "expense.upsert",
      payload: expense,
      createdAt: now,
    });
  });
  return expense;
}

export async function rejectProposal(proposalId: string): Promise<void> {
  await db.proposals.update(proposalId, { status: "rejected" });
}

export async function acceptAllPending(userId: string, ledgerId: string): Promise<number> {
  const pending = await listProposals(ledgerId, "pending");
  let n = 0;
  for (const p of pending) {
    const ok = await acceptProposal(userId, p.id);
    if (ok) n += 1;
  }
  return n;
}

export async function softDeleteExpense(userId: string, id: string): Promise<void> {
  const row = await db.expenses.get(id);
  if (!row) return;
  const now = new Date().toISOString();
  await db.expenses.update(id, { deletedAt: now, updatedBy: userId, updatedAt: now });
}
