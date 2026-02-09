// lib/billing/usage.ts
import { createClient } from "@/lib/supabase/server";

export type Plan = "free" | "pro";

export type Profile = {
  id: string;
  plan: Plan;
  reports_used_this_month: number;
  usage_month: string; // "YYYY-MM"
};

function currentUsageMonth() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

export async function getOrInitProfile() {
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Not authenticated");

  // 1) Fetch profile
  let { data: profile, error } = await supabase
    .from("profiles")
    .select("id, plan, reports_used_this_month, usage_month")
    .eq("id", user.id)
    .maybeSingle();

  // 2) If missing (edge case), create it
  if (!profile) {
    const { data: inserted, error: insertError } = await supabase
      .from("profiles")
      .insert({ id: user.id })
      .select("id, plan, reports_used_this_month, usage_month")
      .single();

    if (insertError) throw insertError;
    profile = inserted as Profile;
  } else if (error) {
    throw error;
  }

  // 3) Monthly reset if needed
  const month = currentUsageMonth();
  if (profile.usage_month !== month) {
    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({ reports_used_this_month: 0, usage_month: month })
      .eq("id", user.id)
      .select("id, plan, reports_used_this_month, usage_month")
      .single();

    if (updateError) throw updateError;
    profile = updated as Profile;
  }

  return { supabase, user, profile };
}

export async function incrementUsageBy1(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("increment_reports_used", { p_user_id: userId });

  if (error) throw error;
  return data;
}
