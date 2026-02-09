"use client";

import { useState } from "react";

export function ShareButton({
  reportId,
  disabled,
  reason,
}: {
  reportId: string;
  disabled?: boolean;
  reason?: string;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onShare = async () => {
    if (disabled) {
      setStatus(reason || "Upgrade to Pro to share links.");
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/reports/${reportId}/share`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to create share link");
      }
      await navigator.clipboard.writeText(data.shareUrl);
      setStatus("Link copied to clipboard");
    } catch (e: any) {
      setStatus(e.message || "Share failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onShare}
        disabled={loading || disabled}
        className="btn-secondary"
      >
        {loading ? "Creating..." : "Share link"}
      </button>
      {status && <span className="text-xs text-zinc-500">{status}</span>}
    </div>
  );
}
