import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/database';

export interface Profile {
  id: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to load and manage user profile
 * Should be used in app layout to make profile available globally
 */
export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Load profile from database
      const profileData = await getProfile(user.id);

      if (profileData) {
        setProfile(profileData);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to load profile'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        loadProfile();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const refresh = async () => {
    await loadProfile();
  };

  return { profile, loading, error, refresh };
}
