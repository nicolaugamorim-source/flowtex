import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { captureServerEvent } from '@/lib/posthog-server';

function getAbsoluteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}${path}`;
}

// Notion OAuth callback — exchanges the authorization code for an access
// token and saves the integration for the user identified by the state cookie.

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const returnedState = searchParams.get('state');

    if (!code) {
      console.error('No authorization code received from Notion');
      return NextResponse.redirect(getAbsoluteUrl('/app/integrations?error=no_code'));
    }

    if (!returnedState) {
      console.error('No state received from Notion');
      return NextResponse.redirect(getAbsoluteUrl('/app/integrations?error=no_state'));
    }

    // Verify state from cookie
    const cookieStore = await cookies();
    const savedState = cookieStore.get('notion_oauth_state')?.value;
    const userId = cookieStore.get('notion_user_id')?.value;

    if (!savedState || savedState !== returnedState) {
      console.error('Invalid or expired state');
      return NextResponse.redirect(getAbsoluteUrl('/app/integrations?error=invalid_state'));
    }

    if (!userId) {
      console.error('No user ID in cookie');
      return NextResponse.redirect(getAbsoluteUrl('/app/integrations?error=no_user_id'));
    }

    // Clear the state cookies
    cookieStore.delete('notion_oauth_state');
    cookieStore.delete('notion_user_id');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.redirect(getAbsoluteUrl('/app/integrations?error=supabase_not_configured'));
    }

    // Use service role for saving (we have userId from cookie, not from auth)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    console.log('User ID from cookie:', userId);

    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    const redirectUri = process.env.NOTION_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing Notion environment variables');
      return NextResponse.redirect(getAbsoluteUrl('/app/integrations?error=notion_not_configured'));
    }

    // Exchange authorization code for access token
    console.log('Exchanging authorization code for Notion access token...');

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
      console.error('Notion token exchange failed:', errorData);
      return NextResponse.redirect(getAbsoluteUrl('/app/integrations?error=token_exchange_failed'));
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('No access token in Notion response');
      return NextResponse.redirect(getAbsoluteUrl('/app/integrations?error=no_access_token'));
    }

    console.log('Got Notion access token');

    // Save Notion integration to database using service role
    const { error: saveError } = await supabaseAdmin
      .from('integrations')
      .upsert(
        {
          user_id: userId,
          provider: 'notion',
          access_token: tokenData.access_token,
          notion_workspace_id: tokenData.workspace_id || null,
          notion_workspace_name: tokenData.workspace_name || null,
          notion_bot_id: tokenData.bot_id || null,
          is_active: true,
          disconnected_at: null,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,provider',
        }
      );

    if (saveError) {
      console.error('Error saving Notion integration:', saveError);
      return NextResponse.redirect(getAbsoluteUrl('/app/integrations?error=save_failed'));
    }

    console.log('Notion integration saved for user:', userId);

    await captureServerEvent(userId, 'integration_connected', { integration: 'notion' });

    // Redirect back with success
    return NextResponse.redirect(getAbsoluteUrl('/app/integrations?notion=success'));
  } catch (error) {
    console.error('Notion OAuth callback error:', error);
    return NextResponse.redirect(getAbsoluteUrl('/app/integrations?error=callback_error'));
  }
}
