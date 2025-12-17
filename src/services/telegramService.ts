// Telegram Alert Service
// Sends alerts via Telegram bot using Netlify Functions

/**
 * Send a Telegram message via Netlify Function
 */
export async function sendTelegramAlert(chatId: string, message: string): Promise<boolean> {
  try {
    // Use relative URL - works in both dev and production
    const functionUrl = '/.netlify/functions/telegram-send';
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        message: message,
      }),
    });

    const result = await response.json();
    
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
