import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingEvents } from '@/lib/google-calendar';
import { ensureValidGoogleToken } from '@/lib/ensure-valid-token';
import { supabase } from '@/lib/supabase';
import { checkSubscriptionAPI } from '@/lib/protect-api-route';

export async function GET(request: NextRequest) {
  try {
    // Check subscription
    const subscriptionCheck = await checkSubscriptionAPI(request);
    if (!subscriptionCheck.authorized) {
      return subscriptionCheck.error || NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    let accessToken = request.headers.get('authorization')?.replace('Bearer ', '');

    // Get userId from session to enable token refresh
    let userId: string | undefined;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    } catch (error) {
      console.log('Could not get userId from session');
    }

    // Ensure we have a valid token
    const validToken = await ensureValidGoogleToken(accessToken, userId);

    if (!validToken) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization token' },
        { status: 401 }
      );
    }

    const events = await getUpcomingEvents(validToken, 10);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Calendar API error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}
