import { supabase } from '@/lib/supabase';

export interface GoogleIntegrationData {
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  scope?: string;
}

export interface NotionIntegrationData {
  access_token: string;
  notion_workspace_id?: string;
  notion_workspace_name?: string;
  notion_bot_id?: string;
}

/**
 * Save Google integration (Gmail, Calendar)
 * Called after Google OAuth callback
 */
export async function saveGoogleIntegration(
  userId: string,
  data: GoogleIntegrationData
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const { error } = await supabase
      .from('integrations')
      .upsert(
        {
          user_id: userId,
          provider: 'google',
          access_token: data.access_token,
          refresh_token: data.refresh_token || null,
          token_expires_at: data.token_expires_at || null,
          scope: data.scope || 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar',
          is_active: true,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,provider',
        }
      );

    if (error) throw error;

    console.log('Google integration saved for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('Error saving Google integration:', error);
    return { success: false, error };
  }
}

/**
 * Save Notion integration
 * Called after Notion OAuth callback
 */
export async function saveNotionIntegration(
  userId: string,
  data: NotionIntegrationData
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const { error } = await supabase
      .from('integrations')
      .upsert(
        {
          user_id: userId,
          provider: 'notion',
          access_token: data.access_token,
          notion_workspace_id: data.notion_workspace_id || null,
          notion_workspace_name: data.notion_workspace_name || null,
          notion_bot_id: data.notion_bot_id || null,
          is_active: true,
          disconnected_at: null,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,provider',
        }
      );

    if (error) throw error;

    console.log('Notion integration saved for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('Error saving Notion integration:', error);
    return { success: false, error };
  }
}

/**
 * Get all integrations for a user
 */
export async function getIntegrations(userId: string): Promise<any[]> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return [];
  }
}

/**
 * Get specific integration for a user
 */
export async function getIntegration(userId: string, provider: string): Promise<any | null> {
  try {
    if (!userId || !provider) {
      throw new Error('userId and provider are required');
    }

    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching integration:', error);
    return null;
  }
}

/**
 * Update integration token (called when refreshing)
 */
export async function updateIntegrationToken(
  userId: string,
  provider: string,
  data: {
    access_token: string;
    token_expires_at?: string;
  }
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId || !provider) {
      throw new Error('userId and provider are required');
    }

    const { error } = await supabase
      .from('integrations')
      .update({
        access_token: data.access_token,
        token_expires_at: data.token_expires_at || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) throw error;

    console.log(`${provider} token updated for user:`, userId);
    return { success: true };
  } catch (error) {
    console.error(`Error updating ${provider} token:`, error);
    return { success: false, error };
  }
}

/**
 * Deactivate an integration
 */
export async function deactivateIntegration(
  userId: string,
  provider: string
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId || !provider) {
      throw new Error('userId and provider are required');
    }

    const { error } = await supabase
      .from('integrations')
      .update({
        is_active: false,
        disconnected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) throw error;

    console.log(`${provider} integration deactivated for user:`, userId);
    return { success: true };
  } catch (error) {
    console.error(`Error deactivating ${provider} integration:`, error);
    return { success: false, error };
  }
}

/**
 * Check if integration is connected
 */
export async function isIntegrationConnected(
  userId: string,
  provider: string
): Promise<boolean> {
  try {
    const integration = await getIntegration(userId, provider);
    return integration !== null && integration.is_active === true;
  } catch (error) {
    console.error('Error checking integration status:', error);
    return false;
  }
}
