import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/google-gmail';
import { ensureValidGoogleToken } from '@/lib/ensure-valid-token';
import { supabase } from '@/lib/supabase';
import { checkSubscriptionAPI } from '@/lib/protect-api-route';
import { captureServerEvent } from '@/lib/posthog-server';

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

    const { to, subject, body, googleAccessToken, userId: requestUserId } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing email fields' },
        { status: 400 }
      );
    }

    // Get userId from authenticated session
    let userId = requestUserId;
    if (!userId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      } catch (error) {
        console.log('Could not get userId from session');
      }
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
