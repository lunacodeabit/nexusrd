import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { PersonalTask, TaskFormData } from '../types';

interface UsePersonalTasksReturn {
  tasks: PersonalTask[];
  todaysTasks: PersonalTask[];
  upcomingTasks: PersonalTask[];
  isLoading: boolean;
  error: Error | null;
  addTask: (task: TaskFormData) => Promise<PersonalTask | null>;
  updateTask: (id: string, updates: Partial<PersonalTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  markAlertSent: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function usePersonalTasks(): UsePersonalTasksReturn {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('personal_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (fetchError) {
        // Table might not exist yet, use localStorage fallback
        console.log('Personal tasks table not found, using localStorage');
        const stored = localStorage.getItem(`personal_tasks_${user.id}`);
        setTasks(stored ? JSON.parse(stored) : []);
      } else {
        setTasks(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching tasks'));
      // Fallback to localStorage
      const stored = localStorage.getItem(`personal_tasks_${user?.id}`);
      setTasks(stored ? JSON.parse(stored) : []);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Save to localStorage as backup
  const saveToLocalStorage = useCallback((updatedTasks: PersonalTask[]) => {
    if (user) {
      localStorage.setItem(`personal_tasks_${user.id}`, JSON.stringify(updatedTasks));
    }
  }, [user]);

  // Get today's tasks
  const todaysTasks = tasks.filter(task => {
    const today = new Date().toISOString().split('T')[0];
    return task.scheduled_date === today && !task.is_completed;
  }).sort((a, b) => {
    if (!a.scheduled_time) return 1;
    if (!b.scheduled_time) return -1;
    return a.scheduled_time.localeCompare(b.scheduled_time);
  });

  // Get upcoming tasks (next 7 days, excluding today)
  const upcomingTasks = tasks.filter(task => {
    const today = new Date();
    const taskDate = new Date(task.scheduled_date);
    const diffDays = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7 && !task.is_completed;
  });

  // Add new task
  const addTask = async (taskData: TaskFormData): Promise<PersonalTask | null> => {
    if (!user) return null;

    const newTask: PersonalTask = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title: taskData.title,
      description: taskData.description || undefined,
      category: taskData.category,
      priority: taskData.priority,
      scheduled_date: taskData.scheduled_date,
      scheduled_time: taskData.scheduled_time || undefined,
      duration_minutes: taskData.duration_minutes || undefined,
      is_completed: false,
      alert_minutes_before: taskData.alert_minutes_before || undefined,
      alert_sent: false,
      is_recurring: taskData.is_recurring,
      recurrence_pattern: taskData.recurrence_pattern,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Try Supabase first
    const { error: insertError } = await supabase
      .from('personal_tasks')
      .insert(newTask);

    if (insertError) {
      console.log('Could not save to Supabase, saving locally');
    }

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    saveToLocalStorage(updatedTasks);

    return newTask;
  };

  // Update task
  const updateTask = async (id: string, updates: Partial<PersonalTask>) => {
    const updatedAt = new Date().toISOString();

    await supabase
      .from('personal_tasks')
      .update({ ...updates, updated_at: updatedAt })
      .eq('id', id);

    const updatedTasks = tasks.map(t => 
      t.id === id ? { ...t, ...updates, updated_at: updatedAt } : t
    );
    setTasks(updatedTasks);
    saveToLocalStorage(updatedTasks);
  };

  // Delete task
  const deleteTask = async (id: string) => {
    await supabase
      .from('personal_tasks')
      .delete()
      .eq('id', id);

    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    saveToLocalStorage(updatedTasks);
  };

  // Toggle complete
  const toggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const updates = {
      is_completed: !task.is_completed,
      completed_at: !task.is_completed ? new Date().toISOString() : undefined,
    };

    await updateTask(id, updates);
  };

  // Mark alert as sent
  const markAlertSent = async (id: string) => {
    await updateTask(id, { alert_sent: true });
  };

  return {
    tasks,
    todaysTasks,
    upcomingTasks,
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    markAlertSent,
    refetch: fetchTasks,
  };
}
