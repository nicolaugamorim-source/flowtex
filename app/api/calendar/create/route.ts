import { NextRequest, NextResponse } from 'next/server';
import { createEvent } from '@/lib/google-calendar';
import { ensureValidGoogleToken } from '@/lib/ensure-valid-token';
import { supabase } from '@/lib/supabase';
import { checkSubscriptionAPI } from '@/lib/protect-api-route';

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

    const { googleAccessToken, summary, description, startTime, endTime } = await request.json();

    // Get userId from session to enable token refresh
    let userId: string | undefined;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    } catch (error) {
      console.log('Could not get userId from session');
    }

    // Ensure we have a valid token
    const validToken = await ensureValidGoogleToken(googleAccessToken, userId);

    if (!validToken) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization token' },
        { status: 401 }
      );
    }

    if (!summary || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: summary, startTime, endTime' },
        { status: 400 }
      );
    }

    const event = await createEvent(validToken, {
      summary,
      description,
      startTime,
      endTime,
    });

    return NextResponse.json({ event, success: true });
  } catch (error) {
    console.error('Calendar create error:', error);

    return NextResponse.json(
      { error: 'Failed to create calendar event', details: String(error) },
      { status: 500 }
    );
  }
}
