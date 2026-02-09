"use client";

import { useState } from "react";

type Props = {
  show: boolean;
};

export default function TrialEndedModal({ show }: Props) {
  const [open, setOpen] = useState(show);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-6">
      <div className="card w-full max-w-md space-y-4">
        <div className="text-lg font-semibold text-gray-900">Your Pro trial has ended</div>
        <div className="text-sm text-gray-700">
          You&apos;re now on the Free plan:
        </div>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>✓ 3 reports per month</li>
          <li>✓ 7 days of history</li>
        </ul>
        <div className="text-sm text-gray-700">
          Want to keep unlimited reports?
        </div>
        <div className="flex gap-2">
          <a href="/pricing" className="btn-primary">
            Upgrade to Pro (€29/month) →
          </a>
          <button className="btn-secondary" onClick={() => setOpen(false)}>
            Stay on Free
          </button>
        </div>
      </div>
    </div>
  );
}

