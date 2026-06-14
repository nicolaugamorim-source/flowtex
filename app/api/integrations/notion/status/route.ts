import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceRoleKey || !supabaseAnonKey) {
      return NextResponse.json({ connected: false, error: 'Missing credentials' }, { status: 500 });
    }

    // Get authenticated user from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ connected: false, error: 'Not authenticated' }, { status: 401 });
    }

    const token = authHeader.slice(7); // Remove "Bearer "
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ connected: false }, { status: 401 });
    }

    // Get Notion token from user_integrations using service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: integrations, error: integError } = await supabaseAdmin
      .from('user_integrations')
      .select('notion_access_token, notion_connected')
      .eq('id', user.id)
      .single();

    if (integError || !integrations?.notion_access_token) {
      return NextResponse.json({ connected: false });
    }

    // Test the token by making a request to Notion API
    const testResponse = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${integrations.notion_access_token}`,
        'Notion-Version': '2022-06-28',
      },
    });

    const isValid = testResponse.ok;

    return NextResponse.json({
      connected: isValid && integrations.notion_connected,
      token_valid: isValid,
    });
  } catch (error) {
    console.error('Error checking Notion status:', error);
    return NextResponse.json({ connected: false }, { status: 500 });
  }
}
