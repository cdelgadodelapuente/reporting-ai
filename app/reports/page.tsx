import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReportBuilder from "./report-builder";


export default async function ReportPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <div className="min-h-screen landing-bg">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
        <div>
          <div className="text-xs text-zinc-500">Report Builder</div>
          <h1 className="text-2xl font-semibold text-zinc-900">New report</h1>
          <p className="text-sm text-zinc-600">
            Pull your latest Jira activity and generate a structured update.
          </p>
        </div>
        <ReportBuilder />
      </div>
    </div>
  );
}
