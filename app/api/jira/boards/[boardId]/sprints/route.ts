import { NextResponse } from "next/server";
import { getJiraIntegrationOrThrow } from "@/lib/jira/getJiraIntegration";

export async function GET(
  _req: Request,
  context: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await context.params; // ✅ IMPORTANT: await params

  console.log("PARAMS (unwrapped) →", { boardId });

  if (!boardId) {
    return NextResponse.json({ ok: false, error: "boardId missing" }, { status: 400 });
  }

  try {
    const { baseUrl, email, apiToken } = await getJiraIntegrationOrThrow();
    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

    const url = `${baseUrl}/rest/agile/1.0/board/${boardId}/sprint?state=active,future,closed&maxResults=50`;

    const res = await fetch(url, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: `Jira sprints failed (${res.status}). ${text}` },
        { status: 400 }
      );
    }

    const data = await res.json();
    const sprints = (data.values || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      state: s.state,
      startDate: s.startDate || null,
      endDate: s.endDate || null,
    }));

    return NextResponse.json({ ok: true, sprints });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
