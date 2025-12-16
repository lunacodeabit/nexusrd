import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Property } from '../types';

export function useProperties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProperties = useCallback(async () => {
    if (!user) {
      setProperties([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedProperties: Property[] = (data || []).map(prop => ({
        id: prop.id,
        title: prop.title,
        address: prop.address || prop.zone || '',
        price: prop.price,
        status: prop.status,
        bedrooms: prop.bedrooms || 0,
        bathrooms: prop.bathrooms || 0,
        sqMeters: prop.area_m2 || 0,
        imageUrl: prop.images?.[0] || '',
        ownerName: prop.owner_name || '',
        ownerPhone: prop.owner_phone || ''
      }));
      
      setProperties(mappedProperties);
    } catch (e) {
      setError(e as Error);
      console.error('Error fetching properties:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProperties();

    if (user) {
      const subscription = supabase
        .channel('properties_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'properties', filter: `user_id=eq.${user.id}` }, 
          () => fetchProperties()
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, fetchProperties]);

  const addProperty = async (property: Omit<Property, 'id'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('properties')
      .insert([{
        user_id: user.id,
        title: property.title,
        address: property.address,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area_m2: property.sqMeters,
        status: property.status,
        images: property.imageUrl ? [property.imageUrl] : [],
        owner_name: property.ownerName,
        owner_phone: property.ownerPhone
      }])
      .select()
      .single();

    if (error) throw error;
    await fetchProperties();
    return data;
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    if (!user) throw new Error('User not authenticated');

    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.bedrooms !== undefined) dbUpdates.bedrooms = updates.bedrooms;
    if (updates.bathrooms !== undefined) dbUpdates.bathrooms = updates.bathrooms;
    if (updates.sqMeters !== undefined) dbUpdates.area_m2 = updates.sqMeters;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.imageUrl !== undefined) dbUpdates.images = [updates.imageUrl];
    if (updates.ownerName !== undefined) dbUpdates.owner_name = updates.ownerName;
    if (updates.ownerPhone !== undefined) dbUpdates.owner_phone = updates.ownerPhone;

    const { data, error } = await supabase
      .from('properties')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    await fetchProperties();
    return data;
  };

  const deleteProperty = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    await fetchProperties();
  };

  return { properties, loading, error, addProperty, updateProperty, deleteProperty, refetch: fetchProperties };
}
