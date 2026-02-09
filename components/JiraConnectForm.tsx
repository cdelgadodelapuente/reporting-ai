"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";


type Props = {
  initialBaseUrl?: string;
  initialEmail?: string;
};

export function JiraConnectForm({ initialBaseUrl = "", initialEmail = "" }: Props) {
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);
  const [email, setEmail] = useState(initialEmail);
  const [apiToken, setApiToken] = useState("");
  const router = useRouter();


  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setStatus(null);
  
    try {
      const res = await fetch("/api/integrations/jira/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, email, apiToken }),
      });
  
      const raw = await res.text();
      const contentType = res.headers.get("content-type") || "";
  
      const data = contentType.includes("application/json")
        ? JSON.parse(raw)
        : null;
  
      if (!data) {
        // HTML (404/redirect/error page)
        throw new Error(`Non-JSON response (${res.status}). Check API route exists and you're logged in.`);
      }
  
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Test failed");
      }
  
      setStatus(`✅ Connected as ${data.displayName}`);
    } catch (e: any) {
      setStatus(`❌ ${e.message}`);
    } finally {
      setTesting(false);
    }
  };
  

  const save = async () => {
    setSaving(true);
    setStatus(null);
  
    try {
      const res = await fetch("/api/integrations/jira/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, email, apiToken }),
      });
  
      const raw = await res.text();
      const contentType = res.headers.get("content-type") || "";
  
      const data = contentType.includes("application/json")
        ? JSON.parse(raw)
        : null;
  
      if (!data) {
        throw new Error(`Non-JSON response (${res.status}). Check API route exists and you're logged in.`);
      }
  
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Save failed");
      }
  
      setStatus("✅ Saved. Refresh dashboard to see connected status.");
      setApiToken("");

      router.refresh();
    } catch (e: any) {
      setStatus(`❌ ${e.message}`);
    } finally {
      setSaving(false);
    }
  };
  

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Connect Jira
        </h2>
        <p className="text-sm text-zinc-600">
          Jira Cloud: base URL + email + API token.
        </p>
      </div>

      <div className="space-y-3">
        <input
          className="input w-full"
          placeholder="https://your-domain.atlassian.net"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
        />
        <input
          className="input w-full"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input w-full"
          placeholder="API token"
          type="password"
          value={apiToken}
          onChange={(e) => setApiToken(e.target.value)}
        />
      </div>

      {status && <p className="text-sm">{status}</p>}

      <div className="flex gap-3">
        <button
          onClick={testConnection}
          disabled={testing || !baseUrl || !email || !apiToken}
          className="btn-primary"
        >
          {testing ? "Testing..." : "Test connection"}
        </button>

        <button
          onClick={save}
          disabled={saving || !baseUrl || !email || !apiToken}
          className="btn-secondary"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
