import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, trial_ends_at")
      .eq("id", user.id)
      .maybeSingle();
    const plan = (profile as any)?.plan ?? "free";
    if (plan === "free") {
      return NextResponse.json(
        { ok: false, error: "Upgrade to Pro to share links" },
        { status: 402 }
      );
    }

    // Try to read existing share token
    const { data: existing, error: existingError } = await supabase
      .from("reports")
      .select("id, shared_link_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle<{ id: string; shared_link_id: string | null }>();

    if (existingError || !existing) {
      return NextResponse.json(
        { ok: false, error: existingError?.message || "Report not found" },
        { status: 404 }
      );
    }

    let token = existing.shared_link_id;
    if (!token) {
      token = crypto.randomUUID();
      const { error: updErr } = await supabase
        .from("reports")
        .update({ shared_link_id: token })
        .eq("id", id)
        .eq("user_id", user.id);

      if (updErr) {
        return NextResponse.json(
          { ok: false, error: updErr.message },
          { status: 500 }
        );
      }
    }

    const shareUrl = `${getSiteUrl()}/share/${token}`;
    return NextResponse.json({ ok: true, shareUrl });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
