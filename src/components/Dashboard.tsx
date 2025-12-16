import React, { useMemo, useState } from 'react';
import type { Lead } from '../types';
import { LeadStatus } from '../types';
import { AlertTriangle, Clock, Phone, TrendingUp, Bell, X, MessageSquare, Mail, MapPin, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';
import LeadDetail from './LeadDetail';
import type { LeadScore } from '../services/leadScoring';
import type { LeadFollowUp } from '../types/activities';

// Interface for scheduled tasks (same as in LeadFollowUpTracker)
interface ScheduledTask {
  id: string;
  leadId: string;
  leadName: string;
  method: 'LLAMADA' | 'WHATSAPP' | 'EMAIL' | 'VISITA' | 'OTRO';
  scheduledDate: string;
  scheduledTime: string;
  notes: string;
  completed: boolean;
  alertMinutesBefore?: number;
  alertSent?: boolean;
}

interface DashboardProps {
  leads: Lead[];
  onUpdateLeadStatus?: (leadId: string, newStatus: LeadStatus) => void;
  onUpdateLeadScore?: (leadId: string, score: LeadScore) => void;
  onUpdateLead?: (leadId: string, updates: Partial<Lead>) => void;
  followUps?: LeadFollowUp[];
  onAddFollowUp?: (followUp: Omit<LeadFollowUp, 'id'>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  leads, 
  onUpdateLeadStatus,
  onUpdateLeadScore,
  onUpdateLead,
  followUps = [],
  onAddFollowUp
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // ---------------------------------------------------------------------------
  // LOGICA DE ALERTAS INTELIGENTE ("El Flow Lógico")
  // ---------------------------------------------------------------------------
  
  const urgentAlerts = useMemo(() => {
    const now = new Date();
    return leads.filter(lead => {
      // Excluir leads cerrados (ganados o perdidos)
      if (lead.status === LeadStatus.CLOSED_WON || lead.status === LeadStatus.CLOSED_LOST) {
        return false;
      }

      // Regla 1: Lead NUEVO sin contactar por > 2 horas
      const createdTime = new Date(lead.createdAt).getTime();
      const isNewAndOld = lead.status === LeadStatus.NEW && (now.getTime() - createdTime > 1000 * 60 * 60 * 2);

      // Regla 2: Seguimiento vencido (nextFollowUpDate ya pasó)
      const followUp = new Date(lead.nextFollowUpDate).getTime();
      const isOverdue = followUp < now.getTime();

      // Si fue contactado recientemente (últimas 2 horas), no mostrar como alerta
      if (lead.lastContactDate) {
        const lastContact = new Date(lead.lastContactDate).getTime();
        const recentlyContacted = (now.getTime() - lastContact) < 1000 * 60 * 60 * 2;
        if (recentlyContacted) return false;
      }

      return isNewAndOld || isOverdue;
    });
  }, [leads]);

  const todaysTasks = useMemo(() => {
     // Visitas programadas (leads con status VISIT_SCHEDULED)
     return leads.filter(l => l.status === LeadStatus.VISIT_SCHEDULED);
  }, [leads]);

  // Get scheduled tasks from localStorage for today
  const todaysScheduledTasks = useMemo(() => {
    const saved = localStorage.getItem('nexus_scheduled_tasks');
    if (!saved) return [];
    
    const allTasks: ScheduledTask[] = JSON.parse(saved);
    const today = new Date().toISOString().split('T')[0];
    
    return allTasks
      .filter(task => task.scheduledDate === today && !task.completed)
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [leads]); // Re-run when leads change to refresh

  const handleCompleteTask = (taskId: string) => {
    const saved = localStorage.getItem('nexus_scheduled_tasks');
    if (!saved) return;
    
    const allTasks: ScheduledTask[] = JSON.parse(saved);
    const updated = allTasks.map(t => 
      t.id === taskId ? { ...t, completed: true } : t
    );
    localStorage.setItem('nexus_scheduled_tasks', JSON.stringify(updated));
    // Force re-render
    window.dispatchEvent(new Event('storage'));
  };

  const getTaskIcon = (method: ScheduledTask['method']) => {
    switch (method) {
      case 'LLAMADA': return <Phone size={14} className="text-green-400" />;
      case 'WHATSAPP': return <MessageSquare size={14} className="text-green-400" />;
      case 'EMAIL': return <Mail size={14} className="text-blue-400" />;
      case 'VISITA': return <MapPin size={14} className="text-purple-400" />;
      default: return <MoreHorizontal size={14} className="text-gray-400" />;
    }
  };

  const getTaskColor = (method: ScheduledTask['method']) => {
    switch (method) {
      case 'LLAMADA': return 'bg-green-500';
      case 'WHATSAPP': return 'bg-green-500';
      case 'EMAIL': return 'bg-blue-500';
      case 'VISITA': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

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

  const handleUpdateScore = (leadId: string, score: LeadScore) => {
    if (onUpdateLeadScore) {
      onUpdateLeadScore(leadId, score);
    }
  };

  const handleAddFollowUp = (followUp: Omit<LeadFollowUp, 'id'>) => {
    if (onAddFollowUp) {
      onAddFollowUp(followUp);
    }
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
        
        {/* Daily Tasks - Now Large on Left */}
        <div className="lg:col-span-2 bg-nexus-surface rounded-xl border border-white/5">
          <div className="p-4 border-b border-white/10 flex items-center gap-2">
            <Clock size={18} className="text-nexus-accent" />
            <h3 className="font-bold text-nexus-text">Agenda Hoy</h3>
          </div>
          <div className="p-4 space-y-3 max-h-[450px] overflow-y-auto">
             {/* Scheduled Tasks for Today */}
             {todaysScheduledTasks.length > 0 && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {todaysScheduledTasks.map(task => (
                   <div 
                     key={task.id} 
                     className="flex gap-3 items-center p-3 bg-nexus-base rounded-lg border border-white/5 hover:border-nexus-accent/30 transition-all group"
                   >
                     <div className={`w-2 h-2 rounded-full ${getTaskColor(task.method)}`}></div>
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                         {getTaskIcon(task.method)}
                         <p className="text-sm font-medium text-white truncate">{task.leadName}</p>
                       </div>
                       <p className="text-xs text-gray-400">
                         {task.scheduledTime} - {task.method}
                         {task.notes && ` • ${task.notes}`}
                       </p>
                     </div>
                     <button
                       onClick={() => handleCompleteTask(task.id)}
                       className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white"
                       title="Marcar como completada"
                     >
                       <CheckCircle2 size={16} />
                     </button>
                   </div>
                 ))}
               </div>
             )}

             {/* Visits (leads with VISIT_SCHEDULED status) */}
             {todaysTasks.length > 0 && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {todaysTasks.map(task => (
                   <div 
                     key={task.id} 
                     className="flex gap-3 items-center p-3 bg-nexus-base rounded-lg border border-purple-500/20 cursor-pointer hover:border-purple-500/50 transition-all"
                     onClick={() => setSelectedLead(task)}
                   >
                     <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                     <div className="flex-1">
                       <div className="flex items-center gap-2">
                         <MapPin size={14} className="text-purple-400" />
                         <p className="text-sm font-medium text-white">Visita: {task.name}</p>
                       </div>
                       <p className="text-xs text-gray-400">{task.interestArea}</p>
                     </div>
                   </div>
                 ))}
               </div>
             )}

             {/* Empty state */}
             {todaysScheduledTasks.length === 0 && todaysTasks.length === 0 && (
               <p className="text-sm text-gray-500 text-center py-8">No hay tareas para hoy 🎉</p>
             )}

             {/* Recurring task hint */}
             <div className="flex gap-3 items-center p-3 opacity-50 border-t border-white/5 mt-2 pt-4">
                <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                <div>
                   <p className="text-sm font-medium text-white">Revisar captaciones nuevas</p>
                   <p className="text-xs text-gray-400">Tarea recurrente</p>
                 </div>
             </div>
          </div>
        </div>

        {/* Critical Alerts Column - Now Small on Right */}
        <div className="bg-nexus-surface rounded-xl border border-red-900/30 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-red-900/10">
            <AlertTriangle size={18} className="text-red-500" />
            <h3 className="font-bold text-red-100">Acciones Críticas</h3>
          </div>
          <div className="p-0 max-h-[400px] overflow-y-auto">
            {urgentAlerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Todo al día. ¡Buen trabajo!</div>
            ) : (
              urgentAlerts.map(lead => (
                <div key={lead.id} className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleContactLead(lead)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                       <span className="font-bold text-white text-sm">{lead.name}</span>
                       <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/20">
                         {lead.status === LeadStatus.NEW ? 'NUEVO' : 'VENCIDO'}
                       </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{lead.notes}</p>
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(lead.nextFollowUpDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleCall(lead.phone)}
                    className="w-full mt-2 bg-nexus-accent text-nexus-base px-3 py-1.5 rounded font-bold text-xs hover:bg-orange-400"
                  >
                    Contactar
                  </button>
                </div>
              ))
            )}
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
            onUpdateScore={handleUpdateScore}
            onUpdateLead={onUpdateLead}
            followUps={followUps}
            onAddFollowUp={handleAddFollowUp}
          />
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
