import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Bell, Volume2, MessageSquare, Save, Check } from 'lucide-react';
import { getUserProfile, saveUserProfile, type UserProfile } from '../services/userProfile';

const UserProfileSettings: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [saved, setSaved] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    setProfile(getUserProfile());
  }, []);

  const handleSave = () => {
    saveUserProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestWhatsApp = () => {
    if (!profile.whatsappNumber) {
      alert('Por favor ingresa tu número de WhatsApp primero');
      return;
    }
    
    const formattedPhone = profile.whatsappNumber.replace(/[^\d]/g, '');
    const testMessage = encodeURIComponent(
      `*NEXUS CRM* - Prueba de Alertas\n\nTu configuracion de WhatsApp funciona correctamente!\n\nAhora recibiras alertas de:\n- Llamadas programadas\n- Mensajes de WhatsApp\n- Emails pendientes\n- Visitas/Citas\n- Otras tareas\n\nListo para aumentar tu productividad!`
    );
    
    window.open(`https://wa.me/${formattedPhone}?text=${testMessage}`, '_blank');
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 rounded-xl border border-blue-500/30 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-500/20 rounded-lg">
          <User className="text-blue-400" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">👤 Mi Perfil</h2>
          <p className="text-gray-400 text-sm">Configura tu información para recibir alertas personalizadas</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-sm text-gray-400 block mb-2 flex items-center gap-2">
            <User size={14} />
            Nombre Completo
          </label>
          <input
            type="text"
            value={profile.fullName}
            onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
            placeholder="Tu nombre"
            className="w-full bg-nexus-base border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-nexus-accent"
          />
        </div>

        {/* WhatsApp Number */}
        <div>
          <label className="text-sm text-gray-400 block mb-2 flex items-center gap-2">
            <MessageSquare size={14} className="text-green-400" />
            Número de WhatsApp (para alertas)
          </label>
          <div className="flex gap-2">
            <input
              type="tel"
              value={profile.whatsappNumber}
              onChange={(e) => setProfile(prev => ({ ...prev, whatsappNumber: e.target.value }))}
              placeholder="+1 809 555 1234"
              className="flex-1 bg-nexus-base border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-nexus-accent"
            />
            <button
              onClick={handleTestWhatsApp}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                testSent 
                  ? 'bg-green-500 text-white' 
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              }`}
            >
              {testSent ? <Check size={16} /> : <MessageSquare size={16} />}
              {testSent ? '¡Enviado!' : 'Probar'}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Incluye el código de país (ej: +1 809 para RD, +1 para USA)
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="text-sm text-gray-400 block mb-2 flex items-center gap-2">
            <Mail size={14} />
            Email
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
            placeholder="tu@email.com"
            className="w-full bg-nexus-base border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-nexus-accent"
          />
        </div>

        {/* Alert Preferences */}
        <div className="pt-4 border-t border-white/10">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Bell size={16} className="text-yellow-400" />
            Preferencias de Alertas
          </h3>
          
          <div className="space-y-3">
            {/* WhatsApp Alerts */}
            <label className="flex items-center justify-between p-3 bg-nexus-base rounded-lg cursor-pointer hover:bg-nexus-base/80 transition-colors">
              <div className="flex items-center gap-3">
                <MessageSquare size={18} className="text-green-400" />
                <div>
                  <p className="text-white text-sm">Alertas por WhatsApp</p>
                  <p className="text-gray-500 text-xs">Recibe recordatorios en tu WhatsApp</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={profile.enableWhatsAppAlerts}
                onChange={(e) => setProfile(prev => ({ ...prev, enableWhatsAppAlerts: e.target.checked }))}
                className="w-5 h-5 rounded accent-nexus-accent"
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
                checked={profile.enableSoundAlerts}
                onChange={(e) => setProfile(prev => ({ ...prev, enableSoundAlerts: e.target.checked }))}
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
                checked={profile.enableBrowserNotifications}
                onChange={(e) => setProfile(prev => ({ ...prev, enableBrowserNotifications: e.target.checked }))}
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
            value={profile.defaultAlertTime}
            onChange={(e) => setProfile(prev => ({ ...prev, defaultAlertTime: parseInt(e.target.value) }))}
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
          className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
            saved 
              ? 'bg-green-500 text-white' 
              : 'bg-nexus-accent text-nexus-base hover:opacity-90'
          }`}
        >
          {saved ? (
            <>
              <Check size={18} />
              ¡Guardado!
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
