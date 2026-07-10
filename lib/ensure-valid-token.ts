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
    console.log('Attempting to refresh Google access token...');
    const refreshedToken = await refreshGoogleAccessToken(userId);

    if (refreshedToken) {
      console.log('Token refreshed successfully from refresh token');
      return refreshedToken;
    }

    // Don't fall back to a stale token if the integration is now known to be
    // dead (refreshGoogleAccessToken marks it inactive on a revoked grant) —
    // that stale token can't work either, and falling back would hide the
    // real "reconnect Google" signal behind a confusing downstream API error.
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: integration } = await supabaseAdmin
        .from('integrations')
        .select('is_active')
        .eq('user_id', userId)
        .eq('provider', 'google')
        .maybeSingle();

      if (integration?.is_active === false) {
        console.log('Google integration is inactive — not falling back to a stale token');
        return null;
      }
    } catch (checkError) {
      console.log('Could not check integration status:', checkError);
    }

    // Refresh failed for some other (likely transient) reason — fall back.
    console.log('Token refresh failed, falling back to frontend token');
  }

  // Fall back to current token from frontend
  if (currentToken) {
    console.log('Using token from frontend (may be expired)');
    return currentToken;
  }

  console.log('No valid token available');
  return null;
}
