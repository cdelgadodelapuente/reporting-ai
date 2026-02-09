import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/analytics";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=Missing code", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin)
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("plan, trial_started_at")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.plan) {
      const now = new Date();
      const ends = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);

      await admin
        .from("profiles")
        .update({
          plan: "trial",
          trial_started_at: now.toISOString(),
          trial_ends_at: ends.toISOString(),
          reports_this_month: 0,
          reports_month_reset_date: monthStart,
        })
        .eq("id", user.id);
      await logEvent(user.id, "trial_started");
    }
  }

  return NextResponse.redirect(new URL("/dashboard", url.origin));
}
