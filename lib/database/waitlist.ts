import { supabase } from '@/lib/supabase';

export interface WaitlistEntryData {
  email: string;
  source?: string;
  name?: string;
  company?: string;
  message?: string;
}

/**
 * Add an email to the waitlist
 * Checks for duplicates first
 */
export async function addToWaitlist(
  data: WaitlistEntryData
): Promise<{ success: boolean; error?: any; message?: string }> {
  try {
    if (!data.email) {
      throw new Error('Email is required');
    }

    // Check if email already exists in waitlist
    const { data: existingEntry, error: checkError } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existingEntry) {
      return {
        success: true,
        message: 'Email already on waitlist',
      };
    }

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    // Add new entry
    const { error } = await supabase
      .from('waitlist')
      .insert({
        email: data.email,
        source: data.source || 'landing_page',
        name: data.name || null,
        company: data.company || null,
        message: data.message || null,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;

    console.log('Email added to waitlist:', data.email);
    return { success: true, message: 'Added to waitlist' };
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return { success: false, error };
  }
}

/**
 * Check if email is on waitlist
 */
export async function isOnWaitlist(email: string): Promise<boolean> {
  try {
    if (!email) {
      return false;
    }

    const { data, error } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .single();

    if (error && error.code === 'PGRST116') {
      return false;
    }

    if (error) throw error;

    return !!data;
  } catch (error) {
    console.error('Error checking waitlist:', error);
    return false;
  }
}

/**
 * Get waitlist count
 */
export async function getWaitlistCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return count || 0;
  } catch (error) {
    console.error('Error getting waitlist count:', error);
    return 0;
  }
}

/**
 * Get all waitlist entries (admin only)
 */
export async function getWaitlistEntries(limit: number = 100): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching waitlist entries:', error);
    return [];
  }
}

/**
 * Remove entry from waitlist
 */
export async function removeFromWaitlist(email: string): Promise<{ success: boolean; error?: any }> {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    const { error } = await supabase
      .from('waitlist')
      .delete()
      .eq('email', email);

    if (error) throw error;

    console.log('Removed from waitlist:', email);
    return { success: true };
  } catch (error) {
    console.error('Error removing from waitlist:', error);
    return { success: false, error };
  }
}
