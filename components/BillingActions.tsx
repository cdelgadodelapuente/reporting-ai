"use client";

import { useState } from "react";

type Props = {
  plan: "free" | "pro";
};

export function BillingActions({ plan }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/create-checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (e: any) {
      setError(e.message || "Checkout failed");
      setLoading(false);
    }
  };

  const openPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Portal failed");
      window.location.href = data.url;
    } catch (e: any) {
      setError(e.message || "Portal failed");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {plan === "free" ? (
        <button onClick={startCheckout} disabled={loading} className="btn-primary w-full">
          {loading ? "Redirecting..." : "Upgrade to Pro"}
        </button>
      ) : (
        <button onClick={openPortal} disabled={loading} className="btn-secondary w-full">
          {loading ? "Opening..." : "Manage billing"}
        </button>
      )}
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}
