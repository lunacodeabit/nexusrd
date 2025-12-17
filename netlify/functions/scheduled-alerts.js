// Scheduled Alerts Function
// This runs every minute on Netlify to check and send alerts
// Works 24/7 even if no one has the page open

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

// Format alert message
function formatMessage(task, minutesBefore) {
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
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    console.log(`Checking for alerts at ${currentHour}:${currentMinute} on ${today}`);

    // Get all tasks for today that haven't had alerts sent
    const { data: tasks, error: tasksError } = await supabase
      .from('personal_tasks')
      .select('*')
      .eq('scheduled_date', today)
      .eq('is_completed', false)
      .eq('alert_sent', false)
      .not('scheduled_time', 'is', null)
      .gt('alert_minutes_before', 0);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return { statusCode: 500, body: JSON.stringify(tasksError) };
    }

    console.log(`Found ${tasks?.length || 0} pending tasks with alerts`);

    let alertsSent = 0;

    for (const task of tasks || []) {
      // Parse task time
      const [taskHour, taskMinute] = task.scheduled_time.split(':').map(Number);
      
      // Calculate alert time
      const taskTimeMinutes = taskHour * 60 + taskMinute;
      const alertTimeMinutes = taskTimeMinutes - (task.alert_minutes_before || 15);
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      
      // Check if it's time to send alert (within window)
      const diff = currentTimeMinutes - alertTimeMinutes;
      
      console.log(`Task "${task.title}": alert at ${Math.floor(alertTimeMinutes/60)}:${String(alertTimeMinutes%60).padStart(2,'0')}, current: ${currentHour}:${String(currentMinute).padStart(2,'0')}, diff: ${diff} min`);
      
      // Send if we're within -1 to +5 minutes of alert time
      if (diff >= -1 && diff <= 5) {
        // Get user profile for this task
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('telegram_chat_id, enable_telegram_alerts')
          .eq('id', task.user_id)
          .single();
        
        if (profileError) {
          console.error(`Error getting profile for user ${task.user_id}:`, profileError);
          continue;
        }
        
        if (userProfile?.enable_telegram_alerts && userProfile?.telegram_chat_id) {
          console.log(`🔔 Sending alert for: ${task.title} to ${userProfile.telegram_chat_id}`);
          
          const message = formatMessage(task, task.alert_minutes_before);
          const sent = await sendTelegram(userProfile.telegram_chat_id, message);
          
          if (sent) {
            // Mark alert as sent
            await supabase
              .from('personal_tasks')
              .update({ alert_sent: true })
              .eq('id', task.id);
            
            alertsSent++;
            console.log(`✅ Alert sent for: ${task.title}`);
          }
        } else {
          console.log(`⚠️ User has no Telegram configured for task: ${task.title}`);
        }
      }
    }

    console.log(`🔔 Alerts sent: ${alertsSent}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Alerts checked',
        tasksChecked: tasks?.length || 0,
        alertsSent,
        timestamp: now.toISOString()
      }),
    };
  } catch (error) {
    console.error('Scheduled alerts error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
