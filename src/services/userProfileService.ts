// User Profile Service - Using Supabase for persistence
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  whatsapp_number: string;
  telegram_chat_id: string;
  default_alert_time: number; // Minutes before task (15, 30, 60, 120)
  enable_whatsapp_alerts: boolean;
  enable_telegram_alerts: boolean;
  enable_sound_alerts: boolean;
  enable_browser_notifications: boolean;
  role?: string;
  is_active?: boolean;
  avatar_url?: string;
  team_id?: string;
  created_at?: string;
  updated_at?: string;
}

// For backward compatibility with legacy localStorage key
const LEGACY_STORAGE_KEY = 'nexus_user_profile';

// Get user profile from Supabase
export const getUserProfileFromSupabase = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getUserProfileFromSupabase:', error);
    return null;
  }
};

// Save user profile to Supabase
export const saveUserProfileToSupabase = async (
  userId: string, 
  profile: Partial<UserProfile>
): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in saveUserProfileToSupabase:', error);
    return null;
  }
};

// Migrate data from localStorage to Supabase (one-time operation)
export const migrateLocalStorageToSupabase = async (userId: string): Promise<void> => {
  const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacyData) return;
  
  try {
    const parsed = JSON.parse(legacyData);
    
    // Only migrate if there's useful data
    if (parsed.telegramChatId || parsed.whatsappNumber || parsed.fullName) {
      await supabase
        .from('user_profiles')
        .update({
          telegram_chat_id: parsed.telegramChatId || '',
          whatsapp_number: parsed.whatsappNumber || '',
          full_name: parsed.fullName || undefined,
          default_alert_time: parsed.defaultAlertTime || 15,
          enable_whatsapp_alerts: parsed.enableWhatsAppAlerts ?? false,
          enable_telegram_alerts: parsed.enableTelegramAlerts ?? true,
          enable_sound_alerts: parsed.enableSoundAlerts ?? true,
          enable_browser_notifications: parsed.enableBrowserNotifications ?? true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      // Clear legacy data after successful migration
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      console.log('Migrated profile from localStorage to Supabase');
    }
  } catch (error) {
    console.error('Error migrating localStorage data:', error);
  }
};

// =============================================
// Legacy functions (for backward compatibility)
// These are DEPRECATED - use Supabase functions above
// =============================================

export interface LegacyUserProfile {
  id: string;
  fullName: string;
  whatsappNumber: string;
  telegramChatId: string;
  email: string;
  defaultAlertTime: number;
  enableWhatsAppAlerts: boolean;
  enableTelegramAlerts: boolean;
  enableSoundAlerts: boolean;
  enableBrowserNotifications: boolean;
}

// Convert Supabase profile to legacy format
export const toLegeacyFormat = (profile: UserProfile): LegacyUserProfile => ({
  id: profile.id,
  fullName: profile.full_name || '',
  whatsappNumber: profile.whatsapp_number || '',
  telegramChatId: profile.telegram_chat_id || '',
  email: profile.email || '',
  defaultAlertTime: profile.default_alert_time || 15,
  enableWhatsAppAlerts: profile.enable_whatsapp_alerts ?? false,
  enableTelegramAlerts: profile.enable_telegram_alerts ?? true,
  enableSoundAlerts: profile.enable_sound_alerts ?? true,
  enableBrowserNotifications: profile.enable_browser_notifications ?? true,
});

// DEPRECATED - only for initial load before user is authenticated
export const getUserProfile = (): LegacyUserProfile => {
  const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (saved) {
    return { ...getDefaultLegacyProfile(), ...JSON.parse(saved) };
  }
  return getDefaultLegacyProfile();
};

export const getDefaultLegacyProfile = (): LegacyUserProfile => ({
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
});

// DEPRECATED - use saveUserProfileToSupabase instead
export const saveUserProfile = (profile: Partial<LegacyUserProfile>): LegacyUserProfile => {
  const current = getUserProfile();
  const updated = { ...current, ...profile };
  localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(updated));
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
