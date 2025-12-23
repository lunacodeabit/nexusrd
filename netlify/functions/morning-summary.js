// Daily Morning Summary Function
// Runs at 8am local time (Dominican Republic)
// Sends a summary of the day's agenda to each user via Telegram

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
        return result.ok;
    } catch (error) {
        console.error('Telegram error:', error);
        return false;
    }
}

// Format time to 12h
function formatTime(time24) {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

// Main handler
exports.handler = async (event, context) => {
    console.log('☀️ Morning summary running at:', new Date().toISOString());

    if (!supabaseUrl || !TELEGRAM_BOT_TOKEN) {
        console.error('Missing environment variables');
        return { statusCode: 500, body: 'Missing config' };
    }

    try {
        const now = new Date();

        // Get today's date in Dominican Republic timezone (UTC-4)
        const TIMEZONE_OFFSET = -4;
        const localNow = new Date(now.getTime() + (TIMEZONE_OFFSET * 60 * 60 * 1000));
        const today = localNow.toISOString().split('T')[0];

        console.log(`☀️ Generating summary for ${today}`);

        // Get all users with Telegram enabled
        const { data: users, error: usersError } = await supabase
            .from('user_profiles')
            .select('id, telegram_chat_id, enable_telegram_alerts, display_name')
            .eq('enable_telegram_alerts', true)
            .not('telegram_chat_id', 'is', null);

        if (usersError) {
            console.error('Error fetching users:', usersError);
            return { statusCode: 500, body: JSON.stringify(usersError) };
        }

        console.log(`☀️ Users to notify: ${users?.length || 0}`);
        let summariesSent = 0;

        for (const user of (users || [])) {
            // Get today's appointments for this user
            const { data: appointments } = await supabase
                .from('scheduled_appointments')
                .select('*')
                .eq('user_id', user.id)
                .eq('scheduled_date', today)
                .eq('status', 'pending')
                .order('scheduled_time', { ascending: true });

            // Get today's personal tasks for this user
            const { data: tasks } = await supabase
                .from('personal_tasks')
                .select('*')
                .eq('user_id', user.id)
                .eq('scheduled_date', today)
                .eq('is_completed', false)
                .order('scheduled_time', { ascending: true });

            // Get overdue leads (last contact > 3 days ago, still active)
            const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
            const { data: overdueLeads } = await supabase
                .from('leads')
                .select('id, name, next_follow_up_date')
                .eq('user_id', user.id)
                .in('status', ['new', 'contacted', 'visit_scheduled', 'negotiation'])
                .lt('next_follow_up_date', today)
                .limit(5);

            // Get new leads count (created in last 24h)
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
            const { count: newLeadsCount } = await supabase
                .from('leads')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_at', oneDayAgo);

            const appointmentCount = appointments?.length || 0;
            const taskCount = tasks?.length || 0;
            const overdueCount = overdueLeads?.length || 0;

            // Skip if user has nothing today
            if (appointmentCount === 0 && taskCount === 0 && overdueCount === 0 && !newLeadsCount) {
                console.log(`User ${user.id} has nothing scheduled, skipping`);
                continue;
            }

            // Build message
            let message = `☀️ <b>Buenos días${user.display_name ? ', ' + user.display_name : ''}!</b>\n\n`;
            message += `📅 <b>Tu agenda para hoy:</b>\n\n`;

            // Appointments section
            if (appointmentCount > 0) {
                message += `📞 <b>Citas (${appointmentCount}):</b>\n`;
                for (const appt of appointments.slice(0, 5)) {
                    const methodEmoji = {
                        'LLAMADA': '📞', 'WHATSAPP': '💬', 'EMAIL': '📧', 'VISITA': '🏠'
                    }[appt.method] || '📌';
                    message += `  ${methodEmoji} ${formatTime(appt.scheduled_time)} - ${appt.lead_name}\n`;
                }
                if (appointmentCount > 5) message += `  ... y ${appointmentCount - 5} más\n`;
                message += '\n';
            }

            // Tasks section
            if (taskCount > 0) {
                message += `✅ <b>Tareas personales (${taskCount}):</b>\n`;
                for (const task of tasks.slice(0, 5)) {
                    message += `  📌 ${formatTime(task.scheduled_time)} - ${task.title}\n`;
                }
                if (taskCount > 5) message += `  ... y ${taskCount - 5} más\n`;
                message += '\n';
            }

            // Overdue leads warning
            if (overdueCount > 0) {
                message += `⚠️ <b>Seguimientos vencidos (${overdueCount}):</b>\n`;
                for (const lead of overdueLeads) {
                    message += `  ❌ ${lead.name}\n`;
                }
                message += '\n';
            }

            // New leads
            if (newLeadsCount > 0) {
                message += `🆕 <b>${newLeadsCount} lead(s) nuevo(s)</b> en las últimas 24h\n\n`;
            }

            message += `<a href="https://alvearecrm.netlify.app/">Abrir CRM →</a>`;

            // Send message
            const sent = await sendTelegram(user.telegram_chat_id, message);
            if (sent) {
                summariesSent++;
                console.log(`☀️ Summary sent to user ${user.id}`);
            }
        }

        console.log(`☀️ Morning summaries sent: ${summariesSent}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Morning summaries sent',
                summariesSent,
                timestamp: now.toISOString()
            }),
        };
    } catch (error) {
        console.error('Morning summary error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
