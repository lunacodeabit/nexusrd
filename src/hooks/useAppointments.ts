import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type {
    Appointment,
    CreateAppointmentData,
    UpdateAppointmentData,
    AppointmentMetrics
} from '../services/appointmentService';
import {
    getAppointments,
    getTodayAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    markAsCompleted,
    markAsNoShow,
    getAppointmentMetrics,
    getPendingAlerts,
    markAlertSent,
    migrateFromLocalStorage
} from '../services/appointmentService';

interface UseAppointmentsOptions {
    autoMigrate?: boolean;
    leadId?: string;
    startDate?: string;
    endDate?: string;
}

interface UseAppointmentsReturn {
    appointments: Appointment[];
    todayAppointments: Appointment[];
    loading: boolean;
    error: string | null;
    metrics: AppointmentMetrics | null;

    // Actions
    create: (data: Omit<CreateAppointmentData, 'user_id'>) => Promise<Appointment | null>;
    update: (id: string, data: UpdateAppointmentData) => Promise<Appointment | null>;
    remove: (id: string) => Promise<boolean>;
    complete: (id: string) => Promise<Appointment | null>;
    noShow: (id: string) => Promise<Appointment | null>;
    refresh: () => Promise<void>;
    checkAlerts: () => Promise<Appointment[]>;
}

export function useAppointments(options: UseAppointmentsOptions = {}): UseAppointmentsReturn {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<AppointmentMetrics | null>(null);
    const [hasMigrated, setHasMigrated] = useState(false);

    // Migrate from localStorage on first load
    useEffect(() => {
        const migrate = async () => {
            if (!user?.id || hasMigrated || options.autoMigrate === false) return;

            try {
                const migrated = await migrateFromLocalStorage(user.id);
                if (migrated > 0) {
                    console.log(`Successfully migrated ${migrated} appointments`);
                }
                setHasMigrated(true);
            } catch (err) {
                console.error('Migration error:', err);
            }
        };

        migrate();
    }, [user?.id, hasMigrated, options.autoMigrate]);

    // Fetch appointments
    const fetchAppointments = useCallback(async () => {
        if (!user?.id) return;

        setLoading(true);
        setError(null);

        try {
            const [allAppointments, today] = await Promise.all([
                getAppointments(user.id, {
                    leadId: options.leadId,
                    startDate: options.startDate,
                    endDate: options.endDate
                }),
                getTodayAppointments(user.id)
            ]);

            setAppointments(allAppointments);
            setTodayAppointments(today);

            // Calculate metrics for current month if no date range specified
            if (!options.startDate && !options.endDate) {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                    .toISOString().split('T')[0];
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                    .toISOString().split('T')[0];

                const monthMetrics = await getAppointmentMetrics(user.id, startOfMonth, endOfMonth);
                setMetrics(monthMetrics);
            }
        } catch (err) {
            setError('Error loading appointments');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user?.id, options.leadId, options.startDate, options.endDate]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // Create appointment
    const create = useCallback(async (data: Omit<CreateAppointmentData, 'user_id'>) => {
        if (!user?.id) return null;

        const appointment = await createAppointment({
            ...data,
            user_id: user.id
        });

        if (appointment) {
            await fetchAppointments();
        }

        return appointment;
    }, [user?.id, fetchAppointments]);

    // Update appointment
    const update = useCallback(async (id: string, data: UpdateAppointmentData) => {
        const appointment = await updateAppointment(id, data);

        if (appointment) {
            await fetchAppointments();
        }

        return appointment;
    }, [fetchAppointments]);

    // Delete appointment
    const remove = useCallback(async (id: string) => {
        const success = await deleteAppointment(id);

        if (success) {
            await fetchAppointments();
        }

        return success;
    }, [fetchAppointments]);

    // Mark as completed
    const complete = useCallback(async (id: string) => {
        const appointment = await markAsCompleted(id);

        if (appointment) {
            await fetchAppointments();
        }

        return appointment;
    }, [fetchAppointments]);

    // Mark as no-show
    const noShow = useCallback(async (id: string) => {
        const appointment = await markAsNoShow(id);

        if (appointment) {
            await fetchAppointments();
        }

        return appointment;
    }, [fetchAppointments]);

    // Check for pending alerts
    const checkAlerts = useCallback(async () => {
        if (!user?.id) return [];

        const pendingAlerts = await getPendingAlerts(user.id);

        // Mark alerts as sent
        for (const alert of pendingAlerts) {
            await markAlertSent(alert.id);
        }

        return pendingAlerts;
    }, [user?.id]);

    return {
        appointments,
        todayAppointments,
        loading,
        error,
        metrics,
        create,
        update,
        remove,
        complete,
        noShow,
        refresh: fetchAppointments,
        checkAlerts
    };
}

export default useAppointments;
