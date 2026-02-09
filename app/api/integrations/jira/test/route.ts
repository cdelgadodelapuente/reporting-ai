import { NextResponse } from "next/server";
import { normalizeBaseUrl } from "@/lib/jira/normalizeBaseUrl";

export async function POST(req: Request) {
  try {
    const { baseUrl, email, apiToken } = await req.json();

    const cleanBaseUrl = normalizeBaseUrl(baseUrl);
    const cleanEmail = String(email || "").trim();
    const cleanToken = String(apiToken || "").trim();

    if (!cleanBaseUrl || !cleanEmail || !cleanToken) {
      return NextResponse.json(
        { ok: false, error: "Missing baseUrl/email/apiToken" },
        { status: 400 }
      );
    }

    const url = `${cleanBaseUrl}/rest/api/3/myself`;
    const auth = Buffer.from(`${cleanEmail}:${cleanToken}`).toString("base64");

    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: `Jira auth failed (${res.status}). ${text}` },
        { status: 401 }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      ok: true,
      displayName: data.displayName,
      accountId: data.accountId,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
