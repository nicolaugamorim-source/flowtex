import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { rescheduleEventById } from '@/lib/google-calendar';
import { ensureValidGoogleToken } from '@/lib/ensure-valid-token';
import { checkSubscriptionAPI } from '@/lib/protect-api-route';

// Reschedules a specific Google Calendar event (delete old id + create new) on the
// authenticated, subscribed user's behalf. Confirm-and-execute step for the chat
// assistant's reschedule_event tool: the tool only *finds* the candidate event and
// the already-parsed new date/time, and returns them to the UI; this route performs
// the actual mutation only once the user clicks "Confirm reschedule".
export async function POST(request: NextRequest) {
  try {
    const subscriptionCheck = await checkSubscriptionAPI(request);
    if (!subscriptionCheck.authorized) {
      return subscriptionCheck.error || NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    const {
      googleAccessToken,
      eventId,
      calendarId,
      summary,
      description,
      startTime,
      endTime,
      newCalendarId,
    } = await request.json();

    if (!eventId || !summary || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, summary, startTime, endTime' },
        { status: 400 }
      );
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

    const result = await rescheduleEventById(validToken, userId, eventId, calendarId || 'primary', {
      summary,
      description,
      startTime,
      endTime,
      calendarId: newCalendarId || calendarId || 'primary',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Calendar reschedule error:', error);
    if (error instanceof Error && error.message.startsWith('OPERATION_IN_PROGRESS')) {
      return NextResponse.json(
        { error: 'A reschedule for this event is already in progress' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to reschedule calendar event' },
      { status: 500 }
    );
  }
}
