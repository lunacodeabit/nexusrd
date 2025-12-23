// Scheduled Alerts Function
// This runs every minute on Netlify to check and send alerts
// Works 24/7 even if no one has the page open
// Handles: personal_tasks AND scheduled_appointments (calendar)

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Telegram Bot Token
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Send Telegram message
async function sendTelegram(chatId, message) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    const result = await response.json();
    console.log(`Telegram sent to ${chatId}:`, result.ok ? 'SUCCESS' : result.description);
    return result.ok;
  } catch (error) {
    console.error('Telegram error:', error);
    return false;
  }
}

// Format personal task alert message
function formatTaskMessage(task, minutesBefore) {
  const categoryEmoji = {
    'trabajo': '💼',
    'cliente': '👤',
    'personal': '🏠',
    'admin': '📋',
  };
  const emoji = categoryEmoji[task.category] || '📌';

  return `⏰ <b>RECORDATORIO CRM ALVEARE</b>

${emoji} <b>${task.title}</b>
🕐 Hora: ${task.scheduled_time}
⏳ En ${minutesBefore} minutos

${task.description ? `📝 ${task.description}` : ''}

¡No lo olvides!`;
}

// Format appointment alert message
function formatAppointmentMessage(appt, minutesBefore) {
  const methodEmoji = {
    'LLAMADA': '📞',
    'WHATSAPP': '💬',
    'EMAIL': '📧',
    'VISITA': '🏠',
    'OTRO': '📌',
  };
  const emoji = methodEmoji[appt.method] || '📅';
  const typeLabel = appt.appointment_type === 'virtual' ? '🖥️ Virtual' :
    appt.appointment_type === 'in_person' ? '🏢 Presencial' : '';

  return `📅 <b>CITA PROGRAMADA</b>

${emoji} <b>${appt.method}</b> con <b>${appt.lead_name}</b>
🕐 Hora: ${appt.scheduled_time}
⏳ En ${minutesBefore} minutos
${typeLabel ? `📍 ${typeLabel}` : ''}
${appt.notes ? `📝 ${appt.notes}` : ''}

<a href="https://alvearecrm.netlify.app/">Abrir CRM →</a>`;
}

// Check if it's time to send an alert
function shouldSendAlert(scheduledTime, alertMinutesBefore, currentHour, currentMinute) {
  const [taskHour, taskMinute] = scheduledTime.split(':').map(Number);
  const taskTimeMinutes = taskHour * 60 + taskMinute;
  const alertMinutes = alertMinutesBefore || 0;
  const alertTimeMinutes = taskTimeMinutes - alertMinutes;
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  // diff = how many minutes past the alert time we are
  const diff = currentTimeMinutes - alertTimeMinutes;

  // Send if we're within 0 to +3 minutes of alert time
  return diff >= 0 && diff <= 3;
}

// Main handler - runs on schedule
exports.handler = async (event, context) => {
  console.log('🔔 Scheduled alerts check running at:', new Date().toISOString());

  if (!supabaseUrl || !TELEGRAM_BOT_TOKEN) {
    console.error('Missing environment variables');
    return { statusCode: 500, body: 'Missing config' };
  }

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

    // IMPORTANT: Netlify runs in UTC. Tasks are stored in local time (Dominican Republic = UTC-4)
    const TIMEZONE_OFFSET = -4; // Dominican Republic (AST = UTC-4)
    const localNow = new Date(now.getTime() + (TIMEZONE_OFFSET * 60 * 60 * 1000));
    const currentHour = localNow.getUTCHours();
    const currentMinute = localNow.getUTCMinutes();

    console.log(`🔔 Local time (UTC${TIMEZONE_OFFSET}): ${currentHour}:${String(currentMinute).padStart(2, '0')} on ${today}`);

    let alertsSent = 0;

    // =====================================================
    // 1. CHECK PERSONAL TASKS (Mi Planner)
    // =====================================================
    const { data: tasks, error: tasksError } = await supabase
      .from('personal_tasks')
      .select('*')
      .eq('scheduled_date', today)
      .eq('is_completed', false)
      .eq('alert_sent', false);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
    } else {
      console.log(`📋 Personal tasks to check: ${tasks?.length || 0}`);

      for (const task of (tasks || [])) {
        if (!task.scheduled_time || task.alert_minutes_before === undefined) continue;

        if (shouldSendAlert(task.scheduled_time, task.alert_minutes_before, currentHour, currentMinute)) {
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('telegram_chat_id, enable_telegram_alerts')
            .eq('id', task.user_id)
            .single();

          if (userProfile?.enable_telegram_alerts && userProfile?.telegram_chat_id) {
            console.log(`🔔 Sending alert for task: ${task.title}`);
            const message = formatTaskMessage(task, task.alert_minutes_before);
            const sent = await sendTelegram(userProfile.telegram_chat_id, message);

            if (sent) {
              await supabase
                .from('personal_tasks')
                .update({ alert_sent: true })
                .eq('id', task.id);
              alertsSent++;
              console.log(`✅ Task alert sent: ${task.title}`);
            }
          }
        }
      }
    }

    // =====================================================
    // 2. CHECK SCHEDULED APPOINTMENTS (Citas del Calendario)
    // =====================================================
    const { data: appointments, error: apptError } = await supabase
      .from('scheduled_appointments')
      .select('*')
      .eq('scheduled_date', today)
      .eq('status', 'pending')
      .eq('alert_sent', false);

    if (apptError) {
      console.error('Error fetching appointments:', apptError);
    } else {
      console.log(`📅 Appointments to check: ${appointments?.length || 0}`);

      for (const appt of (appointments || [])) {
        if (!appt.scheduled_time) continue;

        const alertMinutes = appt.alert_minutes_before || 15;

        if (shouldSendAlert(appt.scheduled_time, alertMinutes, currentHour, currentMinute)) {
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('telegram_chat_id, enable_telegram_alerts')
            .eq('id', appt.user_id)
            .single();

          if (userProfile?.enable_telegram_alerts && userProfile?.telegram_chat_id) {
            console.log(`📅 Sending alert for appointment: ${appt.lead_name} - ${appt.method}`);
            const message = formatAppointmentMessage(appt, alertMinutes);
            const sent = await sendTelegram(userProfile.telegram_chat_id, message);

            if (sent) {
              await supabase
                .from('scheduled_appointments')
                .update({ alert_sent: true })
                .eq('id', appt.id);
              alertsSent++;
              console.log(`✅ Appointment alert sent: ${appt.lead_name}`);
            }
          }
        }
      }
    }

    console.log(`🔔 Total alerts sent: ${alertsSent}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Alerts checked',
        personalTasksChecked: tasks?.length || 0,
        appointmentsChecked: appointments?.length || 0,
        alertsSent,
        timestamp: now.toISOString()
      }),
    };
  } catch (error) {
    console.error('Scheduled alerts error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
