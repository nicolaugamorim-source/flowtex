import { supabase } from './supabase';
import { google } from 'googleapis';

export async function refreshGoogleAccessToken(userId: string): Promise<string | null> {
  try {
    // Get the refresh token from the database
    const { data: user, error } = await supabase
      .from('users')
      .select('google_refresh_token')
      .eq('id', userId)
      .single();

    if (error || !user?.google_refresh_token) {
      console.log('❌ No refresh token found for user', userId);
      return null;
    }

    // Create OAuth2 client with dynamic redirect URI
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/auth/callback`;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    // Set the refresh token
    oauth2Client.setCredentials({
      refresh_token: user.google_refresh_token,
    });

    // Get new access token
    const { credentials } = await oauth2Client.refreshAccessToken();
    const newAccessToken = credentials.access_token;

    if (!newAccessToken) {
      console.error('❌ Failed to get new access token');
      return null;
    }

    console.log('✅ Access token refreshed successfully');
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
