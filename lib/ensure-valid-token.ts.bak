import { refreshGoogleAccessToken } from './google-refresh';

/**
 * Ensures we have a valid Google access token by refreshing if needed
 * @param currentToken Token from the frontend (may be expired)
 * @param userId User ID to fetch refresh token from database
 * @returns Valid access token or null
 */
export async function ensureValidGoogleToken(
  currentToken: string | undefined,
  userId: string | undefined
): Promise<string | null> {
  // If we have userId, always try to refresh first
  if (userId) {
    console.log('🔄 Attempting to refresh Google access token...');
    const refreshedToken = await refreshGoogleAccessToken(userId);

    if (refreshedToken) {
      console.log('✅ Token refreshed successfully from refresh token');
      return refreshedToken;
    }

    // Refresh failed, log but continue
    console.log('⚠️ Token refresh failed, falling back to frontend token');
  }

  // Fall back to current token from frontend
  if (currentToken) {
    console.log('⚠️ Using token from frontend (may be expired)');
    return currentToken;
  }

  console.log('❌ No valid token available');
  return null;
}

/**
 * Get userId from Supabase session
 */
export async function getUserIdFromSession(): Promise<string | undefined> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  } catch (error) {
    console.log('Could not get userId from session:', error);
    return undefined;
  }
}
