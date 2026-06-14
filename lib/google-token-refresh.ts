import { createClient } from '@supabase/supabase-js';

/**
 * Refresh Google access token using refresh token
 */
export async function refreshGoogleAccessToken(userId: string): Promise<string | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing Supabase credentials');
      return null;
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Get refresh token from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('google_refresh_token')
      .eq('id', userId)
      .single();

    if (userError || !user?.google_refresh_token) {
      console.error('❌ No refresh token found for user:', userError);
      return null;
    }

    console.log('🔄 Refreshing Google access token...');

    // Exchange refresh token for new access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: user.google_refresh_token,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Token refresh failed:', error);
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access_token;

    if (!newAccessToken) {
      console.error('❌ No access token in refresh response');
      return null;
    }

    console.log('✅ Successfully refreshed Google access token');

    // Update the access token in Supabase (we can't store it in identities, but we can use it)
    // We'll store it in localStorage for the client to pick up
    return newAccessToken;
  } catch (error) {
    console.error('❌ Error refreshing Google token:', error);
    return null;
  }
}

/**
 * Get fresh Google access token - either from current one or refresh if needed
 */
export async function getFreshGoogleAccessToken(userId: string, currentToken: string): Promise<string | null> {
  // Try refreshing the token
  const refreshedToken = await refreshGoogleAccessToken(userId);
  if (refreshedToken) {
    return refreshedToken;
  }

  // If refresh failed, return the current token (might work, might not)
  return currentToken || null;
}

/**
 * Check if error is due to expired token (401 Unauthorized)
 */
export function isTokenExpiredError(error: any): boolean {
  if (error?.status === 401) return true;
  if (error?.code === 401) return true;
  if (error?.response?.status === 401) return true;

  const errorMessage = error?.message?.toLowerCase() || '';
  if (errorMessage.includes('unauthorized') || errorMessage.includes('invalid_grant')) {
    return true;
  }

  return false;
}
