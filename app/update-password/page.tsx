"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

export default function UpdatePasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);

    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).finally(() => {
        setReady(true);
      });
    } else {
      setReady(true);
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus(error.message);
      return;
    }
    setStatus("Password updated. You can log in now.");
  };

  return (
    <div className="min-h-screen landing-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md card">
        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Set new password</div>
          <h1 className="text-xl font-semibold text-zinc-900">Choose a new password</h1>
          <p className="text-sm text-zinc-600">
            This password will be used for future logins.
          </p>
        </div>

        {!ready ? (
          <p className="mt-6 text-sm text-zinc-600">Preparing secure session…</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <input
              type="password"
              className="input w-full"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            {status && (
              <p className="text-sm text-zinc-600">{status}</p>
            )}

            <button className="btn-primary w-full">
              Update password
            </button>

            <Link
              href="/login"
              className="block text-center text-sm text-zinc-700 hover:underline"
            >
              Back to login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
