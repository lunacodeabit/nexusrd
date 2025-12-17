// User Profile Service - For storing user preferences and contact info

export interface UserProfile {
  id: string;
  fullName: string;
  whatsappNumber: string;
  telegramChatId: string;
  email: string;
  defaultAlertTime: number; // Minutes before task (15, 30, 60, 120)
  enableWhatsAppAlerts: boolean;
  enableTelegramAlerts: boolean;
  enableSoundAlerts: boolean;
  enableBrowserNotifications: boolean;
}

const STORAGE_KEY = 'nexus_user_profile';

const defaultProfile: UserProfile = {
  id: 'default',
  fullName: '',
  whatsappNumber: '',
  telegramChatId: '',
  email: '',
  defaultAlertTime: 15,
  enableWhatsAppAlerts: false,
  enableTelegramAlerts: true,
  enableSoundAlerts: true,
  enableBrowserNotifications: true,
};

export const getUserProfile = (): UserProfile => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return { ...defaultProfile, ...JSON.parse(saved) };
  }
  return defaultProfile;
};

export const saveUserProfile = (profile: Partial<UserProfile>): UserProfile => {
  const current = getUserProfile();
  const updated = { ...current, ...profile };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

// Format phone for WhatsApp API (remove spaces, ensure country code)
export const formatWhatsAppNumber = (phone: string): string => {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If starts with +, remove it for the API
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // If starts with 1 and is 11 digits, assume US/Canada
  // If starts with 809, 829, 849 (DR codes), prepend 1
  if (cleaned.length === 10 && /^(809|829|849)/.test(cleaned)) {
    cleaned = '1' + cleaned;
  }
  
  return cleaned;
};

// Generate WhatsApp alert message based on task type
export const getAlertMessage = (
  taskType: string,
  leadName: string,
  notes?: string,
  minutesBefore?: number
): string => {
  const timeText = minutesBefore 
    ? `en ${minutesBefore >= 60 ? `${minutesBefore/60} hora${minutesBefore > 60 ? 's' : ''}` : `${minutesBefore} minutos`}`
    : 'ahora';

  const messages: Record<string, string> = {
    'LLAMADA': `*CRM ALVEARE* - Recordatorio\n\nTienes una *LLAMADA* programada ${timeText}\nCliente: *${leadName}*${notes ? `\nNota: ${notes}` : ''}\n\nNo olvides hacer la llamada!`,
    'WHATSAPP': `*CRM ALVEARE* - Recordatorio\n\nTienes que enviar un *WHATSAPP* ${timeText}\nCliente: *${leadName}*${notes ? `\nNota: ${notes}` : ''}\n\nEnvia el mensaje ahora!`,
    'EMAIL': `*CRM ALVEARE* - Recordatorio\n\nTienes que enviar un *EMAIL* ${timeText}\nCliente: *${leadName}*${notes ? `\nNota: ${notes}` : ''}\n\nRedacta y envia el correo!`,
    'VISITA': `*CRM ALVEARE* - Recordatorio\n\nTienes una *VISITA* programada ${timeText}\nCliente: *${leadName}*${notes ? `\nNota: ${notes}` : ''}\n\nPreparate para la reunion!`,
    'OTRO': `*CRM ALVEARE* - Recordatorio\n\nTienes una *TAREA* programada ${timeText}\nCliente: *${leadName}*${notes ? `\nNota: ${notes}` : ''}\n\nRevisa los detalles!`,
  };

  return messages[taskType] || messages['OTRO'];
};

// Send WhatsApp alert (opens WhatsApp with pre-filled message)
export const sendWhatsAppAlert = (
  userPhone: string,
  taskType: string,
  leadName: string,
  notes?: string,
  minutesBefore?: number
): void => {
  const formattedPhone = formatWhatsAppNumber(userPhone);
  const message = getAlertMessage(taskType, leadName, notes, minutesBefore);
  const encodedMessage = encodeURIComponent(message);
  
  // Open WhatsApp with the message
  window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
};
