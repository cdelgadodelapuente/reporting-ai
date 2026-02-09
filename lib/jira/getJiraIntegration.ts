import { createClient } from "@/lib/supabase/server";
import { normalizeBaseUrl } from "@/lib/jira/normalizeBaseUrl";

export async function getJiraIntegrationOrThrow() {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();

  if (!userRes.user) throw new Error("Unauthorized");

  const { data: integration, error } = await supabase
    .from("integrations")
    .select("config")
    .eq("user_id", userRes.user.id)
    .eq("provider", "jira")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!integration) throw new Error("Jira not connected");

  const config = integration.config as any;

  return {
    baseUrl: normalizeBaseUrl(String(config.baseUrl || "")),
    email: String(config.email || "").trim(),
    apiToken: String(config.apiToken || "").trim(),
  };
}
