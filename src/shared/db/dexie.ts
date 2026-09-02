import Dexie, { type EntityTable } from "dexie";
import type { Expense, ExpenseProposal } from "@/shared/domain/expense";
import type { IncomeEntry } from "@/shared/domain/income";
import type { Category, Ledger, LedgerMember } from "@/shared/domain/ledger";

export type SessionRow = {
  id: "current";
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  activeLedgerId: string;
};

export type ImportBatchRow = {
  id: string;
  ledgerId: string;
  filename: string;
  extractor: "csv" | "ofx" | "pdf-text" | "llm";
  status: "parsed" | "reviewed" | "committed";
  reviewText: string | null;
  createdBy: string;
  createdAt: string;
};

export type OutboxRow = {
  id: string;
  kind: string;
  payload: unknown;
  createdAt: string;
};

class LifeLedgerDb extends Dexie {
  session!: EntityTable<SessionRow, "id">;
  ledgers!: EntityTable<Ledger, "id">;
  members!: EntityTable<LedgerMember, "ledgerId">;
  categories!: EntityTable<Category, "id">;
  expenses!: EntityTable<Expense, "id">;
  proposals!: EntityTable<ExpenseProposal, "id">;
  incomes!: EntityTable<IncomeEntry, "id">;
  importBatches!: EntityTable<ImportBatchRow, "id">;
  outbox!: EntityTable<OutboxRow, "id">;

  constructor() {
    super("lifeledger");
    this.version(1).stores({
      session: "id",
      ledgers: "id, kind, createdBy",
      members: "[ledgerId+userId], userId, ledgerId",
      categories: "id, ledgerId",
      expenses: "id, ledgerId, spentOn, origin, fingerprint, deletedAt",
      proposals: "id, ledgerId, importBatchId, status, fingerprint",
      importBatches: "id, ledgerId, createdAt",
      outbox: "id, createdAt",
    });
    this.version(2).stores({
      incomes: "id, ledgerId, month, [ledgerId+month]",
    });
  }
}

export const db = new LifeLedgerDb();
