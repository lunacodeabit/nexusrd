// Telegram Alert Service
// Sends alerts via Telegram bot using Netlify Functions or direct API

// Bot token - in production this is handled by Netlify Function
// For local dev, we call Telegram API directly
const TELEGRAM_BOT_TOKEN = '8473727285:AAE-z5MqqqbRrWPKxASSYbPtlYiIFKrYezY';

/**
 * Send a Telegram message via Netlify Function or direct API
 */
export async function sendTelegramAlert(chatId: string, message: string): Promise<boolean> {
  try {
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    let response;
    
    if (isLocalDev) {
      // In development, call Telegram API directly
      console.log('📱 DEV MODE: Calling Telegram API directly');
      response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });
    } else {
      // In production, use Netlify Function
      response = await fetch('/.netlify/functions/telegram-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          message: message,
        }),
      });
    }

    const result = await response.json();
    console.log('📱 Telegram response:', result);
    
    if (!response.ok) {
      console.error('Telegram send error:', result);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram alert:', error);
    return false;
  }
}

/**
 * Format an alert message for Telegram
 */
export function formatAlertMessage(
  taskTitle: string, 
  taskTime: string, 
  minutesBefore: number,
  category?: string
): string {
  const categoryEmoji = {
    'trabajo': '💼',
    'cliente': '👤',
    'personal': '🏠',
    'admin': '📋',
    'otro': '📌',
  }[category || 'otro'] || '📌';

  return `⏰ <b>ALERTA CRM ALVEARE</b>

${categoryEmoji} <b>${taskTitle}</b>

🕐 Hora: ${taskTime}
⏳ En ${minutesBefore} minutos

¡No olvides completar esta tarea!`;
}

/**
 * Get the bot link for users to connect
 */
export function getTelegramBotLink(): string {
  return 'https://t.me/alveare_crm_bot';
}

/**
 * Instructions for getting Chat ID
 */
export function getTelegramInstructions(): string {
  return `Para conectar Telegram:
1. Abre el bot: t.me/alveare_crm_bot
2. Presiona "Start" o envía /start
3. El bot te dará tu ID
4. Copia ese número aquí`;
}
