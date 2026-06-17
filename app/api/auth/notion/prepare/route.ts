import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const clientId = process.env.NOTION_CLIENT_ID;
    const redirectUri = process.env.NOTION_REDIRECT_URI;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!clientId || !redirectUri) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
    }

    // Get authenticated user from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const token = authHeader.slice(7); // Remove "Bearer "
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('❌ User auth error:', userError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Generate random state parameter
    const state = randomBytes(16).toString('hex');

    // Store state AND user_id in cookies for verification in callback
    const cookieStore = await cookies();
    cookieStore.set('notion_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    });

    cookieStore.set('notion_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    });

    // Build Notion auth URL
    const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?` + new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      owner: 'user',
      redirect_uri: redirectUri,
      state: state,
    });

    console.log('✅ Notion OAuth prepared for user:', user.id);
    return NextResponse.json({ authUrl: notionAuthUrl });
  } catch (error) {
    console.error('❌ Error in notion prepare:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
