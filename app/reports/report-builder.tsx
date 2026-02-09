"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { JiraBoardPicker } from "@/components/JiraBoardPicker";
import { ShareButton } from "@/components/ShareButton";

type Issue = {
  key: string;
  summary: string;
  status: string;
  assignee: string | null;
};

type Sprint = {
  id: number;
  name: string;
};

type Audience = "executive" | "technical" | "client";

const DEMO_ISSUES: Issue[] = [
  { key: "DEMO-101", summary: "Launch new checkout flow", status: "Done", assignee: "Ana" },
  { key: "DEMO-102", summary: "Fix payment retries on mobile", status: "Done", assignee: "Luis" },
  { key: "DEMO-103", summary: "Reduce API latency with caching", status: "In Progress", assignee: "Sofía" },
  { key: "DEMO-104", summary: "GDPR review for EU launch", status: "Blocked", assignee: "Marco" },
  { key: "DEMO-105", summary: "Analytics dashboard beta", status: "In Progress", assignee: "Rita" },
  { key: "DEMO-106", summary: "Resolve critical auth bug", status: "Done", assignee: "Pablo" },
];

export default function ReportBuilder() {
  const searchParams = useSearchParams();
  const demoMode = searchParams.get("demo") === "1";

  const [boardId, setBoardId] = useState<number | null>(null);

  const [mode, setMode] = useState<"sprint" | "period" | null>(null);

  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<number | null>(null);

  const [days, setDays] = useState(7);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);

  const [audience, setAudience] = useState<Audience>("executive");
  const [report, setReport] = useState("");
  const [reportId, setReportId] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{
    plan: string;
    used: number;
    limit: number | null;
    resetDate?: string | null;
  } | null>(null);
  const [plan, setPlan] = useState<string>("free");
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitResetDate, setLimitResetDate] = useState<string | null>(null);

  useEffect(() => {
    if (!demoMode) return;
    setMode("period");
    setIssues(DEMO_ISSUES);
    setReport("");
  }, [demoMode]);

  useEffect(() => {
    const loadProfile = async () => {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (res.ok && data.ok) {
        setPlan(data.profile.plan || "free");
        setTrialEndsAt(data.profile.trial_ends_at || null);
      }
    };
    loadProfile();
  }, []);

  // Detect if board supports sprints
  const detectMode = async (id: number) => {
    setError(null);
    setBoardId(id);
    setIssues([]);
    setReport("");

    const res = await fetch(`/api/jira/boards/${id}/sprints`);
    const data = await res.json();

    if (data.ok && Array.isArray(data.sprints) && data.sprints.length > 0) {
      setMode("sprint");
      setSprints(data.sprints);
    } else {
      setMode("period");
      setSprints([]);
      setSelectedSprint(null);
    }
  };

  const loadSprintIssues = async () => {
    if (!selectedSprint) return;
    setError(null);
    setLoadingIssues(true);
    setReport("");

    const res = await fetch(`/api/jira/sprints/${selectedSprint}/issues`);
    const data = await res.json();

    if (!data.ok) setError(data.error || "Failed to load sprint issues");
    else setIssues(data.issues || []);

    setLoadingIssues(false);
  };

  const loadPeriodIssues = async () => {
    setError(null);
    setLoadingIssues(true);
    setReport("");

    const res = await fetch(`/api/jira/issues?days=${days}`);
    const data = await res.json();

    if (!data.ok) setError(data.error || "Failed to load issues");
    else setIssues(data.issues || []);

    setLoadingIssues(false);
  };

  const periodLabel =
    mode === "sprint"
      ? selectedSprint
        ? `Sprint ${selectedSprint}`
        : "Sprint"
      : `Last ${days} days`;

  const generateReport = async () => {
    if (issues.length === 0) {
      setError("Load issues first.");
      return;
    }

    setError(null);
    setLoadingReport(true);
    setReportId(null);

    const res = await fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audience,
        periodLabel,
        issues,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      if (data.code === "LIMIT_REACHED") {
        setError(data.message || "Monthly limit reached.");
        setUsage(data.usage || null);
        setLimitResetDate(data.usage?.resetDate || null);
        setShowLimitModal(true);
      } else {
        setError(data.error || "Failed to generate report");
      }
      setLoadingReport(false);
      return;
    }

    setReport(data.report || "");
    setReportId(data.reportId || null);
    setUsage(data.usage || null);
    setLoadingReport(false);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(report);
  };

  const daysUntilReset = (() => {
    if (!limitResetDate) return null;
    const reset = new Date(limitResetDate);
    const diff = Math.ceil((reset.getTime() - Date.now()) / 86400000);
    return Number.isFinite(diff) ? Math.max(0, diff) : null;
  })();

  return (
    <div className="space-y-6">
      {demoMode ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Demo mode is on. We loaded sample issues so you can generate a report
          without Jira.
        </div>
      ) : (
        <JiraBoardPicker onSelect={detectMode} />
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 space-y-2">
          <div>❌ {error}</div>
          {usage?.plan === "free" && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-red-700">
                {usage.used}/{usage.limit} reports used this month.
              </span>
              <a
                href="/pricing"
                className="text-xs font-medium text-red-700 underline"
              >
                Upgrade for unlimited
              </a>
            </div>
          )}
        </div>
      )}

      {mode === "sprint" && (
        <div className="card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              onChange={(e) => setSelectedSprint(Number(e.target.value))}
              className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Select sprint
              </option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              onClick={loadSprintIssues}
              disabled={loadingIssues || !selectedSprint}
              className="btn-primary"
            >
              {loadingIssues ? "Loading..." : "Load sprint issues"}
            </button>
          </div>
        </div>
      )}

      {mode === "period" && (
        <div className="card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm"
            >
              <option value={3}>Last 3 days</option>
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
            </select>

            <button
              onClick={loadPeriodIssues}
              disabled={loadingIssues}
              className="btn-primary"
            >
              {loadingIssues ? "Loading..." : "Load issues"}
            </button>
          </div>
        </div>
      )}

      {issues.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">
              Issues loaded: {issues.length}
            </h3>

            <div className="flex items-center gap-2">
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as Audience)}
                className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm"
              >
                <option value="executive">Executive</option>
                <option value="technical">Technical</option>
                <option value="client">Client</option>
              </select>

              <button
                onClick={generateReport}
                disabled={loadingReport}
                className="btn-primary"
              >
                {loadingReport ? "Generating..." : "Generate report"}
              </button>
            </div>
          </div>

          <ul className="mt-3 space-y-1 text-sm text-zinc-700">
            {issues.slice(0, 8).map((i) => (
              <li key={i.key}>
                <b>{i.key}</b> — {i.summary} ({i.status})
              </li>
            ))}
            {issues.length > 8 && (
              <li className="text-zinc-500">…and {issues.length - 8} more</li>
            )}
          </ul>
          {usage?.plan === "free" && usage.limit !== null && (
            <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
              Usage: {usage.used}/{usage.limit} reports this month.
            </div>
          )}
        </div>
      )}

      {report && (
        <div className="card p-4 space-y-3">
          {plan === "trial" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              ✅ Your first report is ready! You&apos;re on Pro trial
              {trialEndsAt && (
                <> ({Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))} days left)</>
              )}
              .
              <div className="mt-1">
                Enjoying unlimited reports? Upgrade anytime to keep access.
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">
              Report
            </h3>

            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="btn-secondary"
              >
                Copy
              </button>
              {reportId && (
                <ShareButton
                  reportId={reportId}
                  disabled={plan === "free"}
                  reason="Upgrade to Pro to share links"
                />
              )}
            </div>
          </div>

          <textarea
            value={report}
            onChange={(e) => setReport(e.target.value)}
            className="min-h-[260px] w-full rounded-md border border-zinc-200 bg-white p-3 text-sm outline-none"
            readOnly={plan === "free"}
          />
          {plan === "free" && (
            <div className="text-xs text-amber-700">
              Upgrade to Pro to edit reports before sending.
            </div>
          )}
        </div>
      )}

      {showLimitModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-6">
          <div className="card w-full max-w-md space-y-4">
            <div className="text-lg font-semibold text-gray-900">
              ⚠️ You've used all 3 free reports this month
            </div>
            <div className="text-sm text-gray-700">
              You can wait until {limitResetDate || "next month"}
              {daysUntilReset !== null ? ` (${daysUntilReset} days)` : ""} or upgrade to Pro now for unlimited reports.
            </div>
            <div className="text-sm text-gray-700">
              With Pro you also get:
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ Unlimited reports (no waiting)</li>
              <li>✓ Edit reports before sending</li>
              <li>✓ Share public links</li>
              <li>✓ Unlimited history</li>
              <li>✓ Priority support</li>
            </ul>
            <div className="text-sm text-gray-700">
              💰 €29/month = less than €1 per report vs ~€600/month your time is worth
            </div>
            <div className="flex gap-2">
              <a href="/pricing" className="btn-primary">
                Upgrade to Pro (€29/month) →
              </a>
              <button className="btn-secondary" onClick={() => setShowLimitModal(false)}>
                Maybe later
              </button>
            </div>
            <div className="text-xs text-gray-500">14-day money-back guarantee</div>
          </div>
        </div>
      )}

      {loadingReport && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-6">
          <div className="card w-full max-w-md space-y-4">
            <div className="text-lg font-semibold text-gray-900">
              ✨ Generating your report...
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <div>✓ Reading Jira data...</div>
              <div>✓ Analyzing sprint...</div>
              <div>⏳ Writing narrative...</div>
              <div>○ Formatting output...</div>
            </div>
            <div className="text-xs text-gray-500">
              This usually takes 15–20 seconds
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
