import { useEffect, useRef, useCallback } from 'react';
import { getUserProfile, sendWhatsAppAlert } from '../services/userProfile';
import { notificationSound } from '../services/notificationSound';

// Scheduled Task Interface (same as in LeadFollowUpTracker)
interface ScheduledTask {
  id: string;
  leadId: string;
  leadName: string;
  method: 'LLAMADA' | 'WHATSAPP' | 'EMAIL' | 'VISITA' | 'OTRO';
  scheduledDate: string;
  scheduledTime: string;
  notes: string;
  completed: boolean;
  alertMinutesBefore: number;
  alertSent: boolean;
}

export const useTaskAlerts = () => {
  const lastCheckRef = useRef<string>('');

  const checkAndTriggerAlerts = useCallback(() => {
    const saved = localStorage.getItem('nexus_scheduled_tasks');
    if (!saved) return;

    const tasks: ScheduledTask[] = JSON.parse(saved);
    const now = new Date();
    const userProfile = getUserProfile();
    let hasChanges = false;

    const updatedTasks = tasks.map(task => {
      // Skip completed or already alerted tasks
      if (task.completed || task.alertSent) return task;

      const taskDateTime = new Date(`${task.scheduledDate}T${task.scheduledTime}`);
      const diffMinutes = (taskDateTime.getTime() - now.getTime()) / (1000 * 60);
      const alertTime = task.alertMinutesBefore || 15;

      // Trigger alert if:
      // - Time until task is less than or equal to alert time
      // - Task hasn't passed yet (or just passed within 5 minutes)
      if (diffMinutes <= alertTime && diffMinutes >= -5) {
        console.log(`🔔 Triggering alert for task: ${task.leadName} - ${task.method}`);
        
        // Play sound alert
        if (userProfile.enableSoundAlerts) {
          notificationSound.playNotification();
        }

        // Browser notification
        if (userProfile.enableBrowserNotifications && Notification.permission === 'granted') {
          new Notification(`Recordatorio: ${task.method}`, {
            body: `${task.leadName} - ${task.notes || 'Seguimiento programado'} (${diffMinutes > 0 ? `en ${Math.round(diffMinutes)} min` : 'AHORA'})`,
            icon: '/icons/icon-192x192.png',
            tag: task.id, // Prevent duplicate notifications
            requireInteraction: true
          });
        }

        // WhatsApp alert
        if (userProfile.enableWhatsAppAlerts && userProfile.whatsappNumber) {
          sendWhatsAppAlert(
            userProfile.whatsappNumber,
            task.method,
            task.leadName,
            task.notes,
            Math.max(0, Math.round(diffMinutes))
          );
        }

        hasChanges = true;
        return { ...task, alertSent: true };
      }

      return task;
    });

    // Save updated tasks if any alerts were sent
    if (hasChanges) {
      localStorage.setItem('nexus_scheduled_tasks', JSON.stringify(updatedTasks));
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('storage'));
    }
  }, []);

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
