// Critical Lead Alerts Function
// Checks for leads that haven't been contacted and sends escalating alerts:
// - 2 hours after creation: First reminder
// - 24 hours after creation: Urgent reminder
// Runs every 15 minutes during business hours

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

// Format 2-hour alert message
function format2HourAlert(lead) {
  return `⚠️ <b>LEAD SIN CONTACTAR - 2 HORAS</b>

👤 <b>${lead.name}</b>
📞 ${lead.phone}
💰 Presupuesto: ${lead.currency || 'USD'} ${(lead.budget || 0).toLocaleString()}
📍 Zona: ${lead.interest_area || 'No especificada'}

⏰ Llegó hace 2 horas y nadie lo ha contactado.

<i>Los leads contactados en los primeros minutos tienen 21x más probabilidad de convertir.</i>

📲 <a href="https://alvearecrm.netlify.app">Abrir CRM</a>`;
}

// Format 24-hour alert message  
function format24HourAlert(lead) {
  return `🚨 <b>ALERTA URGENTE - LEAD FRÍO</b>

👤 <b>${lead.name}</b>
📞 ${lead.phone}
💰 Presupuesto: ${lead.currency || 'USD'} ${(lead.budget || 0).toLocaleString()}
📍 Zona: ${lead.interest_area || 'No especificada'}

❄️ <b>¡Este lead lleva +24 HORAS sin contactar!</b>

Este es probablemente un lead perdido. Contacta AHORA o muévelo a "Perdido".

📲 <a href="https://alvearecrm.netlify.app">Abrir CRM</a>`;
}

// Main handler
exports.handler = async (event, context) => {
  console.log('🔴 Critical alerts check running at:', new Date().toISOString());
  
  if (!supabaseUrl || !TELEGRAM_BOT_TOKEN) {
    console.error('Missing environment variables');
    return { statusCode: 500, body: 'Missing config' };
  }

  try {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    console.log(`⏰ Now: ${now.toISOString()}`);
    console.log(`⏰ 2h ago: ${twoHoursAgo.toISOString()}`);
    console.log(`⏰ 24h ago: ${twentyFourHoursAgo.toISOString()}`);

    let alertsSent = 0;

    // =====================================================
    // 1. Check for leads needing 2-HOUR alert
    // Conditions: 
    //   - Created more than 2 hours ago
    //   - Status is still 'new' (hasn't been contacted)
    //   - alert_2h_sent is false or null
    //   - Has no follow-ups recorded
    // =====================================================
    
    const { data: leads2h, error: error2h } = await supabase
      .from('leads')
      .select('*, user_id')
      .eq('status', 'new')
      .or('alert_2h_sent.is.null,alert_2h_sent.eq.false')
      .lt('created_at', twoHoursAgo.toISOString())
      .gt('created_at', twentyFourHoursAgo.toISOString()); // Not older than 24h (those get the 24h alert)

    if (error2h) {
      console.error('Error fetching 2h leads:', error2h);
    } else {
      console.log(`📋 Leads needing 2h alert: ${leads2h?.length || 0}`);
      
      for (const lead of (leads2h || [])) {
        // Check if lead has any follow-ups
        const { data: followUps } = await supabase
          .from('lead_follow_ups')
          .select('id')
          .eq('lead_id', lead.id)
          .limit(1);
        
        if (followUps && followUps.length > 0) {
          console.log(`Lead ${lead.name} has follow-ups, skipping 2h alert`);
          // Mark as sent since they've been contacted
          await supabase
            .from('leads')
            .update({ alert_2h_sent: true, alert_2h_sent_at: now.toISOString() })
            .eq('id', lead.id);
          continue;
        }

        // Get user's telegram settings
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('telegram_chat_id, enable_telegram_alerts')
          .eq('id', lead.user_id)
          .single();

        if (userProfile?.enable_telegram_alerts && userProfile?.telegram_chat_id) {
          console.log(`🔔 Sending 2h alert for: ${lead.name}`);
          
          const message = format2HourAlert(lead);
          const sent = await sendTelegram(userProfile.telegram_chat_id, message);
          
          if (sent) {
            await supabase
              .from('leads')
              .update({ alert_2h_sent: true, alert_2h_sent_at: now.toISOString() })
              .eq('id', lead.id);
            
            alertsSent++;
            console.log(`✅ 2h alert sent for: ${lead.name}`);
          }
        } else {
          console.log(`⚠️ No Telegram config for lead owner: ${lead.name}`);
          // Still mark as "sent" to avoid repeated checks
          await supabase
            .from('leads')
            .update({ alert_2h_sent: true })
            .eq('id', lead.id);
        }
      }
    }

    // =====================================================
    // 2. Check for leads needing 24-HOUR alert
    // Conditions:
    //   - Created more than 24 hours ago
    //   - Status is still 'new' (hasn't been contacted)
    //   - alert_24h_sent is false or null
    //   - Has no follow-ups recorded
    // =====================================================
    
    const { data: leads24h, error: error24h } = await supabase
      .from('leads')
      .select('*, user_id')
      .eq('status', 'new')
      .or('alert_24h_sent.is.null,alert_24h_sent.eq.false')
      .lt('created_at', twentyFourHoursAgo.toISOString());

    if (error24h) {
      console.error('Error fetching 24h leads:', error24h);
    } else {
      console.log(`📋 Leads needing 24h alert: ${leads24h?.length || 0}`);
      
      for (const lead of (leads24h || [])) {
        // Check if lead has any follow-ups
        const { data: followUps } = await supabase
          .from('lead_follow_ups')
          .select('id')
          .eq('lead_id', lead.id)
          .limit(1);
        
        if (followUps && followUps.length > 0) {
          console.log(`Lead ${lead.name} has follow-ups, skipping 24h alert`);
          await supabase
            .from('leads')
            .update({ alert_24h_sent: true, alert_24h_sent_at: now.toISOString() })
            .eq('id', lead.id);
          continue;
        }

        // Get user's telegram settings
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('telegram_chat_id, enable_telegram_alerts')
          .eq('id', lead.user_id)
          .single();

        if (userProfile?.enable_telegram_alerts && userProfile?.telegram_chat_id) {
          console.log(`🚨 Sending 24h URGENT alert for: ${lead.name}`);
          
          const message = format24HourAlert(lead);
          const sent = await sendTelegram(userProfile.telegram_chat_id, message);
          
          if (sent) {
            await supabase
              .from('leads')
              .update({ alert_24h_sent: true, alert_24h_sent_at: now.toISOString() })
              .eq('id', lead.id);
            
            alertsSent++;
            console.log(`✅ 24h alert sent for: ${lead.name}`);
          }
        } else {
          console.log(`⚠️ No Telegram config for lead owner: ${lead.name}`);
          await supabase
            .from('leads')
            .update({ alert_24h_sent: true })
            .eq('id', lead.id);
        }
      }
    }

    console.log(`🔴 Critical alerts complete. Sent: ${alertsSent}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Critical alerts checked',
        alertsSent,
        timestamp: now.toISOString()
      }),
    };
  } catch (error) {
    console.error('Critical alerts error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
