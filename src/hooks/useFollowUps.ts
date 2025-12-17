import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { LeadFollowUp } from '../types/activities';

export function useFollowUps() {
  const { user } = useAuth();
  const [followUps, setFollowUps] = useState<LeadFollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowUps = useCallback(async () => {
    console.log('useFollowUps: fetchFollowUps called, user:', user?.id); // DEBUG
    
    if (!user) {
      console.log('useFollowUps: No user, returning empty'); // DEBUG
      setFollowUps([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('follow_ups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching follow-ups:', error);
        throw error;
      }
      
      console.log('Follow-ups from Supabase:', data); // DEBUG
      
      const mapped: LeadFollowUp[] = (data || []).map(f => ({
        id: f.id,
        leadId: f.lead_id,
        followUpNumber: f.follow_up_number,
        date: f.created_at,
        method: f.method as LeadFollowUp['method'],
        response: f.response as LeadFollowUp['response'],
        notes: f.notes || ''
      }));
      
      console.log('Mapped follow-ups:', mapped); // DEBUG
      
      setFollowUps(mapped);
    } catch (e) {
      console.error('Error fetching follow-ups:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFollowUps();
  }, [user, fetchFollowUps]);

  const addFollowUp = async (followUp: Omit<LeadFollowUp, 'id'>) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('follow_ups')
      .insert([{
        user_id: user.id,
        lead_id: followUp.leadId,
        follow_up_number: followUp.followUpNumber,
        method: followUp.method,
        response: followUp.response,
        notes: followUp.notes
      }]);

    if (error) throw error;
    
    // Update the lead's current_follow_up
    await supabase
      .from('leads')
      .update({ current_follow_up: followUp.followUpNumber })
      .eq('id', followUp.leadId);

    // Log activity for SuperAdmin tracking
    try {
      await supabase.from('activity_logs').insert([{
        user_id: user.id,
        action_type: 'follow_up_created',
        entity_type: 'lead',
        entity_id: followUp.leadId,
        metadata: {
          follow_up_number: followUp.followUpNumber,
          method: followUp.method,
          response: followUp.response,
          has_notes: !!followUp.notes
        }
      }]);
    } catch (logError) {
      console.error('Error logging activity:', logError);
    }
    
    await fetchFollowUps();
  };

  // Update follow-up notes
  const updateFollowUpNotes = async (followUpId: string, notes: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('follow_ups')
      .update({ notes })
      .eq('id', followUpId)
      .eq('user_id', user.id);

    if (error) throw error;
    
    await fetchFollowUps();
  };

  return { followUps, loading, addFollowUp, updateFollowUpNotes, refetch: fetchFollowUps };
}
