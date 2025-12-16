import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ActivityType } from '../types';

interface LogActivityParams {
  actionType: ActivityType;
  entityType?: 'lead' | 'task' | 'property';
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export function useActivityLogger() {
  const { user } = useAuth();

  const logActivity = async ({
    actionType,
    entityType,
    entityId,
    metadata = {}
  }: LogActivityParams): Promise<void> => {
    if (!user) return;

    try {
      await supabase.from('activity_logs').insert([{
        user_id: user.id,
        action_type: actionType,
        entity_type: entityType || null,
        entity_id: entityId || null,
        metadata
      }]);
    } catch (error) {
      // Silent fail - don't break app if logging fails
      console.error('Error logging activity:', error);
    }
  };

  return { logActivity };
}

// Standalone function for use outside of hooks
export async function logUserActivity(
  userId: string,
  actionType: ActivityType,
  entityType?: 'lead' | 'task' | 'property',
  entityId?: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    await supabase.from('activity_logs').insert([{
      user_id: userId,
      action_type: actionType,
      entity_type: entityType || null,
      entity_id: entityId || null,
      metadata
    }]);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}
