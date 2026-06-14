import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getUpcomingEvents, createEvent, getCalendarsList, findAndDeleteEvent, rescheduleEvent } from '@/lib/google-calendar';
import { getEmails, sendEmail, searchEmails, deleteEmail, markAsRead, getFullEmailContent } from '@/lib/google-gmail';
import { ensureValidGoogleToken } from '@/lib/ensure-valid-token';
import { saveChatMessage, getChatHistory, buildAIContextString } from '@/lib/database';
import { supabase } from '@/lib/supabase';

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

// Improve event title with proper formatting and accent correction
function improveEventTitle(title: string): string {
  // Map of common words without accents to their corrected versions
  const accentMap: { [key: string]: string } = {
    'reuniao': 'Reunião',
    'apresentacao': 'Apresentação',
    'discussao': 'Discussão',
    'avaliacao': 'Avaliação',
    'planificacao': 'Planificação',
    'revisao': 'Revisão',
    'definicao': 'Definição',
    'opcao': 'Opção',
  };

  // List of small words to skip when formatting
  const skipWords = ['de', 'do', 'da', 'dos', 'das', 'para', 'por', 'em', 'com', 'e', 'ou', 'que', 'um', 'uma', 'uns', 'umas', 'o', 'a', 'os', 'as'];

  // Split and process each word
  const words = title.toLowerCase().trim().split(/\s+/).map(word => {
    // Check if word needs accent correction
    if (accentMap[word]) {
      return accentMap[word];
    }

    // Capitalize if it's not a skip word, or if it's the first word
    if (!skipWords.includes(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  });

  // Filter out skip words except in key positions
  const importantWords = words.filter((word, index) => {
    // Keep first word
    if (index === 0) return true;
    // Keep non-skip words
    if (!skipWords.includes(word.toLowerCase())) return true;
    return false;
  });

  // Join with hyphens for important words, spaces for small words
  let result = '';
  for (let i = 0; i < importantWords.length; i++) {
    if (i > 0 && !skipWords.includes(importantWords[i].toLowerCase())) {
      result += ' - ';
    } else if (i > 0) {
      result += ' ';
    }
    result += importantWords[i];
  }

  return result;
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

  // Extract day (1-31)
  const dayMatch = dateStr.match(/\b(0?[1-9]|[12]\d|3[01])\b/);
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

  for (const [monthName, monthNum] of Object.entries(monthMap)) {
    if (dateStr.toLowerCase().includes(monthName)) {
      month = monthNum;
      break;
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

    const { message, conversationHistory = [], googleAccessToken, activeAction, userId: requestUserId } = await request.json();

    console.log('Received googleAccessToken:', googleAccessToken ? 'YES' : 'NO');
    console.log('Active action:', activeAction);

    // Get userId from authenticated session
    let userId = requestUserId;
    if (!userId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
        if (userId) {
          console.log('✅ Got userId from Supabase session');
        }
      } catch (error) {
        console.log('Could not get userId from session');
      }
    }

    // Ensure we have a valid access token (will refresh automatically if userId available)
    const validAccessToken = await ensureValidGoogleToken(googleAccessToken, userId);

    // Fetch user's language preference and AI context from database
    let userLanguage = 'en'; // default
    let aiContextString = '';
    if (userId) {
      try {
        const { data: user } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', userId)
          .single();

        if (user?.language) {
          userLanguage = user.language;
          console.log('📝 User language:', userLanguage);
        }
      } catch (error) {
        console.log('Could not fetch user language, using default');
      }

      // Load AI context for better responses
      try {
        aiContextString = await buildAIContextString(userId);
      } catch (error) {
        console.log('Could not fetch AI context');
      }
    }

    // Save user message to database
    if (userId) {
      try {
        await saveChatMessage(userId, {
          role: 'user',
          content: message,
        });
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
    if (validAccessToken) {
      try {
        const events = await getUpcomingEvents(validAccessToken, 50, userId);
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
      }
    }

    // Define tools for Claude
    const tools = [
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
              description: 'Date description in natural language (e.g., "dia 15", "15 de julho", "15 de julho de 2026")',
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
          },
          required: ['summary', 'date_string', 'calendar_id'],
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

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `You are Flowtex, an intelligent workspace assistant for solopreneurs and small teams.

You have access to the user's Gmail, Google Calendar, and Notion. You already know their project context, clients, and team.

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
- Answer questions about their schedule: what meetings they have, what's next, when they're free, conflicts, etc.
- When asked "what's next" or "o que vem a seguir", check the calendar and tell them the immediate upcoming event.
- Provide helpful scheduling suggestions based on available time slots.
- If they ask about today's schedule, tomorrow's schedule, or any specific day, analyze the calendar data and respond with their events for that day.
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
- When creating/scheduling events: Start with "Agendei [event name]:" or "Agendei para as [time]:" (very simple)
- When rescheduling: Start with "Reagendei para as [time]:" or "Movei para [time]:"
- When deleting: Start with "Removi o evento:" or "Apaguei a reunião:"
- Keep the opening sentence VERY simple and short - just the action and time/date
- Example: "Agendei para as 17h:" then show the event bubble
- Do NOT include full explanations in the text - let the bubble show the details

Rules:
- Be direct and concise. No filler, no padding, no emojis.
- Execute tasks immediately without asking for confirmation unless the action is irreversible.
- If a command is ambiguous, ask one short clarifying question before acting.
- Never re-ask for context already provided.
- ALWAYS respond in the exact same language the user writes in. If they write in English, respond in English. If Portuguese, respond in Portuguese. If Spanish, respond in Spanish. Match their language perfectly.
- Keep responses short — one to three sentences maximum unless detail is explicitly needed.${recentContext}${aiContextString}${calendarsInfo}${calendarContext}${actionContext}`,
      tools: tools as any,
      messages: messages,
    });

    console.log('Claude response:', response);

    // Handle tool calls
    if (response.stop_reason === 'tool_use') {
      const toolUse = response.content.find((block: any) => block.type === 'tool_use') as any;

      console.log('Tool called:', toolUse?.name);
      console.log('Tool input:', JSON.stringify(toolUse?.input, null, 2));

      if (toolUse && toolUse.name === 'reschedule_event' && validAccessToken) {
        const { old_event_title, summary, description, date_string, start_time, end_time, calendar_id } = toolUse.input;

        console.log('Rescheduling event:', { old_event_title, summary, date_string, start_time, end_time });

        // Parse the date
        const dates = parseSmartDate(date_string);
        if (!dates) {
          return NextResponse.json({
            content: 'Não consegui interpretar a data. Tenta ser mais específico (e.g., "dia 15 de julho").',
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

            return NextResponse.json({
              content: `Reagendei "${summary}" para ${date_string} das ${start_time || '14:00'} às ${end_time || '16:00'}.`,
              role: 'assistant',
              bubbles: [
                {
                  type: 'event',
                  title: summary,
                  subtitle: calendarName,
                  metadata: [
                    {
                      icon: 'Calendar',
                      label: dayOfWeekStr.charAt(0).toUpperCase() + dayOfWeekStr.slice(1),
                      value: dateStr,
                      color: 'accent',
                    },
                    {
                      icon: 'Clock',
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
            return NextResponse.json({
              content: result.message,
              role: 'assistant',
            });
          }
        } catch (error) {
          console.error('Error rescheduling event:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return NextResponse.json({
            content: `Erro ao reagendar o evento: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'delete_calendar_event' && validAccessToken) {
        const { event_title } = toolUse.input;

        console.log('🗑️ Delete tool called with title:', event_title);

        try {
          console.log('🔍 Calling findAndDeleteEvent...');
          const result = await findAndDeleteEvent(validAccessToken, event_title);
          console.log('✅ findAndDeleteEvent result:', result);

          if (result.success) {
            console.log('✅ Event deleted successfully');
            return NextResponse.json({
              content: userLanguage === 'pt' ? `Removi o evento:` : `Removed event:`,
              role: 'assistant',
              bubbles: [
                {
                  type: 'event',
                  title: result.deletedEvent,
                  metadata: [
                    {
                      icon: 'Calendar',
                      label: result.deletedEventDayOfWeek || 'Date',
                      value: result.deletedEventDate || new Date().toLocaleDateString('pt-PT'),
                      color: 'default',
                    },
                    {
                      icon: 'Clock',
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
            console.log('❌ Event not found:', result.message);
            return NextResponse.json({
              content: result.message,
              role: 'assistant',
            });
          }
        } catch (error) {
          console.error('❌ Error deleting event:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error('Error details:', errorMsg);
          return NextResponse.json({
            content: `Erro ao deletar o evento: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'create_calendar_event' && validAccessToken) {
        const { summary, description, date_string, start_time, end_time, calendar_id } = toolUse.input;

        // Improve the event title with proper formatting and accents
        const improvedSummary = improveEventTitle(summary);

        console.log('Creating event:', {
          originalSummary: summary,
          improvedSummary: improvedSummary,
          description,
          date_string,
          start_time,
          end_time,
          calendar_id
        });

        // Parse the date
        const dates = parseSmartDate(date_string);
        if (!dates) {
          return NextResponse.json({
            content: 'Não consegui interpretar a data. Tenta ser mais específico (e.g., "dia 15 de julho").',
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
          });

          console.log('Event created successfully:', event?.id);

          // Find the calendar name
          const selectedCalendar = calendars?.find((cal: any) => cal.id === calendar_id);
          const calendarName = selectedCalendar?.summary || 'Calendário';

          // Format date and time in user's language
          const locale = userLanguage === 'pt' ? 'pt-PT' : userLanguage === 'es' ? 'es-ES' : 'en-US';
          const dateStr = startDateTime.toLocaleDateString(locale);
          const timeStr = `${start_time || '14:00'} - ${end_time || '16:00'}`;

          // Get localized day name and action text
          const { dayOfWeek: dayOfWeekStr, actionText } = getLocalizedText(startDateTime, 'created', userLanguage);

          // Let Claude generate the response in the user's language
          const responseMessages = [...messages, { role: 'user' as const, content: message }];

          const confirmationResponse = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 100,
            system: `You have just scheduled an event. Respond with a VERY SHORT confirmation message (1 sentence max).
Respond in the EXACT same language as the user's message.
If user wrote in English, respond in English. If Portuguese, respond in Portuguese.
Be concise and just confirm what was scheduled.`,
            messages: responseMessages,
          });

          const confirmationText = confirmationResponse.content[0];
          const confirmationContent = confirmationText && 'text' in confirmationText ? confirmationText.text : `Scheduled for ${start_time || '14:00'}:`;

          return NextResponse.json({
            content: confirmationContent,
            role: 'assistant',
            bubbles: [
              {
                type: 'event',
                title: improvedSummary,
                subtitle: calendarName,
                metadata: [
                  {
                    icon: 'Calendar',
                    label: dayOfWeekStr,
                    value: dateStr,
                    color: 'accent',
                  },
                  {
                    icon: 'Clock',
                    label: userLanguage === 'pt' ? 'Horário' : 'Time',
                    value: timeStr,
                    color: 'accent',
                  },
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
          return NextResponse.json({
            content: `Erro ao criar o evento no calendário: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'read_email_full' && validAccessToken) {
        const { email_id } = toolUse.input;

        console.log('📖 Reading full email content:', email_id);

        try {
          const email = await getFullEmailContent(validAccessToken, email_id);

          if (!email || !email.body) {
            console.log('⚠️ Email or body is empty:', email);
            return NextResponse.json({
              content: userLanguage === 'pt'
                ? 'Desculpa, o email não tem conteúdo ou não consegui ler.'
                : 'Sorry, the email has no content or I couldn\'t read it.',
              role: 'assistant',
            });
          }

          // Return full email content to Claude with clear formatting
          const emailContent = `
📧 EMAIL COMPLETO:

De: ${email.from}
Para: ${email.to}
Assunto: ${email.subject}
Data: ${email.date}

---

${email.body}

---`;

          return NextResponse.json({
            content: emailContent,
            role: 'assistant',
          });
        } catch (error) {
          console.error('Error reading full email:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return NextResponse.json({
            content: userLanguage === 'pt'
              ? `Erro ao ler email completo: ${errorMsg}`
              : `Error reading full email: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'search_emails' && validAccessToken) {
        const { query } = toolUse.input;

        console.log('🔍 Searching emails with query:', query);

        try {
          const emails = await searchEmails(validAccessToken, query, 5);

          console.log(`✅ Found ${emails.length} emails`);

          if (emails.length === 0) {
            return NextResponse.json({
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
Include the main points and action items if any. Do not add headers or markdown formatting.`,
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

              const contentMessages = {
                pt: `Aqui está o resumo do teu último email não lido:`,
                en: `Here's the summary of your last unread email:`,
                es: `Aquí está el resumen de tu último email no leído:`,
              };

              return NextResponse.json({
                content: contentMessages[userLanguage as keyof typeof contentMessages] || contentMessages.en,
                role: 'assistant',
                bubbles: [
                  {
                    type: 'email',
                    title: latestEmail.subject,
                    subtitle: latestEmail.from,
                    description: summary,
                    metadata: [
                      {
                        icon: 'Calendar',
                        label: userLanguage === 'pt' ? 'Data' : 'Date',
                        value: formattedDate,
                        color: 'default',
                      },
                    ],
                    badge: {
                      label: userLanguage === 'pt' ? 'Não lido' : 'Unread',
                      color: 'warning',
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
              {
                label: 'ID',
                value: email.id,
                color: 'default' as const,
              },
            ],
            badge: {
              label: userLanguage === 'pt' ? 'Email' : 'Email',
              color: 'default' as const,
            },
          }));

          // Also pass full email data to Claude in the system message
          const emailsContext = emails.map(e =>
            `Email ID: ${e.id}\nFrom: ${e.from}\nSubject: ${e.subject}\nDate: ${e.date}\nPreview: ${e.body.substring(0, 500)}...`
          ).join('\n\n---\n\n');

          return NextResponse.json({
            content: userLanguage === 'pt'
              ? `Encontrei ${emails.length} email(s):\n\n${emailsContext}`
              : `Found ${emails.length} email(s):\n\n${emailsContext}`,
            role: 'assistant',
            bubbles: emailBubbles,
          });
        } catch (error) {
          console.error('Error searching emails:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return NextResponse.json({
            content: userLanguage === 'pt'
              ? `Erro ao procurar emails: ${errorMsg}`
              : `Error searching emails: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }

      if (toolUse && toolUse.name === 'draft_email') {
        const { to, subject, body } = toolUse.input;

        console.log('📧 Drafting email for:', to);

        // Return draft bubble instead of sending
        return NextResponse.json({
          content: userLanguage === 'pt'
            ? 'Aqui está o draft do email. Revisa e confirma para enviar:'
            : 'Here is the email draft. Review and confirm to send:',
          role: 'assistant',
          bubbles: [
            {
              type: 'email_draft',
              to,
              subject,
              body,
            },
          ],
        });
      }

      if (toolUse && toolUse.name === 'delete_email' && validAccessToken) {
        const { query } = toolUse.input;

        console.log('🗑️ Deleting email with query:', query);

        try {
          const emails = await searchEmails(validAccessToken, query, 1);

          if (emails.length === 0) {
            return NextResponse.json({
              content: userLanguage === 'pt'
                ? 'Não encontrei nenhum email para deletar.'
                : 'I didn\'t find any email to delete.',
              role: 'assistant',
            });
          }

          await deleteEmail(validAccessToken, emails[0].id);

          return NextResponse.json({
            content: userLanguage === 'pt'
              ? `✅ Email "${emails[0].subject}" deletado com sucesso`
              : `✅ Email "${emails[0].subject}" deleted successfully`,
            role: 'assistant',
          });
        } catch (error) {
          console.error('Error deleting email:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return NextResponse.json({
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
            return NextResponse.json({
              content: userLanguage === 'pt'
                ? `Não encontrei nada com "${query}". Qual é o nome exato da página/database que queres?`
                : `I didn't find anything with "${query}". What's the exact name of the page/database?`,
              role: 'assistant',
            });
          }

          // Show top 5 closest matches and ask for confirmation
          const topMatches = pages.slice(0, 5);
          const matchesList = topMatches
            .map((p: any, idx: number) => {
              const title = p.properties?.title?.[0]?.plain_text || p.title?.[0]?.plain_text || 'Untitled';
              const icon = p.icon?.emoji || '📄';
              return `${idx + 1}. ${icon} ${title}`;
            })
            .join('\n');

          return NextResponse.json({
            content: userLanguage === 'pt'
              ? `Encontrei essas opções. Qual é a que queres?\n${matchesList}`
              : `I found these options. Which one is it?\n${matchesList}`,
            role: 'assistant',
            _notionResults: pages.map((p: any) => ({
              id: p.id,
              title: p.properties?.title?.[0]?.plain_text || p.title?.[0]?.plain_text || 'Untitled',
            })),
          });
        } catch (error) {
          console.error('Error searching Notion:', error);
          return NextResponse.json({
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

          return NextResponse.json({
            content: userLanguage === 'pt'
              ? `Página "${title}" criada com sucesso no Notion.`
              : `Page "${title}" created successfully in Notion.`,
            role: 'assistant',
          });
        } catch (error) {
          console.error('Error creating Notion page:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return NextResponse.json({
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

          if (items.length === 0) {
            return NextResponse.json({
              content: userLanguage === 'pt'
                ? 'Este database está vazio.'
                : 'This database is empty.',
              role: 'assistant',
            });
          }

          const itemsList = items
            .slice(0, 10)
            .map((item: any) => `- ${item.properties?.title?.[0]?.plain_text || item.id}`)
            .join('\n');

          return NextResponse.json({
            content: userLanguage === 'pt'
              ? `Encontrei ${items.length} item(ns):\n${itemsList}${items.length > 10 ? '...' : ''}`
              : `Found ${items.length} item(s):\n${itemsList}${items.length > 10 ? '...' : ''}`,
            role: 'assistant',
          });
        } catch (error) {
          console.error('Error querying Notion database:', error);
          return NextResponse.json({
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
            return NextResponse.json({
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

              const icon = p.icon?.emoji || '📄';
              return { title, icon, id: p.id };
            })
            .filter((p): p is { title: string; icon: string; id: string } => p !== null)
            .slice(0, 10); // Limit to top 10

          // Format response as clean list
          const formattedList = pagesWithTitles
            .map(p => `- ${p.icon} ${p.title}`)
            .join('\n');

          const heading = userLanguage === 'pt'
            ? 'Aqui estão suas principais páginas do Notion:'
            : 'Here are your main Notion pages:';

          return NextResponse.json({
            content: `${heading}\n${formattedList}`,
            role: 'assistant',
          });
        } catch (error) {
          console.error('Error listing Notion pages:', error);
          return NextResponse.json({
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
          return NextResponse.json({
            content: userLanguage === 'pt'
              ? 'Erro: não consegui identificar seu usuário. Tenta fazer login novamente.'
              : 'Error: Could not identify your user. Try logging in again.',
            role: 'assistant',
          });
        }

        try {
          const result = await navigateNotionPath(userId, path);

          if (!result) {
            return NextResponse.json({
              content: userLanguage === 'pt'
                ? `Não consegui encontrar o caminho: ${path.join(' > ')}`
                : `I couldn't find the path: ${path.join(' > ')}`,
              role: 'assistant',
            });
          }

          return NextResponse.json({
            content: userLanguage === 'pt'
              ? `Encontrei: "${result.title}"`
              : `Found: "${result.title}"`,
            role: 'assistant',
            _notionPathResult: result,
          });
        } catch (error) {
          console.error('Error navigating Notion path:', error);
          return NextResponse.json({
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

          return NextResponse.json({
            content: userLanguage === 'pt'
              ? `Página "${page_name}" removida com sucesso.`
              : `Page "${page_name}" deleted successfully.`,
            role: 'assistant',
          });
        } catch (error) {
          console.error('Error deleting Notion page:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return NextResponse.json({
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

          return NextResponse.json({
            content: userLanguage === 'pt'
              ? `Status atualizado para "${status}".`
              : `Status updated to "${status}".`,
            role: 'assistant',
          });
        } catch (error) {
          console.error('Error updating Notion page status:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return NextResponse.json({
            content: userLanguage === 'pt'
              ? `Erro ao atualizar status: ${errorMsg}`
              : `Error updating status: ${errorMsg}`,
            role: 'assistant',
          });
        }
      }
    }

    // Extract response content
    const textContent = response.content.find((block: any) => block.type === 'text');
    const responseContent = textContent && 'text' in textContent ? textContent.text : 'No response';

    // Check if response mentions events and extract them for visual display
    let eventsToDisplay: any[] = [];
    if (responseContent && validAccessToken) {
      // Look for event mentions (very simple pattern: if response mentions "reunião", "evento", "agendado", etc.)
      const eventKeywords = ['reunião', 'evento', 'agendado', 'marcado', 'calendário', 'próxima', 'tenho', 'tens', 'dia', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
      const hasEventMention = eventKeywords.some(keyword =>
        responseContent.toLowerCase().includes(keyword)
      );

      if (hasEventMention) {
        // Get all events and find ones mentioned in the response
        try {
          const allCalendarEvents = await getUpcomingEvents(validAccessToken, 50);

          // Try to match events mentioned in the response
          allCalendarEvents.forEach((event: any) => {
            const eventTitle = event.summary?.toLowerCase() || '';
            const responseLC = responseContent.toLowerCase();

            // Check if event title is mentioned in response
            if (eventTitle && responseLC.includes(eventTitle)) {
              const startTime = new Date(event.start?.dateTime || event.start?.date);
              const endTime = new Date(event.end?.dateTime || event.end?.date);

              // Avoid duplicates
              if (!eventsToDisplay.find(e => e.title === event.summary)) {
                eventsToDisplay.push({
                  title: event.summary,
                  date: startTime.toLocaleDateString('pt-PT'),
                  time: event.start?.dateTime
                    ? `${startTime.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
                    : startTime.toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                  dayOfWeek: startTime.toLocaleDateString('pt-PT', { weekday: 'long' }).charAt(0).toUpperCase() + startTime.toLocaleDateString('pt-PT', { weekday: 'long' }).slice(1),
                  calendar: 'Calendário',
                });
              }
            }
          });
        } catch (error) {
          console.error('Error fetching events for display:', error);
        }
      }
    }

    const response_data: any = {
      content: responseContent,
      role: 'assistant',
    };
    // Fim do if (response.stop_reason === 'tool_use')

    // Convert event display data to bubbles if events were found
    if (eventsToDisplay.length > 0) {
      response_data.bubbles = eventsToDisplay.map(evt => ({
        type: 'event' as const,
        title: evt.title,
        metadata: [
          {
            label: evt.dayOfWeek,
            value: evt.date,
            color: 'accent' as const,
          },
          {
            label: userLanguage === 'pt' ? 'Horário' : 'Time',
            value: evt.time,
            color: 'accent' as const,
          },
        ],
        badge: {
          label: userLanguage === 'pt' ? 'Próxima' : 'Upcoming',
          color: 'success' as const,
        },
      }));
    }

    // Save assistant response to database
    if (userId) {
      try {
        await saveChatMessage(userId, {
          role: 'assistant',
          content: responseContent,
          input_tokens: response.usage?.input_tokens || 0,
          output_tokens: response.usage?.output_tokens || 0,
        });
      } catch (error) {
        console.log('Could not save assistant message to database');
      }
    }

    return NextResponse.json(response_data);
  } catch (error) {
    console.error('Chat API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Full error details:', error);

    return NextResponse.json(
      {
        error: 'Erro ao processar mensagem',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
