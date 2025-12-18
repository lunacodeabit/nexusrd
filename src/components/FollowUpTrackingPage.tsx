import React, { useState } from 'react';
import { 
  Clock, 
  Pause, 
  Search, 
  Phone, 
  MessageCircle, 
  Calendar,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  MapPin,
  Home,
  Send
} from 'lucide-react';
import { useFollowUpTracking } from '../hooks/useFollowUpTracking';
import type { FollowUpTracking, TrackingType, Currency } from '../types';

// Format currency helper
const formatCurrency = (amount: number, currency: Currency = 'USD') => {
  if (currency === 'RD$') {
    return `RD$${amount.toLocaleString()}`;
  }
  return `$${amount.toLocaleString()}`;
};

interface FollowUpTrackingPageProps {
  onCallLead?: (phone: string) => void;
  onWhatsAppLead?: (phone: string) => void;
}

const FollowUpTrackingPage: React.FC<FollowUpTrackingPageProps> = ({
  onCallLead,
  onWhatsAppLead
}) => {
  const { 
    waitingLeads, 
    pausedLeads, 
    searchingLeads,
    totalCount,
    isLoading,
    reactivateLead,
    cancelTracking,
    incrementPropertiesSent
  } = useFollowUpTracking();

  const [activeTab, setActiveTab] = useState<TrackingType>('waiting');
  const [confirmAction, setConfirmAction] = useState<{id: string, action: 'reactivate' | 'cancel'} | null>(null);

  const tabs = [
    { 
      id: 'waiting' as TrackingType, 
      label: 'En Espera', 
      shortLabel: 'Espera',
      icon: Clock, 
      count: waitingLeads.length,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      description: 'Esperando aprobación, documentos, etc.'
    },
    { 
      id: 'paused' as TrackingType, 
      label: 'Pausados', 
      shortLabel: 'Pausados',
      icon: Pause, 
      count: pausedLeads.length,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      description: 'Clientes que pausaron su búsqueda'
    },
    { 
      id: 'searching' as TrackingType, 
      label: 'Búsquedas', 
      shortLabel: 'Búsquedas',
      icon: Search, 
      count: searchingLeads.length,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      description: 'Clientes buscando propiedades específicas'
    },
  ];

  const getCurrentLeads = () => {
    switch (activeTab) {
      case 'waiting': return waitingLeads;
      case 'paused': return pausedLeads;
      case 'searching': return searchingLeads;
      default: return [];
    }
  };

  const handleReactivate = async (trackingId: string) => {
    const success = await reactivateLead(trackingId);
    if (success) {
      setConfirmAction(null);
    }
  };

  const handleCancel = async (trackingId: string) => {
    await cancelTracking(trackingId);
    setConfirmAction(null);
  };

  const handleCall = (phone: string | undefined) => {
    if (phone && onCallLead) {
      onCallLead(phone);
    } else if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  const handleWhatsApp = (phone: string | undefined) => {
    if (phone && onWhatsAppLead) {
      onWhatsAppLead(phone);
    } else if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  const getDaysLabel = (days: number | null | undefined) => {
    if (days === null || days === undefined) return null;
    if (days < 0) return { text: `Hace ${Math.abs(days)} días`, isOverdue: true };
    if (days === 0) return { text: 'Hoy', isToday: true };
    if (days === 1) return { text: 'Mañana', isSoon: true };
    return { text: `En ${days} días`, isFuture: true };
  };

  const renderTrackingCard = (tracking: FollowUpTracking) => {
    const daysInfo = getDaysLabel(tracking.days_until_contact);
    const isSearching = tracking.tracking_type === 'searching';

    return (
      <div 
        key={tracking.id}
        className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
              {tracking.lead_name}
              {daysInfo?.isOverdue && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Vencido
                </span>
              )}
              {daysInfo?.isToday && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                  Hoy
                </span>
              )}
            </h3>
            <p className="text-slate-400 text-sm">{tracking.lead_source}</p>
          </div>
          <div className="text-right">
            <p className="text-emerald-400 font-semibold">
              {formatCurrency(tracking.lead_budget || 0, tracking.lead_currency || 'USD')}
            </p>
          </div>
        </div>

        {/* Reason */}
        <div className="mb-3 p-3 bg-slate-900/50 rounded-lg">
          <p className="text-slate-300 text-sm">
            <span className="text-slate-500">
              {tracking.tracking_type === 'waiting' && '🏦 Esperando: '}
              {tracking.tracking_type === 'paused' && '⏸️ Razón: '}
              {tracking.tracking_type === 'searching' && '🔍 Busca: '}
            </span>
            {tracking.reason}
          </p>
          {tracking.notes && (
            <p className="text-slate-400 text-xs mt-1">📝 {tracking.notes}</p>
          )}
        </div>

        {/* Search Criteria (only for searching type) */}
        {isSearching && tracking.search_criteria && (
          <div className="mb-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <p className="text-purple-300 text-xs font-medium mb-2">📋 Criterios de búsqueda:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {tracking.search_criteria.zones && tracking.search_criteria.zones.length > 0 && (
                <div className="flex items-center gap-1 text-slate-300">
                  <MapPin className="w-3 h-3 text-purple-400" />
                  {tracking.search_criteria.zones.join(', ')}
                </div>
              )}
              {(tracking.search_criteria.bedroomsMin || tracking.search_criteria.bedroomsMax) && (
                <div className="flex items-center gap-1 text-slate-300">
                  <Home className="w-3 h-3 text-purple-400" />
                  {tracking.search_criteria.bedroomsMin}-{tracking.search_criteria.bedroomsMax} hab
                </div>
              )}
              {tracking.search_criteria.propertyType && (
                <div className="text-slate-300">
                  Tipo: {tracking.search_criteria.propertyType}
                </div>
              )}
              {tracking.search_criteria.features && tracking.search_criteria.features.length > 0 && (
                <div className="col-span-2 text-slate-400">
                  ✓ {tracking.search_criteria.features.join(', ')}
                </div>
              )}
            </div>
            <div className="mt-2 pt-2 border-t border-purple-500/20 flex items-center justify-between">
              <span className="text-slate-400 text-xs">
                🏠 Propiedades enviadas: {tracking.properties_sent || 0}
              </span>
              <button
                onClick={() => incrementPropertiesSent(tracking.id)}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                +1 Enviada
              </button>
            </div>
          </div>
        )}

        {/* Contact Date & Days */}
        <div className="flex items-center justify-between mb-4">
          {tracking.contact_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-slate-400">
                {tracking.tracking_type === 'waiting' ? 'Fecha estimada:' : 'Contactar:'}
              </span>
              <span className={`font-medium ${
                daysInfo?.isOverdue ? 'text-red-400' :
                daysInfo?.isToday ? 'text-amber-400' :
                daysInfo?.isSoon ? 'text-emerald-400' :
                'text-slate-300'
              }`}>
                {new Date(tracking.contact_date).toLocaleDateString('es-DO', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
              {daysInfo && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  daysInfo.isOverdue ? 'bg-red-500/20 text-red-400' :
                  daysInfo.isToday ? 'bg-amber-500/20 text-amber-400' :
                  daysInfo.isSoon ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  {daysInfo.text}
                </span>
              )}
            </div>
          )}
          <span className="text-slate-500 text-xs">
            En seguimiento: {tracking.days_in_tracking} días
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-700">
          <button
            onClick={() => handleCall(tracking.lead_phone)}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
          >
            <Phone className="w-4 h-4" />
            Llamar
          </button>
          <button
            onClick={() => handleWhatsApp(tracking.lead_phone)}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            onClick={() => setConfirmAction({ id: tracking.id, action: 'reactivate' })}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
            title="Reactivar lead"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Confirm Dialog */}
        {confirmAction?.id === tracking.id && (
          <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-slate-600">
            <p className="text-slate-300 text-sm mb-3">
              {confirmAction.action === 'reactivate' 
                ? '¿Reactivar este lead y moverlo al Kanban?' 
                : '¿Cancelar este seguimiento?'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => confirmAction.action === 'reactivate' 
                  ? handleReactivate(tracking.id)
                  : handleCancel(tracking.id)
                }
                className={`flex-1 py-2 rounded text-sm font-medium ${
                  confirmAction.action === 'reactivate'
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {confirmAction.action === 'reactivate' ? '✓ Reactivar' : '✓ Cancelar'}
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm"
              >
                No, volver
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Clock className="w-7 h-7 text-orange-500" />
          Seguimiento de Leads
          {totalCount > 0 && (
            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-sm font-medium rounded-full">
              {totalCount}
            </span>
          )}
        </h1>
        <p className="text-slate-400 mt-1">
          Leads en espera, pausados o con búsquedas activas
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-xl font-medium transition-all ${
              activeTab === tab.id
                ? `${tab.bgColor} ${tab.color} border border-current`
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent'
            }`}
          >
            <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">{tab.shortLabel}</span>
            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${
              activeTab === tab.id ? 'bg-white/20' : 'bg-slate-700'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Description */}
      <p className="text-slate-500 text-sm mb-4 flex items-center gap-2">
        <ChevronRight className="w-4 h-4" />
        {tabs.find(t => t.id === activeTab)?.description}
      </p>

      {/* Content */}
      <div className="grid gap-4">
        {getCurrentLeads().length === 0 ? (
          <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${tabs.find(t => t.id === activeTab)?.bgColor} flex items-center justify-center`}>
              {React.createElement(tabs.find(t => t.id === activeTab)?.icon || Clock, {
                className: `w-8 h-8 ${tabs.find(t => t.id === activeTab)?.color}`
              })}
            </div>
            <p className="text-slate-400">
              No hay leads {activeTab === 'waiting' ? 'en espera' : activeTab === 'paused' ? 'pausados' : 'con búsquedas activas'}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              Mueve leads desde el Kanban usando el menú "Mover a Seguimiento"
            </p>
          </div>
        ) : (
          getCurrentLeads().map(tracking => renderTrackingCard(tracking))
        )}
      </div>
    </div>
  );
};

export default FollowUpTrackingPage;
