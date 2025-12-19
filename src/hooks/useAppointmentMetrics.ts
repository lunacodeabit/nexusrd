import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from './useUserRole';
import type { AppointmentMetrics, TeamAppointmentSummary } from '../types';

interface UseAppointmentMetricsReturn {
    // For individual asesor
    myMetrics: AppointmentMetrics | null;
    // For supervisors/admin - all asesores
    teamMetrics: AppointmentMetrics[];
    teamSummary: TeamAppointmentSummary | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useAppointmentMetrics(): UseAppointmentMetricsReturn {
    const { user } = useAuth();
    const { canViewTeam } = useUserRole();
    const [myMetrics, setMyMetrics] = useState<AppointmentMetrics | null>(null);
    const [teamMetrics, setTeamMetrics] = useState<AppointmentMetrics[]>([]);
    const [teamSummary, setTeamSummary] = useState<TeamAppointmentSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchMetrics = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Get current month start
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

            // Fetch my own metrics (appointments this month)
            const { data: myAppointments, error: myError } = await supabase
                .from('scheduled_tasks')
                .select('*')
                .eq('user_id', user.id)
                .eq('task_type', 'visit')
                .gte('scheduled_date', monthStart);

            if (myError) throw myError;

            // Calculate my metrics
            const myData: AppointmentMetrics = {
                user_id: user.id,
                full_name: '',
                email: '',
                month: monthStart,
                virtual_appointments: myAppointments?.filter(a => a.appointment_type === 'virtual').length || 0,
                in_person_appointments: myAppointments?.filter(a => a.appointment_type === 'in_person').length || 0,
                total_appointments: myAppointments?.length || 0,
                completed_appointments: myAppointments?.filter(a => a.is_completed).length || 0,
                completed_virtual: myAppointments?.filter(a => a.is_completed && a.appointment_type === 'virtual').length || 0,
                completed_in_person: myAppointments?.filter(a => a.is_completed && a.appointment_type === 'in_person').length || 0,
            };
            setMyMetrics(myData);

            // If supervisor/admin, fetch team metrics
            if (canViewTeam) {
                try {
                    // Get all appointments (without JOIN to avoid relationship errors)
                    const { data: allAppointments, error: teamError } = await supabase
                        .from('scheduled_tasks')
                        .select('*')
                        .eq('task_type', 'visit')
                        .gte('scheduled_date', monthStart);

                    if (teamError) throw teamError;

                    // Get user profiles separately
                    const userIds = [...new Set((allAppointments || []).map(a => a.user_id))];
                    const { data: profiles } = await supabase
                        .from('user_profiles')
                        .select('id, full_name, email')
                        .in('id', userIds);

                    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

                    // Group by user
                    const userMetricsMap = new Map<string, AppointmentMetrics>();

                    (allAppointments || []).forEach(apt => {
                        const userId = apt.user_id;
                        const profile = profileMap.get(userId);
                        const existing = userMetricsMap.get(userId) || {
                            user_id: userId,
                            full_name: profile?.full_name || 'Sin nombre',
                            email: profile?.email || '',
                            month: monthStart,
                            virtual_appointments: 0,
                            in_person_appointments: 0,
                            total_appointments: 0,
                            completed_appointments: 0,
                            completed_virtual: 0,
                            completed_in_person: 0,
                        };

                        existing.total_appointments++;
                        if (apt.appointment_type === 'virtual') existing.virtual_appointments++;
                        if (apt.appointment_type === 'in_person') existing.in_person_appointments++;
                        if (apt.is_completed) {
                            existing.completed_appointments++;
                            if (apt.appointment_type === 'virtual') existing.completed_virtual++;
                            if (apt.appointment_type === 'in_person') existing.completed_in_person++;
                        }

                        userMetricsMap.set(userId, existing);
                    });

                    const teamData = Array.from(userMetricsMap.values())
                        .sort((a, b) => b.total_appointments - a.total_appointments);

                    setTeamMetrics(teamData);

                    // Calculate team summary
                    const summary: TeamAppointmentSummary = {
                        total_virtual: teamData.reduce((sum, m) => sum + m.virtual_appointments, 0),
                        total_in_person: teamData.reduce((sum, m) => sum + m.in_person_appointments, 0),
                        total_appointments: teamData.reduce((sum, m) => sum + m.total_appointments, 0),
                        total_completed: teamData.reduce((sum, m) => sum + m.completed_appointments, 0),
                        asesores_with_appointments: teamData.filter(m => m.total_appointments > 0).length,
                    };
                    setTeamSummary(summary);
                } catch (teamErr) {
                    console.error('Error fetching team appointment metrics:', teamErr);
                    // Don't fail the whole fetch, just log the error
                }
            }
        } catch (err) {
            console.error('Error fetching appointment metrics:', err);
            setError(err instanceof Error ? err : new Error('Error fetching metrics'));
        } finally {
            setIsLoading(false);
        }
    }, [user, canViewTeam]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    return {
        myMetrics,
        teamMetrics,
        teamSummary,
        isLoading,
        error,
        refetch: fetchMetrics,
    };
}
