"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/analytics";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

export async function loginAction(formData: FormData) {
  const email = str(formData, "email");
  const password = str(formData, "password");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export async function signupAction(formData: FormData) {
  const email = str(formData, "email");
  const password = str(formData, "password");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);

  if (data.user?.id) {
    const admin = createAdminClient();
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
      .eq("id", data.user.id);
    await logEvent(data.user.id, "trial_started");
  }

  redirect("/onboarding");
}

export async function oauthAction(formData: FormData) {
  const provider = str(formData, "provider") as "google";
  const supabase = await createClient();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error || !data?.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message || "OAuth error")}`);
  }

  redirect(data.url);
}

export async function resetPasswordAction(formData: FormData) {
  const email = str(formData, "email");
  const supabase = await createClient();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/update-password`,
  });

  if (error) {
    redirect(`/reset?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/reset?success=1");
}
