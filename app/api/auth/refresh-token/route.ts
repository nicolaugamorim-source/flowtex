import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { refreshGoogleAccessToken } from '@/lib/google-refresh';
import { checkTokenRefreshRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/auth/refresh-token
 * Refreshes the Google access token using the refresh token stored in DB
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const rateLimit = checkTokenRefreshRateLimit(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'rate_limited', retryAfterSeconds: rateLimit.retryAfterSeconds },
        { status: 429 }
      );
    }

    console.log('Refreshing token for user:', userId);

    // Get fresh token from refresh token
    const newAccessToken = await refreshGoogleAccessToken(userId);

    if (!newAccessToken) {
      console.log('Could not refresh token');
      return NextResponse.json(
        { error: 'Could not refresh token. Please sign in again.' },
        { status: 401 }
      );
    }

    console.log('Token refreshed successfully');

    return NextResponse.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
