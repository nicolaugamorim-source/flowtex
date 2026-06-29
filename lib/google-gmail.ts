import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const gmail = google.gmail('v1');

// Decode RFC 2047 encoded-word headers (e.g. "=?UTF-8?B?...?=" or "=?UTF-8?Q?...?="),
// which mail clients use for non-ASCII Subject/From headers. Plain headers pass through unchanged.
export function decodeMimeHeader(value: string): string {
  if (!value) return value;
  const decoded = value.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_match, charset, encoding, text) => {
    try {
      if (encoding.toUpperCase() === 'B') {
        return Buffer.from(text, 'base64').toString(charset.toLowerCase() === 'utf-8' ? 'utf-8' : 'latin1');
      }
      // Q-encoding: underscores are spaces, =XX are hex-escaped bytes
      const bytes = text.replace(/_/g, ' ').replace(/=([0-9A-Fa-f]{2})/g, (_m: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));
      return Buffer.from(bytes, 'latin1').toString(charset.toLowerCase() === 'utf-8' ? 'utf-8' : 'latin1');
    } catch {
      return text;
    }
  });
  return fixMojibake(decoded);
}

// Windows-1252 codepoints that differ from Latin-1 in the 0x80–0x9F range — needed because
// mail servers that mis-decode raw UTF-8 bytes as a single-byte charset use cp1252, not
// strict Latin-1 (Node's "latin1" encoding is strict ISO-8859-1 and gets bytes 0x80-0x9F wrong).
const CP1252_HIGH: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
  0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e,
  0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
};

function encodeCp1252(str: string): Buffer | null {
  const bytes: number[] = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0)!;
    if (cp <= 0xff) {
      bytes.push(cp);
      continue;
    }
    const mapped = CP1252_HIGH[cp];
    if (mapped === undefined) return null;
    bytes.push(mapped);
  }
  return Buffer.from(bytes);
}

// Repairs headers that were sent with raw unencoded UTF-8 bytes (a pre-existing bug in
// this app's own sendEmail), which mail servers reinterpret as cp1252 — producing
// "HorÃ¡rio" or doubly-mangled "HorÃƒÂ¡rio". Re-decodes as long as it reduces the
// mojibake marker count, since a correct string has none of these sequences.
function fixMojibake(text: string): string {
  let current = text;
  for (let i = 0; i < 2; i++) {
    const marker = (current.match(/Ã.|Â.|Å./g) || []).length;
    if (marker === 0) break;
    const bytes = encodeCp1252(current);
    if (!bytes) break;
    const candidate = bytes.toString('utf-8');
    const candidateMarker = (candidate.match(/Ã.|Â.|Å./g) || []).length;
    if (candidateMarker < marker && !candidate.includes('�')) {
      current = candidate;
    } else {
      break;
    }
  }
  return current;
}

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
          from: decodeMimeHeader(getHeader('From')),
          to: getHeader('To'),
          subject: decodeMimeHeader(getHeader('Subject')),
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

    // RFC 822 headers must be ASCII — non-ASCII subjects need RFC 2047 encoded-word
    // form, otherwise mail servers fall back to Latin-1 and the UTF-8 bytes get
    // mangled (double mojibake) when the subject is read back later.
    const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`;
    const message =
      `From: me\r\n` +
      `To: ${to}\r\n` +
      `Subject: ${encodedSubject}\r\n` +
      `MIME-Version: 1.0\r\n` +
      `Content-Type: text/plain; charset="UTF-8"\r\n` +
      `Content-Transfer-Encoding: base64\r\n\r\n` +
      Buffer.from(body, 'utf-8').toString('base64');
    const encodedMessage = Buffer.from(message, 'utf-8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

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
    console.log('Fetching full email content for ID:', messageId);
    const auth = await getGmailClient(accessToken);

    const fullMessage = await gmail.users.messages.get({
      auth,
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    if (!fullMessage.data) {
      console.error('No message data returned');
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
          console.log('Found text/plain part');
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
            console.log('Found text/html part');
          } catch (e) {
            console.error('Error decoding text/html:', e);
          }
        }
      }

      // Strategy 3: Recursively extract from nested parts
      if (!body) {
        body = extractTextFromParts(fullMessage.data.payload.parts);
        if (body) {
          console.log('Extracted from nested parts');
        }
      }
    } else if (fullMessage.data.payload?.body?.data) {
      // Simple email without parts
      try {
        body = Buffer.from(fullMessage.data.payload.body.data, 'base64').toString('utf-8');
        console.log('Found simple body');
      } catch (e) {
        console.error('Error decoding body:', e);
      }
    }

    // Clean up excessive newlines
    body = body.replace(/\n\n\n+/g, '\n\n').trim();

    console.log('Email fetched successfully, body length:', body.length);

    return {
      id: messageId,
      threadId: fullMessage.data.threadId || '',
      from: decodeMimeHeader(getHeader('From')),
      to: getHeader('To'),
      subject: decodeMimeHeader(getHeader('Subject')),
      body: body || '[Email vazio ou conteúdo não encontrado]',
      date: getHeader('Date'),
    };
  } catch (error) {
    console.error('Error fetching full email:', error);
    return null;
  }
}

export async function deleteEmail(accessToken: string, messageId: string) {
  try {
    const auth = await getGmailClient(accessToken);

    // Uses trash (not permanent delete) since the granted OAuth scope is
    // gmail.modify, which doesn't allow messages.delete (requires the full
    // https://mail.google.com/ scope). This matches normal Gmail "delete" UX.
    await gmail.users.messages.trash({
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
