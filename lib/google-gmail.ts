import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const gmail = google.gmail('v1');

export async function getGmailClient(accessToken: string): Promise<any> {
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

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
}

export async function getEmails(accessToken: string, maxResults: number = 10, query?: string) {
  try {
    const auth = await getGmailClient(accessToken);

    const response = await gmail.users.messages.list({
      auth,
      userId: 'me',
      maxResults,
      q: query || '',
    });

    const messageIds = response.data.messages || [];

    // Fetch full message details
    const emails: EmailMessage[] = [];
    for (const msg of messageIds.slice(0, maxResults)) {
      try {
        const fullMessage = await gmail.users.messages.get({
          auth,
          userId: 'me',
          id: msg.id!,
          format: 'full',
        });

        const headers = fullMessage.data.payload?.headers || [];
        const getHeader = (name: string) => headers.find(h => h.name === name)?.value || '';

        let body = '';
        if (fullMessage.data.payload?.parts) {
          const textPart = fullMessage.data.payload.parts.find(part => part.mimeType === 'text/plain');
          if (textPart?.body?.data) {
            body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
          }
        } else if (fullMessage.data.payload?.body?.data) {
          body = Buffer.from(fullMessage.data.payload.body.data, 'base64').toString('utf-8');
        }

        emails.push({
          id: msg.id!,
          threadId: msg.threadId!,
          from: getHeader('From'),
          to: getHeader('To'),
          subject: getHeader('Subject'),
          body: body.substring(0, 5000), // First 5000 chars (fuller content)
          date: getHeader('Date'),
        });
      } catch (error) {
        console.error(`Error fetching message ${msg.id}:`, error);
      }
    }

    return emails;
  } catch (error) {
    console.error('Error fetching emails:', error);
    return [];
  }
}

export async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
) {
  try {
    const auth = await getGmailClient(accessToken);

    const message = `From: me\r\nTo: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`;
    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    const response = await gmail.users.messages.send({
      auth,
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    return {
      success: true,
      messageId: response.data.id,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function searchEmails(accessToken: string, query: string, maxResults: number = 5) {
  return getEmails(accessToken, maxResults, query);
}

function extractTextFromParts(parts: any[]): string {
  let text = '';

  for (const part of parts) {
    // Direct text content
    if (part.body?.data) {
      try {
        const decoded = Buffer.from(part.body.data, 'base64').toString('utf-8');
        if (decoded.trim()) {
          text += decoded + '\n';
        }
      } catch (e) {
        console.error('Error decoding part:', e);
      }
    }

    // Nested parts (multipart)
    if (part.parts && part.parts.length > 0) {
      text += extractTextFromParts(part.parts);
    }
  }

  return text;
}

export async function getFullEmailContent(accessToken: string, messageId: string): Promise<EmailMessage | null> {
  try {
    console.log('📖 Fetching full email content for ID:', messageId);
    const auth = await getGmailClient(accessToken);

    const fullMessage = await gmail.users.messages.get({
      auth,
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    if (!fullMessage.data) {
      console.error('❌ No message data returned');
      return null;
    }

    const headers = fullMessage.data.payload?.headers || [];
    const getHeader = (name: string) => headers.find(h => h.name === name)?.value || '';

    let body = '';

    // Strategy 1: Look for text/plain part
    if (fullMessage.data.payload?.parts) {
      let textPart = fullMessage.data.payload.parts.find(part => part.mimeType === 'text/plain');
      if (textPart?.body?.data) {
        try {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
          console.log('✅ Found text/plain part');
        } catch (e) {
          console.error('Error decoding text/plain:', e);
        }
      }

      // Strategy 2: If no text/plain, look for HTML
      if (!body) {
        const htmlPart = fullMessage.data.payload.parts.find(part => part.mimeType === 'text/html');
        if (htmlPart?.body?.data) {
          try {
            body = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
            console.log('✅ Found text/html part');
          } catch (e) {
            console.error('Error decoding text/html:', e);
          }
        }
      }

      // Strategy 3: Recursively extract from nested parts
      if (!body) {
        body = extractTextFromParts(fullMessage.data.payload.parts);
        if (body) {
          console.log('✅ Extracted from nested parts');
        }
      }
    } else if (fullMessage.data.payload?.body?.data) {
      // Simple email without parts
      try {
        body = Buffer.from(fullMessage.data.payload.body.data, 'base64').toString('utf-8');
        console.log('✅ Found simple body');
      } catch (e) {
        console.error('Error decoding body:', e);
      }
    }

    // Clean up excessive newlines
    body = body.replace(/\n\n\n+/g, '\n\n').trim();

    console.log('✅ Email fetched successfully, body length:', body.length);

    return {
      id: messageId,
      threadId: fullMessage.data.threadId || '',
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject'),
      body: body || '[Email vazio ou conteúdo não encontrado]',
      date: getHeader('Date'),
    };
  } catch (error) {
    console.error('❌ Error fetching full email:', error);
    return null;
  }
}

export async function deleteEmail(accessToken: string, messageId: string) {
  try {
    const auth = await getGmailClient(accessToken);

    await gmail.users.messages.delete({
      auth,
      userId: 'me',
      id: messageId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting email:', error);
    throw error;
  }
}

export async function markAsRead(accessToken: string, messageId: string) {
  try {
    const auth = await getGmailClient(accessToken);

    await gmail.users.messages.modify({
      auth,
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking email as read:', error);
    throw error;
  }
}
