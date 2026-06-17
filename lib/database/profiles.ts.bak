import { supabase } from '@/lib/supabase';

export interface ProfileData {
  full_name?: string;
  email?: string;
  business_name?: string;
  business_brief?: string;
  business_type?: string;
  theme?: 'light' | 'dark';
  language?: string;
  onboarding_completed?: boolean;
  email_verified?: boolean;
  plan?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

/**
 * Create or update user profile after authentication
 * Called after Google OAuth or email/password signup
 */
export async function createOrUpdateProfile(
  userId: string,
  data: ProfileData
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected for new users
      throw fetchError;
    }

    if (existingProfile) {
      // Update existing profile
      const { error } = await supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      console.log('✅ Profile updated for user:', userId);
    } else {
      // Create new profile with 14-day trial
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          ...data,
          subscription_status: 'trial',
          subscription_expires_at: trialEndDate.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      console.log('✅ Profile created for user with 14-day trial:', userId);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error creating/updating profile:', error);
    return { success: false, error };
  }
}

/**
 * Get user profile
 */
export async function getProfile(userId: string): Promise<any> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  data: ProfileData
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    console.log('✅ Profile updated for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    return { success: false, error };
  }
}

/**
 * Complete onboarding for a user
 * Stores business info and marks onboarding as complete
 */
export async function completeOnboarding(
  userId: string,
  data: {
    business_name: string;
    business_brief: string;
    business_type: string;
  }
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        business_name: data.business_name,
        business_brief: data.business_brief,
        business_type: data.business_type,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    console.log('✅ Onboarding completed for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error completing onboarding:', error);
    return { success: false, error };
  }
}

/**
 * Mark profile as onboarding completed
 */
export async function markOnboardingComplete(
  userId: string
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    console.log('✅ Onboarding marked as complete for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error marking onboarding complete:', error);
    return { success: false, error };
  }
}
