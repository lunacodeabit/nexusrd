import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Lead } from '../types';

export function useLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeads = useCallback(async () => {
    if (!user) {
      setLeads([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map database fields to app fields
      const mappedLeads: Lead[] = (data || []).map(lead => ({
        id: lead.id,
        name: lead.name,
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source || '',
        status: lead.status,
        budget: lead.budget_max || 0,
        currency: (lead.currency || 'USD') as Lead['currency'],
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
      
      setLeads(mappedLeads);
    } catch (e) {
      setError(e as Error);
      console.error('Error fetching leads:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLeads();

    // Subscribe to realtime changes
    if (user) {
      const subscription = supabase
        .channel('leads_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'leads', filter: `user_id=eq.${user.id}` }, 
          () => fetchLeads()
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, fetchLeads]);

  const addLead = async (lead: Omit<Lead, 'id'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('leads')
      .insert([{
        user_id: user.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        status: lead.status,
        budget_max: lead.budget,
        // currency: lead.currency || 'USD', // Enable after running SQL
        interest_area: lead.interestArea,
        notes: lead.notes,
        next_follow_up_date: lead.nextFollowUpDate,
        score: lead.score?.total,
        score_category: lead.score?.category
      }])
      .select()
      .single();

    if (error) throw error;
    await fetchLeads();
    return data;
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    if (!user) throw new Error('User not authenticated');

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.source !== undefined) dbUpdates.source = updates.source;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.budget !== undefined) dbUpdates.budget_max = updates.budget;
    // if (updates.currency !== undefined) dbUpdates.currency = updates.currency; // Enable after running SQL
    if (updates.interestArea !== undefined) dbUpdates.interest_area = updates.interestArea;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.nextFollowUpDate !== undefined) dbUpdates.next_follow_up_date = updates.nextFollowUpDate;
    if (updates.score !== undefined) {
      dbUpdates.score = updates.score.total;
      dbUpdates.score_category = updates.score.category;
    }

    const { data, error } = await supabase
      .from('leads')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    await fetchLeads();
    return data;
  };

  const deleteLead = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    await fetchLeads();
  };

  return { leads, loading, error, addLead, updateLead, deleteLead, refetch: fetchLeads };
}
