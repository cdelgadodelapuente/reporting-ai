import { createAdminClient } from "@/lib/supabase/admin";

export async function logEvent(userId: string, event_type: string, metadata: any = {}) {
  try {
    const admin = createAdminClient();
    await admin.from("usage_events").insert({
      user_id: userId,
      event_type,
      metadata,
    });
  } catch {
    // best-effort analytics; ignore failures
  }
}

