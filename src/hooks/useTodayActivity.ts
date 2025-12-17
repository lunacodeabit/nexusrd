import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TodayActivityCounts {
  calls: number;
  whatsapp: number;
  emails: number;
  followUps: number;
  leadsCreated: number;
  total: number;
}

export function useTodayActivity() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<TodayActivityCounts>({
    calls: 0,
    whatsapp: 0,
    emails: 0,
    followUps: 0,
    leadsCreated: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchTodayActivity = useCallback(async () => {
    if (!user) {
      setCounts({ calls: 0, whatsapp: 0, emails: 0, followUps: 0, leadsCreated: 0, total: 0 });
      setLoading(false);
      return;
    }

    try {
      // Get start of today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('activity_logs')
        .select('action_type, metadata')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      if (error) {
        console.error('Error fetching today activity:', error);
        return;
      }

      const activities = data || [];
      
      const newCounts: TodayActivityCounts = {
        calls: activities.filter(a => a.action_type === 'call_made' && !a.metadata?.type).length,
        whatsapp: activities.filter(a => a.action_type === 'whatsapp_sent').length,
        emails: activities.filter(a => a.action_type === 'call_made' && a.metadata?.type === 'email_sent').length,
        followUps: activities.filter(a => a.action_type === 'follow_up_created').length,
        leadsCreated: activities.filter(a => a.action_type === 'lead_created').length,
        total: activities.length
      };

      setCounts(newCounts);
    } catch (e) {
      console.error('Error in useTodayActivity:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTodayActivity();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchTodayActivity, 30000);
    return () => clearInterval(interval);
  }, [fetchTodayActivity]);

  return { counts, loading, refetch: fetchTodayActivity };
}
