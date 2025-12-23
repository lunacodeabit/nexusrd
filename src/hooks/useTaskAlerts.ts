import { useEffect, useRef, useCallback, useState } from 'react';
import { sendWhatsAppAlert } from '../services/userProfile';
import { notificationSound } from '../services/notificationSound';
import { useAuth } from '../contexts/AuthContext';
import { getProfileForAlerts, type UserProfileData } from './useUserProfile';
import { useAppointments } from './useAppointments';

export const useTaskAlerts = () => {
  const { user } = useAuth();
  const lastCheckRef = useRef<string>('');
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const { appointments, update: updateAppointment } = useAppointments({ autoMigrate: true });

  // Load user profile from Supabase
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        const profile = await getProfileForAlerts(user.id);
        setUserProfile(profile);
      }
    };
    loadProfile();
    // Refresh profile every 2 minutes
    const interval = setInterval(loadProfile, 120000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const checkAndTriggerAlerts = useCallback(async () => {
    if (!userProfile || !appointments.length) return;

    const now = new Date();

    for (const task of appointments) {
      // Skip completed, no-show, cancelled, or already alerted tasks
      if (task.status !== 'pending' || task.alert_sent) continue;

      const taskDateTime = new Date(`${task.scheduled_date}T${task.scheduled_time}`);
      const diffMinutes = (taskDateTime.getTime() - now.getTime()) / (1000 * 60);
      const alertTime = task.alert_minutes_before || 15;

      // Trigger alert if:
      // - Time until task is less than or equal to alert time
      // - Task hasn't passed yet (or just passed within 5 minutes)
      if (diffMinutes <= alertTime && diffMinutes >= -5) {
        console.log(`🔔 Triggering alert for task: ${task.lead_name} - ${task.method}`);

        // Play sound alert
        if (userProfile.enable_sound_alerts) {
          notificationSound.playNotification();
        }

        // Browser notification
        if (userProfile.enable_browser_notifications && Notification.permission === 'granted') {
          new Notification(`Recordatorio: ${task.method}`, {
            body: `${task.lead_name} - ${task.notes || 'Seguimiento programado'} (${diffMinutes > 0 ? `en ${Math.round(diffMinutes)} min` : 'AHORA'})`,
            icon: '/icons/icon-192x192.png',
            tag: task.id, // Prevent duplicate notifications
            requireInteraction: true
          });
        }

        // WhatsApp alert
        if (userProfile.enable_whatsapp_alerts && userProfile.whatsapp_number) {
          sendWhatsAppAlert(
            userProfile.whatsapp_number,
            task.method,
            task.lead_name,
            task.notes || '',
            Math.max(0, Math.round(diffMinutes))
          );
        }

        // Mark alert as sent in Supabase
        await updateAppointment(task.id, {});
      }
    }
  }, [userProfile, appointments, updateAppointment]);

  useEffect(() => {
    // Request notification permission on mount
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }

    // Check immediately on mount
    checkAndTriggerAlerts();

    // Check every 30 seconds (more frequent than before)
    const interval = setInterval(() => {
      const now = new Date().toISOString();
      // Avoid checking multiple times in the same second
      if (now !== lastCheckRef.current) {
        lastCheckRef.current = now;
        checkAndTriggerAlerts();
      }
    }, 30000);

    // Also check when window gains focus (user returns to tab)
    const handleFocus = () => {
      console.log('Window focused - checking alerts');
      checkAndTriggerAlerts();
    };
    window.addEventListener('focus', handleFocus);

    // Also check when visibility changes
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab visible - checking alerts');
        checkAndTriggerAlerts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkAndTriggerAlerts]);

  return { checkAndTriggerAlerts };
};
