import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUpcomingEvents, createEvent, getCalendarsList, findAndDeleteEvent, rescheduleEvent, findAndSendInvite } from '@/lib/google-calendar';
import { getEmails, sendEmail, searchEmails, deleteEmail, markAsRead, getFullEmailContent } from '@/lib/google-gmail';
import { ensureValidGoogleToken } from '@/lib/ensure-valid-token';
import { saveChatMessage, getChatHistory } from '@/lib/database';
import { checkSubscriptionAPI } from '@/lib/protect-api-route';
import { captureServerEvent } from '@/lib/posthog-server';
import { checkChatRateLimit } from '@/lib/rate-limit';

// Main AI chat endpoint — talks to Claude with tool access to the user's
// calendar, Gmail, and chat history, and persists the conversation.
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Detect language from user message
function detectLanguage(text: string): string {
  const lowerText = text.toLowerCase();

  // Count language indicators
  const ptIndicators = (lowerText.match(/\b(meu|minha|meus|minhas|da|do|resumo|nao|lido|ultimo|ultima|qual|reunião|agendado|agendar|remarcar|remover|português|calendário|evento|eventos|quero|pode|como|onde|quando|muito|pouco|grande|pequeno|aqui|ali|aí|ele|ela)\b/gi) || []).length;

  const enIndicators = (lowerText.match(/\b(my|your|give|me|unread|last|summary|resume|email|which|what|send|this|that|is|are|for|with|and|the|meeting|schedule|scheduled|reschedule|delete|day|english|calendar|event|events|can|will|should|would|have|has)\b/gi) || []).length;

  const esIndicators = (lowerText.match(/\b(mi|tu|mío|mía|resumen|no\sleído|último|última|cuál|qué|dar|enviar|este|ese|aquel|está|estoy|español|reunión|programar|reprogramar|eliminar|día|calendario|evento|eventos|quiero|puedo|como|donde|cuando)\b/gi) || []).length;

  // Return the language with the most indicators
  if (ptIndicators > enIndicators && ptIndicators > esIndicators && ptIndicators > 0) {
    return 'pt';
  }
  if (esIndicators > enIndicators && esIndicators > 0) {
    return 'es';
  }
  if (enIndicators > 0) {
    return 'en';
  }

  return 'en'; // default to English
}

// Get day name and action text in the user's language
function getLocalizedText(date: Date, action: 'created' | 'updated' | 'deleted', language: string): { dayOfWeek: string; actionText: string } {
  const dayNames: { [key: string]: string[] } = {
    'pt': ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
    'en': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    'es': ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  };

  const actionTexts: { [key: string]: { [key: string]: string } } = {
    'pt': { 'created': 'Agendado', 'updated': 'Atualizado', 'deleted': 'Removido' },
    'en': { 'created': 'Scheduled', 'updated': 'Updated', 'deleted': 'Removed' },
    'es': { 'created': 'Programado', 'updated': 'Actualizado', 'deleted': 'Eliminado' },
  };

  const lang = language || 'en';
  const dayOfWeek = dayNames[lang]?.[date.getDay()] || date.toLocaleDateString('en-US', { weekday: 'long' });
  const actionText = actionTexts[lang]?.[action] || 'Scheduled';

  return { dayOfWeek, actionText };
}

// Title-case an event title (English only), keeping small connector words lowercase
// and acronyms (e.g. "CM") in all caps when the user already typed them that way.
function improveEventTitle(title: string): string {
  const skipWords = ['a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'for', 'and', 'or', 'with', 'by'];

  const words = title.trim().split(/\s+/).map((word, index) => {
    // Preserve words the user already typed in all caps (e.g. acronyms like "CM").
    if (word.length > 1 && word === word.toUpperCase()) {
      return word;
    }

    const lower = word.toLowerCase();
    if (index > 0 && skipWords.includes(lower)) {
      return lower;
    }
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });

  return words.join(' ');
}

// Extract a bare email address from a "Name <email@x.com>" or plain "email@x.com" string
function extractEmailAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from.trim();
}

// Resolve a relative date filter ("today", "tomorrow", "this week", weekday names) into a date range
function resolveRelativeDateRange(filter?: string): { start: Date; end: Date } | null {
  if (!filter) return null;
  const f = filter.toLowerCase();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const now = new Date();
  const singleDay = (start: Date) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  };

  // "in N days/weeks/months", "in a day/week/month" — checked first since these
  // are the most specific patterns.
  const inMatch = f.match(/\bin\s+(a|an|\d+)\s+(day|days|week|weeks|month|months)\b/);
  if (inMatch) {
    const amount = inMatch[1] === 'a' || inMatch[1] === 'an' ? 1 : parseInt(inMatch[1]);
    const unit = inMatch[2];
    const start = startOfDay(now);
    if (unit.startsWith('day')) start.setDate(start.getDate() + amount);
    else if (unit.startsWith('week')) start.setDate(start.getDate() + amount * 7);
    else if (unit.startsWith('month')) start.setMonth(start.getMonth() + amount);
    return singleDay(start);
  }

  if (f.includes('day after tomorrow')) {
    const start = startOfDay(now);
    start.setDate(start.getDate() + 2);
    return singleDay(start);
  }

  if (f.includes('yesterday')) {
    const start = startOfDay(now);
    start.setDate(start.getDate() - 1);
    return singleDay(start);
  }

  if (f.includes('today') || f.includes('hoje')) {
    return singleDay(startOfDay(now));
  }

  if (f.includes('tomorrow') || f.includes('amanh')) {
    const start = startOfDay(now);
    start.setDate(start.getDate() + 1);
    return singleDay(start);
  }

  if (f.includes('next week')) {
    const start = startOfDay(now);
    start.setDate(start.getDate() + 7);
    return singleDay(start);
  }

  if (f.includes('next month')) {
    const start = startOfDay(now);
    start.setMonth(start.getMonth() + 1);
    return singleDay(start);
  }

  if (f.includes('week') || f.includes('semana')) {
    const start = startOfDay(now);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }

  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const weekdayIndex = weekdays.findIndex((w) => f.includes(w));
  if (weekdayIndex >= 0) {
    const start = startOfDay(now);
    let diff = weekdayIndex - start.getDay();
    if (diff <= 0) diff += 7;
    start.setDate(start.getDate() + diff);
    return singleDay(start);
  }

  return null;
}

// Smart date parser
function parseSmartDate(dateStr: string): { start: string; end: string } | null {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  // Try to parse different date formats
  let day: number | null = null;
  let month: number | null = null;
  let year: number | null = null;

  // Relative date words ("today", "tomorrow", weekday names) — resolved before
  // falling back to numeric day/month parsing.
  const lowerDateStr = dateStr.toLowerCase();
  const relativeRange = resolveRelativeDateRange(lowerDateStr);
  if (relativeRange) {
    day = relativeRange.start.getDate();
    month = relativeRange.start.getMonth();
    year = relativeRange.start.getFullYear();
  }

  // Extract day (1-31) — only if not already resolved from a relative word
  const dayMatch = day === null ? dateStr.match(/\b(0?[1-9]|[12]\d|3[01])\b/) : null;
  if (dayMatch) day = parseInt(dayMatch[1]);

  // Extract month by name or number
  const monthMap: { [key: string]: number } = {
    janeiro: 0, january: 0, jan: 0,
    fevereiro: 1, february: 1, feb: 1,
    março: 2, march: 2, mar: 2,
    abril: 3, april: 3, apr: 3,
    maio: 4, may: 4,
    junho: 5, june: 5, jun: 5,
    julho: 6, july: 6, jul: 6,
    agosto: 7, august: 7, aug: 7,
    setembro: 8, september: 8, sep: 8,
    outubro: 9, october: 9, oct: 9,
    novembro: 10, november: 10, nov: 10,
    dezembro: 11, december: 11, dec: 11,
  };

  if (month === null) {
    for (const [monthName, monthNum] of Object.entries(monthMap)) {
      if (dateStr.toLowerCase().includes(monthName)) {
        month = monthNum;
        break;
      }
    }
  }

  // If month not found, try numeric format
  if (month === null) {
    const monthMatch = dateStr.match(/\b(0?[1-9]|1[0-2])\b/);
    if (monthMatch) month = parseInt(monthMatch[1]) - 1;
  }

  // Extract year if present
  const yearMatch = dateStr.match(/\b(20\d{2})\b/);
  if (yearMatch) year = parseInt(yearMatch[1]);

  if (day === null) return null;

  // Determine year and month intelligently
  if (month === null) {
    // Only day provided - use current month if day hasn't passed, else next month
    month = currentDate > day ? currentMonth + 1 : currentMonth;
    if (month > 11) {
      month = 0;
      year = currentYear + 1;
    } else {
      year = currentYear;
    }
  } else {
    // Month provided
    if (year === null) {
      // Check if month has passed this year
      if (month < currentMonth || (month === currentMonth && currentDate > day)) {
        year = currentYear + 1;
      } else {
        year = currentYear;
      }
    }
  }

  // Create ISO date strings
  const startDate = new Date(year, month, day, 14, 0, 0);
  const endDate = new Date(year, month, day, 16, 0, 0);

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Check subscription before processing
    const subscriptionCheck = await checkSubscriptionAPI(request);
    if (!subscriptionCheck.authorized) {
      console.log('[CHAT API] Subscription check failed');
      return subscriptionCheck.error || NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    const { message, conversationHistory = [], googleAccessToken, activeAction, userId: requestUserId } = await request.json();

    console.log('Received googleAccessToken:', googleAccessToken ? 'YES' : 'NO');
    console.log('Active action:', activeAction);

    // Authenticated server-side client (forwards the user's session cookies so RLS policies pass)
    const cookieStore = await cookies();
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Get userId from authenticated session
    let userId = requestUserId;
    if (!userId) {
      try {
        const { data: { user } } = await supabaseServer.auth.getUser();
        userId = user?.id;
        if (userId) {
          console.log('Got userId from Supabase session');
        }
      } catch (error) {
        console.log('Could not get userId from session');
      }
    }

    // Catches a runaway retry loop or script before it reaches the (paid)
    // Anthropic call or any Gmail/Calendar/Notion API — never sends the
    // message, so the client can safely re-show it as unsent.
    const rateLimitKey = userId || request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimit = checkChatRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'rate_limited', retryAfterSeconds: rateLimit.retryAfterSeconds },
        { status: 429 }
      );
    }

    // Saves the assistant's reply before sending it back, so tool-driven responses
    // (calendar, email, Notion) are persisted just like plain-text ones.
    const saveAssistantReply = async (payload: any) => {
      if (userId) {
        try {
          await saveChatMessage(userId, {
            role: 'assistant',
            content: payload.content,
          }, supabaseServer);
        } catch (error) {
          console.log('Could not save assistant message to database');
        }
        await captureServerEvent(userId, 'chat_message_sent', { has_tool_use: true });
      }
      return NextResponse.json(payload);
    };

    // Ensure we have a valid access token (will refresh automatically if userId available)
    const validAccessToken = await ensureValidGoogleToken(googleAccessToken, userId);

    // The assistant always replies in English, regardless of the user's profile
    // language setting or the language they write in (MVP simplification).
    const userLanguage: string = 'en';
    let profile: {
      business_name?: string;
      business_type?: string;
      industry?: string;
      business_brief?: string;
      target_clients?: string;
      main_tools?: string;
    } | null = null;
    if (userId) {
      // Load the business profile directly (used to build the system prompt's identity section).
      try {
        const { data } = await supabaseServer
          .from('profiles')
          .select('business_name, business_type, industry, business_brief, target_clients, main_tools')
          .eq('id', userId)
          .single();
        profile = data || null;
      } catch (error) {
        console.log('Could not fetch profile');
      }
    }

    // Save user message to database
    if (userId) {
      try {
        await saveChatMessage(userId, {
          role: 'user',
          content: message,
        }, supabaseServer);
      } catch (error) {
        console.log('Could not save user message to database');
      }
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    // Prepare messages for Claude
    const messages = conversationHistory.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    // Fetch calendar events and calendars list if access token is provided
    let calendarContext = '';
    let calendarsInfo = '';
    let calendars: any[] = [];
    let upcomingEvents: any[] = [];
    let calendarFetchFailed = false;
    if (validAccessToken) {
      try {
        const events = await getUpcomingEvents(validAccessToken, 50, userId);
        upcomingEvents = events;
        if (events.length > 0) {
          const eventsList = events
            .map((event: any) => {
              const startTime = event.start?.dateTime || event.start?.date;
              const endTime = event.end?.dateTime || event.end?.date;
              const startDate = new Date(startTime);
              const endDate = new Date(endTime);

              // Format time nicely
              const timeStr = event.start?.dateTime
                ? `${startDate.toLocaleString('pt-PT', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
                : startDate.toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

              return `• ${event.summary} - ${timeStr}`;
            })
            .join('\n');
          calendarContext = `\n\n📅 YOUR CALENDAR (Next 50 events):\n${eventsList}`;
        }

        // Fetch available calendars
        calendars = await getCalendarsList(validAccessToken, userId);
        if (calendars.length > 0) {
          const calendarsList = calendars
            .map((cal) => `- "${cal.summary}" (${cal.id})${cal.primary ? ' [PRIMARY]' : ''}`)
            .join('\n');
          calendarsInfo = `\n\nYour Calendars:\n${calendarsList}`;
        }
      } catch (error) {
        console.error('Error fetching calendar data:', error);
        calendarFetchFailed = true;
      }
    }

    // Fetch current kanban tasks (excluding done) and clients for upfront context
    let kanbanContext = '';
    let clientsContext = '';
    if (userId) {
      try {
        const { data: kanbanTasks } = await supabaseServer
          .from('kanban_tasks')
          .select('*')
          .eq('user_id', userId)
          .neq('column_id', 'done')
          .order('created_at', { ascending: false })
          .limit(20);

        if (kanbanTasks && kanbanTasks.length > 0) {
          const tasksList = kanbanTasks
            .map((t: any) => `- [${t.priority}] ${t.title} → ${t.column_id} (${t.category})`)
            .join('\n');
          kanbanContext = `\n\nCURRENT KANBAN (excluding done):\n${tasksList}`;
        }
      } catch (error) {
        console.log('Could not fetch kanban tasks for context');
      }

      try {
        const { data: clients } = await supabaseServer
          .from('clients')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (clients && clients.length > 0) {
          const clientsList = clients
            .map((c: any) => `- ${c.name}${c.company ? ` @ ${c.company}` : ''} | ${c.status}${c.email ? ` | ${c.email}` : ''}${c.notes ? ` | notes: ${c.notes}` : ''}`)
            .join('\n');
          clientsContext = `\n\nCURRENT CLIENTS:\n${clientsList}`;
        }
      } catch (error) {
        console.log('Could not fetch clients for context');
      }
    }

    // Define tools for Claude
    const tools = [
      {
        name: 'show_calendar_events',
        description: 'Display one or more upcoming calendar events as visual cards. ALWAYS use this tool (instead of describing events in plain text) whenever the user asks about their schedule, meetings, or events — e.g. "what is my next meeting", "what do I have tomorrow", "what is on my calendar this week".',
        input_schema: {
          type: 'object',
          properties: {
            count: {
              type: 'number',
              description: 'How many events to show. Use 1 for "next meeting" style questions. Defaults to 1.',
            },
            date_filter: {
              type: 'string',
              description: 'Optional relative date filter: "today", "tomorrow", "this week", or a weekday name (e.g. "friday"). Leave empty to just show the next upcoming event(s).',
            },
          },
        },
      },
      {
        name: 'create_calendar_event',
        description: 'Create an event in Google Calendar. IMPORTANT: Always choose the correct calendar_id based on the event type. Analyze the event and find the matching calendar from the Available Calendars list. Never use "primary" - always use the specific calendar ID that matches the event type.',
        input_schema: {
          type: 'object',
          properties: {
            summary: {
              type: 'string',
              description: 'Event title/name',
            },
            description: {
              type: 'string',
              description: 'Event description (optional)',
            },
            date_string: {
              type: 'string',
              description: 'Date description in natural language. Accepts relative phrases ("today", "tomorrow", "day after tomorrow", "next monday", "next week", "in 3 days", "in a month") or explicit dates ("dia 15", "July 15", "15 de julho de 2026"). Pass the user\'s phrase through as-is — do not convert it to an explicit date yourself.',
            },
            start_time: {
              type: 'string',
              description: 'Start time in HH:MM format (e.g., "14:00")',
            },
            end_time: {
              type: 'string',
              description: 'End time in HH:MM format (e.g., "16:00")',
            },
            calendar_id: {
              type: 'string',
              description: 'REQUIRED: The exact calendar ID from the Available Calendars list. Match the calendar to the event type. For a work event like "reunião", use the Trabalho calendar ID.',
            },
            client_name: {
              type: 'string',
              description: 'Name of the client/company this meeting is with, if mentioned (e.g. "with John from Acme", "reunião com a Acme"). Used to look up their email in the CRM and silently link them as an attendee — no invite email is sent. Leave empty if no client is mentioned.',
            },
          },
          required: ['summary', 'date_string', 'calendar_id'],
        },
      },
      {
        name: 'send_calendar_invite',
        description: 'Send a real calendar invite email to the client already linked to an event. Use this ONLY when the user explicitly asks to invite/notify the client (e.g. "send the invite to the client", "notifica o cliente deste evento") — never automatically after just creating an event.',
        input_schema: {
          type: 'object',
          properties: {
            event_title: {
              type: 'string',
              description: 'The title or keyword of the event to send the invite for',
            },
          },
          required: ['event_title'],
        },
      },
      {
        name: 'delete_calendar_event',
        description: 'Delete an event from Google Calendar by event title or keyword. Searches for events containing the title.',
        input_schema: {
          type: 'object',
          properties: {
            event_title: {
              type: 'string',
              description: 'The title or keyword of the event to delete',
            },
          },
          required: ['event_title'],
        },
      },
      {
        name: 'reschedule_event',
        description: 'Reschedule an existing event by deleting the old one and creating a new one with updated time/date. Use this when user asks to "reagendar", "mover", "adiar", or reschedule an event.',
        input_schema: {
          type: 'object',
          properties: {
            old_event_title: {
              type: 'string',
              description: 'The title of the event to reschedule',
            },
            summary: {
              type: 'string',
              description: 'Event title/name (usually same as old event)',
            },
            description: {
              type: 'string',
              description: 'Event description (optional)',
            },
            date_string: {
              type: 'string',
              description: 'Date description in natural language (e.g., "dia 15", "15 de julho")',
            },
            start_time: {
              type: 'string',
              description: 'New start time in HH:MM format (e.g., "15:00")',
            },
            end_time: {
              type: 'string',
              description: 'New end time in HH:MM format (e.g., "16:00")',
            },
            calendar_id: {
              type: 'string',
              description: 'Calendar ID (optional, uses original calendar if not specified)',
            },
          },
          required: ['old_event_title', 'summary', 'date_string', 'start_time'],
        },
      },
      {
        name: 'draft_email',
        description: 'Draft an email for user review. IMPORTANT: Always draft the email first, then the user will see a draft bubble with Confirm and Remake buttons. Only send after the user confirms.',
        input_schema: {
          type: 'object',
          properties: {
            to: {
              type: 'string',
              description: 'Email address of the recipient',
            },
            subject: {
              type: 'string',
              description: 'Subject line of the email',
            },
            body: {
              type: 'string',
              description: 'Body/content of the email',
            },
          },
          required: ['to', 'subject', 'body'],
        },
      },
      {
        name: 'search_emails',
        description: 'Search for emails by keyword, sender, subject, or other criteria.',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (e.g., "from:john@example.com", "subject:meeting", "is:unread")',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'read_email_full',
        description: 'Read the complete content of a specific email. Use this to get the full message when you need to analyze or summarize an email in detail.',
        input_schema: {
          type: 'object',
          properties: {
            email_id: {
              type: 'string',
              description: 'The ID of the email to read (you get this from search_emails results)',
            },
          },
          required: ['email_id'],
        },
      },
      {
        name: 'delete_email',
        description: 'Delete an email by searching for it first, then deleting it.',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find the email to delete',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'search_notion',
        description: 'Search for pages in Notion by keyword or title. Returns matching pages.',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (e.g., "Sales", "Projetos", "Trabalho")',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'create_notion_page',
        description: 'Create a new page in a Notion database. Requires the parent database ID.',
        input_schema: {
          type: 'object',
          properties: {
            parent_id: {
              type: 'string',
              description: 'The database ID where the page will be created (usually found after searching)',
            },
            title: {
              type: 'string',
              description: 'Title of the new page',
            },
            status: {
              type: 'string',
              description: 'Status property (optional, e.g., "Em andamento", "Concluído", "Planejado")',
            },
            description: {
              type: 'string',
              description: 'Additional description (optional)',
            },
          },
          required: ['parent_id', 'title'],
        },
      },
      {
        name: 'query_notion_database',
        description: 'Query a Notion database and list its contents.',
        input_schema: {
          type: 'object',
          properties: {
            database_id: {
              type: 'string',
              description: 'The database ID to query',
            },
          },
          required: ['database_id'],
        },
      },
      {
        name: 'navigate_notion_path',
        description: 'Navigate through a hierarchical path in Notion (e.g., "Mente do Nicolau > Trabalho > Projetos"). Returns the ID of the final destination.',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of path segments (e.g., ["Mente do Nicolau", "Trabalho", "Projetos"])',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'list_notion_pages',
        description: 'List all your top-level pages and databases in Notion.',
        input_schema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'delete_notion_page',
        description: 'Delete a page from Notion by its ID. This action cannot be undone.',
        input_schema: {
          type: 'object',
          properties: {
            page_id: {
              type: 'string',
              description: 'The ID of the page to delete',
            },
            page_name: {
              type: 'string',
              description: 'The name of the page (for confirmation message)',
            },
          },
          required: ['page_id', 'page_name'],
        },
      },
      {
        name: 'update_notion_page_status',
        description: 'Update the status property of a Notion page (e.g., change "Em andamento" to "Concluído")',
        input_schema: {
          type: 'object',
          properties: {
            page_id: {
              type: 'string',
              description: 'The ID of the page to update',
            },
            status: {
              type: 'string',
              description: 'The new status value (e.g., "Em andamento", "Concluído", "Planejado")',
            },
          },
          required: ['page_id', 'status'],
        },
      },
      {
        name: 'get_kanban_tasks',
        description: 'Get the user\'s kanban tasks. Use this when the user asks about their tasks, priorities, what to do today, follow-ups, or anything related to their work pipeline.',
        input_schema: {
          type: 'object',
          properties: {
            column: {
              type: 'string',
              enum: ['todo', 'in_progress', 'review', 'done', 'all'],
              description: 'Filter by column. Defaults to "all".',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Filter by priority (optional).',
            },
          },
        },
      },
      {
        name: 'create_kanban_task',
        description: 'Create a new task in the kanban board. Use this when the user asks to add a task, reminder, or to-do.',
        input_schema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the task',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Task priority. Defaults to "medium".',
            },
            column: {
              type: 'string',
              enum: ['todo', 'in_progress', 'review', 'done'],
              description: 'Column to place the task in. Defaults to "todo".',
            },
            category: {
              type: 'string',
              enum: ['task', 'client', 'idea', 'bug'],
              description: 'Task category. Defaults to "task".',
            },
            description: {
              type: 'string',
              description: 'Additional details about the task (optional)',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'move_kanban_task',
        description: 'Move a kanban task to a different column. Use this when the user says a task is done, in progress, needs review, or asks to update its status.',
        input_schema: {
          type: 'object',
          properties: {
            task_id: {
              type: 'string',
              description: 'The ID of the task to move (from get_kanban_tasks results)',
            },
            column: {
              type: 'string',
              enum: ['todo', 'in_progress', 'review', 'done'],
              description: 'The column to move the task to',
            },
          },
          required: ['task_id', 'column'],
        },
      },
      {
        name: 'get_clients',
        description: 'Get the user\'s clients from the CRM. Use this when the user asks about clients, contacts, follow-ups, or who they are working with.',
        input_schema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Filter by client status (optional, e.g. "lead", "active")',
            },
          },
        },
      },
      {
        name: 'create_client',
        description: 'Add a new client to the CRM. Use this when the user mentions a new client, contact, or lead to track.',
        input_schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the client or contact',
            },
            company: {
              type: 'string',
              description: 'Company name (optional)',
            },
            email: {
              type: 'string',
              description: 'Email address (optional)',
            },
            phone: {
              type: 'string',
              description: 'Phone number (optional)',
            },
            status: {
              type: 'string',
              description: 'Client status. Defaults to "lead".',
            },
            notes: {
              type: 'string',
              description: 'Additional notes (optional)',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'update_client',
        description: 'Update an existing client\'s details (e.g. name, company, email, phone, status, notes, or avatar color). Use this when the user asks to change, edit, or correct information about a client, or to add/replace their notes. Only pass the fields that should change.',
        input_schema: {
          type: 'object',
          properties: {
            client_id: {
              type: 'string',
              description: 'The exact ID of the client to update, if already known from a previous get_clients call. Leave empty if you only know the client by name.',
            },
            client_lookup_name: {
              type: 'string',
              description: 'The name or company of the client to update, used to find them when client_id is not known. Required if client_id is not provided. Never invent or guess an ID — use this field instead.',
            },
            name: {
              type: 'string',
              description: 'New name for the client (optional)',
            },
            company: {
              type: 'string',
              description: 'New company name (optional)',
            },
            email: {
              type: 'string',
              description: 'New email address (optional)',
            },
            phone: {
              type: 'string',
              description: 'New phone number (optional)',
            },
            status: {
              type: 'string',
              description: 'New client status, e.g. "lead", "active" (optional)',
            },
            notes: {
              type: 'string',
              description: 'New notes content, replacing the existing notes (optional). If the user asks to add a note, combine it with any existing notes already known from context.',
            },
            avatar_color: {
              type: 'string',
              description: 'New avatar color as a hex code, e.g. "#00D4A4" (optional). Use this when the user asks to change the client\'s color.',
            },
          },
          required: [],
        },
      },
      {
        name: 'delete_client',
        description: 'Permanently delete a client from the CRM. This action cannot be undone.',
        input_schema: {
          type: 'object',
          properties: {
            client_id: {
              type: 'string',
              description: 'The exact ID of the client to delete, if already known from a previous get_clients call. Leave empty if you only know the client by name.',
            },
            client_lookup_name: {
              type: 'string',
              description: 'The name or company of the client to delete, used to find them when client_id is not known. Required if client_id is not provided. Never invent or guess an ID — use this field instead.',
            },
          },
          required: [],
        },
      },
    ];

    // Call Claude API with tools
    console.log('Calling Claude API with message:', message);

    // Build recent context (last email/calendar action)
    let recentContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      // Look for recent email or calendar mentions in conversation
      const lastAssistantMessage = conversationHistory.reverse().find((msg: any) => msg.role === 'assistant');
      if (lastAssistantMessage?.content) {
        // Extract email details if mentioned
        if (lastAssistantMessage.content.includes('Email from:') || lastAssistantMessage.content.includes('FULL:')) {
          recentContext = `\n\nRECENT EMAIL CONTEXT:
Remember the email you just read. Use this context for any follow-up actions the user requests.
When user asks to "reply", "confirm", "reschedule", or similar - apply the email context you have.`;
        }
        // Extract calendar details if mentioned
        if (lastAssistantMessage.content.includes('meeting') || lastAssistantMessage.content.includes('event')) {
          recentContext += `\n\nRECENT CALENDAR CONTEXT:
You know the meeting details from the email/previous context. Use this information for rescheduling or related actions.`;
        }
      }
    }

    // Build action-specific system prompt
    let actionContext = '';
    if (activeAction === 'schedule') {
      actionContext = '\n\nCURRENT ACTION: The user is scheduling an event. Extract event details (title, date, time range) from their message and create a calendar event. Always use the create_calendar_event tool when scheduling.';
    } else if (activeAction === 'email') {
      actionContext = '\n\nCURRENT ACTION: The user wants to send or compose an email. Help them draft or send email messages.';
    } else if (activeAction === 'todo') {
      actionContext = '\n\nCURRENT ACTION: The user is creating a to-do item or task. Help them organize their tasks.';
    }

    const systemPrompt = `You are the business operator for ${profile?.business_name || 'this business'}. You are not an assistant — you are an active partner who knows this business inside out and acts on it.

You have full access to the user's Gmail, Google Calendar, Notion, tasks, and clients. You already know their business, their clients, their priorities, and their current workload.

Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

ABOUT THIS BUSINESS:
- Business: ${profile?.business_name || 'Not set'}
- Type: ${profile?.business_type || 'Not set'}
- Industry: ${profile?.industry || 'Not set'}
- Brief: ${profile?.business_brief || 'Not set'}
- Target clients: ${profile?.target_clients || 'Not set'}
- Tools used: ${profile?.main_tools || 'Not set'}

MINDSET:
- You are proactive, not passive. When you answer a question, also flag what the user should probably do next.
- You reason before you respond. Before answering, identify: what is the real problem, what context is relevant, and what is the best possible action — not the easiest one.
- You know this business. You do not ask for information you already have. You do not give generic advice. Every response is grounded in the user's actual context.
- When you see an opportunity, a risk, or a next step the user hasn't thought of — say it.

BEHAVIOUR:
- Execute immediately. Do not ask for confirmation unless the action is irreversible.
- If something is ambiguous, ask one short question before acting.
- Never ask more than one question at a time. If you need clarification, pick the single most important question and ask only that.
- Never re-ask for context already provided in this session.
- Tone: semi-formal. Direct, clear, no filler. Not corporate, not casual.
- No emojis unless quoting something that already contains one.
- ALWAYS respond in English, no matter what language the user writes in. Never switch to Portuguese, Spanish, or any other language in your replies.
- Keep responses short unless detail is explicitly needed or the situation demands analysis.

WHEN THE USER ASKS SOMETHING LIKE "what follow-ups do I have today?" or similar:
- Do not just list tasks. Analyse: who needs contact, when is the best time, what should be said, and why.
- Cross-reference available CRM data, Gmail, and Kanban before answering.
- Suggest the action, not just the information.

WHEN THE USER ASKS FOR AN OPINION OR STRATEGY:
- Give a real answer. Not "it depends." Say what you would do and why.
- Be direct even if the answer is uncomfortable.

Date Inputs (date_string parameter on calendar tools):
- The date_string parameter understands relative phrases directly: "today", "tomorrow", "day after tomorrow", "yesterday", "next monday" (or any weekday), "next week", "next month", "in 3 days", "in a week", "in 2 weeks", "in a month", as well as explicit dates ("dia 15", "15 de julho", "July 15").
- NEVER ask the user to convert a relative date into an explicit one yourself — just pass their exact relative phrase (e.g. "tomorrow") straight into date_string. The tool resolves it.
- Only ask a clarifying question if the user's timing is genuinely ambiguous (e.g. they said nothing about when at all).
- Default times if unspecified: 14:00-16:00.

CONTEXT AWARENESS & SMART INFERENCE:
- You have full context from recent emails, calendar events, and conversations
- When the user refers to something you just read (an email, meeting, etc.), use that context immediately
- DO NOT ask for information you can infer from context. Examples:
  * If you just read "Flow wants to reschedule Tuesday meeting to Wednesday", and user says "reschedule it":
    → You KNOW: old date=Tuesday, new date=Wednesday, email recipient=Flow/support.flowapp@gmail.com
    → Do NOT ask "which meeting?" or "what date?" - you have the context
  * If user says "send confirmation email" after reading meeting reschedule request:
    → You KNOW what to confirm and who to send to (from the email)
    → Just do it, don't ask for details
- Make intelligent assumptions based on conversation flow
- Extract implicit information: if meeting details are clear from context, use them
- Be proactive: suggest next logical steps based on what you just learned

Email Context Memory:
- When you read an email, remember: sender, subject, date, content, any requests/action items
- In follow-up messages, reference this context naturally
- If user action relates to an email you just read, apply that context immediately
- Extract: Who sent it? What do they want? What action is needed? Who should you reply to?

Date Parsing Rules:
- If user says "dia 15", use current month if day 15 hasn't passed, else next month
- If user says "15 de julho", use current year if July 15 hasn't passed, else next year
- Always use the current/next applicable year
- Default times: 14:00-16:00 if not specified

Notion Rules:
- When user asks "what are my pages?", "list my pages", "show me my pages", etc. → Use list_notion_pages to show them
- Always proactively list pages when the user seems to be exploring their Notion workspace

Notion Navigation Rules:
- Recognize hierarchical paths in ANY of these formats:
  * Using ">": "mente do nicolau > trabalho > projetos"
  * Using ",": "mente do nicolau, trabalho, projetos"
  * Using natural language: "mente do nicolau depois trabalho depois projetos"
  * Or: "mente do nicolau after trabalho after projetos" (English)
  * Or: "mente do nicolau em seguida trabalho em seguida projetos" (Portuguese)
- Be flexible with typos: "nicolu" → "Nicolau", "trablahro" → "Trabalho"
- When you detect a path (with >, comma, or "depois"/"after"/"em seguida"), extract it and use navigate_notion_path
- Example: User says "add to mente do nicolau, trabalho, projetos"
  * Extract path: ["mente do nicolau", "trabalho", "projetos"]
  * Call navigate_notion_path with this array
  * Then create_notion_page with the returned ID
- This allows you to create pages deep inside hierarchical structures

Client Linking Rules:
- When creating an event and the user mentions a client, contact, or company it's with (e.g. "with Acme", "reunião com a Acme", "call to John"), pass that name as client_name on create_calendar_event. It gets silently matched against the CRM and linked as an attendee — no invite is sent automatically.
- Only call send_calendar_invite when the user explicitly asks to notify/invite the client (e.g. "send the invite", "avisa o cliente"). Never call it right after creating an event on your own initiative.

Calendar Selection Rules:
- ALWAYS analyze the event content to determine its type (work, personal, study, vacation, birthday, etc.)
- ALWAYS match the event type to one of the available calendars by analyzing their names and descriptions
- Look for keywords in calendar names that match the event type:
  * "Trabalho", "Work", "Business", "Meeting", "Reunião" → work events
  * "Rotina", "Personal", "Pessoal", "Daily" → personal/routine events
  * "Estudo", "Aulas", "Estudante", "Educação", "Education" → study/education events
  * "Férias", "Holidays", "Vacation" → vacation/holiday events
  * "Aniversários", "Birthdays" → birthday events
- Event keywords to match:
  * "reunião", "meeting", "apresentação", "presentation", "call", "conference" → Trabalho calendar
  * "aula", "lecture", "estudo", "study", "exame", "exam" → Estudo/Education calendar
  * "férias", "vacation", "holiday" → Férias calendar
  * "aniversário", "birthday", "comemoração" → Aniversários calendar
- When naming calendars match the event type, USE THAT CALENDAR - do NOT use the primary calendar
- Only use the primary calendar if no other calendar matches the event type
- IMPORTANT: Extract and use the exact calendar ID from the calendars list shown in "Available Calendars", not "primary"

Calendar Knowledge:
- You have full access to the user's calendar. You know their upcoming events, availability, and commitments.
- IMPORTANT: Whenever the user asks about their schedule, meetings, or events (e.g. "what's next", "what is my next meeting", "what do I have tomorrow", "o que vem a seguir"), ALWAYS call the show_calendar_events tool instead of describing the event(s) in plain text. Use count for "next" style questions and date_filter for "today"/"tomorrow"/"this week"/weekday questions.
- The tool automatically caps the visual cards at 3 and asks the user to narrow down (a specific day or topic) if there are more. Do not add your own extra text on top of the tool's response — its message already handles this.
- Provide helpful scheduling suggestions based on available time slots.
- Use the calendar data (and the show_calendar_events tool) to answer questions about conflicts and availability.
- When user asks to "reagendar" (reschedule) or "mover" an event, you should:
  1. First delete the old event using delete_calendar_event tool
  2. Then create a new event using create_calendar_event tool with the new time/date
  3. If they say "1 hora mais tarde" (1 hour later), adjust the time accordingly

Complex Operations:
- DIVIDE/SPLIT an event: Delete the original and create 2 (or more) shorter events with the specified time slots
  * Example: "divide a reunião em 2 partes iguais com intervalo de 30min" = delete original, create 2 events of equal duration with 30min break
- COMBINE/MERGE events: Delete multiple events and create a single longer event
- DUPLICATE events: Delete one occurrence and create multiple copies with different times
- For ANY complex operation: Use the available tools (delete + create) in sequence to achieve the result
- Always calculate times accurately and preserve event names

Response Format for Calendar Actions:
- When creating/scheduling events: Start with "Scheduled [event name]:" or "Scheduled for [time]:" (very simple)
- When rescheduling: Start with "Rescheduled to [time]:" or "Moved to [time]:"
- When deleting: Start with "Removed the event:" or "Deleted the meeting:"
- Keep the opening sentence VERY simple and short - just the action and time/date
- Example: "Scheduled for 5pm:" then show the event bubble
- Do NOT include full explanations in the text - let the bubble show the details

Quoting rule: never use emojis in your own writing, except when directly quoting something that already contains one (e.g. an email subject, a Notion page name/icon) — reproduce it as-is, don't add new ones.${recentContext}${calendarsInfo}${calendarContext}${kanbanContext}${clientsContext}${actionContext}`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      tools: tools as any,
      messages: messages,
    });

    console.log('Claude response:', response);

    // Handle tool calls
    if (response.stop_reason === 'tool_use') {
      const toolUse = response.content.find((block: any) => block.type === 'tool_use') as any;

      console.log('Tool called:', toolUse?.name);
      console.log('Tool input:', JSON.stringify(toolUse?.input, null, 2));

      // For read-only tools that fetch raw data (get_kanban_tasks, get_clients), feed the
      // result back to Claude so it answers in natural language instead of dumping JSON
      // straight at the user.
      const respondWithToolResult = async (resultData: any) => {
        const followUp = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            ...messages,
            { role: 'assistant', content: response.content },
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(resultData),
                },
              ],
            },
          ],
        });

        const textBlock = followUp.content.find((block: any) => block.type === 'text') as any;
        const finalText = textBlock && 'text' in textBlock ? textBlock.text : 'No response';

        return saveAssistantReply({ content: finalText, role: 'assistant' });
      };

      if (toolUse && toolUse.name === 'reschedule_event' && validAccessToken) {
        const { old_event_title, summary, description, date_string, start_time, end_time, calendar_id } = toolUse.input;

        console.log('Rescheduling event:', { old_event_title, summary, date_string, start_time, end_time });

        // Parse the date
        const dates = parseSmartDate(date_string);
        if (!dates) {
          return saveAssistantReply({
            content: 'I could not understand that date. Try being more specific (e.g., "July 15").',
            role: 'assistant',
          });
        }

        // Apply custom times if provided
        let startDateTime = new Date(dates.start);
        let endDateTime = new Date(dates.end);

        if (start_time) {
          const [hours, minutes] = start_time.split(':').map(Number);
          startDateTime.setHours(hours, minutes, 0);
        }

        if (end_time) {
          const [hours, minutes] = end_time.split(':').map(Number);
          endDateTime.setHours(hours, minutes, 0);
        }

        try {
          const result = await rescheduleEvent(validAccessToken, old_event_title, {
            summary,
            description,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            calendarId: calendar_id,
          });

          if (result.success) {
            // Find the calendar name
            const selectedCalendar = calendars?.find((cal: any) => cal.id === calendar_id);
            const calendarName = selectedCalendar?.summary || 'Calendário';

            // Format date and time
            const dayOfWeekStr = startDateTime.toLocaleDateString('pt-PT', { weekday: 'long' });
            const dateStr = startDateTime.toLocaleDateString('pt-PT');
            const timeStr = `${start_time || '14:00'} - ${end_time || '16:00'}`;

            if (userId) await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'reschedule_event' });

            return saveAssistantReply({
              content: 'Rescheduled:',
              role: 'assistant',
              bubbles: [
                {
                  type: 'event',
                  title: summary,
                  subtitle: calendarName,
                  metadata: [
                    {
                      label: dayOfWeekStr.charAt(0).toUpperCase() + dayOfWeekStr.slice(1),
                      value: dateStr,
                      color: 'accent',
                    },
                    {
                      label: userLanguage === 'pt' ? 'Horário' : 'Time',
                      value: timeStr,
                      color: 'accent',
                    },
                  ],
                  badge: {
                    label: userLanguage === 'pt' ? 'Reagendado' : 'Rescheduled',
                    color: 'warning',
                  },
                },
              ],
            });
          } else {
            return saveAssistantReply({
              content: result.message,
              role: 'assistant',
            });
          }
        } catch (error) {
          console.error('Error rescheduling event:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return saveAssistantReply({
            content: `Error rescheduling the event: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'delete_calendar_event' && validAccessToken) {
        const { event_title } = toolUse.input;

        console.log('Delete tool called with title:', event_title);

        try {
          console.log('Calling findAndDeleteEvent...');
          const result = await findAndDeleteEvent(validAccessToken, event_title);
          console.log('findAndDeleteEvent result:', result);

          if (result.success) {
            console.log('Event deleted successfully');
            if (userId) await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'delete_calendar_event' });
            return saveAssistantReply({
              content: 'Removed:',
              role: 'assistant',
              bubbles: [
                {
                  type: 'event',
                  title: result.deletedEvent,
                  metadata: [
                    {
                      label: result.deletedEventDayOfWeek || 'Date',
                      value: result.deletedEventDate || new Date().toLocaleDateString('pt-PT'),
                      color: 'default',
                    },
                    {
                      label: userLanguage === 'pt' ? 'Horário' : 'Time',
                      value: result.deletedEventTime || '--:--',
                      color: 'default',
                    },
                  ],
                  badge: {
                    label: userLanguage === 'pt' ? 'Removido' : 'Removed',
                    color: 'error',
                  },
                },
              ],
            });
          } else {
            console.log('Event not found:', result.message);
            return saveAssistantReply({
              content: result.message,
              role: 'assistant',
            });
          }
        } catch (error) {
          console.error('Error deleting event:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error('Error details:', errorMsg);
          return saveAssistantReply({
            content: `Error deleting the event: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'send_calendar_invite' && validAccessToken) {
        const { event_title } = toolUse.input;

        try {
          const result = await findAndSendInvite(validAccessToken, event_title);

          if (result.success) {
            if (userId) await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'send_calendar_invite' });
            return saveAssistantReply({
              content: `Invite sent to ${result.attendeeEmail} for "${result.eventTitle}".`,
              role: 'assistant',
            });
          } else {
            return saveAssistantReply({
              content: result.message,
              role: 'assistant',
            });
          }
        } catch (error) {
          console.error('Error sending calendar invite:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return saveAssistantReply({
            content: `Error sending the invite: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'show_calendar_events' && validAccessToken) {
        const { count = 1, date_filter } = toolUse.input;

        const range = resolveRelativeDateRange(date_filter);
        let matched = upcomingEvents;

        if (range) {
          matched = upcomingEvents.filter((event: any) => {
            const start = new Date(event.start?.dateTime || event.start?.date);
            return start >= range.start && start < range.end;
          });
        } else {
          matched = upcomingEvents.slice(0, count);
        }

        if (matched.length === 0) {
          return saveAssistantReply({
            content: calendarFetchFailed
              ? (userLanguage === 'pt'
                  ? 'Não consegui aceder ao teu calendário agora. Tenta novamente em instantes.'
                  : 'I could not reach your calendar right now. Please try again in a moment.')
              : (userLanguage === 'pt'
                  ? 'Não encontrei nenhum evento nesse período.'
                  : 'No events found for that period.'),
            role: 'assistant',
          });
        }

        if (userId) await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'show_calendar_events' });

        const locale = userLanguage === 'pt' ? 'pt-PT' : userLanguage === 'es' ? 'es-ES' : 'en-US';
        const MAX_SHOWN = 3;
        const shown = matched.slice(0, MAX_SHOWN);
        const remaining = matched.length - shown.length;

        let content: string;
        if (matched.length === 1) {
          content = userLanguage === 'pt' ? 'Aqui está o evento:' : 'Here is the event:';
        } else if (remaining > 0) {
          content = userLanguage === 'pt'
            ? `Encontrei ${matched.length} eventos. A mostrar os primeiros ${MAX_SHOWN} — e mais ${remaining}. Queres ver algo específico ou um dia em particular?`
            : `Found ${matched.length} events. Showing the first ${MAX_SHOWN} — and ${remaining} more. Want to see something specific, or a particular day?`;
        } else {
          content = userLanguage === 'pt' ? `Encontrei ${matched.length} eventos:` : `Found ${matched.length} events:`;
        }

        return saveAssistantReply({
          content,
          role: 'assistant',
          bubbles: shown.map((event: any) => {
            const startDate = new Date(event.start?.dateTime || event.start?.date);
            const endDate = new Date(event.end?.dateTime || event.end?.date);
            const dayOfWeek = startDate.toLocaleDateString(locale, { weekday: 'long' });
            const timeStr = event.start?.dateTime
              ? `${startDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`
              : (userLanguage === 'pt' ? 'Dia inteiro' : 'All day');

            return {
              type: 'event',
              title: event.summary || (userLanguage === 'pt' ? 'Sem título' : 'Untitled'),
              metadata: [
                {
                  label: dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1),
                  value: startDate.toLocaleDateString(locale),
                  color: 'accent',
                },
                {
                  label: userLanguage === 'pt' ? 'Horário' : 'Time',
                  value: timeStr,
                  color: 'accent',
                },
              ],
              badge: {
                label: userLanguage === 'pt' ? 'Próximo' : 'Upcoming',
                color: 'success',
              },
            };
          }),
        });
      }

      if (toolUse && toolUse.name === 'create_calendar_event' && validAccessToken) {
        const { summary, description, date_string, start_time, end_time, calendar_id, client_name } = toolUse.input;

        // Improve the event title with proper formatting and accents
        const improvedSummary = improveEventTitle(summary);

        console.log('Creating event:', {
          originalSummary: summary,
          improvedSummary: improvedSummary,
          description,
          date_string,
          start_time,
          end_time,
          calendar_id,
          client_name,
        });

        // If a client/company was mentioned, look them up in the CRM and silently
        // attach their email as an attendee (no invite sent) for reliable linking later.
        let attendeeEmail: string | undefined;
        let matchedClientName: string | undefined;
        if (client_name && userId) {
          try {
            const { data: matchedClients } = await supabaseServer
              .from('clients')
              .select('name, company, email')
              .eq('user_id', userId)
              .or(`name.ilike.%${client_name}%,company.ilike.%${client_name}%`)
              .limit(1);

            const match = matchedClients?.[0];
            if (match?.email) {
              attendeeEmail = match.email;
              matchedClientName = match.name;
            }
          } catch (error) {
            console.log('Could not look up client for attendee linking');
          }
        }

        // Parse the date
        const dates = parseSmartDate(date_string);
        if (!dates) {
          return saveAssistantReply({
            content: 'I could not understand that date. Try being more specific (e.g., "July 15").',
            role: 'assistant',
          });
        }

        // Apply custom times if provided
        let startDateTime = new Date(dates.start);
        let endDateTime = new Date(dates.end);

        if (start_time) {
          const [hours, minutes] = start_time.split(':').map(Number);
          startDateTime.setHours(hours, minutes, 0);
        }

        if (end_time) {
          const [hours, minutes] = end_time.split(':').map(Number);
          endDateTime.setHours(hours, minutes, 0);
        }

        try {
          console.log('Creating event with:', {
            summary: improvedSummary,
            description,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            calendarId: calendar_id,
          });

          const event = await createEvent(validAccessToken, {
            summary: improvedSummary,
            description,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            calendarId: calendar_id,
            attendeeEmail,
          });

          console.log('Event created successfully:', event?.id, attendeeEmail ? `linked to ${attendeeEmail}` : '');

          if (userId) {
            await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'create_calendar_event' });
            await captureServerEvent(userId, 'calendar_event_created', {
              has_client_linked: Boolean(matchedClientName),
              has_description: Boolean(description),
            });
          }

          // Find the calendar name
          const selectedCalendar = calendars?.find((cal: any) => cal.id === calendar_id);
          const calendarName = selectedCalendar?.summary || 'Calendário';

          // Format date and time in user's language
          const locale = userLanguage === 'pt' ? 'pt-PT' : userLanguage === 'es' ? 'es-ES' : 'en-US';
          const dateStr = startDateTime.toLocaleDateString(locale);
          const timeStr = `${start_time || '14:00'} - ${end_time || '16:00'}`;

          // Get localized day name and action text
          const { dayOfWeek: dayOfWeekStr } = getLocalizedText(startDateTime, 'created', userLanguage);

          return saveAssistantReply({
            content: 'Scheduled:',
            role: 'assistant',
            bubbles: [
              {
                type: 'event',
                title: improvedSummary,
                subtitle: calendarName,
                metadata: [
                  {
                    label: dayOfWeekStr,
                    value: dateStr,
                    color: 'accent',
                  },
                  {
                    label: userLanguage === 'pt' ? 'Horário' : 'Time',
                    value: timeStr,
                    color: 'accent',
                  },
                  ...(matchedClientName
                    ? [{ label: userLanguage === 'pt' ? 'Cliente' : 'Client', value: matchedClientName, color: 'accent' as const }]
                    : []),
                ],
                badge: {
                  label: userLanguage === 'pt' ? 'Agendado' : 'Scheduled',
                  color: 'success',
                },
              },
            ],
          });
        } catch (error) {
          console.error('Error creating event:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error('Error details:', errorMsg);
          return saveAssistantReply({
            content: `Error creating the calendar event: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'read_email_full' && validAccessToken) {
        const { email_id } = toolUse.input;

        console.log('Reading full email content:', email_id);

        try {
          const email = await getFullEmailContent(validAccessToken, email_id);

          if (!email || !email.body) {
            console.log('Email or body is empty:', email);
            return saveAssistantReply({
              content: userLanguage === 'pt'
                ? 'Desculpa, o email não tem conteúdo ou não consegui ler.'
                : 'Sorry, the email has no content or I couldn\'t read it.',
              role: 'assistant',
            });
          }

          if (userId) await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'read_email_full' });

          return saveAssistantReply({
            content: email.body,
            role: 'assistant',
            bubbles: [
              {
                type: 'email',
                title: email.subject,
                subtitle: email.from,
                metadata: [
                  {
                    label: userLanguage === 'pt' ? 'Para' : 'To',
                    value: email.to,
                    color: 'default',
                  },
                  {
                    label: userLanguage === 'pt' ? 'Data' : 'Date',
                    value: email.date,
                    color: 'default',
                  },
                ],
                meta: {
                  emailId: email_id,
                  fromEmail: extractEmailAddress(email.from),
                  subject: email.subject,
                },
              },
            ],
          });
        } catch (error) {
          console.error('Error reading full email:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return saveAssistantReply({
            content: userLanguage === 'pt'
              ? `Erro ao ler email completo: ${errorMsg}`
              : `Error reading full email: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'search_emails' && validAccessToken) {
        const { query } = toolUse.input;

        console.log('Searching emails with query:', query);

        try {
          const emails = await searchEmails(validAccessToken, query, 5);

          console.log(`Found ${emails.length} emails`);

          if (userId) await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'search_emails' });

          if (emails.length === 0) {
            return saveAssistantReply({
              content: userLanguage === 'pt' ? 'Não encontrei nenhum email com essa pesquisa.' : 'I didn\'t find any emails matching that search.',
              role: 'assistant',
            });
          }

          // If user asked for the last email, summarize it
          if (query === 'is:unread' || query.includes('last') || query.includes('último') || query.includes('recebido')) {
            const latestEmail = emails[0]; // Most recent is first

            if (latestEmail) {
              // Ask Claude to summarize the email content in the user's language
              const languageInstructions = {
                pt: `Summarize in Portuguese. Respond concisely (2-3 sentences max).`,
                en: `Summarize in English. Respond concisely (2-3 sentences max).`,
                es: `Summarize in Spanish. Respond concisely (2-3 sentences max).`,
              };

              const summaryResponse = await client.messages.create({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 300,
                system: `You are an email summarizer. ${languageInstructions[userLanguage as keyof typeof languageInstructions] || languageInstructions.en}
Include the main points and action items if any. Do not add headers or markdown formatting.
Tone: semi-formal. Never use emojis, even if the original email contains them.`,
                messages: [
                  {
                    role: 'user',
                    content: `Email from: ${latestEmail.from}\nSubject: ${latestEmail.subject}\nDate: ${latestEmail.date}\n\nContent:\n${latestEmail.body}`,
                  },
                ],
              });

              const summaryText = summaryResponse.content[0];
              let summary = summaryText && 'text' in summaryText ? summaryText.text : latestEmail.body.substring(0, 200);

              // Clean up summary - remove any markdown headers
              summary = summary.replace(/^#+\s*/gm, '').trim();

              // Format date in user's language
              const dateObj = new Date(latestEmail.date);
              const dateLocale = userLanguage === 'pt' ? 'pt-PT' : userLanguage === 'es' ? 'es-ES' : 'en-US';
              const formattedDate = dateObj.toLocaleDateString(dateLocale, {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              return saveAssistantReply({
                content: userLanguage === 'pt' ? 'Email não lido:' : 'Unread email:',
                role: 'assistant',
                bubbles: [
                  {
                    type: 'email',
                    title: latestEmail.subject,
                    subtitle: latestEmail.from,
                    description: summary,
                    metadata: [
                      {
                        label: userLanguage === 'pt' ? 'Data' : 'Date',
                        value: formattedDate,
                        color: 'default',
                      },
                    ],
                    badge: {
                      label: userLanguage === 'pt' ? 'Não lido' : 'Unread',
                      color: 'warning',
                    },
                    meta: {
                      emailId: latestEmail.id,
                      fromEmail: extractEmailAddress(latestEmail.from),
                      subject: latestEmail.subject,
                    },
                  },
                ],
              });
            }
          }

          // Format emails as bubbles for display with full email info
          const emailBubbles = emails.map((email) => ({
            type: 'email' as const,
            title: email.subject,
            subtitle: email.from,
            description: email.body.substring(0, 200) + (email.body.length > 200 ? '...' : ''),
            metadata: [
              {
                label: userLanguage === 'pt' ? 'Data' : 'Date',
                value: email.date.split(/\s+\d{2}:\d{2}:\d{2}/)[0], // Remove time and timezone
                color: 'default' as const,
              },
            ],
            badge: {
              label: userLanguage === 'pt' ? 'Email' : 'Email',
              color: 'default' as const,
            },
            meta: {
              emailId: email.id,
              fromEmail: extractEmailAddress(email.from),
              subject: email.subject,
            },
          }));

          return saveAssistantReply({
            content: userLanguage === 'pt'
              ? `Encontrei ${emails.length} email(s):`
              : `Found ${emails.length} email(s):`,
            role: 'assistant',
            bubbles: emailBubbles,
          });
        } catch (error) {
          console.error('Error searching emails:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return saveAssistantReply({
            content: userLanguage === 'pt'
              ? `Erro ao procurar emails: ${errorMsg}`
              : `Error searching emails: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'draft_email') {
        const { to, subject, body } = toolUse.input;

        console.log('Drafting email for:', to);

        if (userId) await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'draft_email' });

        // Return draft bubble instead of sending
        return saveAssistantReply({
          content: userLanguage === 'pt' ? 'Draft:' : 'Draft:',
          role: 'assistant',
          bubbles: [
            {
              type: 'email_draft',
              title: subject,
              subtitle: to,
              meta: { to, subject, body },
            },
          ],
        });
      }

      if (toolUse && toolUse.name === 'delete_email' && validAccessToken) {
        const { query } = toolUse.input;

        console.log('Deleting email with query:', query);

        try {
          const emails = await searchEmails(validAccessToken, query, 1);

          if (emails.length === 0) {
            return saveAssistantReply({
              content: userLanguage === 'pt'
                ? 'Não encontrei nenhum email para deletar.'
                : 'I didn\'t find any email to delete.',
              role: 'assistant',
            });
          }

          await deleteEmail(validAccessToken, emails[0].id);

          if (userId) await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'delete_email' });

          return saveAssistantReply({
            content: userLanguage === 'pt'
              ? `Email "${emails[0].subject}" eliminado com sucesso.`
              : `Email "${emails[0].subject}" deleted successfully.`,
            role: 'assistant',
          });
        } catch (error) {
          console.error('Error deleting email:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return saveAssistantReply({
            content: userLanguage === 'pt'
              ? `Erro ao deletar email: ${errorMsg}`
              : `Error deleting email: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      // Notion tools
      if (toolUse && toolUse.name === 'search_notion' && userId) {
        const { query } = toolUse.input;
        const { searchNotionPages } = await import('@/lib/notion');

        console.log('Searching Notion for:', query);

        try {
          const pages = await searchNotionPages(userId, query);

          if (pages.length === 0) {
            return saveAssistantReply({
              content: userLanguage === 'pt'
                ? `Não encontrei nada com "${query}". Qual é o nome exato da página/database que queres?`
                : `I didn't find anything with "${query}". What's the exact name of the page/database?`,
              role: 'assistant',
            });
          }

          if (userId) await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'search_notion' });

          // Show top 5 closest matches and ask for confirmation
          const topMatches = pages.slice(0, 5);

          return saveAssistantReply({
            content: userLanguage === 'pt'
              ? `Encontrei estas opções. Qual delas é a que procuras?`
              : `I found these options. Which one is it?`,
            role: 'assistant',
            bubbles: topMatches.map((p: any) => {
              const title = p.properties?.title?.[0]?.plain_text || p.title?.[0]?.plain_text || 'Untitled';
              const icon = p.icon?.emoji;
              return {
                type: 'notion',
                title: icon ? `${icon} ${title}` : title,
              };
            }),
            _notionResults: pages.map((p: any) => ({
              id: p.id,
              title: p.properties?.title?.[0]?.plain_text || p.title?.[0]?.plain_text || 'Untitled',
            })),
          });
        } catch (error) {
          console.error('Error searching Notion:', error);
          return saveAssistantReply({
            content: userLanguage === 'pt'
              ? 'Erro ao buscar no Notion. Certifique-se de que o Notion está conectado.'
              : 'Error searching Notion. Make sure Notion is connected.',
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'create_notion_page' && userId) {
        const { parent_id, title, status, description } = toolUse.input;
        const { createNotionPage } = await import('@/lib/notion');

        console.log('Creating Notion page:', { parent_id, title });

        try {
          const properties: Record<string, any> = {};

          if (status) {
            properties['Status'] = {
              status: {
                name: status,
              },
            };
          }

          const page = await createNotionPage(userId, parent_id, title, properties);

          await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'create_notion_page' });
          await captureServerEvent(userId, 'notion_page_created', { has_status: Boolean(status) });

          return saveAssistantReply({
            content: userLanguage === 'pt' ? `Criada:` : `Created:`,
            role: 'assistant',
            bubbles: [
              {
                type: 'notion',
                title,
                description: description || undefined,
                badge: {
                  label: status || (userLanguage === 'pt' ? 'Criada' : 'Created'),
                  color: 'success',
                },
              },
            ],
          });
        } catch (error) {
          console.error('Error creating Notion page:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return saveAssistantReply({
            content: userLanguage === 'pt'
              ? `Erro ao criar página: ${errorMsg}`
              : `Error creating page: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'query_notion_database' && userId) {
        const { database_id } = toolUse.input;
        const { getNotionDatabase } = await import('@/lib/notion');

        console.log('Querying Notion database:', database_id);

        try {
          const items = await getNotionDatabase(userId, database_id);

          await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'query_notion_database' });

          if (items.length === 0) {
            return saveAssistantReply({
              content: userLanguage === 'pt'
                ? 'Este database está vazio.'
                : 'This database is empty.',
              role: 'assistant',
            });
          }

          const topItems = items.slice(0, 10);

          return saveAssistantReply({
            content: userLanguage === 'pt'
              ? `Encontrei ${items.length} item(ns) neste database${items.length > 10 ? ' (a mostrar os primeiros 10)' : ''}:`
              : `Found ${items.length} item(s) in this database${items.length > 10 ? ' (showing the first 10)' : ''}:`,
            role: 'assistant',
            bubbles: topItems.map((item: any) => ({
              type: 'notion',
              title: item.properties?.title?.[0]?.plain_text || 'Untitled',
              badge: item.properties?.Status?.status?.name
                ? { label: item.properties.Status.status.name, color: 'info' }
                : undefined,
            })),
          });
        } catch (error) {
          console.error('Error querying Notion database:', error);
          return saveAssistantReply({
            content: userLanguage === 'pt'
              ? 'Erro ao consultar o database.'
              : 'Error querying database.',
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'list_notion_pages' && userId) {
        const { listNotionRootPages } = await import('@/lib/notion');

        console.log('Listing Notion root pages');

        try {
          const pages = await listNotionRootPages(userId);

          if (pages.length === 0) {
            return saveAssistantReply({
              content: userLanguage === 'pt'
                ? 'Não encontrei nenhuma página no Notion.'
                : 'No pages found in your Notion.',
              role: 'assistant',
            });
          }

          // Extract and filter pages with proper titles
          const pagesWithTitles = pages
            .map((p: any) => {
              // Try multiple ways to extract the title
              const title = p.properties?.title?.[0]?.plain_text ||
                           (typeof p.title === 'string' ? p.title : null) ||
                           p.title?.[0]?.plain_text ||
                           p.child_page?.title ||
                           p.child_database?.title ||
                           null;

              // Skip pages that are just IDs with no meaningful title
              if (!title || title.match(/^[a-f0-9-]{36}$/)) {
                return null;
              }

              const icon = p.icon?.emoji;
              return { title, icon, id: p.id };
            })
            .filter((p): p is { title: string; icon: string | undefined; id: string } => p !== null)
            .slice(0, 10); // Limit to top 10

          await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'list_notion_pages' });

          const heading = userLanguage === 'pt'
            ? 'Aqui estão as tuas principais páginas do Notion:'
            : 'Here are your main Notion pages:';

          return saveAssistantReply({
            content: heading,
            role: 'assistant',
            bubbles: pagesWithTitles.map((p) => ({
              type: 'notion',
              title: p.icon ? `${p.icon} ${p.title}` : p.title,
            })),
          });
        } catch (error) {
          console.error('Error listing Notion pages:', error);
          return saveAssistantReply({
            content: userLanguage === 'pt'
              ? 'Erro ao listar páginas do Notion.'
              : 'Error listing Notion pages.',
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'navigate_notion_path') {
        const { path } = toolUse.input;
        const { navigateNotionPath } = await import('@/lib/notion');

        console.log('Navigating Notion path:', path, 'userId:', userId);

        if (!userId) {
          return saveAssistantReply({
            content: userLanguage === 'pt'
              ? 'Erro: não consegui identificar seu usuário. Tenta fazer login novamente.'
              : 'Error: Could not identify your user. Try logging in again.',
            role: 'assistant',
          });
        }

        try {
          const result = await navigateNotionPath(userId, path);

          if (!result) {
            return saveAssistantReply({
              content: userLanguage === 'pt'
                ? `Não consegui encontrar o caminho: ${path.join(' > ')}`
                : `I couldn't find the path: ${path.join(' > ')}`,
              role: 'assistant',
            });
          }

          await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'navigate_notion_path' });

          return saveAssistantReply({
            content: userLanguage === 'pt' ? `Encontrada:` : `Found:`,
            role: 'assistant',
            bubbles: [
              {
                type: 'notion',
                title: result.title,
                subtitle: path.join(' > '),
              },
            ],
            _notionPathResult: result,
          });
        } catch (error) {
          console.error('Error navigating Notion path:', error);
          return saveAssistantReply({
            content: userLanguage === 'pt'
              ? 'Erro ao navegar no Notion.'
              : 'Error navigating Notion.',
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'delete_notion_page' && userId) {
        const { page_id, page_name } = toolUse.input;
        const { deleteNotionPage } = await import('@/lib/notion');

        console.log('Deleting Notion page:', page_id);

        try {
          await deleteNotionPage(userId, page_id);

          await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'delete_notion_page' });

          return saveAssistantReply({
            content: userLanguage === 'pt' ? `Removida:` : `Deleted:`,
            role: 'assistant',
            bubbles: [
              {
                type: 'notion',
                title: page_name,
                badge: { label: userLanguage === 'pt' ? 'Removida' : 'Deleted', color: 'error' },
              },
            ],
          });
        } catch (error) {
          console.error('Error deleting Notion page:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return saveAssistantReply({
            content: userLanguage === 'pt'
              ? `Erro ao deletar página: ${errorMsg}`
              : `Error deleting page: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'update_notion_page_status' && userId) {
        const { page_id, status } = toolUse.input;
        const { updateNotionPage } = await import('@/lib/notion');

        console.log('Updating Notion page status:', page_id, status);

        try {
          await updateNotionPage(userId, page_id, {
            Status: {
              status: {
                name: status,
              },
            },
          });

          await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'update_notion_page_status' });

          return saveAssistantReply({
            content: userLanguage === 'pt' ? `Atualizada:` : `Updated:`,
            role: 'assistant',
            bubbles: [
              {
                type: 'notion',
                title: userLanguage === 'pt' ? 'Página do Notion' : 'Notion Page',
                badge: { label: status, color: 'info' },
              },
            ],
          });
        } catch (error) {
          console.error('Error updating Notion page status:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return saveAssistantReply({
            content: userLanguage === 'pt'
              ? `Erro ao atualizar status: ${errorMsg}`
              : `Error updating status: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'get_kanban_tasks' && userId) {
        const { column = 'all', priority } = toolUse.input;

        try {
          let query = supabaseServer
            .from('kanban_tasks')
            .select('*')
            .eq('user_id', userId);

          if (column && column !== 'all') {
            query = query.eq('column_id', column);
          }
          if (priority) {
            query = query.eq('priority', priority);
          }

          const { data: tasks, error } = await query.order('created_at', { ascending: false });
          if (error) throw error;

          await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'get_kanban_tasks' });

          return await respondWithToolResult(tasks || []);
        } catch (error) {
          console.error('Error fetching kanban tasks:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return saveAssistantReply({
            content: `Error fetching tasks: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'create_kanban_task' && userId) {
        const { title, priority = 'medium', column = 'todo', category = 'task', description } = toolUse.input;

        try {
          const { data: task, error } = await supabaseServer
            .from('kanban_tasks')
            .insert([
              {
                user_id: userId,
                title,
                priority,
                column_id: column,
                category,
                description: description || null,
              },
            ])
            .select()
            .single();

          if (error) throw error;

          await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'create_kanban_task' });

          return saveAssistantReply({
            content: 'Added:',
            role: 'assistant',
            bubbles: [
              {
                type: 'task',
                title: task.title,
                description: task.description || undefined,
                badge: { label: task.priority, color: task.priority === 'high' ? 'error' : task.priority === 'low' ? 'default' : 'warning' },
              },
            ],
          });
        } catch (error) {
          console.error('Error creating kanban task:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return saveAssistantReply({
            content: `Error creating task: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'move_kanban_task' && userId) {
        const { task_id, column } = toolUse.input;

        try {
          const { data: task, error } = await supabaseServer
            .from('kanban_tasks')
            .update({ column_id: column })
            .eq('id', task_id)
            .eq('user_id', userId)
            .select()
            .single();

          if (error) throw error;

          await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'move_kanban_task' });

          return saveAssistantReply({
            content: 'Moved:',
            role: 'assistant',
            bubbles: [
              {
                type: 'task',
                title: task.title,
                badge: { label: column, color: 'success' },
              },
            ],
          });
        } catch (error) {
          console.error('Error moving kanban task:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return saveAssistantReply({
            content: `Error moving task: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'get_clients' && userId) {
        const { status } = toolUse.input;

        try {
          let query = supabaseServer
            .from('clients')
            .select('*')
            .eq('user_id', userId);

          if (status) {
            query = query.eq('status', status);
          }

          const { data: clients, error } = await query.order('created_at', { ascending: false });
          if (error) throw error;

          await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'get_clients' });

          return await respondWithToolResult(clients || []);
        } catch (error) {
          console.error('Error fetching clients:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return saveAssistantReply({
            content: `Error fetching clients: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'create_client' && userId) {
        const { name, company, email, phone, status = 'lead', notes } = toolUse.input;

        try {
          const { data: client, error } = await supabaseServer
            .from('clients')
            .insert([
              {
                user_id: userId,
                name,
                company: company || null,
                email: email || null,
                phone: phone || null,
                status,
                notes: notes || null,
              },
            ])
            .select()
            .single();

          if (error) throw error;

          await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'create_client' });

          return saveAssistantReply({
            content: 'Added:',
            role: 'assistant',
            bubbles: [
              {
                type: 'custom',
                title: client.name,
                subtitle: client.company || undefined,
                badge: { label: client.status, color: 'info' },
              },
            ],
          });
        } catch (error) {
          console.error('Error creating client:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return saveAssistantReply({
            content: `Error creating client: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      if (toolUse && (toolUse.name === 'update_client' || toolUse.name === 'delete_client') && userId) {
        // Resolve a client_id/client_lookup_name pair to a real client row.
        // Never trust a client_id the model supplies unless it's a real UUID — it sometimes hallucinates one.
        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const { client_id, client_lookup_name } = toolUse.input;

        const resolveClient = async (): Promise<
          { match: { id: string; name: string; company: string | null } } | { errorMessage: string }
        > => {
          if (client_id && UUID_RE.test(client_id)) {
            const { data } = await supabaseServer
              .from('clients')
              .select('id, name, company')
              .eq('id', client_id)
              .eq('user_id', userId)
              .maybeSingle();
            if (data) return { match: data };
          }

          const lookupName = client_lookup_name || (client_id && !UUID_RE.test(client_id) ? client_id : undefined);
          if (!lookupName) {
            return { errorMessage: userLanguage === 'pt' ? 'Não sei a que cliente te referes.' : "I don't know which client you mean." };
          }

          const { data: matches } = await supabaseServer
            .from('clients')
            .select('id, name, company')
            .eq('user_id', userId)
            .or(`name.ilike.%${lookupName}%,company.ilike.%${lookupName}%`);

          if (!matches || matches.length === 0) {
            return { errorMessage: userLanguage === 'pt' ? `Nenhum cliente encontrado para "${lookupName}".` : `No client found matching "${lookupName}".` };
          }
          if (matches.length > 1) {
            const names = matches.map((m) => m.name).join(', ');
            return { errorMessage: userLanguage === 'pt' ? `Vários clientes correspondem a "${lookupName}": ${names}. Sê mais específico.` : `Multiple clients match "${lookupName}": ${names}. Please be more specific.` };
          }
          return { match: matches[0] };
        };

        const resolved = await resolveClient();
        if (!('match' in resolved)) {
          return saveAssistantReply({ content: resolved.errorMessage, role: 'assistant' });
        }
        const resolvedClientId = resolved.match.id;

        if (toolUse.name === 'update_client') {
          const { name, company, email, phone, status, notes, avatar_color } = toolUse.input;

          try {
            const updateData: Record<string, any> = {};
            if (name !== undefined) updateData.name = name;
            if (company !== undefined) updateData.company = company;
            if (email !== undefined) updateData.email = email;
            if (phone !== undefined) updateData.phone = phone;
            if (status !== undefined) updateData.status = status;
            if (notes !== undefined) updateData.notes = notes;
            if (avatar_color !== undefined) updateData.avatar_color = avatar_color;

            if (Object.keys(updateData).length === 0) {
              return saveAssistantReply({
                content: userLanguage === 'pt'
                  ? 'Nada para atualizar — indica que campo queres alterar.'
                  : 'Nothing to update — specify which field to change.',
                role: 'assistant',
              });
            }

            const { data: updatedClient, error } = await supabaseServer
              .from('clients')
              .update(updateData)
              .eq('id', resolvedClientId)
              .eq('user_id', userId)
              .select()
              .maybeSingle();

            if (error) throw error;
            if (!updatedClient) {
              return saveAssistantReply({
                content: userLanguage === 'pt' ? 'Cliente não encontrado.' : 'Client not found.',
                role: 'assistant',
              });
            }

            await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'update_client' });

            return saveAssistantReply({
              content: userLanguage === 'pt' ? 'Atualizado:' : 'Updated:',
              role: 'assistant',
              bubbles: [
                {
                  type: 'custom',
                  title: updatedClient.name,
                  subtitle: updatedClient.company || undefined,
                  badge: { label: updatedClient.status, color: 'info' },
                },
              ],
            });
          } catch (error) {
            console.error('Error updating client:', error);
            const errorMsg = error instanceof Error
              ? error.message
              : (error && typeof error === 'object' && 'message' in error)
                ? String((error as { message: unknown }).message)
                : String(error);
            return saveAssistantReply({
              content: userLanguage === 'pt'
                ? `Erro ao atualizar cliente: ${errorMsg}`
                : `Error updating client: ${errorMsg}`,
              role: 'assistant',
            });
          }
        }

        // toolUse.name === 'delete_client'
        try {
          const { error } = await supabaseServer
            .from('clients')
            .delete()
            .eq('id', resolvedClientId)
            .eq('user_id', userId);

          if (error) throw error;

          await captureServerEvent(userId, 'chat_tool_used', { tool_name: 'delete_client' });

          return saveAssistantReply({
            content: userLanguage === 'pt' ? 'Removido:' : 'Deleted:',
            role: 'assistant',
            bubbles: [
              {
                type: 'custom',
                title: resolved.match.name,
                badge: { label: userLanguage === 'pt' ? 'Removido' : 'Deleted', color: 'error' },
              },
            ],
          });
        } catch (error) {
          console.error('Error deleting client:', error);
          const errorMsg = error instanceof Error
            ? error.message
            : (error && typeof error === 'object' && 'message' in error)
              ? String((error as { message: unknown }).message)
              : String(error);
          return saveAssistantReply({
            content: userLanguage === 'pt'
              ? `Erro ao remover cliente: ${errorMsg}`
              : `Error deleting client: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }
    }

    // Extract response content
    const textContent = response.content.find((block: any) => block.type === 'text');
    const responseContent = textContent && 'text' in textContent ? textContent.text : 'No response';

    const response_data: any = {
      content: responseContent,
      role: 'assistant',
    };
    // Fim do if (response.stop_reason === 'tool_use')

    // Save assistant response to database
    if (userId) {
      try {
        await saveChatMessage(userId, {
          role: 'assistant',
          content: responseContent,
          input_tokens: response.usage?.input_tokens || 0,
          output_tokens: response.usage?.output_tokens || 0,
        }, supabaseServer);
      } catch (error) {
        console.log('Could not save assistant message to database');
      }
      await captureServerEvent(userId, 'chat_message_sent', { has_tool_use: false });
    }

    return NextResponse.json(response_data);
  } catch (error) {
    console.error('Chat API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Full error details:', error);

    return NextResponse.json(
      {
        error: 'Error processing message',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
