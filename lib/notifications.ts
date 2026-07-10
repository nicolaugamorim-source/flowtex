import { createClient } from "@supabase/supabase-js";

export type NotificationType =
  | "integration_disconnected"
  | "streak_milestone"
  | "payment_failed"
  | "trial_ending"
  | "subscription_canceled"
  | "cancellation_scheduled";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Creating a notification is never allowed to break the flow that triggered
// it (a token refresh, a webhook) — log and swallow instead of throwing,
// same pattern as sendProductEmail.
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      type,
      title,
      message,
      metadata,
    });
  } catch (error) {
    console.error("[notifications] Failed to create:", type, error);
  }
}
