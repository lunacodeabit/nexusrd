import React, { useMemo, useState } from 'react';
import type { Lead } from '../types';
import { LeadStatus } from '../types';
import { AlertTriangle, Clock, Phone, TrendingUp, Bell, X, MessageSquare, Mail, MapPin, MoreHorizontal, CheckCircle2, Pencil, CalendarPlus, Zap } from 'lucide-react';
import Modal from './Modal';
import LeadDetail from './LeadDetail';
import DailyPlanner from './DailyPlanner';
import type { LeadScore } from '../services/leadScoring';
import type { LeadFollowUp } from '../types/activities';
import { useTodayActivity } from '../hooks/useTodayActivity';
import { useAutomations } from '../hooks/useAutomations';
import { useAutomationEngine } from '../hooks/useAutomationEngine';

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
  onUpdateFollowUpNotes?: (followUpId: string, notes: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  leads, 
  onUpdateLeadStatus,
  onUpdateLeadScore,
  onUpdateLead,
  followUps = [],
  onAddFollowUp,
  onUpdateFollowUpNotes
}) => {
  const { counts: todayActivity } = useTodayActivity();
  const { rules } = useAutomations();
  const { pendingAutomations } = useAutomationEngine({ leads, rules });
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [taskForm, setTaskForm] = useState({
    method: 'LLAMADA' as ScheduledTask['method'],
    date: '',
    time: '',
    notes: '',
    alertMinutesBefore: 15
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const ALERT_TIME_OPTIONS = [
    { value: 15, label: '15m' },
    { value: 30, label: '30m' },
    { value: 60, label: '1h' },
    { value: 120, label: '2h' },
  ];

  // ---------------------------------------------------------------------------
  // LOGICA DE ALERTAS INTELIGENTE ("El Flow Lógico")
  // ---------------------------------------------------------------------------
  
  // Tipo unificado para alertas críticas
  type CriticalAlert = {
    lead: Lead;
    type: 'NEW' | 'OVERDUE' | 'AUTOMATION';
    reason: string;
    automationName?: string;
  };

  const criticalAlerts = useMemo((): CriticalAlert[] => {
    const now = new Date();
    const alerts: CriticalAlert[] = [];
    const addedLeadIds = new Set<string>();

    // 1. Alertas de automatizaciones (prioridad alta)
    for (const auto of pendingAutomations) {
      if (auto.action === 'show_alert' || auto.action === 'notify_supervisor') {
        const lead = leads.find(l => l.id === auto.leadId);
        if (lead && !addedLeadIds.has(lead.id)) {
          alerts.push({
            lead,
            type: 'AUTOMATION',
            reason: auto.message || auto.ruleName,
            automationName: auto.ruleName
          });
          addedLeadIds.add(lead.id);
        }
      }
    }

    // 2. Alertas manuales (leads sin contactar o vencidos)
    for (const lead of leads) {
      if (addedLeadIds.has(lead.id)) continue;
      if (lead.status === LeadStatus.CLOSED_WON || lead.status === LeadStatus.CLOSED_LOST) continue;

      const leadFollowUps = followUps.filter(f => f.leadId === lead.id);
      const hasFollowUps = leadFollowUps.length > 0;
      const lastFollowUpDate = hasFollowUps 
        ? Math.max(...leadFollowUps.map(f => new Date(f.date).getTime()))
        : null;

      const createdTime = new Date(lead.createdAt).getTime();
      const isNewAndOld = lead.status === LeadStatus.NEW && 
                          !hasFollowUps && 
                          (now.getTime() - createdTime > 1000 * 60 * 60 * 2);

      const followUp = new Date(lead.nextFollowUpDate).getTime();
      const isOverdue = followUp < now.getTime();

      const lastContactTime = lead.lastContactDate ? new Date(lead.lastContactDate).getTime() : null;
      const mostRecentContact = Math.max(lastContactTime || 0, lastFollowUpDate || 0);
      
      if (mostRecentContact > 0) {
        const recentlyContacted = (now.getTime() - mostRecentContact) < 1000 * 60 * 60 * 2;
        if (recentlyContacted) continue;
      }

      if (isNewAndOld) {
        alerts.push({ lead, type: 'NEW', reason: 'SIN CONTACTAR' });
        addedLeadIds.add(lead.id);
      } else if (isOverdue) {
        alerts.push({ lead, type: 'OVERDUE', reason: 'SEGUIMIENTO VENCIDO' });
        addedLeadIds.add(lead.id);
      }
    }

    return alerts;
  }, [leads, followUps, pendingAutomations]);

  // Para compatibilidad con el conteo de KPIs
  const urgentAlerts = criticalAlerts;

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
  }, [leads, refreshKey]); // Re-run when leads change or refreshKey changes

  const handleCompleteTask = (taskId: string) => {
    const saved = localStorage.getItem('nexus_scheduled_tasks');
    if (!saved) return;
    
    const allTasks: ScheduledTask[] = JSON.parse(saved);
    const updated = allTasks.map(t => 
      t.id === taskId ? { ...t, completed: true } : t
    );
    localStorage.setItem('nexus_scheduled_tasks', JSON.stringify(updated));
    setRefreshKey(prev => prev + 1);
    window.dispatchEvent(new Event('storage'));
  };

  const handleEditTask = (task: ScheduledTask) => {
    setEditingTask(task);
    setTaskForm({
      method: task.method,
      date: task.scheduledDate,
      time: task.scheduledTime,
      notes: task.notes,
      alertMinutesBefore: task.alertMinutesBefore || 15
    });
  };

  const handleSaveTask = () => {
    if (!editingTask || !taskForm.date || !taskForm.time) return;
    
    const saved = localStorage.getItem('nexus_scheduled_tasks');
    if (!saved) return;
    
    const allTasks: ScheduledTask[] = JSON.parse(saved);
    const updated = allTasks.map(t => 
      t.id === editingTask.id 
        ? {
            ...t,
            method: taskForm.method,
            scheduledDate: taskForm.date,
            scheduledTime: taskForm.time,
            notes: taskForm.notes,
            alertMinutesBefore: taskForm.alertMinutesBefore,
            alertSent: false
          }
        : t
    );
    localStorage.setItem('nexus_scheduled_tasks', JSON.stringify(updated));
    setEditingTask(null);
    setRefreshKey(prev => prev + 1);
    window.dispatchEvent(new Event('storage'));
  };

  const handleDeleteTask = (taskId: string) => {
    const saved = localStorage.getItem('nexus_scheduled_tasks');
    if (!saved) return;
    
    const allTasks: ScheduledTask[] = JSON.parse(saved);
    const updated = allTasks.filter(t => t.id !== taskId);
    localStorage.setItem('nexus_scheduled_tasks', JSON.stringify(updated));
    setEditingTask(null);
    setRefreshKey(prev => prev + 1);
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

  const handleWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(`Hola ${name}, te contacto de ALVEARE Inmobiliaria.`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
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
          { label: 'Llamadas Hoy', val: todayActivity.calls, icon: Phone, color: 'text-blue-400' },
          { label: 'WhatsApp Hoy', val: todayActivity.whatsapp, icon: MessageSquare, color: 'text-emerald-400' },
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
                     <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                       <button
                         onClick={() => handleEditTask(task)}
                         className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white"
                         title="Editar tarea"
                       >
                         <Pencil size={14} />
                       </button>
                       <button
                         onClick={() => handleCompleteTask(task.id)}
                         className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white"
                         title="Marcar como completada"
                       >
                         <CheckCircle2 size={14} />
                       </button>
                     </div>
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
               <p className="text-sm text-gray-500 text-center py-4">No hay tareas de leads para hoy</p>
             )}

             {/* Personal Tasks Section - Integrated Planner */}
             <div className="border-t border-white/10 pt-4 mt-4">
               <DailyPlanner compact />
             </div>
          </div>
        </div>

        {/* Critical Alerts Column - Now Small on Right */}
        <div className="bg-nexus-surface rounded-xl border border-red-900/30 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-red-900/10">
            <AlertTriangle size={18} className="text-red-500" />
            <h3 className="font-bold text-red-100">Acciones Críticas</h3>
            {criticalAlerts.length > 0 && (
              <span className="ml-auto text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">{criticalAlerts.length}</span>
            )}
          </div>
          <div className="p-0 max-h-[400px] overflow-y-auto">
            {criticalAlerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Todo al día. ¡Buen trabajo!</div>
            ) : (
              criticalAlerts.map((alert, idx) => {
                const { lead, type, reason, automationName } = alert;
                const leadFollowUps = followUps.filter(f => f.leadId === lead.id);
                
                return (
                <div key={`${lead.id}-${idx}`} className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleContactLead(lead)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                       <span className="font-bold text-white text-sm">{lead.name}</span>
                       <span className={`text-xs px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                         type === 'AUTOMATION' 
                           ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' 
                           : type === 'NEW'
                           ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' 
                           : 'bg-red-500/20 text-red-400 border-red-500/20'
                       }`}>
                         {type === 'AUTOMATION' && <Zap size={10} />}
                         {reason}
                       </span>
                    </div>
                    {automationName && (
                      <p className="text-xs text-yellow-400/70 mt-1">⚡ Regla: {automationName}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{lead.notes}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {leadFollowUps.length > 0
                        ? `Último contacto: ${new Date(leadFollowUps[leadFollowUps.length-1].date).toLocaleDateString()}`
                        : `Creado: ${new Date(lead.createdAt).toLocaleDateString()}`
                      }
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => handleCall(lead.phone)}
                      className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded font-bold text-xs hover:bg-green-500 flex items-center justify-center gap-1"
                    >
                      <Phone size={12} /> Llamar
                    </button>
                    <button 
                      onClick={() => handleWhatsApp(lead.phone, lead.name)}
                      className="flex-1 bg-nexus-accent text-nexus-base px-3 py-1.5 rounded font-bold text-xs hover:bg-orange-400 flex items-center justify-center gap-1"
                    >
                      <MessageSquare size={12} /> WhatsApp
                    </button>
                  </div>
                </div>
              )})
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
            onUpdateFollowUpNotes={onUpdateFollowUpNotes}
          />
        )}
      </Modal>

      {/* Modal: Edit Task */}
      <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)} title="Editar Tarea">
        {editingTask && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <CalendarPlus size={20} className="text-blue-400" />
              <div>
                <p className="font-bold text-white">{editingTask.leadName}</p>
                <p className="text-xs text-gray-400">Editando tarea programada</p>
              </div>
            </div>

            {/* Method Selection */}
            <div>
              <label className="text-xs text-gray-500 block mb-2">Tipo de contacto</label>
              <div className="grid grid-cols-5 gap-2">
                {(['LLAMADA', 'WHATSAPP', 'EMAIL', 'VISITA', 'OTRO'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setTaskForm(prev => ({ ...prev, method }))}
                    className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                      taskForm.method === method
                        ? getTaskColor(method).replace('bg-', 'bg-') + '/30 border border-white/30 text-white'
                        : 'bg-nexus-surface border border-white/10 text-gray-400'
                    }`}
                  >
                    {getTaskIcon(method)}
                    <span className="text-[10px]">{method}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-2">Fecha</label>
                <input
                  type="date"
                  value={taskForm.date}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-nexus-surface border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-2">Hora</label>
                <input
                  type="time"
                  value={taskForm.time}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full bg-nexus-surface border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Alert Time */}
            <div>
              <label className="text-xs text-gray-500 block mb-2">Alertarme antes</label>
              <div className="grid grid-cols-4 gap-2">
                {ALERT_TIME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTaskForm(prev => ({ ...prev, alertMinutesBefore: option.value }))}
                    className={`p-2 rounded-lg text-xs transition-all ${
                      taskForm.alertMinutesBefore === option.value
                        ? 'bg-blue-500 text-white font-bold'
                        : 'bg-nexus-surface border border-white/10 text-gray-400 hover:border-white/30'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-gray-500 block mb-2">Nota</label>
              <input
                type="text"
                value={taskForm.notes}
                onChange={(e) => setTaskForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Nota opcional..."
                className="w-full bg-nexus-surface border border-white/10 rounded-lg p-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveTask}
                disabled={!taskForm.date || !taskForm.time}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-bold hover:bg-blue-400 transition-colors disabled:opacity-50"
              >
                Guardar Cambios
              </button>
              <button
                onClick={() => handleDeleteTask(editingTask.id)}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
              >
                Eliminar
              </button>
              <button
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 border border-white/20 text-gray-400 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
