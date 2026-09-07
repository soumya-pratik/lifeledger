import { supabase } from "@/shared/supabase/client";
import { catalogModuleIds } from "@/shared/config/features";
import { FALLBACK_FREE, type Entitlements, type UserRole } from "@/shared/entitlements/types";

export async function fetchEntitlements(input: {
  userId: string;
  email: string;
  displayName: string;
}): Promise<Entitlements> {
  if (!supabase) return FALLBACK_FREE;

  try {
    const now = new Date().toISOString();
    const { data: existing } = await supabase
      .from("profiles")
      .select("user_id, plan_id, role")
      .eq("user_id", input.userId)
      .maybeSingle();

    if (!existing) {
      const { error: insertError } = await supabase.from("profiles").insert({
        user_id: input.userId,
        plan_id: "free",
        email: input.email,
        display_name: input.displayName,
        updated_at: now,
      });
      if (insertError) return FALLBACK_FREE;
    } else {
      await supabase
        .from("profiles")
        .update({ email: input.email, display_name: input.displayName, updated_at: now })
        .eq("user_id", input.userId);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plan_id, role")
      .eq("user_id", input.userId)
      .maybeSingle();

    if (profileError || !profile) return FALLBACK_FREE;

    const planId = (profile.plan_id as string) ?? "free";
    const role = ((profile.role as UserRole | undefined) ?? "user") as UserRole;
    const { data: planRow } = await supabase.from("plans").select("name").eq("id", planId).maybeSingle();

    if (role === "admin") {
      return {
        planId,
        planName: (planRow?.name as string | undefined) ?? planId,
        role,
        modules: catalogModuleIds(),
      };
    }

    const { data: rows, error: modError } = await supabase
      .from("profile_modules")
      .select("module_id")
      .eq("user_id", input.userId);

    if (modError) {
      const { data: fallback } = await supabase.from("plan_modules").select("module_id").eq("plan_id", "free");
      return {
        planId,
        planName: (planRow?.name as string | undefined) ?? planId,
        role: "user",
        modules: (fallback ?? []).map((r) => r.module_id as string),
      };
    }

    const modules = (rows ?? []).map((r) => r.module_id as string);
    return {
      planId,
      planName: (planRow?.name as string | undefined) ?? planId,
      role,
      modules: modules.includes("home") ? modules : ["home", ...modules],
    };
  } catch {
    return FALLBACK_FREE;
  }
}
