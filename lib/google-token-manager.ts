import { supabase } from './supabase';

interface TokenData {
  accessToken: string;
  expiresAt: number; // Unix timestamp
  refreshToken?: string;
  issuedAt: number;
}

const STORAGE_KEY = 'google_token_data';
const TOKEN_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

/**
 * Save token data with expiration tracking
 */
export async function saveTokenData(
  accessToken: string,
  expiresIn: number = 3600, // Default 1 hour
  refreshToken?: string
) {
  const now = Date.now();
  const expiresAt = now + expiresIn * 1000;

  const tokenData: TokenData = {
    accessToken,
    expiresAt,
    refreshToken,
    issuedAt: now,
  };

  // Save to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokenData));
  localStorage.setItem('google_access_token', accessToken);

  // Save to Supabase integrations table
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const expiresAtIso = new Date(expiresAt).toISOString();

      await supabase
        .from('integrations')
        .upsert(
          {
            user_id: user.id,
            provider: 'google',
            access_token: accessToken,
            refresh_token: refreshToken || null,
            token_expires_at: expiresAtIso,
            is_active: true,
          },
          { onConflict: 'user_id,provider' }
        );
      console.log('✅ Google tokens saved to integrations table');
    }
  } catch (error) {
    console.error('⚠️ Could not save tokens to DB:', error);
  }

  console.log('✅ Token data saved (expires in', Math.round(expiresIn / 60), 'min)');
}

/**
 * Get token from localStorage with expiration check
 */
export function getTokenData(): TokenData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const tokenData = JSON.parse(data) as TokenData;

    // Check if token is still valid
    const now = Date.now();
    if (now < tokenData.expiresAt - TOKEN_BUFFER_MS) {
      return tokenData;
    }

    console.log('⏰ Token expired, needs refresh');
    return null;
  } catch (error) {
    console.error('Error reading token data:', error);
    return null;
  }
}

/**
 * Get valid access token (returns cached or refreshed)
 */
export async function getValidAccessToken(): Promise<string | null> {
  // Try to get cached token from localStorage
  const tokenData = getTokenData();
  if (tokenData) {
    console.log('✅ Using cached access token');
    return tokenData.accessToken;
  }

  // Token expired or doesn't exist - try to refresh
  console.log('🔄 Attempting to refresh token...');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('❌ No user logged in');
    return null;
  }

  try {
    // First, check if we have a refresh token in the integrations table
    const { data: integration, error: queryError } = await supabase
      .from('integrations')
      .select('access_token, refresh_token, token_expires_at')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (queryError) {
      console.log('⚠️ Could not query integrations table:', queryError.message);
    } else if (integration?.access_token) {
      console.log('✅ Found token in integrations table');
      // Save to localStorage for faster access next time
      saveTokenData(integration.access_token, 3600, integration.refresh_token || undefined);
      return integration.access_token;
    }

    // Try to refresh using the refresh endpoint
    const response = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });

    if (response.ok) {
      const data = await response.json();
      // Save the refreshed token
      saveTokenData(data.accessToken, 3600);
      console.log('✅ Token refreshed successfully');
      return data.accessToken;
    } else {
      console.log('⚠️ Refresh endpoint returned:', response.status);
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
  }

  // Last resort - check localStorage
  const stored = localStorage.getItem('google_access_token');
  if (stored) {
    console.log('⚠️ Using token from localStorage (may be expired)');
    return stored;
  }

  console.log('❌ No valid token available');
  return null;
}

/**
 * Clear all token data (on logout)
 */
export function clearTokenData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('google_access_token');
  console.log('✅ Token data cleared');
}
