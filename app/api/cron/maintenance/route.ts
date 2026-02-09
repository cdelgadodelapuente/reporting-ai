import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/analytics";

export async function POST() {
  const admin = createAdminClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  // Expire trials
  const { data: expiredTrials } = await admin
    .from("profiles")
    .select("id")
    .eq("plan", "trial")
    .lt("trial_ends_at", now.toISOString());

  if (expiredTrials?.length) {
    await admin
      .from("profiles")
      .update({ plan: "free", reports_this_month: 0, reports_month_reset_date: monthStart })
      .eq("plan", "trial")
      .lt("trial_ends_at", now.toISOString());

    for (const p of expiredTrials) {
      await logEvent(p.id, "trial_expired");
    }
  }

  // Monthly reset for free users
  await admin
    .from("profiles")
    .update({ reports_this_month: 0, reports_month_reset_date: monthStart })
    .eq("plan", "free")
    .not("reports_month_reset_date", "eq", monthStart);

  return NextResponse.json({ ok: true });
}

