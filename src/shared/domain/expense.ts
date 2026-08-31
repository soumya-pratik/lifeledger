export const CURRENCY = "INR" as const;
export const MINOR_PER_MAJOR = 100;

export type PaymentMethod = "upi" | "card" | "cash" | "other";
export type ExpenseOrigin = "manual" | "statement";
export type ProposalStatus = "pending" | "accepted" | "rejected";

/** Shared contract: imports fill this; expenses persist it. */
export type ExpenseDraft = {
  id: string;
  ledgerId: string;
  amountMinor: number;
  currency: string;
  spentOn: string;
  categoryId: string | null;
  note: string;
  paymentMethod: PaymentMethod;
  origin: ExpenseOrigin;
  importBatchId?: string;
  fingerprint?: string;
  rawDescription?: string;
  bankTxnId?: string;
};

export type Expense = ExpenseDraft & {
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ExpenseProposal = ExpenseDraft & {
  importBatchId: string;
  fingerprint: string;
  status: ProposalStatus;
  createdBy: string;
};
