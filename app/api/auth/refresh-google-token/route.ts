import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { refreshGoogleAccessToken } from '@/lib/google-refresh';

// Forces a refresh of the authenticated user's Google access token.
export async function POST(request: NextRequest) {
  try {
    // Get userId from authenticated session
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      console.error('No authenticated user');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.id);

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
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
