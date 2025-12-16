import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { TaskCompletion } from '../types/activities';

export function useActivities() {
  const { user } = useAuth();
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompletions = useCallback(async () => {
    if (!user) {
      setCompletions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      
      const mapped: TaskCompletion[] = (data || []).map(a => ({
        taskId: a.task_id,
        date: a.date,
        dayOfWeek: a.day_of_week as TaskCompletion['dayOfWeek'],
        completed: a.completed,
        completedAt: a.completed_at
      }));
      
      setCompletions(mapped);
    } catch (e) {
      console.error('Error fetching activities:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCompletions();
  }, [user, fetchCompletions]);

  const toggleTask = async (taskId: string, date: string, dayOfWeek: TaskCompletion['dayOfWeek']) => {
    if (!user) throw new Error('User not authenticated');

    // Check if exists
    const existing = completions.find(c => c.taskId === taskId && c.date === date);
    
    if (existing) {
      // Toggle
      const { error } = await supabase
        .from('daily_activities')
        .update({ 
          completed: !existing.completed,
          completed_at: !existing.completed ? new Date().toISOString() : null
        })
        .eq('user_id', user.id)
        .eq('task_id', taskId)
        .eq('date', date);

      if (error) throw error;
    } else {
      // Create new
      const { error } = await supabase
        .from('daily_activities')
        .insert([{
          user_id: user.id,
          task_id: taskId,
          date: date,
          day_of_week: dayOfWeek,
          completed: true,
          completed_at: new Date().toISOString()
        }]);

      if (error) throw error;
    }
    
    await fetchCompletions();
  };

  return { completions, loading, toggleTask, refetch: fetchCompletions };
}
