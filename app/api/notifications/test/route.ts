import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createNotification, NotificationType } from "@/lib/notifications";

// Dev-only helper — lets the Settings page fire a sample notification of any
// type so the bell UI can be tested without waiting for the real trigger
// (a revoked Google token, a Stripe webhook, a new streak record).
const SAMPLES: Record<NotificationType, { title: string; message: string }> = {
  integration_disconnected: {
    title: "Google disconnected",
    message: "Your Google connection was lost. Reconnect it to keep Gmail, Calendar, and the assistant working.",
  },
  streak_milestone: {
    title: "New longest streak!",
    message: "You just hit a 7-day streak — your best yet.",
  },
  payment_failed: {
    title: "Payment failed",
    message: "We couldn't process your last payment. Update your billing details to avoid losing access.",
  },
  trial_ending: {
    title: "Trial ending soon",
    message: "Your trial ends in 2 days. Add a payment method to keep your access.",
  },
  subscription_canceled: {
    title: "Subscription ended",
    message: "Your subscription has ended. Resubscribe any time to regain access.",
  },
  cancellation_scheduled: {
    title: "Subscription set to cancel",
    message: "Your subscription is scheduled to end on December 31, 2026. You'll keep access until then.",
  },
};

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await request.json();
  const sample = SAMPLES[type as NotificationType];
  if (!sample) {
    return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
  }

  await createNotification(user.id, type, sample.title, sample.message, { test: true });

  return NextResponse.json({ success: true });
}
