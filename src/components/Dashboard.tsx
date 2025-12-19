import React, { useMemo, useState } from 'react';
import type { Lead } from '../types';
import { LeadStatus } from '../types';
import { AlertTriangle, Clock, Phone, TrendingUp, Bell, X, MessageSquare, Mail, MapPin, MoreHorizontal, CheckCircle2, Pencil, CalendarPlus, Zap, Calendar } from 'lucide-react';
import Modal from './Modal';
import LeadDetail from './LeadDetail';
import DailyPlanner from './DailyPlanner';
import type { LeadScore } from '../services/leadScoring';
import type { LeadFollowUp } from '../types/activities';
import { useTodayActivity } from '../hooks/useTodayActivity';
import { useAutomations } from '../hooks/useAutomations';
import { useAutomationEngine } from '../hooks/useAutomationEngine';
import { useAppointmentMetrics } from '../hooks/useAppointmentMetrics';

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
  overdueLabel?: string; // For displaying how overdue the task is
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
  const { myMetrics } = useAppointmentMetrics();
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
      const actionType = auto.rule.action;
      if (actionType === 'show_alert' || actionType === 'notify_supervisor') {
        if (!addedLeadIds.has(auto.lead.id)) {
          alerts.push({
            lead: auto.lead,
            type: 'AUTOMATION',
            reason: auto.suggestedMessage || auto.rule.name,
            automationName: auto.rule.name
          });
          addedLeadIds.add(auto.lead.id);
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

  // Get scheduled tasks from localStorage for today - split into pending and overdue
  const { todaysPendingTasks, todaysOverdueTasks } = useMemo(() => {
    const saved = localStorage.getItem('nexus_scheduled_tasks');
    if (!saved) return { todaysPendingTasks: [], todaysOverdueTasks: [] };

    const allTasks: ScheduledTask[] = JSON.parse(saved);
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    const todayTasks = allTasks.filter(task => task.scheduledDate === today && !task.completed);

    const pending: ScheduledTask[] = [];
    const overdue: ScheduledTask[] = [];

    for (const task of todayTasks) {
      const [hours, minutes] = task.scheduledTime.split(':').map(Number);
      const taskTime = new Date(today);
      taskTime.setHours(hours, minutes, 0, 0);

      if (taskTime.getTime() < now.getTime()) {
        // Calculate overdue time
        const diffMs = now.getTime() - taskTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        let overdueLabel = '';

        if (diffMins < 60) {
          overdueLabel = `Hace ${diffMins} min`;
        } else if (diffMins < 1440) {
          const hours = Math.floor(diffMins / 60);
          overdueLabel = `Hace ${hours}h`;
        } else {
          const days = Math.floor(diffMins / 1440);
          overdueLabel = `Hace ${days} día${days > 1 ? 's' : ''}`;
        }

        overdue.push({ ...task, overdueLabel } as ScheduledTask & { overdueLabel: string });
      } else {
        pending.push(task);
      }
    }

    // Also check tasks from previous days that weren't completed
    const pastTasks = allTasks.filter(task => task.scheduledDate < today && !task.completed);
    for (const task of pastTasks) {
      const taskDate = new Date(task.scheduledDate);
      const diffDays = Math.floor((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
      const overdueLabel = diffDays === 1 ? 'Hace 1 día' : `Hace ${diffDays} días`;
      overdue.push({ ...task, overdueLabel } as ScheduledTask & { overdueLabel: string });
    }

    return {
      todaysPendingTasks: pending.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)),
      todaysOverdueTasks: overdue.sort((a, b) => {
        // Sort by date first, then by time
        if (a.scheduledDate !== b.scheduledDate) {
          return a.scheduledDate.localeCompare(b.scheduledDate);
        }
        return a.scheduledTime.localeCompare(b.scheduledTime);
      })
    };
  }, [leads, refreshKey]);

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
                {criticalAlerts.length === 0 ? (
                  <p className="p-4 text-gray-500 text-sm text-center">Sin notificaciones pendientes</p>
                ) : (
                  criticalAlerts.map((alert, idx) => (
                    <div
                      key={`notif-${alert.lead.id}-${idx}`}
                      className="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer"
                      onClick={() => { setSelectedLead(alert.lead); setShowNotifications(false); }}
                    >
                      <p className="text-sm font-medium text-white">{alert.lead.name}</p>
                      <p className="text-xs text-red-400">{alert.reason}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-nexus-surface p-4 rounded-xl border border-white/5 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Leads Activos</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 text-green-400">{leads.length}</p>
            </div>
            <TrendingUp size={20} className="text-gray-500" />
          </div>
        </div>
        <div className="bg-nexus-surface p-4 rounded-xl border border-white/5 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Alertas Rojas</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 text-red-500">{urgentAlerts.length}</p>
            </div>
            <AlertTriangle size={20} className="text-gray-500" />
          </div>
        </div>
        <div className="bg-nexus-surface p-4 rounded-xl border border-white/5 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Llamadas Hoy</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 text-blue-400">{todayActivity.calls}</p>
            </div>
            <Phone size={20} className="text-gray-500" />
          </div>
        </div>
        <div className="bg-nexus-surface p-4 rounded-xl border border-white/5 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">WhatsApp Hoy</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 text-emerald-400">{todayActivity.whatsapp}</p>
            </div>
            <MessageSquare size={20} className="text-gray-500" />
          </div>
        </div>
        <div className="bg-nexus-surface p-4 rounded-xl border border-purple-500/20 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Citas del Mes</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 text-purple-400">{myMetrics?.total_appointments || 0}</p>
              {myMetrics && (myMetrics.virtual_appointments > 0 || myMetrics.in_person_appointments > 0) && (
                <p className="text-xs text-gray-500 mt-1">🖥️ {myMetrics.virtual_appointments} | 🏠 {myMetrics.in_person_appointments}</p>
              )}
            </div>
            <Calendar size={20} className="text-purple-400" />
          </div>
        </div>
      </div>

      {/* ALERT SECTION - 3 Equal Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 1. Agenda Hoy - Pending Tasks */}
        <div className="bg-nexus-surface rounded-xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center gap-2">
            <Clock size={18} className="text-nexus-accent" />
            <h3 className="font-bold text-nexus-text">Agenda Hoy</h3>
            {(todaysPendingTasks.length + todaysTasks.length) > 0 && (
              <span className="ml-auto text-xs bg-nexus-accent/20 text-nexus-accent px-2 py-0.5 rounded-full">
                {todaysPendingTasks.length + todaysTasks.length}
              </span>
            )}
          </div>
          <div className="p-3 space-y-2 max-h-[380px] overflow-y-auto">
            {/* Visits (leads with VISIT_SCHEDULED status) */}
            {todaysTasks.map(task => (
              <div
                key={task.id}
                className="flex gap-2 items-center p-2.5 bg-nexus-base rounded-lg border border-purple-500/20 cursor-pointer hover:border-purple-500/50 transition-all"
                onClick={() => setSelectedLead(task)}
              >
                <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-purple-400 flex-shrink-0" />
                    <p className="text-sm font-medium text-white truncate">Visita: {task.name}</p>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{task.interestArea}</p>
                </div>
              </div>
            ))}

            {/* Scheduled Tasks for Today - Not yet overdue */}
            {todaysPendingTasks.map(task => (
              <div
                key={task.id}
                className="flex gap-2 items-center p-2.5 bg-nexus-base rounded-lg border border-white/5 hover:border-nexus-accent/30 transition-all group"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getTaskColor(task.method)}`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getTaskIcon(task.method)}
                    <p className="text-sm font-medium text-white truncate">{task.leadName}</p>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {task.scheduledTime} {task.notes && `• ${task.notes}`}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditTask(task)}
                    className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white"
                    title="Editar"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white"
                    title="Completar"
                  >
                    <CheckCircle2 size={12} />
                  </button>
                </div>
              </div>
            ))}

            {/* Empty state */}
            {todaysPendingTasks.length === 0 && todaysTasks.length === 0 && (
              <div className="text-center py-6">
                <Clock size={24} className="text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Sin tareas pendientes hoy</p>
              </div>
            )}

            {/* Personal Tasks Section - Planner */}
            <div className="border-t border-white/10 pt-3 mt-3">
              <DailyPlanner compact />
            </div>
          </div>
        </div>

        {/* 2. Acciones Vencidas - Overdue Tasks */}
        <div className="bg-nexus-surface rounded-xl border border-amber-900/30 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-amber-900/10">
            <AlertTriangle size={18} className="text-amber-500" />
            <h3 className="font-bold text-amber-100">Acciones Vencidas</h3>
            {todaysOverdueTasks.length > 0 && (
              <span className="ml-auto text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                {todaysOverdueTasks.length}
              </span>
            )}
          </div>
          <div className="p-3 space-y-2 max-h-[380px] overflow-y-auto">
            {todaysOverdueTasks.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 size={24} className="text-green-500/50 mx-auto mb-2" />
                <p className="text-sm text-gray-500">¡Al día! Sin tareas vencidas</p>
              </div>
            ) : (
              todaysOverdueTasks.map(task => {
                // Find the lead associated with this task
                const taskLead = leads.find(l => l.id === task.leadId);
                return (
                  <div
                    key={task.id}
                    className="p-2.5 bg-amber-950/30 rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition-all group"
                  >
                    <div
                      className="flex gap-2 items-start cursor-pointer"
                      onClick={() => taskLead && setSelectedLead(taskLead)}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${getTaskColor(task.method)}`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getTaskIcon(task.method)}
                          <p className="text-sm font-medium text-white truncate hover:text-amber-400">{task.leadName}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                            {task.overdueLabel}
                          </span>
                          <span className="text-xs text-gray-500">
                            Era: {task.scheduledTime}
                          </span>
                        </div>
                        {task.notes && (
                          <p className="text-xs text-gray-400 mt-1 truncate">{task.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}
                        className="flex-1 p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white text-xs font-medium"
                      >
                        Reprogramar
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCompleteTask(task.id); }}
                        className="flex-1 p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white text-xs font-medium"
                      >
                        Completar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. Acciones Críticas - Leads sin contactar */}
        <div className="bg-nexus-surface rounded-xl border border-red-900/30 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-red-900/10">
            <AlertTriangle size={18} className="text-red-500" />
            <h3 className="font-bold text-red-100">Acciones Críticas</h3>
            {criticalAlerts.length > 0 && (
              <span className="ml-auto text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                {criticalAlerts.length}
              </span>
            )}
          </div>
          <div className="p-0 max-h-[380px] overflow-y-auto">
            {criticalAlerts.length === 0 ? (
              <div className="p-6 text-center">
                <CheckCircle2 size={24} className="text-green-500/50 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Todo al día. ¡Buen trabajo!</p>
              </div>
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
                        <span className="font-bold text-white text-sm truncate">{lead.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border flex items-center gap-1 ${type === 'AUTOMATION'
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
                          ? `Último contacto: ${new Date(leadFollowUps[leadFollowUps.length - 1].date).toLocaleDateString()}`
                          : `Creado: ${new Date(lead.createdAt).toLocaleDateString()}`
                        }
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleCall(lead.phone)}
                        className="flex-1 bg-green-600 text-white px-2 py-1.5 rounded font-bold text-xs hover:bg-green-500 flex items-center justify-center gap-1"
                      >
                        <Phone size={12} /> Llamar
                      </button>
                      <button
                        onClick={() => handleWhatsApp(lead.phone, lead.name)}
                        className="flex-1 bg-nexus-accent text-nexus-base px-2 py-1.5 rounded font-bold text-xs hover:bg-orange-400 flex items-center justify-center gap-1"
                      >
                        <MessageSquare size={12} /> WhatsApp
                      </button>
                    </div>
                  </div>
                )
              })
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
                    className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${taskForm.method === method
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
                    className={`p-2 rounded-lg text-xs transition-all ${taskForm.alertMinutesBefore === option.value
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
