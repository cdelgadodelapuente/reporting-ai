import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";
import { JiraConnectForm } from "@/components/JiraConnectForm";
import { BillingActions } from "@/components/BillingActions";
import TrialBanner from "@/components/TrialBanner";
import TrialEndedModal from "@/components/TrialEndedModal";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { upgraded?: string };
}) {
  const supabase = await createClient();

  // 1) Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: onboardingProfile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if ((onboardingProfile as any)?.onboarding_completed === false) {
    redirect("/onboarding");
  }

  // 2) Jira integration (if any)
  const { data: integration, error: integrationError } = await supabase
    .from("integrations")
    .select("config")
    .eq("user_id", user.id)
    .eq("provider", "jira")
    .maybeSingle();

  const baseUrl = (integration as any)?.config?.baseUrl ?? "";
  const email = (integration as any)?.config?.email ?? "";
  const isConnected = Boolean(integration);

  const { data: usageProfile } = await supabase
    .from("profiles")
    .select(
      "plan, reports_this_month, reports_month_reset_date, trial_started_at, trial_ends_at, stripe_subscription_id"
    )
    .eq("id", user.id)
    .maybeSingle();

  const now = new Date();
  let plan = (usageProfile as any)?.plan ?? "free";
  const trialEndsAt = (usageProfile as any)?.trial_ends_at as string | null;
  const trialStartedAt = (usageProfile as any)?.trial_started_at as string | null;
  const used = (usageProfile as any)?.reports_this_month ?? 0;
  const limit = plan === "free" ? 3 : null;
  const monthReset = (usageProfile as any)?.reports_month_reset_date as string | null;

  const trialEnded = plan === "trial" && trialEndsAt && new Date(trialEndsAt) < now;
  if (trialEnded) {
    await supabase
      .from("profiles")
      .update({ plan: "free", reports_this_month: 0 })
      .eq("id", user.id);
    plan = "free";
  }

  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: weekReports } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", weekAgo);
  const reportsThisWeek = weekReports || 0;
  const hoursSaved = reportsThisWeek * 0.5;

  const nextResetDate = (() => {
    const d = monthReset ? new Date(monthReset) : new Date(now.getFullYear(), now.getMonth(), 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return next.toLocaleDateString();
  })();

  // 3) Recent reports (last 10)
  let reportsQuery = supabase
    .from("reports")
    .select("id, audience, created_at, metadata")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);
  if (plan === "free") {
    reportsQuery = reportsQuery.gte("created_at", weekAgo);
  }
  const { data: reports, error: reportsError } = await reportsQuery;

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/dashboard">
            <img src="/relay-logo.png" alt="Relay" className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="text-gray-900">Dashboard</span>
            <Link href="/reports" className="hover:text-black">
              Reports
            </Link>
            <Link href="/settings" className="hover:text-black">
              Settings
            </Link>
            <LogoutButton />
          </div>
        </div>

        {searchParams?.upgraded === "true" && (
          <div className="card border border-emerald-200 bg-emerald-50">
            <div className="text-sm font-semibold text-emerald-900">
              🎉 Welcome to Relay Pro!
            </div>
            <div className="text-sm text-emerald-800">
              You now have unlimited reports, full editing, share links, and unlimited history.
            </div>
            <div className="mt-3">
              <Link href="/reports" className="btn-primary inline-flex items-center justify-center">
                Start generating →
              </Link>
            </div>
          </div>
        )}

        {plan === "trial" && trialEndsAt && (
          <TrialBanner
            daysLeft={Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - now.getTime()) / 86400000))}
            reports={reportsThisWeek}
            hoursSaved={hoursSaved}
            showUrgent={
              Math.ceil((new Date(trialEndsAt).getTime() - now.getTime()) / 86400000) <= 4
            }
          />
        )}
        <TrialEndedModal show={Boolean(trialEnded)} />

        <div className="card">
          <div className="text-sm font-semibold text-gray-900">🎯 Generate New Report</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <select className="input">
              <option>Project</option>
            </select>
            <select className="input">
              <option>Sprint</option>
            </select>
            <select className="input">
              <option>Audience</option>
            </select>
          </div>
          <div className="mt-4">
            <Link href="/reports" className="btn-primary inline-flex items-center justify-center">
              Generate report →
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">📊 Recent Reports</div>
              <div className="text-sm text-gray-600">Your last generated reports.</div>
            </div>
            <Link href="/reports" className="text-sm text-gray-700 hover:underline">
              See all reports →
            </Link>
          </div>

          {!reports || reports.length === 0 ? (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              📝 No reports yet. Generate your first report to see it here.
              {plan === "trial" && (
                <div className="mt-2 text-sm text-gray-600">
                  You have 14 days of Pro access to try everything.
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {reports.map((r: any) => {
                const period = r?.metadata?.periodLabel ?? "Report";
                return (
                  <div
                    key={r.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {period} — {r.audience}
                        </div>
                        <div className="text-xs text-gray-500">
                          Generated {new Date(r.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/reports/${r.id}`}
                          className="text-sm text-gray-700 hover:underline"
                        >
                          View
                        </Link>
                        <span className="text-gray-300">|</span>
                        <Link
                          href={`/reports/${r.id}`}
                          className="text-sm text-gray-700 hover:underline"
                        >
                          Share
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
              {plan === "free" && (
                <div className="text-xs text-gray-500">
                  Showing last 7 days only. Upgrade to Pro to see full history.
                </div>
              )}
            </div>
          )}

          {reportsError && (
            <p className="text-sm text-red-600">
              DB error (reports): {reportsError.message}
            </p>
          )}
        </div>

        <div className="card">
          <div className="text-sm font-semibold text-gray-900">📈 Usage This Month</div>
          {plan === "trial" ? (
            <>
              <div className="mt-2 text-sm text-gray-600">
                Pro trial active. Unlimited reports until {trialEndsAt ? new Date(trialEndsAt).toLocaleDateString() : "trial end"}.
              </div>
              <div className="mt-2 text-sm text-gray-600">
                You&apos;ve generated {reportsThisWeek} reports and saved ~{hoursSaved.toFixed(1)} hours.
              </div>
              <div className="mt-4">
                <BillingActions plan={"free"} />
              </div>
            </>
          ) : plan === "free" ? (
            <>
              <div className="mt-2 text-sm text-gray-600">
                {used} of {limit} reports used. You have {Math.max(0, limit - used)} report remaining this month.
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-[#f59e0b]"
                  style={{
                    width: `${Math.min(100, Math.round((used / 3) * 100))}%`,
                  }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500">Resets on {nextResetDate}.</div>
              <div className="mt-4">
                <BillingActions plan={plan} />
              </div>
            </>
          ) : (
            <>
              <div className="mt-2 text-sm text-gray-600">
                {reportsThisWeek} reports generated. Saving you ~{hoursSaved.toFixed(1)} hours.
              </div>
              <div className="mt-4">
                <BillingActions plan={"pro"} />
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div className="text-sm font-semibold text-gray-900">⚙️ Connected Integrations</div>
          <div className="mt-2 text-sm text-gray-600">
            {isConnected ? `✓ Jira (${baseUrl})` : "Jira not connected yet."}
          </div>
          <div className="mt-4">
            <JiraConnectForm initialBaseUrl={baseUrl} initialEmail={email} />
          </div>
          {integrationError && (
            <p className="text-sm text-red-600">
              DB error (integrations): {integrationError.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
