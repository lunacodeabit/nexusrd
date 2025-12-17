import { useEffect, useCallback, useRef, useState } from 'react';
import { usePersonalTasks } from './usePersonalTasks';
import { useAuth } from '../contexts/AuthContext';
import { getProfileForAlerts, type UserProfileData } from './useUserProfile';
import { sendTelegramAlert, formatAlertMessage } from '../services/telegramService';

/**
 * Hook que monitorea las tareas personales y dispara alertas
 * cuando se acerca la hora programada
 */
export function usePersonalTaskAlerts() {
  const { user } = useAuth();
  const { todaysTasks, markAlertSent } = usePersonalTasks();
  const audioRef = useRef<AudioContext | null>(null);
  const alertedTasks = useRef<Set<string>>(new Set());
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);

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

  // Play notification sound
  const playAlertSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioRef.current;
      
      // Create a pleasant notification sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);

      // Second beep
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.setValueAtTime(1108, ctx.currentTime); // C#6
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.5);
      }, 200);
    } catch (e) {
      console.log('Could not play alert sound:', e);
    }
  }, []);

  // Show browser notification
  const showNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'personal-task-alert',
        requireInteraction: true,
      });
    }
  }, []);

  // Open WhatsApp with alert message
  const sendWhatsAppAlert = useCallback((taskTitle: string, taskTime: string, minutesBefore: number) => {
    if (!userProfile?.enable_whatsapp_alerts || !userProfile?.whatsapp_number) {
      return;
    }

    const formattedPhone = userProfile.whatsapp_number.replace(/[^\d]/g, '');
    const message = encodeURIComponent(
      `⏰ *ALERTA CRM ALVEARE*\n\n` +
      `📋 Tarea: ${taskTitle}\n` +
      `🕐 Hora: ${taskTime}\n` +
      `⏳ En ${minutesBefore} minutos\n\n` +
      `¡No olvides completarla!`
    );
    
    // Open WhatsApp - user will need to click send
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  }, [userProfile]);

  // Check for upcoming tasks
  const checkAlerts = useCallback(() => {
    if (!userProfile) {
      console.log('⏰ Alert check: No user profile loaded yet');
      return;
    }
    
    const now = new Date();
    console.log(`⏰ Checking alerts at ${now.toLocaleTimeString()}, Tasks today: ${todaysTasks.length}`);
    
    for (const task of todaysTasks) {
      // Skip if no time set, already completed, or already alerted
      if (!task.scheduled_time || task.is_completed || task.alert_sent) continue;
      if (alertedTasks.current.has(task.id)) continue;
      if (!task.alert_minutes_before || task.alert_minutes_before === 0) continue;

      // Parse scheduled time
      const [hours, minutes] = task.scheduled_time.split(':').map(Number);
      const taskTime = new Date();
      taskTime.setHours(hours, minutes, 0, 0);

      // Calculate alert time (when to send the alert)
      const alertTime = new Date(taskTime.getTime() - task.alert_minutes_before * 60 * 1000);

      // Check if it's time to alert
      const timeDiff = alertTime.getTime() - now.getTime();
      const minutesUntilAlert = Math.round(timeDiff / 60000);
      
      console.log(`📋 Task "${task.title}": scheduled ${task.scheduled_time}, alert at ${alertTime.toLocaleTimeString()}, minutes until alert: ${minutesUntilAlert}`);
      
      // Alert if:
      // - Up to 2 minutes BEFORE alert time (early trigger)
      // - OR up to 30 minutes AFTER alert time (catch missed alerts)
      // This ensures alerts are sent even if page wasn't open at exact time
      const shouldAlert = timeDiff <= 120000 && timeDiff > -1800000; // 2 min before to 30 min after
      
      if (shouldAlert) {
        console.log(`🔔 TRIGGERING ALERT for: ${task.title}`);
        alertedTasks.current.add(task.id);
        markAlertSent(task.id);
        
        // Play sound if enabled
        if (userProfile.enable_sound_alerts) {
          playAlertSound();
        }
        
        // Show browser notification if enabled
        if (userProfile.enable_browser_notifications) {
          const timeStr = task.scheduled_time;
          showNotification(
            `⏰ Recordatorio: ${task.title}`,
            `En ${task.alert_minutes_before} minutos (${timeStr})`
          );
        }
        
        // Send WhatsApp alert if enabled (opens link - requires user action)
        if (userProfile.enable_whatsapp_alerts && userProfile.whatsapp_number) {
          sendWhatsAppAlert(task.title, task.scheduled_time, task.alert_minutes_before);
        }
        
        // Send Telegram alert if enabled (automatic!)
        if (userProfile.enable_telegram_alerts && userProfile.telegram_chat_id) {
          console.log(`📱 Sending Telegram to ${userProfile.telegram_chat_id}`);
          const message = formatAlertMessage(
            task.title, 
            task.scheduled_time, 
            task.alert_minutes_before,
            task.category
          );
          sendTelegramAlert(userProfile.telegram_chat_id, message);
        } else {
          console.log(`📱 Telegram NOT sent: enabled=${userProfile.enable_telegram_alerts}, chatId=${userProfile.telegram_chat_id}`);
        }
      }
    }
  }, [todaysTasks, userProfile, markAlertSent, playAlertSound, showNotification, sendWhatsAppAlert]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check every 30 seconds for better precision
  useEffect(() => {
    console.log('⏰ Alert system initialized');
    checkAlerts(); // Initial check
    const interval = setInterval(checkAlerts, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [checkAlerts]);

  return {
    pendingAlerts: todaysTasks.filter(t => 
      t.scheduled_time && 
      !t.is_completed && 
      !t.alert_sent && 
      t.alert_minutes_before && 
      t.alert_minutes_before > 0
    ).length,
  };
}
