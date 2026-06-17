import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { isTokenExpiredError, refreshGoogleAccessToken } from './google-token-refresh';

const calendar = google.calendar('v3');

export async function getCalendarClient(accessToken: string): Promise<any> {
  // Get redirect URI from environment, with fallback
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/auth/callback`;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  return oauth2Client;
}

/**
 * Wrapper to handle token refresh on 401 errors
 */
async function withTokenRefresh<T>(
  userId: string,
  accessToken: string,
  fn: (token: string) => Promise<T>
): Promise<T> {
  try {
    return await fn(accessToken);
  } catch (error: any) {
    if (isTokenExpiredError(error) && userId) {
      console.log('🔄 Token expired, attempting refresh...');
      const newToken = await refreshGoogleAccessToken(userId);
      if (newToken) {
        console.log('✅ Token refreshed, retrying request...');
        return await fn(newToken);
      }
    }
    throw error;
  }
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
}

export async function getCalendarsList(accessToken: string, userId?: string): Promise<GoogleCalendar[]> {
  try {
    return await withTokenRefresh(
      userId || '',
      accessToken,
      async (token) => {
        const auth = await getCalendarClient(token);

        const response = await calendar.calendarList.list({
          auth,
          maxResults: 50,
        });

        return (response.data.items || []).map((item: any) => ({
          id: item.id,
          summary: item.summary,
          description: item.description,
          primary: item.primary,
        }));
      }
    );
  } catch (error) {
    console.error('Error fetching calendars list:', error);
    return [];
  }
}

export async function getUpcomingEvents(accessToken: string, maxResults: number = 10, userId?: string) {
  try {
    return await withTokenRefresh(
      userId || '',
      accessToken,
      async (token) => {
        const auth = await getCalendarClient(token);

        // First get all calendars
        const calendarsResponse = await calendar.calendarList.list({
          auth,
          maxResults: 50,
        });

        const calendars = calendarsResponse.data.items || [];
        const allEvents: any[] = [];

        // Fetch events from each calendar
        for (const cal of calendars) {
          try {
            const response = await calendar.events.list({
              auth,
              calendarId: cal.id!,
              timeMin: new Date().toISOString(),
              maxResults: 100,
              singleEvents: true,
              orderBy: 'startTime',
            });

            const events = response.data.items || [];
            allEvents.push(...events);
          } catch (error) {
            console.error(`Error fetching events from calendar ${cal.id}:`, error);
          }
        }

        // Sort by start time and limit results
        allEvents.sort((a, b) => {
          const aTime = new Date(a.start?.dateTime || a.start?.date).getTime();
          const bTime = new Date(b.start?.dateTime || b.start?.date).getTime();
          return aTime - bTime;
        });

        return allEvents.slice(0, maxResults);
      }
    );
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
}

export async function createEvent(
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    startTime: string;
    endTime: string;
    calendarId?: string;
  }
) {
  try {
    const auth = await getCalendarClient(accessToken);
    const calendarId = event.calendarId || 'primary';

    const response = await calendar.events.insert({
      auth,
      calendarId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.startTime,
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: event.endTime,
          timeZone: 'America/Sao_Paulo',
        },
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

export async function updateEvent(
  accessToken: string,
  eventId: string,
  event: {
    summary?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
  }
) {
  try {
    const auth = await getCalendarClient(accessToken);

    const response = await calendar.events.update({
      auth,
      calendarId: 'primary',
      eventId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: event.startTime
          ? {
              dateTime: event.startTime,
              timeZone: 'America/Sao_Paulo',
            }
          : undefined,
        end: event.endTime
          ? {
              dateTime: event.endTime,
              timeZone: 'America/Sao_Paulo',
            }
          : undefined,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
}

export async function deleteEvent(
  accessToken: string,
  eventId: string,
  calendarId: string = 'primary'
) {
  try {
    const auth = await getCalendarClient(accessToken);

    await calendar.events.delete({
      auth,
      calendarId,
      eventId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}

// Normalize string for comparison (remove accents, lowercase)
function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export async function rescheduleEvent(
  accessToken: string,
  oldEventTitle: string,
  newEvent: {
    summary: string;
    description?: string;
    startTime: string;
    endTime: string;
    calendarId?: string;
  }
) {
  try {
    const auth = await getCalendarClient(accessToken);
    const normalizedSearchTitle = normalizeString(oldEventTitle);

    // Get all calendars
    const calendarsResponse = await calendar.calendarList.list({
      auth,
      maxResults: 50,
    });

    const cals = calendarsResponse.data.items || [];
    let deletedEvent: any = null;

    // Search and delete old event in all calendars
    for (const cal of cals) {
      try {
        const response = await calendar.events.list({
          auth,
          calendarId: cal.id!,
          timeMin: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // last 90 days
          maxResults: 250,
          singleEvents: true,
          orderBy: 'startTime',
        });

        const events = response.data.items || [];
        console.log(`📅 Found ${events.length} events in calendar ${cal.id} (${cal.summary})`);

        const eventToDelete = events.find(
          (event: any) => {
            const normalized = normalizeString(event.summary || '');
            const matches = normalized.includes(normalizedSearchTitle);
            console.log(`  - "${event.summary}" -> normalized: "${normalized}" -> matches: ${matches}`);
            return matches;
          }
        );

        if (eventToDelete && eventToDelete.id) {
          console.log(`✅ Found event to delete: ${eventToDelete.summary} (ID: ${eventToDelete.id})`);
          deletedEvent = eventToDelete;

          try {
            await calendar.events.delete({
              auth,
              calendarId: cal.id!,
              eventId: eventToDelete.id,
            });
            console.log(`✅ Event deleted successfully from calendar ${cal.id}`);
          } catch (deleteError) {
            console.error(`❌ Error deleting event:`, deleteError);
            throw deleteError;
          }
          break;
        } else {
          console.log(`❌ No matching event found in calendar ${cal.id}`);
        }
      } catch (error) {
        console.error(`Error searching calendar ${cal.id}:`, error);
      }
    }

    if (!deletedEvent) {
      return {
        success: false,
        message: `Não achei nenhum evento com o título "${oldEventTitle}" para reagendar`,
      };
    }

    // Create new event with new time
    const calendarIdToUse = newEvent.calendarId || 'primary';
    const newEventResponse = await calendar.events.insert({
      auth,
      calendarId: calendarIdToUse,
      requestBody: {
        summary: newEvent.summary,
        description: newEvent.description,
        start: {
          dateTime: newEvent.startTime,
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: newEvent.endTime,
          timeZone: 'America/Sao_Paulo',
        },
      },
    });

    return {
      success: true,
      oldEvent: deletedEvent.summary,
      newEvent: newEventResponse.data,
    };
  } catch (error) {
    console.error('Error rescheduling event:', error);
    throw error;
  }
}

export async function findAndDeleteEvent(
  accessToken: string,
  eventTitle: string
) {
  try {
    const auth = await getCalendarClient(accessToken);
    const normalizedSearchTitle = normalizeString(eventTitle);

    // Get all calendars
    const calendarsResponse = await calendar.calendarList.list({
      auth,
      maxResults: 50,
    });

    const cals = calendarsResponse.data.items || [];

    // Search in all calendars
    for (const cal of cals) {
      try {
        const response = await calendar.events.list({
          auth,
          calendarId: cal.id!,
          timeMin: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // last 90 days
          maxResults: 250,
          singleEvents: true,
          orderBy: 'startTime',
        });

        const events = response.data.items || [];
        const eventToDelete = events.find(
          (event: any) =>
            normalizeString(event.summary || '').includes(normalizedSearchTitle)
        );

        if (eventToDelete && eventToDelete.id) {
          const startTime = new Date(eventToDelete.start?.dateTime || eventToDelete.start?.date || new Date().toISOString());
          const endTime = new Date(eventToDelete.end?.dateTime || eventToDelete.end?.date || new Date().toISOString());

          await calendar.events.delete({
            auth,
            calendarId: cal.id!,
            eventId: eventToDelete.id,
          });

          return {
            success: true,
            deletedEvent: eventToDelete.summary,
            deletedEventDate: startTime.toLocaleDateString('pt-PT'),
            deletedEventTime: eventToDelete.start?.dateTime
              ? `${startTime.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
              : startTime.toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            deletedEventDayOfWeek: startTime.toLocaleDateString('pt-PT', { weekday: 'long' }).charAt(0).toUpperCase() + startTime.toLocaleDateString('pt-PT', { weekday: 'long' }).slice(1),
          };
        }
      } catch (error) {
        console.error(`Error searching calendar ${cal.id}:`, error);
      }
    }

    return {
      success: false,
      message: `Não achei nenhum evento com o título "${eventTitle}"`,
    };
  } catch (error) {
    console.error('Error finding and deleting event:', error);
    throw error;
  }
}
