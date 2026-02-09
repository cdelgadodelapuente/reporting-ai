import { NextResponse } from "next/server";
import { getJiraIntegrationOrThrow } from "@/lib/jira/getJiraIntegration";

export async function GET(
  _req: Request,
  context: { params: Promise<{ sprintId: string }> }
) {
  const { sprintId } = await context.params;

  try {
    const { baseUrl, email, apiToken } = await getJiraIntegrationOrThrow();
    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

    const url = `${baseUrl}/rest/agile/1.0/sprint/${sprintId}/issue?maxResults=100`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();

    const issues = (data.issues || []).map((i: any) => ({
      key: i.key,
      summary: i.fields?.summary,
      status: i.fields?.status?.name,
      assignee: i.fields?.assignee?.displayName || null,
    }));

    return NextResponse.json({ ok: true, issues });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 400 }
    );
  }
}
