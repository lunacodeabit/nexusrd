import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface UserProfileData {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  telegram_chat_id: string;
  whatsapp_number: string;
  default_alert_time: number;
  enable_whatsapp_alerts: boolean;
  enable_telegram_alerts: boolean;
  enable_sound_alerts: boolean;
  enable_browser_notifications: boolean;
  role?: string;
  is_active?: boolean;
}

const defaultProfile: Omit<UserProfileData, 'id' | 'email'> = {
  full_name: '',
  telegram_chat_id: '',
  whatsapp_number: '',
  default_alert_time: 15,
  enable_whatsapp_alerts: false,
  enable_telegram_alerts: true,
  enable_sound_alerts: true,
  enable_browser_notifications: true,
};

interface UseUserProfileReturn {
  profile: UserProfileData | null;
  isLoading: boolean;
  error: Error | null;
  updateProfile: (updates: Partial<UserProfileData>) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useUserProfile(): UseUserProfileReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        // Handle case where new columns don't exist yet
        if (fetchError.code === '42703') {
          console.log('Some columns might not exist yet, using defaults');
        }
        throw fetchError;
      }

      // Merge with defaults in case some columns are null
      setProfile({
        ...defaultProfile,
        id: user.id,
        email: user.email || '',
        ...data,
        telegram_chat_id: data?.telegram_chat_id || '',
        whatsapp_number: data?.whatsapp_number || '',
        enable_telegram_alerts: data?.enable_telegram_alerts ?? true,
        enable_whatsapp_alerts: data?.enable_whatsapp_alerts ?? false,
        enable_sound_alerts: data?.enable_sound_alerts ?? true,
        enable_browser_notifications: data?.enable_browser_notifications ?? true,
      });
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err : new Error('Error fetching profile'));
      
      // Set minimal profile with defaults
      if (user) {
        setProfile({
          ...defaultProfile,
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<UserProfileData>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      return false;
    }
  }, [user]);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
}

// Singleton for non-hook usage (alerts system)
let cachedProfile: UserProfileData | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

export async function getProfileForAlerts(userId: string): Promise<UserProfileData | null> {
  const now = Date.now();
  
  // Return cached if still fresh
  if (cachedProfile && cachedProfile.id === userId && now - lastFetchTime < CACHE_DURATION) {
    return cachedProfile;
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile for alerts:', error);
      return cachedProfile; // Return stale cache if available
    }

    cachedProfile = {
      ...defaultProfile,
      id: userId,
      email: data?.email || '',
      ...data,
      telegram_chat_id: data?.telegram_chat_id || '',
      whatsapp_number: data?.whatsapp_number || '',
      enable_telegram_alerts: data?.enable_telegram_alerts ?? true,
      enable_whatsapp_alerts: data?.enable_whatsapp_alerts ?? false,
      enable_sound_alerts: data?.enable_sound_alerts ?? true,
      enable_browser_notifications: data?.enable_browser_notifications ?? true,
    };
    lastFetchTime = now;
    
    return cachedProfile;
  } catch (err) {
    console.error('Error in getProfileForAlerts:', err);
    return cachedProfile;
  }
}

// Clear cache when profile is updated
export function clearProfileCache() {
  cachedProfile = null;
  lastFetchTime = 0;
}
