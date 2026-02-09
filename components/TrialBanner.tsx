"use client";

import { useState } from "react";

type Props = {
  daysLeft: number;
  reports: number;
  hoursSaved: number;
  showUrgent: boolean;
};

export default function TrialBanner({ daysLeft, reports, hoursSaved, showUrgent }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const title = showUrgent
    ? "⏰ Your Pro trial ends in 4 days"
    : `⏰ Pro trial: ${daysLeft} days remaining`;

  return (
    <div className="card border border-amber-200 bg-amber-50 flex flex-col gap-2">
      <div className="text-sm font-semibold text-amber-900">{title}</div>
      <div className="text-sm text-amber-800">
        You&apos;ve generated {reports} reports and saved ~{hoursSaved.toFixed(1)} hours this week.
      </div>
      <div className="flex gap-3">
        <a href="/pricing" className="btn-primary">
          Upgrade to Pro (€29/month) →
        </a>
        <button className="btn-secondary" onClick={() => setDismissed(true)}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

