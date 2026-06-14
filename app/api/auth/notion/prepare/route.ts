import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const clientId = process.env.NOTION_CLIENT_ID;
    const redirectUri = process.env.NOTION_REDIRECT_URI;

    if (!supabaseUrl || !supabaseAnonKey || !clientId || !redirectUri) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
    }

    // Get authenticated user from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const token = authHeader.slice(7); // Remove "Bearer "
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User auth error:', userError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Create oauth_states record using service role
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Missing service role key' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabaseAdmin
      .from('oauth_states')
      .insert({
        user_id: user.id,
        provider: 'notion',
      })
      .select('state')
      .single();

    if (error || !data) {
      console.error('❌ Error creating oauth state:', error);
      console.error('Error details:', JSON.stringify(error));
      return NextResponse.json({
        error: 'Failed to create state',
        details: error?.message || 'Unknown error'
      }, { status: 500 });
    }

    // Generate authorization URL
    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(data.state)}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error in notion prepare:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
