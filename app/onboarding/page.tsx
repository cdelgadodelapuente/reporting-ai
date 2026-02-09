import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingWizard from "@/components/OnboardingWizard";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, plan, trial_started_at, trial_ends_at")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile?.plan) {
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
  }

  if ((profile as any)?.onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen landing-bg">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <OnboardingWizard />
      </div>
    </div>
  );
}
