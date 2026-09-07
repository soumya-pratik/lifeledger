import { supabase } from "@/shared/supabase/client";
import { balancesForUser, computePairBalances } from "@/features/splits/balances";
import type { ShareLine } from "@/features/splits/splitMath";
import type { SplitExpense, SplitGroup, SplitGroupKind, SplitMember, SplitSettlement } from "@/features/splits/types";

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

type ProfileRow = { user_id: string; email: string | null; display_name: string | null };

async function profilesByIds(ids: string[]): Promise<Map<string, ProfileRow>> {
  const client = requireClient();
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  const { data, error } = await client.from("profiles").select("user_id, email, display_name").in("user_id", unique);
  if (error) throw error;
  return new Map((data ?? []).map((p) => [p.user_id as string, p as ProfileRow]));
}

export function memberLabel(m: { displayName: string; email: string; userId: string }, selfId: string): string {
  if (m.userId === selfId) return "You";
  return m.displayName || m.email || m.userId.slice(0, 8);
}

export async function listGroups(): Promise<SplitGroup[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("split_groups")
    .select("id, name, kind, currency, created_by, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((g) => ({
    id: g.id as string,
    name: g.name as string,
    kind: g.kind as SplitGroupKind,
    currency: g.currency as string,
    createdBy: g.created_by as string,
    createdAt: g.created_at as string,
  }));
}

export async function createGroup(input: {
  name: string;
  kind: SplitGroupKind;
  userId: string;
}): Promise<SplitGroup> {
  const client = requireClient();
  // #region agent log
  fetch("http://127.0.0.1:7276/ingest/9e733f63-913b-4a5e-ab8d-47371ed54f20", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "db2b60" },
    body: JSON.stringify({
      sessionId: "db2b60",
      runId: "post-fix",
      hypothesisId: "H5",
      location: "src/features/splits/api.ts:createGroup:entry",
      message: "createGroup start",
      data: {
        hasClient: !!client,
        kind: input.kind,
        nameLen: input.name.trim().length,
        userIdLen: input.userId.length,
        userIdPrefix: input.userId.slice(0, 8),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  const { data, error } = await client.rpc("create_split_group", {
    p_name: input.name.trim(),
    p_kind: input.kind,
  });
  if (error) {
    // #region agent log
    fetch("http://127.0.0.1:7276/ingest/9e733f63-913b-4a5e-ab8d-47371ed54f20", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "db2b60" },
      body: JSON.stringify({
        sessionId: "db2b60",
        runId: "post-fix",
        hypothesisId: "H4",
        location: "src/features/splits/api.ts:createGroup:rpc",
        message: "create_split_group rpc failed",
        data: {
          code: error.code,
          errMessage: error.message,
          details: error.details,
          hint: error.hint,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw error;
  }
  // #region agent log
  fetch("http://127.0.0.1:7276/ingest/9e733f63-913b-4a5e-ab8d-47371ed54f20", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "db2b60" },
    body: JSON.stringify({
      sessionId: "db2b60",
      runId: "post-fix",
      hypothesisId: "H4",
      location: "src/features/splits/api.ts:createGroup:rpcOk",
      message: "create_split_group rpc ok",
      data: { hasId: !!(data as { id?: string } | null)?.id, kind: input.kind },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  const row = data as {
    id: string;
    name: string;
    kind: SplitGroupKind;
    currency: string;
    created_by: string;
    created_at: string;
  };
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    currency: row.currency,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function getGroup(id: string): Promise<SplitGroup | null> {
  const client = requireClient();
  const { data, error } = await client
    .from("split_groups")
    .select("id, name, kind, currency, created_by, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id as string,
    name: data.name as string,
    kind: data.kind as SplitGroupKind,
    currency: data.currency as string,
    createdBy: data.created_by as string,
    createdAt: data.created_at as string,
  };
}

export async function listMembers(groupId: string): Promise<SplitMember[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("split_group_members")
    .select("group_id, user_id, role")
    .eq("group_id", groupId);
  if (error) throw error;
  const rows = data ?? [];
  const profiles = await profilesByIds(rows.map((r) => r.user_id as string));
  return rows.map((r) => {
    const p = profiles.get(r.user_id as string);
    return {
      groupId: r.group_id as string,
      userId: r.user_id as string,
      role: r.role as "owner" | "member",
      displayName: p?.display_name ?? "",
      email: p?.email ?? "",
    };
  });
}

export async function inviteMember(
  groupId: string,
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = requireClient();
  const { data, error } = await client.rpc("invite_split_group_member", {
    p_group: groupId,
    p_email: email.trim(),
  });
  if (error) throw error;
  const body = data as { ok?: boolean; error?: string };
  if (body?.ok) return { ok: true };
  return { ok: false, error: body?.error ?? "invite_failed" };
}

export async function listExpenses(groupId: string): Promise<SplitExpense[]> {
  const client = requireClient();
  const { data: expenses, error } = await client
    .from("split_expenses")
    .select("id, group_id, amount_minor, currency, description, spent_on, payer_id, created_by, created_at, deleted_at")
    .eq("group_id", groupId)
    .is("deleted_at", null)
    .order("spent_on", { ascending: false });
  if (error) throw error;
  const ids = (expenses ?? []).map((e) => e.id as string);
  if (ids.length === 0) return [];
  const { data: shares, error: shareError } = await client
    .from("split_shares")
    .select("expense_id, user_id, share_minor")
    .in("expense_id", ids);
  if (shareError) throw shareError;
  const byExp = new Map<string, { userId: string; shareMinor: number }[]>();
  for (const s of shares ?? []) {
    const list = byExp.get(s.expense_id as string) ?? [];
    list.push({ userId: s.user_id as string, shareMinor: s.share_minor as number });
    byExp.set(s.expense_id as string, list);
  }
  return (expenses ?? []).map((e) => ({
    id: e.id as string,
    groupId: e.group_id as string,
    amountMinor: e.amount_minor as number,
    currency: e.currency as string,
    description: e.description as string,
    spentOn: e.spent_on as string,
    payerId: e.payer_id as string,
    createdBy: e.created_by as string,
    createdAt: e.created_at as string,
    deletedAt: (e.deleted_at as string | null) ?? null,
    shares: byExp.get(e.id as string) ?? [],
  }));
}

export async function listSettlements(groupId: string): Promise<SplitSettlement[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("split_settlements")
    .select("id, group_id, from_user, to_user, amount_minor, spent_on, note")
    .eq("group_id", groupId)
    .order("spent_on", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((s) => ({
    id: s.id as string,
    groupId: s.group_id as string,
    fromUser: s.from_user as string,
    toUser: s.to_user as string,
    amountMinor: s.amount_minor as number,
    spentOn: s.spent_on as string,
    note: (s.note as string | null) ?? null,
  }));
}

export async function createExpense(input: {
  groupId: string;
  userId: string;
  amountMinor: number;
  description: string;
  spentOn: string;
  payerId: string;
  shares: ShareLine[];
}): Promise<void> {
  const client = requireClient();
  const { data, error } = await client
    .from("split_expenses")
    .insert({
      group_id: input.groupId,
      amount_minor: input.amountMinor,
      currency: "INR",
      description: input.description.trim(),
      spent_on: input.spentOn,
      payer_id: input.payerId,
      created_by: input.userId,
    })
    .select("id")
    .single();
  if (error) throw error;
  const { error: shareError } = await client.from("split_shares").insert(
    input.shares.map((s) => ({
      expense_id: data.id,
      user_id: s.userId,
      share_minor: s.shareMinor,
    })),
  );
  if (shareError) throw shareError;
}

export async function createSettlement(input: {
  groupId: string;
  userId: string;
  fromUser: string;
  toUser: string;
  amountMinor: number;
  spentOn: string;
  note: string;
}): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("split_settlements").insert({
    group_id: input.groupId,
    from_user: input.fromUser,
    to_user: input.toUser,
    amount_minor: input.amountMinor,
    spent_on: input.spentOn,
    note: input.note.trim() || null,
    created_by: input.userId,
  });
  if (error) throw error;
}

export async function listAllUserBalances(userId: string) {
  const groups = await listGroups();
  const perGroup = [];
  for (const g of groups) {
    const [expenses, settlements] = await Promise.all([listExpenses(g.id), listSettlements(g.id)]);
    const pairs = computePairBalances(
      expenses.map((e) => ({
        id: e.id,
        payerId: e.payerId,
        amountMinor: e.amountMinor,
        deletedAt: e.deletedAt,
        shares: e.shares,
      })),
      settlements.map((s) => ({ fromUser: s.fromUser, toUser: s.toUser, amountMinor: s.amountMinor })),
    );
    perGroup.push({ group: g, ...balancesForUser(pairs, userId), pairs });
  }
  return perGroup;
}
