import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface ActivityLogEntry {
    id: string;
    action_type: string;
    lead_id: string | null;
    lead_name: string | null;
    metadata: {
        phone?: string;
        message?: string;
        type?: string;
        [key: string]: unknown;
    } | null;
    created_at: string;
}

interface ActivityDetails {
    calls: ActivityLogEntry[];
    whatsapp: ActivityLogEntry[];
    loading: boolean;
}

export function useTodayActivityDetails() {
    const { user } = useAuth();
    const [details, setDetails] = useState<ActivityDetails>({
        calls: [],
        whatsapp: [],
        loading: true
    });

    const fetchDetails = useCallback(async () => {
        if (!user) {
            setDetails({ calls: [], whatsapp: [], loading: false });
            return;
        }

        try {
            // Get start of today
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('activity_logs')
                .select('id, action_type, lead_id, metadata, created_at')
                .eq('user_id', user.id)
                .gte('created_at', today.toISOString())
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching activity details:', error);
                return;
            }

            const activities = data || [];

            // Get unique lead IDs to fetch lead names
            const leadIds = [...new Set(activities.map(a => a.lead_id).filter(Boolean))] as string[];

            let leadNames: Record<string, string> = {};
            if (leadIds.length > 0) {
                const { data: leads } = await supabase
                    .from('leads')
                    .select('id, name')
                    .in('id', leadIds);

                if (leads) {
                    leadNames = leads.reduce((acc, l) => ({ ...acc, [l.id]: l.name }), {});
                }
            }

            // Add lead names to activities
            const activitiesWithNames = activities.map(a => ({
                ...a,
                lead_name: a.lead_id ? leadNames[a.lead_id] || 'Lead desconocido' : null
            }));

            setDetails({
                calls: activitiesWithNames.filter(a => a.action_type === 'call_made' && !a.metadata?.type),
                whatsapp: activitiesWithNames.filter(a => a.action_type === 'whatsapp_sent'),
                loading: false
            });

        } catch (e) {
            console.error('Error in useTodayActivityDetails:', e);
            setDetails({ calls: [], whatsapp: [], loading: false });
        }
    }, [user]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    return { ...details, refetch: fetchDetails };
}
