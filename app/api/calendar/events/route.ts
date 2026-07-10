import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUpcomingEvents } from '@/lib/google-calendar';
import { ensureValidGoogleToken } from '@/lib/ensure-valid-token';
import { checkSubscriptionAPI } from '@/lib/protect-api-route';

// Returns the authenticated user's upcoming Google Calendar events.
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
