import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface AIContextData {
  business_brief?: string;
  industry?: string;
  key_goals?: string;
  context?: string;
  tone?: string;
  language?: string;
  preferences?: Record<string, any>;
}

/**
 * Save AI context for a user
 * Called after onboarding completion with business info
 */
export async function saveAIContext(
  userId: string,
  data: AIContextData
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const { error } = await supabase
      .from('ai_context')
      .upsert(
        {
          user_id: userId,
          business_brief: data.business_brief || null,
          industry: data.industry || null,
          key_goals: data.key_goals || null,
          context: data.context || null,
          tone: data.tone || 'professional',
          language: data.language || 'en',
          preferences: data.preferences || {},
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (error) throw error;

    console.log('AI context saved for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('Error saving AI context:', error);
    return { success: false, error };
  }
}

/**
 * Get AI context for a user
 * Used in chat route to provide context to Claude
 */
export async function getAIContext(
  userId: string,
  client: SupabaseClient = supabase
): Promise<any | null> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const { data, error } = await client
      .from('ai_context')
      .select('*')
      .eq('user_id', userId)
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
    console.error('Error fetching AI context:', error);
    return null;
  }
}

/**
 * Update AI context for a user
 * Called when user info changes (onboarding update, profile changes)
 */
export async function updateAIContext(
  userId: string,
  data: AIContextData
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Only update fields that are provided
    if (data.business_brief !== undefined) updateData.business_brief = data.business_brief;
    if (data.industry !== undefined) updateData.industry = data.industry;
    if (data.key_goals !== undefined) updateData.key_goals = data.key_goals;
    if (data.context !== undefined) updateData.context = data.context;
    if (data.tone !== undefined) updateData.tone = data.tone;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.preferences !== undefined) updateData.preferences = data.preferences;

    const { error } = await supabase
      .from('ai_context')
      .update(updateData)
      .eq('user_id', userId);

    if (error) throw error;

    console.log('AI context updated for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('Error updating AI context:', error);
    return { success: false, error };
  }
}

/**
 * Build context string for AI system prompt
 *
 * Reads from `profiles`, not `ai_context` — onboarding reliably writes business
 * info to profiles, but only opportunistically updates ai_context (which silently
 * no-ops if that row doesn't exist yet), so ai_context can be empty even when the
 * user has completed onboarding.
 */
export async function buildAIContextString(
  userId: string,
  client: SupabaseClient = supabase
): Promise<string> {
  try {
    const { data: profile, error } = await client
      .from('profiles')
      .select('business_name, business_type, industry, business_brief, target_clients, main_tools')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return '';
    }

    let contextString = '\n\nUSER CONTEXT:\n';

    if (profile.business_name) {
      contextString += `Business Name: ${profile.business_name}\n`;
    }

    if (profile.business_type) {
      contextString += `Business Type: ${profile.business_type}\n`;
    }

    if (profile.industry) {
      contextString += `Industry: ${profile.industry}\n`;
    }

    if (profile.business_brief) {
      contextString += `Business Brief: ${profile.business_brief}\n`;
    }

    if (profile.target_clients) {
      contextString += `Target Clients: ${profile.target_clients}\n`;
    }

    if (profile.main_tools) {
      contextString += `Main Tools Used: ${profile.main_tools}\n`;
    }

    return contextString === '\n\nUSER CONTEXT:\n' ? '' : contextString;
  } catch (error) {
    console.error('Error building AI context string:', error);
    return '';
  }
}
