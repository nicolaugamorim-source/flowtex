import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { refreshGoogleAccessToken } from '@/lib/google-refresh';
import { checkTokenRefreshRateLimit } from '@/lib/rate-limit';

// Forces a refresh of the authenticated user's Google access token.
export async function POST(request: NextRequest) {
  try {
    // Get userId from authenticated session
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

    if (!user?.id) {
      console.error('No authenticated user');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.id);

    const rateLimit = checkTokenRefreshRateLimit(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'rate_limited', retryAfterSeconds: rateLimit.retryAfterSeconds },
        { status: 429 }
      );
    }

    // Use the refresh token stored in the database
    const freshToken = await refreshGoogleAccessToken(user.id);

    if (!freshToken) {
      console.error('Could not refresh Google token');
      return NextResponse.json(
        { error: 'Could not refresh Google access token. Please sign in again.' },
        { status: 401 }
      );
    }

    console.log('Access token refreshed successfully');
    return NextResponse.json({
      accessToken: freshToken,
      source: 'refresh_token',
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
