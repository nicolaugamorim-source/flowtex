import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendEmail } from '@/lib/google-gmail';
import { ensureValidGoogleToken } from '@/lib/ensure-valid-token';
import { checkSubscriptionAPI } from '@/lib/protect-api-route';
import { captureServerEvent } from '@/lib/posthog-server';
import { checkEmailSendRateLimit } from '@/lib/rate-limit';

// Sends an email via Gmail on behalf of the authenticated, subscribed user.
export async function POST(request: NextRequest) {
  try {
    // Check subscription
    const subscriptionCheck = await checkSubscriptionAPI(request);
    if (!subscriptionCheck.authorized) {
      return subscriptionCheck.error || NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    const { to, subject, body, googleAccessToken } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing email fields' },
        { status: 400 }
      );
    }

    // Get userId strictly from the authenticated session (cookie-bound
    // server client) - never trust a client-supplied userId.
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

    let userId: string | undefined;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    } catch (error) {
      console.log('Could not get userId from session');
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Catches a runaway retry loop or script hammering the user's mailbox
    // through Gmail before it reaches the (rate-limited by Google) send call.
    const rateLimit = checkEmailSendRateLimit(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'rate_limited', retryAfterSeconds: rateLimit.retryAfterSeconds },
        { status: 429 }
      );
    }

    // Ensure we have a valid access token
    const validAccessToken = await ensureValidGoogleToken(googleAccessToken, userId);

    if (!validAccessToken) {
      return NextResponse.json(
        { error: 'No valid access token' },
        { status: 401 }
      );
    }

    console.log('Sending email to:', to);

    const result = await sendEmail(validAccessToken, to, subject, body);

    if (result.success) {
      if (userId) {
        await captureServerEvent(userId, "email_sent", {
          subject_length: subject.length,
          body_length: body.length,
          recipient_domain: to.split('@')[1] || undefined,
        });
      }
      return NextResponse.json({
        success: true,
        message: `Email sent to ${to}`,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending email:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
