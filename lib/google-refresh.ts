import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import { captureServerEvent } from './posthog-server';
import { createNotification } from './notifications';

// Server-only client (service role) — this file is never imported by client
// components, and RLS would otherwise block reading another user's stored
// refresh_token since there's no per-request session to authenticate with here.
// Created lazily (not at module scope) so that build-time page-data collection,
// which evaluates this module without runtime env vars loaded, doesn't crash.
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function refreshGoogleAccessToken(userId: string): Promise<string | null> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    // Get the Google integration with refresh token from the database
    const { data: integration, error } = await supabaseAdmin
      .from('integrations')
      .select('refresh_token, access_token')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single();

    if (error || !integration?.refresh_token) {
      console.log('No Google refresh token found for user', userId);
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
    let credentials;
    try {
      const result = await oauth2Client.refreshAccessToken();
      credentials = result.credentials;
    } catch (refreshError: any) {
      // "invalid_grant" means the refresh token itself is dead — revoked by
      // the user in their Google account, or expired from disuse. That's
      // permanent, unlike a network blip, so mark the integration inactive
      // instead of silently leaving it looking "Connected" forever.
      const isRevoked =
        refreshError?.response?.data?.error === 'invalid_grant' ||
        String(refreshError?.message || '').includes('invalid_grant');

      if (isRevoked) {
        console.warn('Google refresh token revoked for user', userId, '— marking integration inactive');
        await supabaseAdmin
          .from('integrations')
          .update({
            is_active: false,
            disconnected_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('provider', 'google');
        await captureServerEvent(userId, 'integration_disconnected', { integration: 'google', reason: 'invalid_grant' });
        await createNotification(
          userId,
          'integration_disconnected',
          'Google disconnected',
          'Your Google connection was lost. Reconnect it to keep Gmail, Calendar, and the assistant working.',
          { integration: 'google' }
        );
      }

      console.error('Error refreshing token:', refreshError);
      return null;
    }

    const newAccessToken = credentials.access_token;

    if (!newAccessToken) {
      console.error('Failed to get new access token');
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

      console.log('Access token refreshed and saved to database');
    } catch (updateError) {
      console.warn('Token refreshed but failed to save to database:', updateError);
    }

    return newAccessToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
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
