import { supabase } from '../lib/supabase';

// Types
export interface Appointment {
    id: string;
    user_id: string;
    lead_id: string | null;
    lead_name: string;
    method: 'LLAMADA' | 'WHATSAPP' | 'EMAIL' | 'VISITA' | 'OTRO';
    appointment_type: 'virtual' | 'in_person' | null;
    scheduled_date: string;
    scheduled_time: string;
    status: 'pending' | 'completed' | 'no_show' | 'cancelled';
    completed_at: string | null;
    alert_minutes_before: number;
    alert_sent: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateAppointmentData {
    user_id: string;
    lead_id?: string;
    lead_name: string;
    method: Appointment['method'];
    appointment_type?: 'virtual' | 'in_person';
    scheduled_date: string;
    scheduled_time: string;
    alert_minutes_before?: number;
    notes?: string;
}

export interface UpdateAppointmentData {
    method?: Appointment['method'];
    appointment_type?: 'virtual' | 'in_person';
    scheduled_date?: string;
    scheduled_time?: string;
    status?: Appointment['status'];
    alert_minutes_before?: number;
    notes?: string;
}

export interface AppointmentMetrics {
    total: number;
    pending: number;
    completed: number;
    noShow: number;
    cancelled: number;
    virtual: number;
    inPerson: number;
    completionRate: number;
}

// Service functions

/**
 * Get all appointments for a user, optionally filtered
 */
export async function getAppointments(
    userId: string,
    options?: {
        startDate?: string;
        endDate?: string;
        leadId?: string;
        status?: Appointment['status'];
    }
): Promise<Appointment[]> {
    let query = supabase
        .from('scheduled_appointments')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

    if (options?.startDate) {
        query = query.gte('scheduled_date', options.startDate);
    }
    if (options?.endDate) {
        query = query.lte('scheduled_date', options.endDate);
    }
    if (options?.leadId) {
        query = query.eq('lead_id', options.leadId);
    }
    if (options?.status) {
        query = query.eq('status', options.status);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching appointments:', error);
        return [];
    }

    return data || [];
}

/**
 * Get appointments for today
 */
export async function getTodayAppointments(userId: string): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    return getAppointments(userId, { startDate: today, endDate: today });
}

/**
 * Create a new appointment
 */
export async function createAppointment(data: CreateAppointmentData): Promise<Appointment | null> {
    const { data: appointment, error } = await supabase
        .from('scheduled_appointments')
        .insert({
            ...data,
            status: 'pending',
            alert_sent: false,
            alert_minutes_before: data.alert_minutes_before || 15
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating appointment:', error);
        return null;
    }

    return appointment;
}

/**
 * Update an appointment
 */
export async function updateAppointment(
    id: string,
    data: UpdateAppointmentData
): Promise<Appointment | null> {
    const { data: appointment, error } = await supabase
        .from('scheduled_appointments')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating appointment:', error);
        return null;
    }

    return appointment;
}

/**
 * Delete an appointment
 */
export async function deleteAppointment(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('scheduled_appointments')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting appointment:', error);
        return false;
    }

    return true;
}

/**
 * Mark appointment as completed
 */
export async function markAsCompleted(id: string): Promise<Appointment | null> {
    return updateAppointment(id, {
        status: 'completed'
    });
}

/**
 * Mark appointment as no-show
 */
export async function markAsNoShow(id: string): Promise<Appointment | null> {
    return updateAppointment(id, {
        status: 'no_show'
    });
}

/**
 * Mark alert as sent
 */
export async function markAlertSent(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('scheduled_appointments')
        .update({ alert_sent: true })
        .eq('id', id);

    return !error;
}

/**
 * Get appointment metrics for a date range
 */
export async function getAppointmentMetrics(
    userId: string,
    startDate: string,
    endDate: string
): Promise<AppointmentMetrics> {
    const appointments = await getAppointments(userId, { startDate, endDate });

    const total = appointments.length;
    const pending = appointments.filter(a => a.status === 'pending').length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const noShow = appointments.filter(a => a.status === 'no_show').length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;

    const virtual = appointments.filter(a => a.appointment_type === 'virtual').length;
    const inPerson = appointments.filter(a => a.appointment_type === 'in_person').length;

    const completionRate = total > 0
        ? Math.round((completed / (completed + noShow)) * 100) || 0
        : 0;

    return {
        total,
        pending,
        completed,
        noShow,
        cancelled,
        virtual,
        inPerson,
        completionRate
    };
}

/**
 * Get pending appointments that need alerts
 */
export async function getPendingAlerts(userId: string): Promise<Appointment[]> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('scheduled_appointments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .eq('alert_sent', false)
        .gte('scheduled_date', today);

    if (error) {
        console.error('Error fetching pending alerts:', error);
        return [];
    }

    // Filter appointments that are within alert window
    return (data || []).filter(appointment => {
        const appointmentTime = new Date(`${appointment.scheduled_date}T${appointment.scheduled_time}`);
        const alertTime = appointment.alert_minutes_before || 15;
        const diffMinutes = (appointmentTime.getTime() - now.getTime()) / (1000 * 60);

        return diffMinutes > 0 && diffMinutes <= alertTime;
    });
}

/**
 * Migrate from localStorage to Supabase (one-time migration)
 */
export async function migrateFromLocalStorage(userId: string): Promise<number> {
    const saved = localStorage.getItem('nexus_scheduled_tasks');
    if (!saved) return 0;

    const tasks = JSON.parse(saved);
    let migrated = 0;

    for (const task of tasks) {
        const { error } = await supabase
            .from('scheduled_appointments')
            .insert({
                user_id: userId,
                lead_id: task.leadId || null,
                lead_name: task.leadName,
                method: task.method,
                appointment_type: task.appointmentType || null,
                scheduled_date: task.scheduledDate,
                scheduled_time: task.scheduledTime,
                status: task.completed ? 'completed' : 'pending',
                alert_minutes_before: task.alertMinutesBefore || 15,
                alert_sent: task.alertSent || false,
                notes: task.notes || null
            });

        if (!error) migrated++;
    }

    // Clear localStorage after successful migration
    if (migrated > 0) {
        localStorage.removeItem('nexus_scheduled_tasks');
        console.log(`Migrated ${migrated} appointments from localStorage to Supabase`);
    }

    return migrated;
}
