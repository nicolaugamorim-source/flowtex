import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";
import { sendProductEmail } from "@/lib/emails/send";
import { activationNudgeEmail } from "@/lib/emails/templates";

// Constant-time comparison for the cron secret. timingSafeEqual throws on
// mismatched buffer lengths, so that case is checked (and rejected) first
// rather than being allowed to throw.
function isValidCronSecret(authHeader: string | null): boolean {
  if (!authHeader || !process.env.CRON_SECRET) return false;
  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET}`);
  const actual = Buffer.from(authHeader);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

// Runs daily via Vercel Cron (see vercel.json). Unlike every other email in
// lib/emails, this one isn't triggered by a webhook — it's time-based: "signed
// up 2+ days ago, never started a trial or subscribed." Requires a scheduled
// job because there's no event that fires for "nothing happened."
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!isValidCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  // Signed up 2+ days ago, never checked out (no Stripe customer at all), and
  // hasn't already gotten this nudge — each account gets it exactly once.
  const { data: staleSignups, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name")
    .lte("created_at", twoDaysAgo)
    .is("stripe_customer_id", null)
    .is("activation_nudge_sent_at", null);

  if (error) {
    console.error("[CRON activation-nudge] Query failed:", error);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  let sent = 0;
  for (const profile of staleSignups || []) {
    if (!profile.email) continue;
    await sendProductEmail(profile.email, activationNudgeEmail(profile.full_name || ""));
    await supabaseAdmin
      .from("profiles")
      .update({ activation_nudge_sent_at: new Date().toISOString() })
      .eq("id", profile.id);
    sent++;
  }

  return NextResponse.json({ checked: staleSignups?.length ?? 0, sent });
}
