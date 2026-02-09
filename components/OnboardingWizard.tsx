"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState("");
  const [email, setEmail] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [showTokenHelp, setShowTokenHelp] = useState(false);
  const [generating, setGenerating] = useState(false);

  const completeOnboarding = async () => {
    setSaving(true);
    try {
      await fetch("/api/onboarding/complete", { method: "POST" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-8">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className={step >= 1 ? "text-blue-500" : ""}>●</span>
          <span className={step >= 2 ? "text-blue-500" : ""}>●</span>
          <span className={step >= 3 ? "text-blue-500" : ""}>●</span>
        </div>

        {step === 1 && (
          <div className="mt-6 space-y-4">
            <div className="text-2xl font-bold text-gray-900">
              Welcome to Relay! 👋
            </div>
            <div className="text-sm text-gray-600">
              You have 14 days of Pro access to try everything.
            </div>
            <div className="text-sm text-gray-600">
              Let&apos;s get your first report generated. Takes about 2 minutes.
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <div>1. Connect your Jira (60 seconds)</div>
              <div>2. Generate your first report (30 seconds)</div>
            </div>
            <button onClick={() => setStep(2)} className="btn-primary mt-4 w-full">
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-4">
            <div className="text-2xl font-bold text-gray-900">Connect Jira</div>
            <div className="text-sm text-gray-600">
              We need access to read your sprint data. (We never write or modify anything)
            </div>
            <div className="text-sm text-gray-700">
              Jira URL
              <input
                className="input mt-2 w-full"
                placeholder="https://yourcompany.atlassian.net"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              <div className="mt-1 text-xs text-gray-500">
                Example: https://acme.atlassian.net
              </div>
            </div>
            <div className="text-sm text-gray-700">
              API Token
              <input
                className="input mt-2 w-full"
                placeholder="Enter token here"
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
              />
              <input
                className="input mt-2 w-full"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowTokenHelp(true)}
                className="mt-1 text-xs text-blue-600 hover:underline"
              >
                How do I get this? →
              </button>
            </div>
            {testStatus && <div className="text-sm">{testStatus}</div>}
            <button
              onClick={async () => {
                setTesting(true);
                setTestStatus(null);
                try {
                  const res = await fetch("/api/integrations/jira/test", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ baseUrl, email, apiToken }),
                  });
                  const data = await res.json();
                  if (!res.ok || !data.ok) {
                    setTestStatus(`❌ ${data.error || "Connection failed"}`);
                  } else {
                    setTestStatus(`✓ Connected successfully as ${data.displayName}`);
                  }
                } catch (e: any) {
                  setTestStatus(`❌ ${e.message || "Connection failed"}`);
                } finally {
                  setTesting(false);
                }
              }}
              className="btn-primary w-full"
              disabled={testing}
            >
              {testing ? "Testing..." : "Test connection"}
            </button>
            <button
              onClick={async () => {
                if (!testStatus?.startsWith("✓")) return;
                await fetch("/api/integrations/jira/save", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ baseUrl, email, apiToken }),
                });
                setStep(3);
              }}
              className="btn-secondary w-full"
              disabled={!testStatus?.startsWith("✓")}
            >
              Continue to generate report →
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 space-y-4">
            <div className="text-2xl font-bold text-gray-900">
              Generate your first report
            </div>
            <div className="text-sm text-gray-600">Select a sprint to report on:</div>

            <div className="grid gap-3 sm:grid-cols-2">
              <select className="input">
                <option>Project</option>
              </select>
              <select className="input">
                <option>Sprint</option>
              </select>
            </div>

            <div className="text-sm text-gray-700">Who&apos;s this report for?</div>
            <div className="space-y-2 text-sm text-gray-700">
              <label className="flex items-start gap-2">
                <input type="radio" name="audience" />
                <span>
                  My CEO/executives
                  <div className="text-xs text-gray-500">
                    High-level summary, business impact, no tech jargon
                  </div>
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input type="radio" name="audience" />
                <span>
                  My engineering team
                  <div className="text-xs text-gray-500">
                    Technical details, architecture decisions, code quality
                  </div>
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input type="radio" name="audience" />
                <span>
                  External client
                  <div className="text-xs text-gray-500">
                    Progress updates, timeline, next milestones
                  </div>
                </span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={async () => {
                  setGenerating(true);
                  await new Promise((r) => setTimeout(r, 1200));
                  await completeOnboarding();
                  router.push("/reports");
                }}
                className="btn-primary inline-flex items-center justify-center"
              >
                {generating ? "Generating..." : "Generate report →"}
              </button>
              <button onClick={() => setStep(1)} className="btn-secondary">
                Back
              </button>
            </div>
          </div>
        )}

        {showTokenHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div className="card w-full max-w-md space-y-4">
              <div className="text-lg font-semibold text-gray-900">
                Getting your Jira API token
              </div>
              <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
                <li>Go to Atlassian Account Settings</li>
                <li>Click “Security”</li>
                <li>Click “Create and manage API tokens”</li>
                <li>Click “Create API token”</li>
                <li>Name it “Reporting Tool”</li>
                <li>Copy the token</li>
              </ol>
              <a
                className="text-sm text-blue-600 hover:underline"
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noreferrer"
              >
                Open Atlassian token page
              </a>
              <div className="flex justify-end gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => setShowTokenHelp(false)}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        {generating && (
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
    </div>
  );
}
