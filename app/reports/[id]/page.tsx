import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShareButton } from "@/components/ShareButton";

type Props = {
  params: {
    id: string;
  };
};

export default async function ReportDetailPage({ params }: Props) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: report, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !report) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, trial_ends_at")
    .eq("id", user.id)
    .maybeSingle();
  const plan = (profile as any)?.plan ?? "free";

  return (
    <div className="min-h-screen landing-bg">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <Link href="/reports" className="text-sm text-zinc-600 hover:underline">
          ← Back
        </Link>

        <div className="card space-y-3">
          <div className="text-xs text-zinc-500">Report</div>
          <h1 className="text-2xl font-semibold text-zinc-900">Report detail</h1>
          <div className="text-sm text-zinc-500">
            {new Date(report.created_at).toLocaleString()}
          </div>
          <ShareButton
            reportId={report.id}
            disabled={plan === "free"}
            reason="Upgrade to Pro to share links"
          />
        </div>

        <article className="card prose prose-zinc max-w-none whitespace-pre-wrap">
          {report.content}
        </article>
      </div>
    </div>
  );
}
