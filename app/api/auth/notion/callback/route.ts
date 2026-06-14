import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { saveNotionIntegration } from '@/lib/database';

function getAbsoluteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}${path}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      console.error('❌ No authorization code received from Notion');
      return NextResponse.redirect(getAbsoluteUrl('/app/integrations?error=no_code'));
    }

    if (!state) {
      console.error('❌ No state received from Notion');
      return NextResponse.redirect(getAbsoluteUrl('/app/integrations?error=no_state'));
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing Supabase credentials');
      return NextResponse.redirect(getAbsoluteUrl('/app/integrations?error=supabase_not_configured'));
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Get user_id from oauth_states using the state
    const { data: oauthState, error: stateError } = await supabaseAdmin
      .from('oauth_states')
      .select('user_id')
      .eq('state', state)
      .eq('provider', 'notion')
      .single();

    if (stateError || !oauthState) {
      console.error('❌ Invalid or expired state:', stateError);
      return NextResponse.redirect(getAbsoluteUrl('/app/integrations?error=invalid_state'));
    }

    const userId = oauthState.user_id;
    console.log('✅ User ID from state:', userId);

    // Delete the used state record
    await supabaseAdmin
      .from('oauth_states')
      .delete()
      .eq('state', state);

    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    const redirectUri = process.env.NOTION_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('❌ Missing Notion environment variables');
      return NextResponse.redirect(getAbsoluteUrl('/app/integrations?error=notion_not_configured'));
    }

    // Exchange authorization code for access token
    console.log('🔄 Exchanging authorization code for Notion access token...');

    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('❌ Notion token exchange failed:', errorData);
      return NextResponse.redirect(getAbsoluteUrl('/app/integrations?error=token_exchange_failed'));
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('❌ No access token in Notion response');
      return NextResponse.redirect(getAbsoluteUrl('/app/integrations?error=no_access_token'));
    }

    console.log('✅ Got Notion access token');

    // Save Notion integration to database
    const saveResult = await saveNotionIntegration(userId, {
      access_token: tokenData.access_token,
      notion_workspace_id: tokenData.workspace_id,
      notion_workspace_name: tokenData.workspace_name,
    });

    if (!saveResult.success) {
      console.error('❌ Error saving Notion integration:', saveResult.error);
      return NextResponse.redirect(getAbsoluteUrl('/app/integrations?error=save_failed'));
    }

    console.log('✅ Notion integration saved for user:', userId);

    // Redirect back with success
    return NextResponse.redirect(getAbsoluteUrl('/app/integrations?notion=success'));
  } catch (error) {
    console.error('❌ Notion OAuth callback error:', error);
    return NextResponse.redirect(getAbsoluteUrl('/app/integrations?error=callback_error'));
  }
}
