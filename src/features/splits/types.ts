export type SplitGroupKind = "home" | "trip" | "couple" | "other";

export type SplitGroup = {
  id: string;
  name: string;
  kind: SplitGroupKind;
  currency: string;
  createdBy: string;
  createdAt: string;
};

export type SplitMember = {
  groupId: string;
  userId: string;
  role: "owner" | "member";
  displayName: string;
  email: string;
};

export type SplitExpense = {
  id: string;
  groupId: string;
  amountMinor: number;
  currency: string;
  description: string;
  spentOn: string;
  payerId: string;
  createdBy: string;
  createdAt: string;
  deletedAt: string | null;
  shares: { userId: string; shareMinor: number }[];
};

export type SplitSettlement = {
  id: string;
  groupId: string;
  fromUser: string;
  toUser: string;
  amountMinor: number;
  spentOn: string;
  note: string | null;
};
