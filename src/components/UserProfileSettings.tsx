import React, { useState, useEffect } from 'react';
import { User, Mail, Bell, Volume2, MessageSquare, Save, Check, Send, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUserProfileFromSupabase, 
  saveUserProfileToSupabase, 
  migrateLocalStorageToSupabase
} from '../services/userProfileService';
import { sendTelegramAlert, getTelegramBotLink } from '../services/telegramService';

// Telegram icon component
const TelegramIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

interface ProfileFormData {
  full_name: string;
  email: string;
  telegram_chat_id: string;
  whatsapp_number: string;
  default_alert_time: number;
  enable_telegram_alerts: boolean;
  enable_whatsapp_alerts: boolean;
  enable_sound_alerts: boolean;
  enable_browser_notifications: boolean;
}

const UserProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileFormData>({
    full_name: '',
    email: '',
    telegram_chat_id: '',
    whatsapp_number: '',
    default_alert_time: 15,
    enable_telegram_alerts: true,
    enable_whatsapp_alerts: false,
    enable_sound_alerts: true,
    enable_browser_notifications: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [telegramTestSent, setTelegramTestSent] = useState(false);
  const [telegramTesting, setTelegramTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load profile from Supabase when component mounts
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // First, try to migrate any existing localStorage data
        await migrateLocalStorageToSupabase(user.id);

        // Then fetch the profile from Supabase
        const data = await getUserProfileFromSupabase(user.id);
        
        if (data) {
          setProfile({
            full_name: data.full_name || '',
            email: data.email || user.email || '',
            telegram_chat_id: data.telegram_chat_id || '',
            whatsapp_number: data.whatsapp_number || '',
            default_alert_time: data.default_alert_time || 15,
            enable_telegram_alerts: data.enable_telegram_alerts ?? true,
            enable_whatsapp_alerts: data.enable_whatsapp_alerts ?? false,
            enable_sound_alerts: data.enable_sound_alerts ?? true,
            enable_browser_notifications: data.enable_browser_notifications ?? true,
          });
        } else {
          // Use registration info if no profile exists
          setProfile(prev => ({
            ...prev,
            full_name: user.user_metadata?.full_name || '',
            email: user.email || '',
          }));
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Error al cargar el perfil. Intenta recargar la página.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setError(null);

    try {
      const result = await saveUserProfileToSupabase(user.id, {
        full_name: profile.full_name,
        telegram_chat_id: profile.telegram_chat_id,
        whatsapp_number: profile.whatsapp_number,
        default_alert_time: profile.default_alert_time,
        enable_telegram_alerts: profile.enable_telegram_alerts,
        enable_whatsapp_alerts: profile.enable_whatsapp_alerts,
        enable_sound_alerts: profile.enable_sound_alerts,
        enable_browser_notifications: profile.enable_browser_notifications,
      });

      if (result) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError('Error al guardar. Por favor intenta de nuevo.');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Error al guardar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!profile.telegram_chat_id) {
      alert('Por favor ingresa tu ID de Telegram primero');
      return;
    }
    
    setTelegramTesting(true);
    const success = await sendTelegramAlert(
      profile.telegram_chat_id,
      `✅ <b>Prueba exitosa!</b>\n\nTu configuración de Telegram está funcionando.\n\nRecibirás alertas de:\n• Llamadas programadas\n• Visitas con clientes\n• Tareas pendientes`
    );
    
    setTelegramTesting(false);
    if (success) {
      setTelegramTestSent(true);
      setTimeout(() => setTelegramTestSent(false), 3000);
    } else {
      alert('Error al enviar. Verifica que el ID sea correcto y hayas iniciado el bot.');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 rounded-xl border border-blue-500/30 mb-6">
        <div className="flex items-center justify-center gap-3 py-8">
          <RefreshCw className="animate-spin text-blue-400" size={24} />
          <span className="text-gray-400">Cargando perfil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 rounded-xl border border-blue-500/30 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-500/20 rounded-lg">
          <User className="text-blue-400" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">👤 Mi Perfil</h2>
          <p className="text-gray-400 text-sm">Configura tu información para recibir alertas personalizadas</p>
          <p className="text-green-400 text-xs mt-1">💾 Los datos se guardan en la nube automáticamente</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-sm text-gray-400 mb-2 flex items-center gap-2">
            <User size={14} />
            Nombre Completo
          </label>
          <input
            type="text"
            value={profile.full_name}
            onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
            placeholder="Tu nombre"
            className="w-full bg-nexus-base border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-nexus-accent"
          />
        </div>

        {/* Telegram ID - Primary */}
        <div>
          <label className="text-sm text-gray-400 mb-2 flex items-center gap-2">
            <TelegramIcon size={14} className="text-sky-400" />
            Telegram ID ⭐ (Recomendado - Gratis)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={profile.telegram_chat_id}
              onChange={(e) => setProfile(prev => ({ ...prev, telegram_chat_id: e.target.value }))}
              placeholder="Tu ID de Telegram (ejemplo: 123456789)"
              className="flex-1 bg-nexus-base border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-nexus-accent"
            />
            <button
              onClick={handleTestTelegram}
              disabled={telegramTesting || !profile.telegram_chat_id}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                telegramTestSent 
                  ? 'bg-green-500 text-white' 
                  : 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30'
              } disabled:opacity-50`}
            >
              {telegramTesting ? (
                <span className="animate-spin">⏳</span>
              ) : telegramTestSent ? (
                <Check size={16} />
              ) : (
                <Send size={16} />
              )}
              {telegramTestSent ? '¡Enviado!' : 'Probar'}
            </button>
          </div>
          <div className="mt-2 p-3 bg-sky-500/10 rounded-lg border border-sky-500/20">
            <p className="text-xs text-sky-300 mb-2">📱 ¿Cómo obtener tu ID?</p>
            <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
              <li>Abre Telegram y busca <a href={getTelegramBotLink()} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">@alveare_crm_bot</a></li>
              <li>Presiona <strong className="text-white">Start</strong> o envía /start</li>
              <li>El bot te dará tu ID numérico - cópialo aquí</li>
            </ol>
          </div>
        </div>

        {/* WhatsApp Number - Coming Soon */}
        <div className="opacity-50">
          <label className="text-sm text-gray-400 mb-2 flex items-center gap-2">
            <MessageSquare size={14} className="text-green-400" />
            WhatsApp (Próximamente)
          </label>
          <input
            type="tel"
            value={profile.whatsapp_number}
            onChange={(e) => setProfile(prev => ({ ...prev, whatsapp_number: e.target.value }))}
            placeholder="+1 809 555 1234"
            className="w-full bg-nexus-base border border-white/10 rounded-lg p-3 text-white"
            disabled
          />
        </div>

        {/* Email - Read Only */}
        <div>
          <label className="text-sm text-gray-400 mb-2 flex items-center gap-2">
            <Mail size={14} />
            Email (del registro)
          </label>
          <input
            type="email"
            value={profile.email}
            readOnly
            className="w-full bg-nexus-base/50 border border-white/10 rounded-lg p-3 text-gray-400 cursor-not-allowed"
          />
        </div>

        {/* Alert Preferences */}
        <div className="pt-4 border-t border-white/10">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Bell size={16} className="text-yellow-400" />
            Preferencias de Alertas
          </h3>
          
          <div className="space-y-3">
            {/* Telegram Alerts - Recommended */}
            <label className="flex items-center justify-between p-3 bg-sky-500/10 border border-sky-500/20 rounded-lg cursor-pointer hover:bg-sky-500/20 transition-colors">
              <div className="flex items-center gap-3">
                <TelegramIcon size={18} className="text-sky-400" />
                <div>
                  <p className="text-white text-sm">Alertas por Telegram ⭐</p>
                  <p className="text-gray-500 text-xs">Recibe recordatorios automáticos (Gratis)</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={profile.enable_telegram_alerts}
                onChange={(e) => setProfile(prev => ({ ...prev, enable_telegram_alerts: e.target.checked }))}
                className="w-5 h-5 rounded accent-sky-400"
              />
            </label>

            {/* Sound Alerts */}
            <label className="flex items-center justify-between p-3 bg-nexus-base rounded-lg cursor-pointer hover:bg-nexus-base/80 transition-colors">
              <div className="flex items-center gap-3">
                <Volume2 size={18} className="text-blue-400" />
                <div>
                  <p className="text-white text-sm">Sonido de Alerta</p>
                  <p className="text-gray-500 text-xs">Reproduce un sonido con cada alerta</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={profile.enable_sound_alerts}
                onChange={(e) => setProfile(prev => ({ ...prev, enable_sound_alerts: e.target.checked }))}
                className="w-5 h-5 rounded accent-nexus-accent"
              />
            </label>

            {/* Browser Notifications */}
            <label className="flex items-center justify-between p-3 bg-nexus-base rounded-lg cursor-pointer hover:bg-nexus-base/80 transition-colors">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-yellow-400" />
                <div>
                  <p className="text-white text-sm">Notificaciones del Navegador</p>
                  <p className="text-gray-500 text-xs">Muestra notificaciones push</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={profile.enable_browser_notifications}
                onChange={(e) => setProfile(prev => ({ ...prev, enable_browser_notifications: e.target.checked }))}
                className="w-5 h-5 rounded accent-nexus-accent"
              />
            </label>
          </div>
        </div>

        {/* Default Alert Time */}
        <div className="pt-4 border-t border-white/10">
          <label className="text-sm text-gray-400 block mb-2">
            ⏰ Tiempo predeterminado de alerta
          </label>
          <select
            value={profile.default_alert_time}
            onChange={(e) => setProfile(prev => ({ ...prev, default_alert_time: parseInt(e.target.value) }))}
            className="w-full bg-nexus-base border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-nexus-accent"
          >
            <option value={15}>15 minutos antes</option>
            <option value={30}>30 minutos antes</option>
            <option value={60}>1 hora antes</option>
            <option value={120}>2 horas antes</option>
          </select>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
            saved 
              ? 'bg-green-500 text-white' 
              : 'bg-nexus-accent text-nexus-base hover:opacity-90'
          } disabled:opacity-50`}
        >
          {isSaving ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              Guardando...
            </>
          ) : saved ? (
            <>
              <Check size={18} />
              ¡Guardado en la nube!
            </>
          ) : (
            <>
              <Save size={18} />
              Guardar Perfil
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default UserProfileSettings;
