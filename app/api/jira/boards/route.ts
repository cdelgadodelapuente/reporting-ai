import { NextResponse } from "next/server";
import { getJiraIntegrationOrThrow } from "@/lib/jira/getJiraIntegration";

export async function GET() {
  try {
    const { baseUrl, email, apiToken } =
      await getJiraIntegrationOrThrow();

    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

    const url = `${baseUrl}/rest/agile/1.0/board?maxResults=50`;

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
        { ok: false, error: `Jira boards failed (${res.status}). ${text}` },
        { status: 400 }
      );
    }

    const data = await res.json();

    const boards = (data.values || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      type: b.type,
    }));

    return NextResponse.json({ ok: true, boards });
  } catch (e: any) {
    const msg = e?.message || "Unknown error";
    const status = msg === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
