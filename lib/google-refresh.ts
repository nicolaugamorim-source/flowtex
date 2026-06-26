import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

// Server-only client (service role) — this file is never imported by client
// components, and RLS would otherwise block reading another user's stored
// refresh_token since there's no per-request session to authenticate with here.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function refreshGoogleAccessToken(userId: string): Promise<string | null> {
  try {
    // Get the Google integration with refresh token from the database
    const { data: integration, error } = await supabaseAdmin
      .from('integrations')
      .select('refresh_token, access_token')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single();

    if (error || !integration?.refresh_token) {
      console.log('❌ No Google refresh token found for user', userId);
      return null;
    }

    // Create OAuth2 client with dynamic redirect URI
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/auth/callback`;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    // Set the refresh token
    oauth2Client.setCredentials({
      refresh_token: integration.refresh_token,
    });

    // Get new access token
    const { credentials } = await oauth2Client.refreshAccessToken();
    const newAccessToken = credentials.access_token;

    if (!newAccessToken) {
      console.error('❌ Failed to get new access token');
      return null;
    }

    // Save the new access token to the database
    try {
      const expiresAt = credentials.expiry_date
        ? new Date(credentials.expiry_date).toISOString()
        : new Date(Date.now() + 3600 * 1000).toISOString();

      await supabaseAdmin
        .from('integrations')
        .update({
          access_token: newAccessToken,
          token_expires_at: expiresAt,
        })
        .eq('user_id', userId)
        .eq('provider', 'google');

      console.log('✅ Access token refreshed and saved to database');
    } catch (updateError) {
      console.warn('⚠️ Token refreshed but failed to save to database:', updateError);
    }

    return newAccessToken;
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    return null;
  }
}

export async function getValidGoogleAccessToken(userId: string, currentToken: string | undefined): Promise<string | null> {
  // If we have a token, try to use it
  if (currentToken) {
    return currentToken;
  }

  // Try to refresh
  return refreshGoogleAccessToken(userId);
}
