import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

    const supabase = await createClient();
    const { data: userRes } = await supabase.auth.getUser();

    if (!userRes.user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // upsert by (user_id, provider) - vamos a hacerlo manual para MVP
    const { data: existing, error: selectErr } = await supabase
      .from("integrations")
      .select("id")
      .eq("user_id", userRes.user.id)
      .eq("provider", "jira")
      .maybeSingle();

    if (selectErr) {
      return NextResponse.json({ ok: false, error: selectErr.message }, { status: 500 });
    }

    const config = {
      baseUrl: cleanBaseUrl,
      email: cleanEmail,
      apiToken: cleanToken,
    };

    if (existing?.id) {
      const { error: updErr } = await supabase
        .from("integrations")
        .update({ config })
        .eq("id", existing.id);

      if (updErr) {
        return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, updated: true });
    }

    const { error: insErr } = await supabase.from("integrations").insert({
      user_id: userRes.user.id,
      provider: "jira",
      config,
    });

    if (insErr) {
      return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, created: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
