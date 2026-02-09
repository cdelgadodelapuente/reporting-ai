import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildPrompt } from "@/lib/prompts";
import { formatSprintData } from "@/lib/jira/formatSprintData";
import { logEvent } from "@/lib/analytics";
import { preservesNumbers } from "@/lib/score/validateReport";
import { buildFacts, formatFactsBlock } from "@/lib/reporting/facts.mjs";
import { runReportPipeline } from "@/lib/reporting/pipeline.mjs";

type Audience = "executive" | "technical" | "client";
type Plan = "free" | "pro" | "trial";

type ProfileRow = {
  id: string;
  plan: Plan;
  reports_this_month: number;
  reports_month_reset_date: string | null; // "YYYY-MM-01"
  trial_ends_at: string | null;
};

const MODEL =
  process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-5-20250929";

const FREE_LIMIT = 3;

function currentMonthStart() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

async function getProfileOrFail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, plan, reports_this_month, reports_month_reset_date, trial_ends_at")
    .eq("id", userId)
    .single<ProfileRow>();

  if (error) {
    throw new Error(`DB profile load failed: ${error.message}`);
  }

  return data;
}

async function resetProfileIfNewMonth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: ProfileRow,
  monthStart: string
): Promise<ProfileRow> {
  if (profile.reports_month_reset_date === monthStart) return profile;

  const { data, error } = await supabase
    .from("profiles")
    .update({ reports_this_month: 0, reports_month_reset_date: monthStart })
    .eq("id", profile.id)
    .select("id, plan, reports_this_month, reports_month_reset_date, trial_ends_at")
    .single<ProfileRow>();

  if (error) throw new Error(`DB usage reset failed: ${error.message}`);
  return data;
}

async function incrementUsageIfFree(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: ProfileRow
): Promise<number> {
  if (profile.plan !== "free") return profile.reports_this_month;

  const { data, error } = await supabase
    .from("profiles")
    .update({ reports_this_month: profile.reports_this_month + 1 })
    .eq("id", profile.id)
    .select("reports_this_month")
    .single<{ reports_this_month: number }>();

  if (error) {
    // No tiramos el request: el report ya se generó y se guardó.
    console.error("usage increment failed:", error);
    return profile.reports_this_month;
  }

  return data.reports_this_month;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const audience = body.audience as Audience;
    const periodLabel = body.periodLabel as string;
    const issues = body.issues as Array<{
      key: string;
      summary?: string;
      status?: string;
      assignee?: string | null;
      type?: string;
      updated?: string;
    }>;

    // -----------------------------
    // Validation
    // -----------------------------
    if (!audience || !["executive", "technical", "client"].includes(audience)) {
      return NextResponse.json(
        { ok: false, error: "Invalid audience" },
        { status: 400 }
      );
    }

    if (!periodLabel || typeof periodLabel !== "string") {
      return NextResponse.json(
        { ok: false, error: "Invalid periodLabel" },
        { status: 400 }
      );
    }

    if (!Array.isArray(issues)) {
      return NextResponse.json(
        { ok: false, error: "Invalid issues array" },
        { status: 400 }
      );
    }

    // -----------------------------
    // Auth (Supabase)
    // -----------------------------
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json(
        { ok: false, error: `Auth error: ${userError.message}` },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // -----------------------------
    // Usage / Plan check (profiles)
    // -----------------------------
    const monthStart = currentMonthStart();

    let profile: ProfileRow;
    try {
      profile = await getProfileOrFail(supabase, user.id);
    } catch (e: any) {
      return NextResponse.json(
        {
          ok: false,
          code: "PROFILE_MISSING",
          error:
            'Profile missing. Ensure Supabase trigger creates "profiles" row on signup.',
          details: e?.message ?? String(e),
        },
        { status: 500 }
      );
    }

    profile = await resetProfileIfNewMonth(supabase, profile, monthStart);

    if (profile.plan === "trial" && profile.trial_ends_at) {
      const ends = new Date(profile.trial_ends_at);
      if (Date.now() > ends.getTime()) {
        const { data, error } = await supabase
          .from("profiles")
          .update({ plan: "free", reports_this_month: 0, reports_month_reset_date: monthStart })
          .eq("id", profile.id)
          .select("id, plan, reports_this_month, reports_month_reset_date, trial_ends_at")
          .single<ProfileRow>();
        if (!error && data) profile = data;
      }
    }

    if (profile.plan === "free" && profile.reports_this_month >= FREE_LIMIT) {
        const nextResetDate = (() => {
          const d = new Date(monthStart);
          const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
          return next.toISOString().slice(0, 10);
        })();
        await logEvent(profile.id, "free_limit_hit", { plan: profile.plan });
        return NextResponse.json(
          {
            ok: false,
            code: "LIMIT_REACHED",
            message: `Monthly limit reached. You've used all ${FREE_LIMIT} free reports this month.`,
            usage: {
              plan: profile.plan,
              used: profile.reports_this_month,
              limit: FREE_LIMIT,
              monthStart,
              resetDate: nextResetDate,
            },
          },
          { status: 402 }
        );
      }
      

    // -----------------------------
    // Prompt (structured, audience-specific)
    // -----------------------------
    const formattedData = formatSprintData(issues);
    const facts = buildFacts(issues, audience);
    const factsBlock = formatFactsBlock(facts);

    // -----------------------------
    // Anthropic
    // -----------------------------
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing ANTHROPIC_API_KEY" },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const pipeline = await runReportPipeline({
      scenarioId: body.scenario_id ?? null,
      audience,
      formattedData,
      facts,
      factsBlock,
      periodLabel,
      buildPrompt,
      anthropic,
      model: MODEL,
      logger: (entry: any) => {
        if (entry?.promptType) {
          console.log("[pipeline]", entry);
        }
      },
    });

    if (!pipeline.ok) {
      await logEvent(user.id, "report_generated", { plan: profile.plan, ok: false });
      return NextResponse.json(
        { ok: false, error: pipeline.errorText },
        { status: 422 }
      );
    }

    const finalReport = pipeline.finalReport;
    const draftReport = pipeline.draftReport || finalReport;

    if (!preservesNumbers(draftReport, finalReport)) {
      console.warn("number preservation check failed");
    }

    // -----------------------------
    // Save report
    // -----------------------------
    const { data: saved, error: saveError } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        audience,
        content: finalReport,
        metadata: {
          periodLabel,
          issuesCount: issues.length,
          model: MODEL,
        },
      })
      .select("id")
      .single<{ id: string }>();

    if (saveError) {
      return NextResponse.json(
        { ok: false, error: `DB save failed: ${saveError.message}` },
        { status: 500 }
      );
    }

    // -----------------------------
    // Increment usage (free only)
    // -----------------------------
    const newUsed = await incrementUsageIfFree(supabase, profile);
    await logEvent(user.id, "report_generated", { plan: profile.plan });

    const nextResetDate = (() => {
      const d = new Date(monthStart);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      return next.toISOString().slice(0, 10);
    })();

    return NextResponse.json({
      ok: true,
      model: MODEL,
      reportId: saved.id,
      report: finalReport,
      usage: {
        plan: profile.plan,
        used: newUsed,
        limit: profile.plan === "free" ? FREE_LIMIT : null,
        monthStart,
        resetDate: nextResetDate,
      },
    });
  } catch (e: any) {
    const requestId = e?.response?.headers?.get?.("request-id") ?? null;
    console.error("generate-report error:", e);

    return NextResponse.json(
      {
        ok: false,
        error: e?.message ?? "Unknown error",
        request_id: requestId,
      },
      { status: 500 }
    );
  }
}
