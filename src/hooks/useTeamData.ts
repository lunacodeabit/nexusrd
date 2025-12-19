import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useUserRole } from './useUserRole';
import type {
  TeamMemberPerformance,
  DailyActivitySummary,
  UserProfile,
  Lead,
  ScheduledTask
} from '../types';

interface TeamStats {
  totalAsesores: number;
  activeToday: number;
  totalLeads: number;
  leadsWonThisMonth: number;
  conversionRate: number;
  inactiveAsesores: string[]; // IDs of asesores without activity in 3+ days
}

interface UseTeamDataReturn {
  teamMembers: TeamMemberPerformance[];
  teamStats: TeamStats | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  // Detailed data fetchers
  getAsesorLeads: (userId: string) => Promise<Lead[]>;
  getAsesorTasks: (userId: string) => Promise<ScheduledTask[]>;
  getAsesorActivity: (userId: string, days?: number) => Promise<DailyActivitySummary[]>;
  getAsesorAppointments: (userId: string) => Promise<ScheduledTask[]>;
}

export function useTeamData(): UseTeamDataReturn {
  const { canViewTeam } = useUserRole();
  const [teamMembers, setTeamMembers] = useState<TeamMemberPerformance[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTeamData = useCallback(async () => {
    if (!canViewTeam) {
      setTeamMembers([]);
      setTeamStats(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch ALL active user profiles (including admins and supervisors)
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('is_active', true);

      if (profilesError) throw profilesError;

      // Fetch leads with score info
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('user_id, status, created_at, score_category');

      if (leadsError) throw leadsError;

      // Fetch follow-ups count per lead
      const { data: followUpsData, error: followUpsError } = await supabase
        .from('follow_ups')
        .select('user_id, lead_id');

      const followUps = followUpsError ? [] : followUpsData || [];

      // Fetch tasks data
      const { data: tasksData, error: tasksError } = await supabase
        .from('scheduled_tasks')
        .select('user_id, is_completed');

      // Tasks table might not exist yet, so don't throw
      const tasks = tasksError ? [] : tasksData || [];

      // Fetch last activity per user
      const { data: activityData, error: activityError } = await supabase
        .from('activity_logs')
        .select('user_id, created_at')
        .order('created_at', { ascending: false });

      // Activity table might not exist yet
      const activities = activityError ? [] : activityData || [];

      // Calculate three days ago for inactivity check
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      // Get start of current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Build team members performance
      const members: TeamMemberPerformance[] = (profiles || []).map((profile: UserProfile) => {
        const userLeads = (leadsData || []).filter(l => l.user_id === profile.id);
        const userTasks = tasks.filter(t => t.user_id === profile.id);
        const userActivity = activities.filter(a => a.user_id === profile.id);
        const userFollowUps = followUps.filter(f => f.user_id === profile.id);

        const lastActivity = userActivity.length > 0 ? userActivity[0].created_at : null;

        // Count leads from this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const leadsThisWeek = userLeads.filter(l => new Date(l.created_at) >= oneWeekAgo).length;

        // Count leads by score category
        const hotLeads = userLeads.filter(l => l.score_category === 'HOT').length;
        const warmLeads = userLeads.filter(l => l.score_category === 'WARM').length;
        const coldLeads = userLeads.filter(l => l.score_category === 'COLD').length;

        // Active leads (not closed)
        const activeLeads = userLeads.filter(l =>
          !['CERRADO_GANADO', 'CERRADO_PERDIDO'].includes(l.status)
        ).length;

        // Follow-up metrics
        const totalFollowUps = userFollowUps.length;
        const leadsWithFollowUps = new Set(userFollowUps.map(f => f.lead_id)).size;
        const avgFollowUps = leadsWithFollowUps > 0
          ? Math.round((totalFollowUps / leadsWithFollowUps) * 10) / 10
          : 0;

        // Conversion rate (closed won / total closed)
        const closedLeads = userLeads.filter(l =>
          ['CERRADO_GANADO', 'CERRADO_PERDIDO'].includes(l.status)
        ).length;
        const leadsWon = userLeads.filter(l => l.status === 'CERRADO_GANADO').length;
        const conversionRate = closedLeads > 0
          ? Math.round((leadsWon / closedLeads) * 100)
          : 0;

        return {
          user_id: profile.id,
          full_name: profile.full_name || profile.email.split('@')[0],
          email: profile.email,
          role: profile.role,
          is_active: profile.is_active,
          total_leads: userLeads.length,
          leads_won: leadsWon,
          leads_lost: userLeads.filter(l => l.status === 'CERRADO_PERDIDO').length,
          leads_this_week: leadsThisWeek,
          total_tasks: userTasks.length,
          tasks_completed: userTasks.filter(t => t.is_completed).length,
          last_activity: lastActivity,
          // New advanced metrics
          hot_leads: hotLeads,
          warm_leads: warmLeads,
          cold_leads: coldLeads,
          active_leads: activeLeads,
          conversion_rate: conversionRate,
          avg_follow_ups: avgFollowUps,
          total_follow_ups: totalFollowUps
        };
      });

      // Sort by leads won (descending)
      members.sort((a, b) => b.leads_won - a.leads_won);

      // Calculate team stats
      const activeToday = members.filter(m => {
        if (!m.last_activity) return false;
        const today = new Date();
        const activityDate = new Date(m.last_activity);
        return activityDate.toDateString() === today.toDateString();
      }).length;

      const inactiveAsesores = members
        .filter(m => {
          if (!m.last_activity) return true;
          return new Date(m.last_activity) < threeDaysAgo;
        })
        .map(m => m.user_id);

      const totalLeads = members.reduce((sum, m) => sum + m.total_leads, 0);
      const totalWon = members.reduce((sum, m) => sum + m.leads_won, 0);
      const totalClosed = totalWon + members.reduce((sum, m) => sum + m.leads_lost, 0);

      setTeamMembers(members);
      setTeamStats({
        totalAsesores: members.length,
        activeToday,
        totalLeads,
        leadsWonThisMonth: totalWon, // Simplified for now
        conversionRate: totalClosed > 0 ? (totalWon / totalClosed) * 100 : 0,
        inactiveAsesores
      });

    } catch (err) {
      console.error('Error fetching team data:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [canViewTeam]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  // Get specific asesor's leads
  const getAsesorLeads = useCallback(async (userId: string): Promise<Lead[]> => {
    if (!canViewTeam) return [];

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching asesor leads:', error);
      return [];
    }

    return (data || []).map(lead => ({
      id: lead.id,
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source || '',
      status: lead.status,
      budget: lead.budget_max || 0,
      currency: lead.currency || 'USD',
      interestArea: lead.interest_area || '',
      notes: lead.notes || '',
      createdAt: lead.created_at,
      nextFollowUpDate: lead.next_follow_up_date,
      score: lead.score ? {
        total: lead.score,
        percentage: Math.round((lead.score / 50) * 100),
        category: lead.score_category as 'HOT' | 'WARM' | 'COLD',
        qualifiedAt: lead.qualified_at
      } : undefined
    }));
  }, [canViewTeam]);

  // Get specific asesor's tasks
  const getAsesorTasks = useCallback(async (userId: string): Promise<ScheduledTask[]> => {
    if (!canViewTeam) return [];

    const { data, error } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: false });

    if (error) {
      console.error('Error fetching asesor tasks:', error);
      return [];
    }

    return data || [];
  }, [canViewTeam]);

  // Get asesor's activity summary
  const getAsesorActivity = useCallback(async (userId: string, days = 30): Promise<DailyActivitySummary[]> => {
    if (!canViewTeam) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching asesor activity:', error);
      return [];
    }

    // Group by date and summarize
    const byDate: Record<string, DailyActivitySummary> = {};

    (data || []).forEach(log => {
      const date = log.created_at.split('T')[0];
      if (!byDate[date]) {
        byDate[date] = {
          user_id: userId,
          activity_date: date,
          total_actions: 0,
          leads_created: 0,
          leads_updated: 0,
          tasks_completed: 0,
          calls_made: 0,
          whatsapp_sent: 0
        };
      }

      byDate[date].total_actions++;
      if (log.action_type === 'lead_created') byDate[date].leads_created++;
      if (log.action_type === 'lead_updated') byDate[date].leads_updated++;
      if (log.action_type === 'task_completed') byDate[date].tasks_completed++;
      if (log.action_type === 'call_made') byDate[date].calls_made++;
      if (log.action_type === 'whatsapp_sent') byDate[date].whatsapp_sent++;
    });

    return Object.values(byDate).sort((a, b) =>
      b.activity_date.localeCompare(a.activity_date)
    );
  }, [canViewTeam]);

  // Get specific asesor's appointments (visits - virtual or in-person)
  const getAsesorAppointments = useCallback(async (userId: string): Promise<ScheduledTask[]> => {
    if (!canViewTeam) return [];

    const { data, error } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('task_type', 'visit')
      .order('scheduled_date', { ascending: false });

    if (error) {
      console.error('Error fetching asesor appointments:', error);
      return [];
    }

    return data || [];
  }, [canViewTeam]);

  return {
    teamMembers,
    teamStats,
    isLoading,
    error,
    refetch: fetchTeamData,
    getAsesorLeads,
    getAsesorTasks,
    getAsesorActivity,
    getAsesorAppointments
  };
}
