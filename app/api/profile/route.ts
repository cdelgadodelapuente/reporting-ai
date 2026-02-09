import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("plan, trial_started_at, trial_ends_at, reports_this_month, reports_month_reset_date")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: error?.message || "Profile missing" }, { status: 400 });
  }

  if (data.plan === "trial" && data.trial_ends_at) {
    const ends = new Date(data.trial_ends_at);
    if (Date.now() > ends.getTime()) {
      await supabase
        .from("profiles")
        .update({ plan: "free", reports_this_month: 0 })
        .eq("id", user.id);
      data.plan = "free";
    }
  }

  return NextResponse.json({ ok: true, profile: data });
}
