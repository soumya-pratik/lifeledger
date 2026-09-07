import { supabase } from "@/shared/supabase/client";
import type { UserRole } from "@/shared/entitlements/types";

export type AdminUserRow = {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  updatedAt: string;
  modules: string[];
};

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

export async function adminListUsers(): Promise<AdminUserRow[]> {
  const client = requireClient();
  const { data: profiles, error } = await client
    .from("profiles")
    .select("user_id, email, display_name, role, updated_at")
    .order("email", { ascending: true });
  if (error) throw error;
  const ids = (profiles ?? []).map((p) => p.user_id as string);
  if (ids.length === 0) {
    return [];
  }
  const { data: mods, error: modError } = await client
    .from("profile_modules")
    .select("user_id, module_id")
    .in("user_id", ids);
  if (modError) throw modError;
  const byUser = new Map<string, string[]>();
  for (const m of mods ?? []) {
    const uid = m.user_id as string;
    const list = byUser.get(uid) ?? [];
    list.push(m.module_id as string);
    byUser.set(uid, list);
  }
  return (profiles ?? []).map((p) => ({
    userId: p.user_id as string,
    email: (p.email as string) ?? "",
    displayName: (p.display_name as string) ?? "",
    role: ((p.role as UserRole | undefined) ?? "user") as UserRole,
    updatedAt: p.updated_at as string,
    modules: byUser.get(p.user_id as string) ?? ["home"],
  }));
}

export async function adminSetRole(userId: string, role: UserRole): Promise<{ ok: boolean; error?: string }> {
  const client = requireClient();
  const { data, error } = await client.rpc("admin_set_user_role", { p_user: userId, p_role: role });
  if (error) throw error;
  const body = data as { ok?: boolean; error?: string };
  if (body?.ok) return { ok: true };
  return { ok: false, error: body?.error };
}

export async function adminSetModules(userId: string, modules: string[]): Promise<void> {
  const client = requireClient();
  const { error } = await client.rpc("admin_set_user_modules", {
    p_user: userId,
    p_modules: modules.filter((m) => m !== "home"),
  });
  if (error) throw error;
}
