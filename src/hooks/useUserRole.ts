import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile, UserRole } from '../types';

interface UseUserRoleReturn {
  profile: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isSupervisor: boolean;
  isAdmin: boolean;
  isAsesor: boolean;
  canViewTeam: boolean;
  canManageUsers: boolean;
  canViewSettings: boolean;
  refetch: () => Promise<void>;
}

export function useUserRole(): UseUserRoleReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert([{
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
              role: 'asesor'
            }])
            .select()
            .single();

          if (insertError) throw insertError;
          setProfile(newProfile);
        } else {
          throw error;
        }
      } else {
        // Si el perfil existe pero el nombre está vacío, actualizarlo con los datos del registro
        if (data && (!data.full_name || data.full_name === user.email?.split('@')[0]) && user.user_metadata?.full_name) {
          const { data: updatedProfile } = await supabase
            .from('user_profiles')
            .update({ full_name: user.user_metadata.full_name })
            .eq('id', user.id)
            .select()
            .single();
          
          setProfile(updatedProfile || data);
        } else {
          setProfile(data);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const role = profile?.role ?? null;
  const isSupervisor = role === 'supervisor';
  const isAdmin = role === 'admin';
  const isAsesor = role === 'asesor';
  const canViewTeam = isSupervisor || isAdmin;
  const canManageUsers = isSupervisor || isAdmin;
  const canViewSettings = isSupervisor || isAdmin;

  return {
    profile,
    role,
    isLoading,
    isSupervisor,
    isAdmin,
    isAsesor,
    canManageUsers,
    canViewTeam,
    canViewSettings,
    refetch: fetchProfile
  };
}
