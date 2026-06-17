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

    console.log('✅ AI context saved for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving AI context:', error);
    return { success: false, error };
  }
}

/**
 * Get AI context for a user
 * Used in chat route to provide context to Claude
 */
export async function getAIContext(userId: string): Promise<any | null> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const { data, error } = await supabase
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
    console.error('❌ Error fetching AI context:', error);
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

    console.log('✅ AI context updated for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating AI context:', error);
    return { success: false, error };
  }
}

/**
 * Build context string for AI system prompt
 */
export async function buildAIContextString(userId: string): Promise<string> {
  try {
    const aiContext = await getAIContext(userId);

    if (!aiContext) {
      return '';
    }

    let contextString = '\n\nUSER CONTEXT:\n';

    if (aiContext.business_brief) {
      contextString += `Business Brief: ${aiContext.business_brief}\n`;
    }

    if (aiContext.industry) {
      contextString += `Industry: ${aiContext.industry}\n`;
    }

    if (aiContext.key_goals) {
      contextString += `Key Goals: ${aiContext.key_goals}\n`;
    }

    if (aiContext.context) {
      contextString += `Additional Context: ${aiContext.context}\n`;
    }

    return contextString;
  } catch (error) {
    console.error('❌ Error building AI context string:', error);
    return '';
  }
}
