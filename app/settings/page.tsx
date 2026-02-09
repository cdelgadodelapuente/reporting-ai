import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BillingActions } from "@/components/BillingActions";
import Link from "next/link";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "plan, reports_this_month, reports_month_reset_date, trial_started_at, trial_ends_at"
    )
    .eq("id", user.id)
    .maybeSingle();

  const plan = (profile as any)?.plan ?? "free";
  const reports = (profile as any)?.reports_this_month ?? 0;
  const resetDate = (profile as any)?.reports_month_reset_date
    ? new Date((profile as any)?.reports_month_reset_date).toLocaleDateString()
    : "next month";
  const trialEnds = (profile as any)?.trial_ends_at
    ? new Date((profile as any)?.trial_ends_at).toLocaleDateString()
    : null;
  const { count: totalReports } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const reportCount = totalReports || 0;

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
        <Link href="/dashboard" className="text-sm text-gray-600 hover:underline">
          ← Back to dashboard
        </Link>
        <div className="card space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          {plan === "free" && (
            <div className="space-y-2 text-sm text-gray-700">
              <div>Plan: Free</div>
              <div>Reports this month: {reports} of 3 used</div>
              <div>Resets: {resetDate}</div>
              <BillingActions plan="free" />
            </div>
          )}
          {plan === "trial" && (
            <div className="space-y-2 text-sm text-gray-700">
              <div>Plan: Pro Trial</div>
              <div>Trial ends: {trialEnds}</div>
              <div>Reports generated: {reportCount} (unlimited during trial)</div>
              <BillingActions plan="free" />
            </div>
          )}
          {plan === "pro" && (
            <div className="space-y-2 text-sm text-gray-700">
              <div>Plan: Pro</div>
              <div>Billing: €29/month (or €290/year)</div>
              <BillingActions plan="pro" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
