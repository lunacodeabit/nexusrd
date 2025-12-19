import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { FollowUpTracking, TrackingFormData } from '../types';

interface UseFollowUpTrackingReturn {
  trackings: FollowUpTracking[];
  waitingLeads: FollowUpTracking[];
  pausedLeads: FollowUpTracking[];
  searchingLeads: FollowUpTracking[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  addTracking: (leadId: string, data: TrackingFormData) => Promise<FollowUpTracking | null>;
  updateTracking: (id: string, updates: Partial<FollowUpTracking>) => Promise<void>;
  reactivateLead: (trackingId: string) => Promise<boolean>;
  cancelTracking: (trackingId: string) => Promise<void>;
  incrementPropertiesSent: (trackingId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useFollowUpTracking(): UseFollowUpTrackingReturn {
  const { user } = useAuth();
  const [trackings, setTrackings] = useState<FollowUpTracking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all active trackings
  const fetchTrackings = useCallback(async () => {
    if (!user) {
      setTrackings([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Try to fetch trackings - use simple query without JOIN to avoid column errors
      const { data, error: fetchError } = await supabase
        .from('follow_up_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        // Table likely doesn't exist - this is OK, just use empty state
        if (fetchError.code === '42P01' || fetchError.message?.includes('does not exist')) {
          console.log('follow_up_tracking table not found, using empty state');
          setTrackings([]);
          setError(null);
        } else {
          console.error('Error fetching trackings:', fetchError);
          setError(new Error(fetchError.message));
          setTrackings([]);
        }
      } else {
        // Transform data - no JOIN so lead info will be fetched separately when needed
        const transformed = (data || []).map(t => ({
          ...t,
          days_until_contact: t.contact_date
            ? Math.ceil((new Date(t.contact_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null,
          days_in_tracking: Math.ceil((Date.now() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        }));
        setTrackings(transformed);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching trackings'));
      setTrackings([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTrackings();
  }, [fetchTrackings]);

  // Filter by type
  const waitingLeads = trackings.filter(t => t.tracking_type === 'waiting');
  const pausedLeads = trackings.filter(t => t.tracking_type === 'paused');
  const searchingLeads = trackings.filter(t => t.tracking_type === 'searching');
  const totalCount = trackings.length;

  // Add new tracking
  const addTracking = async (leadId: string, data: TrackingFormData): Promise<FollowUpTracking | null> => {
    if (!user) return null;

    try {
      // Get lead's current status
      const { data: lead } = await supabase
        .from('leads')
        .select('status')
        .eq('id', leadId)
        .single();

      if (!lead) {
        throw new Error('Lead not found');
      }

      // Deactivate any existing active tracking for this lead
      await supabase
        .from('follow_up_tracking')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('lead_id', leadId)
        .eq('is_active', true);

      // Create new tracking
      const newTracking = {
        user_id: user.id,
        lead_id: leadId,
        tracking_type: data.tracking_type,
        original_status: lead.status,
        reason: data.reason,
        notes: data.notes || null,
        contact_date: data.contact_date || null,
        search_criteria: data.search_criteria || null,
        properties_sent: 0,
        is_active: true,
      };

      const { data: inserted, error: insertError } = await supabase
        .from('follow_up_tracking')
        .insert(newTracking)
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Refresh list
      await fetchTrackings();
      return inserted;
    } catch (err) {
      console.error('Error adding tracking:', err);
      setError(err instanceof Error ? err : new Error('Error adding tracking'));
      return null;
    }
  };

  // Update tracking
  const updateTracking = async (id: string, updates: Partial<FollowUpTracking>) => {
    try {
      const { error: updateError } = await supabase
        .from('follow_up_tracking')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (updateError) throw new Error(updateError.message);

      // Update local state
      setTrackings(prev => prev.map(t =>
        t.id === id ? { ...t, ...updates } : t
      ));
    } catch (err) {
      console.error('Error updating tracking:', err);
      setError(err instanceof Error ? err : new Error('Error updating tracking'));
    }
  };

  // Reactivate lead (move back to Kanban)
  const reactivateLead = async (trackingId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const tracking = trackings.find(t => t.id === trackingId);
      if (!tracking) return false;

      // Deactivate tracking
      await supabase
        .from('follow_up_tracking')
        .update({
          is_active: false,
          reactivated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', trackingId);

      // Restore lead to original status
      await supabase
        .from('leads')
        .update({
          status: tracking.original_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', tracking.lead_id);

      // Refresh list
      await fetchTrackings();
      return true;
    } catch (err) {
      console.error('Error reactivating lead:', err);
      setError(err instanceof Error ? err : new Error('Error reactivating lead'));
      return false;
    }
  };

  // Cancel tracking without reactivating
  const cancelTracking = async (trackingId: string) => {
    try {
      await supabase
        .from('follow_up_tracking')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', trackingId);

      // Refresh list
      await fetchTrackings();
    } catch (err) {
      console.error('Error canceling tracking:', err);
      setError(err instanceof Error ? err : new Error('Error canceling tracking'));
    }
  };

  // Increment properties sent counter (for searching type)
  const incrementPropertiesSent = async (trackingId: string) => {
    const tracking = trackings.find(t => t.id === trackingId);
    if (!tracking) return;

    await updateTracking(trackingId, {
      properties_sent: (tracking.properties_sent || 0) + 1
    });
  };

  return {
    trackings,
    waitingLeads,
    pausedLeads,
    searchingLeads,
    totalCount,
    isLoading,
    error,
    addTracking,
    updateTracking,
    reactivateLead,
    cancelTracking,
    incrementPropertiesSent,
    refetch: fetchTrackings,
  };
}
