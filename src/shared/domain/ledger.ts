export type LedgerKind = "personal" | "shared";
export type MemberRole = "owner" | "editor" | "viewer";

export type Ledger = {
  id: string;
  name: string;
  kind: LedgerKind;
  currency: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type LedgerMember = {
  ledgerId: string;
  userId: string;
  role: MemberRole;
  status: "active" | "invited";
};

export type Category = {
  id: string;
  ledgerId: string;
  name: string;
  kind: "need" | "want" | "unspecified";
  archivedAt: string | null;
};

export const DEFAULT_CATEGORIES: { name: string; kind: Category["kind"] }[] = [
  { name: "Food", kind: "need" },
  { name: "Transport", kind: "need" },
  { name: "Rent", kind: "need" },
  { name: "Utilities", kind: "need" },
  { name: "Health", kind: "need" },
  { name: "Transfer", kind: "unspecified" },
  { name: "Other", kind: "unspecified" },
];
