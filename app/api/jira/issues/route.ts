import { NextResponse } from "next/server";
import { getJiraIntegrationOrThrow } from "@/lib/jira/getJiraIntegration";

function isoDateDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  try {
    const { baseUrl, email, apiToken } = await getJiraIntegrationOrThrow();
    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

    const { searchParams } = new URL(req.url);

    const days = Number(searchParams.get("days") || "7");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const start = from || isoDateDaysAgo(days);
    const end = to || new Date().toISOString().slice(0, 10);

    const jql = `updated >= "${start}" AND updated <= "${end}" ORDER BY updated DESC`;

    const fields = [
      "summary",
      "status",
      "assignee",
      "issuetype",
      "priority",
      "labels",
      "created",
      "updated",
      "project",
    ].join(",");

    // ✅ NUEVA API (Jira 2025)
    const url =
      `${baseUrl}/rest/api/3/search/jql` +
      `?jql=${encodeURIComponent(jql)}` +
      `&maxResults=100` +
      `&fields=${encodeURIComponent(fields)}`;

    console.log("JIRA SEARCH →", url);

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
        { ok: false, error: `Jira search failed (${res.status}). ${text}` },
        { status: 400 }
      );
    }

    const data = await res.json();

    const issues = (data.issues || []).map((i: any) => ({
      key: i.key,
      summary: i.fields?.summary,
      status: i.fields?.status?.name,
      assignee: i.fields?.assignee?.displayName || null,
      type: i.fields?.issuetype?.name,
      updated: i.fields?.updated,
    }));

    return NextResponse.json({
      ok: true,
      period: { start, end },
      count: issues.length,
      issues,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
