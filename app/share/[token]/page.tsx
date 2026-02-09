import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: {
    token: string;
  };
};

export default async function SharedReportPage({ params }: Props) {
  const supabase = await createClient();

  const { data: report, error } = await supabase
    .from("reports")
    .select("content, created_at, audience")
    .eq("shared_link_id", params.token)
    .single();

  if (error || !report) notFound();

  return (
    <div className="min-h-screen landing-bg">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div className="card space-y-3">
          <div className="text-xs text-zinc-500">Shared report</div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            {report.audience} update
          </h1>
          <div className="text-sm text-zinc-500">
            {new Date(report.created_at).toLocaleString()}
          </div>
        </div>

        <article className="card prose prose-zinc max-w-none whitespace-pre-wrap">
          {report.content}
        </article>
      </div>
    </div>
  );
}
