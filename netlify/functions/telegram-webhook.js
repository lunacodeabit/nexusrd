// Netlify Function - Telegram Webhook
// Responds to /start with user's chat ID

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, body: 'ok' };
  }

  try {
    const update = JSON.parse(event.body);
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const firstName = update.message.from?.first_name || 'Usuario';

      let responseText = '';

      if (text === '/start' || text.startsWith('/start')) {
        responseText = `¡Hola ${firstName}! 👋

Bienvenido a <b>ALVEARE CRM Alertas</b> 🏠

Tu ID de Telegram es:
<code>${chatId}</code>

📋 <b>Instrucciones:</b>
1. Copia el número de arriba
2. Ve a tu CRM → Mi Perfil
3. Pégalo en el campo "Telegram ID"
4. ¡Listo! Recibirás alertas aquí

✅ Recibirás notificaciones de:
• Llamadas programadas
• Visitas con clientes
• Tareas pendientes
• Seguimientos de leads`;
      } else if (text === '/id') {
        responseText = `Tu ID es: <code>${chatId}</code>`;
      } else {
        responseText = `Este bot envía alertas del CRM ALVEARE.

Tu ID es: <code>${chatId}</code>

Copia este número y pégalo en tu perfil del CRM.`;
      }

      await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: responseText,
            parse_mode: 'HTML',
          }),
        }
      );
    }

    return { statusCode: 200, body: 'ok' };
  } catch (error) {
    console.error('Webhook error:', error);
    return { statusCode: 200, body: 'ok' };
  }
};
