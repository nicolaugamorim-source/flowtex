import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { deleteEvent } from '@/lib/google-calendar';
import { ensureValidGoogleToken } from '@/lib/ensure-valid-token';
import { checkSubscriptionAPI } from '@/lib/protect-api-route';

// Deletes a specific Google Calendar event by id, on the authenticated, subscribed
// user's behalf. This is the confirm-and-execute step for the chat assistant's
// delete_calendar_event tool: the tool only ever *finds* the candidate event and
// returns it to the UI, and this route performs the actual irreversible deletion
// only once the user clicks "Confirm delete" (mirrors app/api/gmail/delete).
export async function POST(request: NextRequest) {
  try {
    const subscriptionCheck = await checkSubscriptionAPI(request);
    if (!subscriptionCheck.authorized) {
      return subscriptionCheck.error || NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    const { googleAccessToken, eventId, calendarId } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

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

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validToken = await ensureValidGoogleToken(googleAccessToken, userId);
    if (!validToken) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization token' },
        { status: 401 }
      );
    }

    await deleteEvent(validToken, eventId, calendarId || 'primary');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendar delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    );
  }
}
