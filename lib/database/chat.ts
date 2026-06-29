import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface ChatMessageData {
  role: 'user' | 'assistant';
  content: string;
  action_type?: string;
  action_result?: string;
  input_tokens?: number;
  output_tokens?: number;
}

/**
 * Save a chat message to database
 * Called after each user message or assistant response
 */
export async function saveChatMessage(
  userId: string,
  data: ChatMessageData,
  client: SupabaseClient = supabase
): Promise<{ success: boolean; error?: any; messageId?: string }> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const { data: insertedData, error } = await client
      .from('chat_messages')
      .insert({
        user_id: userId,
        role: data.role,
        content: data.content,
        action_type: data.action_type || null,
        action_result: data.action_result || null,
        input_tokens: data.input_tokens || 0,
        output_tokens: data.output_tokens || 0,
        created_at: new Date().toISOString(),
      })
      .select('id');

    if (error) throw error;

    const messageId = insertedData?.[0]?.id;
    console.log('Chat message saved:', messageId);

    return { success: true, messageId };
  } catch (error) {
    console.error('Error saving chat message:', error);
    return { success: false, error };
  }
}

/**
 * Get chat history for a user (last N messages)
 * Used to load conversation context
 */
export async function getChatHistory(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }
}

/**
 * Get full chat history for export or review
 */
export async function getFullChatHistory(userId: string): Promise<any[]> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching full chat history:', error);
    return [];
  }
}

/**
 * Get recent chat messages (for context window)
 * Returns messages from the last N minutes
 */
export async function getRecentChatMessages(
  userId: string,
  minutesBack: number = 120
): Promise<any[]> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const cutoffDate = new Date(Date.now() - minutesBack * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', cutoffDate)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching recent chat messages:', error);
    return [];
  }
}

/**
 * Get messages with actions performed
 */
export async function getChatMessagesWithActions(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .not('action_type', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching chat messages with actions:', error);
    return [];
  }
}

/**
 * Clear chat history for a user
 */
export async function clearChatHistory(userId: string): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    console.log('Chat history cleared for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return { success: false, error };
  }
}

/**
 * Calculate token usage statistics
 */
export async function getTokenUsageStats(
  userId: string,
  period: 'day' | 'week' | 'month' = 'month'
): Promise<{ input_tokens: number; output_tokens: number; message_count: number }> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    // Calculate cutoff date
    const now = new Date();
    let cutoffDate = new Date();

    if (period === 'day') {
      cutoffDate.setDate(now.getDate() - 1);
    } else if (period === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      cutoffDate.setMonth(now.getMonth() - 1);
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('input_tokens, output_tokens')
      .eq('user_id', userId)
      .gte('created_at', cutoffDate.toISOString());

    if (error) throw error;

    const stats = {
      input_tokens: 0,
      output_tokens: 0,
      message_count: data?.length || 0,
    };

    if (data) {
      stats.input_tokens = data.reduce((sum, msg) => sum + (msg.input_tokens || 0), 0);
      stats.output_tokens = data.reduce((sum, msg) => sum + (msg.output_tokens || 0), 0);
    }

    return stats;
  } catch (error) {
    console.error('Error calculating token usage:', error);
    return { input_tokens: 0, output_tokens: 0, message_count: 0 };
  }
}
