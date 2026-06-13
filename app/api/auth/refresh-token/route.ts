import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { refreshGoogleAccessToken } from '@/lib/google-refresh';

/**
 * POST /api/auth/refresh-token
 * Refreshes the Google access token using the refresh token stored in DB
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Refreshing token for user:', userId);

    // Get fresh token from refresh token
    const newAccessToken = await refreshGoogleAccessToken(userId);

    if (!newAccessToken) {
      console.log('❌ Could not refresh token');
      return NextResponse.json(
        { error: 'Could not refresh token. Please sign in again.' },
        { status: 401 }
      );
    }

    console.log('✅ Token refreshed successfully');

    return NextResponse.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
