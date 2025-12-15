import React, { useMemo, useState } from 'react';
import type { Lead } from '../types';
import { LeadStatus } from '../types';
import { AlertTriangle, Clock, Phone, TrendingUp, Bell, X } from 'lucide-react';
import Modal from './Modal';
import LeadDetail from './LeadDetail';

interface DashboardProps {
  leads: Lead[];
  onUpdateLeadStatus?: (leadId: string, newStatus: LeadStatus) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ leads, onUpdateLeadStatus }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // ---------------------------------------------------------------------------
  // LOGICA DE ALERTAS INTELIGENTE ("El Flow Lógico")
  // ---------------------------------------------------------------------------
  
  const urgentAlerts = useMemo(() => {
    const now = new Date();
    return leads.filter(lead => {
      // Regla 1: Lead NUEVO sin contactar por > 2 horas (Simulado con 30 min para demo)
      const createdTime = new Date(lead.createdAt).getTime();
      const isNewAndOld = lead.status === LeadStatus.NEW && (now.getTime() - createdTime > 1000 * 60 * 60 * 2);

      // Regla 2: Seguimiento vencido o para hoy
      const followUp = new Date(lead.nextFollowUpDate).getTime();
      const isOverdue = followUp < now.getTime();

      return isNewAndOld || isOverdue;
    });
  }, [leads]);

  const todaysTasks = useMemo(() => {
     // Simulación de tareas para hoy
     return leads.filter(l => l.status === LeadStatus.VISIT_SCHEDULED);
  }, [leads]);

  const handleContactLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleUpdateStatus = (leadId: string, newStatus: LeadStatus) => {
    if (onUpdateLeadStatus) {
      onUpdateLeadStatus(leadId, newStatus);
    }
    setSelectedLead(null);
  };

  // Request notification permission on mount
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Panel de Control</h2>
          <p className="text-gray-400">Resumen de operaciones en tiempo real</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 bg-white/5 rounded-full hover:bg-white/10 relative"
          >
            <Bell size={24} className="text-nexus-accent" />
            {urgentAlerts.length > 0 && (
               <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-nexus-base"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-nexus-surface border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3 border-b border-white/10 flex justify-between items-center">
                <h4 className="font-bold text-white">Notificaciones</h4>
                <button onClick={() => setShowNotifications(false)}>
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {urgentAlerts.length === 0 ? (
                  <p className="p-4 text-gray-500 text-sm text-center">Sin notificaciones pendientes</p>
                ) : (
                  urgentAlerts.map(lead => (
                    <div 
                      key={lead.id} 
                      className="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer"
                      onClick={() => { setSelectedLead(lead); setShowNotifications(false); }}
                    >
                      <p className="text-sm font-medium text-white">{lead.name}</p>
                      <p className="text-xs text-red-400">
                        {lead.status === LeadStatus.NEW ? 'Nuevo sin contactar' : 'Seguimiento vencido'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Leads Activos', val: leads.length, icon: TrendingUp, color: 'text-green-400' },
          { label: 'Alertas Rojas', val: urgentAlerts.length, icon: AlertTriangle, color: 'text-red-500' },
          { label: 'Llamadas Hoy', val: 12, icon: Phone, color: 'text-blue-400' },
          { label: 'Visitas Pend.', val: todaysTasks.length, icon: Clock, color: 'text-nexus-accent' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-nexus-surface p-4 rounded-xl border border-white/5 shadow-lg">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-xs text-gray-400 uppercase tracking-wider">{kpi.label}</p>
                 <p className={`text-2xl md:text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.val}</p>
               </div>
               <kpi.icon size={20} className="text-gray-500" />
             </div>
          </div>
        ))}
      </div>

      {/* ALERT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Critical Alerts Column */}
        <div className="lg:col-span-2 bg-nexus-surface rounded-xl border border-red-900/30 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-red-900/10">
            <AlertTriangle size={18} className="text-red-500" />
            <h3 className="font-bold text-red-100">Acciones Críticas Requeridas</h3>
          </div>
          <div className="p-0">
            {urgentAlerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Todo al día. ¡Buen trabajo!</div>
            ) : (
              urgentAlerts.map(lead => (
                <div key={lead.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex justify-between items-center">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => handleContactLead(lead)}
                  >
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-white">{lead.name}</span>
                       <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/20">
                         {lead.status === LeadStatus.NEW ? 'NUEVO SIN CONTACTAR' : 'SEGUIMIENTO VENCIDO'}
                       </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{lead.notes}</p>
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(lead.nextFollowUpDate).toLocaleString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleCall(lead.phone)}
                    className="bg-nexus-accent text-nexus-base px-4 py-2 rounded font-bold text-sm hover:bg-orange-400 shadow-[0_0_10px_rgba(255,133,27,0.3)]"
                  >
                    Contactar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Daily Tasks */}
        <div className="bg-nexus-surface rounded-xl border border-white/5">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-bold text-nexus-text">Agenda Hoy</h3>
          </div>
          <div className="p-4 space-y-4">
             {todaysTasks.length > 0 ? todaysTasks.map(task => (
               <div 
                 key={task.id} 
                 className="flex gap-3 items-start cursor-pointer hover:bg-white/5 p-2 rounded-lg -m-2"
                 onClick={() => setSelectedLead(task)}
               >
                 <div className="w-2 h-2 mt-2 rounded-full bg-blue-400"></div>
                 <div>
                   <p className="text-sm font-medium text-white">Visita: {task.name}</p>
                   <p className="text-xs text-gray-400">{task.interestArea}</p>
                 </div>
               </div>
             )) : (
               <p className="text-sm text-gray-500">No hay visitas programadas.</p>
             )}
             <div className="flex gap-3 items-start opacity-50">
                <div className="w-2 h-2 mt-2 rounded-full bg-gray-600"></div>
                <div>
                   <p className="text-sm font-medium text-white">Revisar captaciones nuevas</p>
                   <p className="text-xs text-gray-400">Tarea recurrente</p>
                 </div>
             </div>
          </div>
        </div>

      </div>

      {/* Modal: Lead Detail */}
      <Modal isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} title="Detalle del Lead">
        {selectedLead && (
          <LeadDetail 
            lead={selectedLead} 
            onClose={() => setSelectedLead(null)}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
