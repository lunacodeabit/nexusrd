import React, { useState, useEffect } from 'react';
import { 
  Phone, MessageSquare, Mail, MapPin, MoreHorizontal,
  Plus, CheckCircle2, Clock, AlertCircle,
  TrendingUp, CalendarPlus, Bell, X, Pencil, Check
} from 'lucide-react';
import type { Lead } from '../types';
import type { LeadFollowUp } from '../types/activities';
import { notificationSound } from '../services/notificationSound';
import { getUserProfile, sendWhatsAppAlert } from '../services/userProfile';

// Alert time options in minutes
const ALERT_TIME_OPTIONS = [
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 120, label: '2 horas antes' },
];

// Scheduled Task Interface
interface ScheduledTask {
  id: string;
  leadId: string;
  leadName: string;
  method: LeadFollowUp['method'];
  scheduledDate: string;
  scheduledTime: string;
  notes: string;
  completed: boolean;
  alertMinutesBefore: number; // Minutes before to send alert
  alertSent: boolean; // Track if alert was already sent
}

interface LeadFollowUpTrackerProps {
  lead: Lead;
  followUps: LeadFollowUp[];
  onAddFollowUp: (followUp: Omit<LeadFollowUp, 'id'>) => void;
  onUpdateFollowUpNotes?: (followUpId: string, notes: string) => void;
}

// Helper function to format time to 12-hour format with AM/PM
const formatTime12h = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const LeadFollowUpTracker: React.FC<LeadFollowUpTrackerProps> = ({ 
  lead, 
  followUps,
  onAddFollowUp,
  onUpdateFollowUpNotes
}) => {
  const [isAddingFollowUp, setIsAddingFollowUp] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [editingFollowUpId, setEditingFollowUpId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>(() => {
    const saved = localStorage.getItem('nexus_scheduled_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [newFollowUp, setNewFollowUp] = useState({
    method: 'WHATSAPP' as LeadFollowUp['method'],
    notes: '',
    response: 'PENDIENTE' as LeadFollowUp['response']
  });
  const [scheduledTask, setScheduledTask] = useState({
    method: 'LLAMADA' as LeadFollowUp['method'],
    date: '',
    time: '',
    notes: '',
    alertMinutesBefore: 15
  });
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);

  // Save scheduled tasks to localStorage
  useEffect(() => {
    localStorage.setItem('nexus_scheduled_tasks', JSON.stringify(scheduledTasks));
  }, [scheduledTasks]);

  // Check for reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const userProfile = getUserProfile();
      
      scheduledTasks.forEach(task => {
        if (task.completed || task.alertSent) return;
        
        const taskDateTime = new Date(`${task.scheduledDate}T${task.scheduledTime}`);
        const diffMinutes = (taskDateTime.getTime() - now.getTime()) / (1000 * 60);
        const alertTime = task.alertMinutesBefore || 15;
        
        // Check if it's time to send alert (within 1 minute of alert time)
        if (diffMinutes > 0 && diffMinutes <= alertTime && diffMinutes >= alertTime - 1) {
          // Play sound alert
          if (userProfile.enableSoundAlerts) {
            notificationSound.playNotification();
          }
          
          // Browser notification
          if (userProfile.enableBrowserNotifications && Notification.permission === 'granted') {
            new Notification(`⏰ Recordatorio: ${task.method}`, {
              body: `${task.leadName} - ${task.notes || 'Seguimiento programado'} (en ${alertTime} min)`,
              icon: '/icons/icon-192x192.png'
            });
          }
          
          // WhatsApp alert
          if (userProfile.enableWhatsAppAlerts && userProfile.whatsappNumber) {
            sendWhatsAppAlert(
              userProfile.whatsappNumber,
              task.method,
              task.leadName,
              task.notes,
              alertTime
            );
          }
          
          // Mark alert as sent
          setScheduledTasks(prev => 
            prev.map(t => t.id === task.id ? { ...t, alertSent: true } : t)
          );
        }
      });
    };

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Check immediately on mount
    return () => clearInterval(interval);
  }, [scheduledTasks]);

  // Get follow-ups for this lead
  const leadFollowUps = followUps
    .filter(f => f.leadId === lead.id)
    .sort((a, b) => a.followUpNumber - b.followUpNumber);

  const leadScheduledTasks = scheduledTasks
    .filter(t => t.leadId === lead.id && !t.completed)
    .sort((a, b) => new Date(`${a.scheduledDate}T${a.scheduledTime}`).getTime() - new Date(`${b.scheduledDate}T${b.scheduledTime}`).getTime());

  const currentFollowUpNumber = leadFollowUps.length;
  const nextFollowUpNumber = currentFollowUpNumber + 1;

  const handleSubmitFollowUp = () => {
    notificationSound.playNotification();
    
    onAddFollowUp({
      leadId: lead.id,
      followUpNumber: nextFollowUpNumber,
      date: new Date().toISOString(),
      method: newFollowUp.method,
      notes: newFollowUp.notes,
      response: newFollowUp.response
    });
    setNewFollowUp({ method: 'WHATSAPP', notes: '', response: 'PENDIENTE' });
    setIsAddingFollowUp(false);
  };

  const handleScheduleTask = () => {
    if (!scheduledTask.date || !scheduledTask.time) return;
    
    const newTask: ScheduledTask = {
      id: `task-${Date.now()}`,
      leadId: lead.id,
      leadName: lead.name,
      method: scheduledTask.method,
      scheduledDate: scheduledTask.date,
      scheduledTime: scheduledTask.time,
      notes: scheduledTask.notes,
      completed: false,
      alertMinutesBefore: scheduledTask.alertMinutesBefore,
      alertSent: false
    };
    
    setScheduledTasks(prev => [...prev, newTask]);
    setScheduledTask({ method: 'LLAMADA', date: '', time: '', notes: '', alertMinutesBefore: 15 });
    setIsScheduling(false);
    notificationSound.playSuccess();
  };

  const handleCompleteTask = (taskId: string) => {
    setScheduledTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: true } : t
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    setScheduledTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleEditTask = (task: ScheduledTask) => {
    setEditingTask(task);
    setScheduledTask({
      method: task.method,
      date: task.scheduledDate,
      time: task.scheduledTime,
      notes: task.notes,
      alertMinutesBefore: task.alertMinutesBefore
    });
    setIsScheduling(true);
  };

  const handleSaveEditTask = () => {
    if (!editingTask || !scheduledTask.date || !scheduledTask.time) return;
    
    setScheduledTasks(prev => prev.map(t => 
      t.id === editingTask.id 
        ? {
            ...t,
            method: scheduledTask.method,
            scheduledDate: scheduledTask.date,
            scheduledTime: scheduledTask.time,
            notes: scheduledTask.notes,
            alertMinutesBefore: scheduledTask.alertMinutesBefore,
            alertSent: false // Reset alert if time changed
          }
        : t
    ));
    setEditingTask(null);
    setScheduledTask({ method: 'LLAMADA', date: '', time: '', notes: '', alertMinutesBefore: 15 });
    setIsScheduling(false);
    notificationSound.playSuccess();
  };

  const handleCancelScheduling = () => {
    setEditingTask(null);
    setScheduledTask({ method: 'LLAMADA', date: '', time: '', notes: '', alertMinutesBefore: 15 });
    setIsScheduling(false);
  };

  const getMethodIcon = (method: LeadFollowUp['method']) => {
    switch (method) {
      case 'LLAMADA': return <Phone size={14} />;
      case 'WHATSAPP': return <MessageSquare size={14} />;
      case 'EMAIL': return <Mail size={14} />;
      case 'VISITA': return <MapPin size={14} />;
      default: return <MoreHorizontal size={14} />;
    }
  };

  const getMethodColor = (method: LeadFollowUp['method']) => {
    switch (method) {
      case 'LLAMADA': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'WHATSAPP': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'EMAIL': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'VISITA': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getResponseIcon = (response?: LeadFollowUp['response']) => {
    switch (response) {
      case 'POSITIVA': return <CheckCircle2 size={14} className="text-green-400" />;
      case 'NEGATIVA': return <AlertCircle size={14} className="text-red-400" />;
      case 'SIN_RESPUESTA': return <Clock size={14} className="text-yellow-400" />;
      default: return <Clock size={14} className="text-gray-400" />;
    }
  };

  const getResponseLabel = (response?: LeadFollowUp['response']) => {
    switch (response) {
      case 'POSITIVA': return 'Positiva';
      case 'NEGATIVA': return 'Negativa';
      case 'SIN_RESPUESTA': return 'Sin Respuesta';
      default: return 'Pendiente';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-nexus-accent" />
          <span className="font-bold text-white">Seguimientos</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Actual:</span>
          <span className="px-2 py-1 bg-nexus-accent/20 text-nexus-accent rounded font-bold text-sm">
            S{currentFollowUpNumber}
          </span>
          <span className="text-gray-500">/ S12</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="flex justify-between mb-2">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
            <div
              key={num}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                num <= currentFollowUpNumber
                  ? 'bg-nexus-accent text-nexus-base'
                  : num === nextFollowUpNumber
                  ? 'bg-nexus-accent/30 text-nexus-accent border-2 border-nexus-accent border-dashed'
                  : 'bg-gray-700 text-gray-500'
              }`}
            >
              {num}
            </div>
          ))}
        </div>
        <div className="h-1 bg-gray-700 rounded-full">
          <div 
            className="h-full bg-nexus-accent rounded-full transition-all duration-500"
            style={{ width: `${(currentFollowUpNumber / 12) * 100}%` }}
          />
        </div>
      </div>

      {/* Follow-up History */}
      {leadFollowUps.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {leadFollowUps.map((followUp) => (
            <div 
              key={followUp.id}
              className="p-3 bg-nexus-base rounded-lg border border-white/5"
            >
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded ${getMethodColor(followUp.method)}`}>
                  {getMethodIcon(followUp.method)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">S{followUp.followUpNumber}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(followUp.date).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <div className="flex items-center gap-1 ml-auto">
                      {getResponseIcon(followUp.response)}
                      <span className="text-xs text-gray-400">{getResponseLabel(followUp.response)}</span>
                    </div>
                  </div>
                  
                  {/* Notes Section - Editable */}
                  {editingFollowUpId === followUp.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={editingNotes}
                        onChange={(e) => setEditingNotes(e.target.value)}
                        className="w-full bg-nexus-surface border border-nexus-accent/50 rounded p-2 text-sm text-white placeholder-gray-500 focus:outline-none resize-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (onUpdateFollowUpNotes) {
                              onUpdateFollowUpNotes(followUp.id, editingNotes);
                            }
                            setEditingFollowUpId(null);
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30"
                        >
                          <Check size={12} />
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingFollowUpId(null)}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs hover:bg-gray-500/30"
                        >
                          <X size={12} />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 group">
                      {followUp.notes ? (
                        <div className="flex items-start gap-2">
                          <p className="text-xs text-gray-300 flex-1 whitespace-pre-wrap">{followUp.notes}</p>
                          {onUpdateFollowUpNotes && (
                            <button
                              onClick={() => {
                                setEditingFollowUpId(followUp.id);
                                setEditingNotes(followUp.notes || '');
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-nexus-accent transition-all"
                              title="Editar nota"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>
                      ) : onUpdateFollowUpNotes && (
                        <button
                          onClick={() => {
                            setEditingFollowUpId(followUp.id);
                            setEditingNotes('');
                          }}
                          className="text-xs text-gray-500 hover:text-nexus-accent flex items-center gap-1"
                        >
                          <Plus size={12} />
                          Agregar nota
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Follow-up Form */}
      {isAddingFollowUp ? (
        <div className="bg-nexus-base rounded-lg p-4 border border-nexus-accent/30 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Plus size={16} className="text-nexus-accent" />
            <span className="font-bold text-white">Registrar S{nextFollowUpNumber}</span>
          </div>

          {/* Method Selection */}
          <div>
            <label className="text-xs text-gray-500 block mb-2">Método de contacto</label>
            <div className="grid grid-cols-5 gap-2">
              {(['LLAMADA', 'WHATSAPP', 'EMAIL', 'VISITA', 'OTRO'] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setNewFollowUp(prev => ({ ...prev, method }))}
                  className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                    newFollowUp.method === method
                      ? getMethodColor(method)
                      : 'bg-nexus-surface border border-white/10 text-gray-400'
                  }`}
                >
                  {getMethodIcon(method)}
                  <span className="text-[10px]">{method}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Response */}
          <div>
            <label className="text-xs text-gray-500 block mb-2">Respuesta</label>
            <div className="grid grid-cols-4 gap-2">
              {(['POSITIVA', 'NEGATIVA', 'SIN_RESPUESTA', 'PENDIENTE'] as const).map((response) => (
                <button
                  key={response}
                  onClick={() => setNewFollowUp(prev => ({ ...prev, response }))}
                  className={`p-2 rounded-lg flex items-center justify-center gap-1 text-xs transition-all ${
                    newFollowUp.response === response
                      ? response === 'POSITIVA' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : response === 'NEGATIVA' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : response === 'SIN_RESPUESTA' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      : 'bg-nexus-surface border border-white/10 text-gray-400'
                  }`}
                >
                  {getResponseIcon(response)}
                  <span className="hidden md:inline">{getResponseLabel(response)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-gray-500 block mb-2">Notas (opcional)</label>
            <textarea
              value={newFollowUp.notes}
              onChange={(e) => setNewFollowUp(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="¿Qué se habló? ¿Próximos pasos?"
              className="w-full bg-nexus-surface border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-nexus-accent resize-none"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSubmitFollowUp}
              className="flex-1 bg-nexus-accent text-nexus-base py-2 rounded-lg font-bold hover:opacity-90 transition-opacity"
            >
              Guardar S{nextFollowUpNumber}
            </button>
            <button
              onClick={() => setIsAddingFollowUp(false)}
              className="px-4 py-2 border border-white/20 text-gray-400 rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingFollowUp(true)}
          disabled={currentFollowUpNumber >= 12}
          className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg font-bold transition-all ${
            currentFollowUpNumber >= 12
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-nexus-accent to-orange-400 text-nexus-base hover:opacity-90'
          }`}
        >
          <Plus size={18} />
          {currentFollowUpNumber >= 12 
            ? 'Máximo de seguimientos alcanzado' 
            : `Registrar Seguimiento S${nextFollowUpNumber}`
          }
        </button>
      )}

      {/* Stats */}
      {leadFollowUps.length > 0 && (
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
          <div className="text-center">
            <p className="text-lg font-bold text-green-400">
              {leadFollowUps.filter(f => f.response === 'POSITIVA').length}
            </p>
            <p className="text-xs text-gray-500">Positivas</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-yellow-400">
              {leadFollowUps.filter(f => f.response === 'SIN_RESPUESTA').length}
            </p>
            <p className="text-xs text-gray-500">Sin Resp.</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-red-400">
              {leadFollowUps.filter(f => f.response === 'NEGATIVA').length}
            </p>
            <p className="text-xs text-gray-500">Negativas</p>
          </div>
        </div>
      )}

      {/* Scheduled Tasks Section */}
      <div className="border-t border-white/10 pt-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-yellow-400" />
            <span className="font-bold text-white text-sm">Tareas Programadas</span>
          </div>
          <button
            onClick={() => setIsScheduling(true)}
            className="flex items-center gap-1 text-xs text-nexus-accent hover:text-orange-400 transition-colors"
          >
            <CalendarPlus size={14} />
            Programar
          </button>
        </div>

        {/* Scheduled Tasks List */}
        {leadScheduledTasks.length > 0 ? (
          <div className="space-y-2 mb-3">
            {leadScheduledTasks.map((task) => {
              const taskDate = new Date(`${task.scheduledDate}T${task.scheduledTime}`);
              const isPast = taskDate < new Date();
              const isToday = task.scheduledDate === new Date().toISOString().split('T')[0];
              
              return (
                <div 
                  key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    isPast ? 'bg-red-500/10 border-red-500/30' :
                    isToday ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-nexus-base border-white/10'
                  }`}
                >
                  <div className={`p-1.5 rounded ${getMethodColor(task.method)}`}>
                    {getMethodIcon(task.method)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{task.method}</span>
                      {isPast && <span className="text-xs text-red-400">¡Vencido!</span>}
                      {isToday && !isPast && <span className="text-xs text-yellow-400">Hoy</span>}
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(task.scheduledDate).toLocaleDateString('es-ES')} a las {formatTime12h(task.scheduledTime)}
                    </p>
                    {task.notes && <p className="text-xs text-gray-500 truncate">{task.notes}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                      title="Editar tarea"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className="p-1.5 text-green-400 hover:bg-green-500/20 rounded transition-colors"
                      title="Marcar como completado"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                      title="Eliminar"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-500 text-center py-2">No hay tareas programadas</p>
        )}

        {/* Schedule Task Form */}
        {isScheduling && (
          <div className={`bg-nexus-base rounded-lg p-4 border ${editingTask ? 'border-blue-500/30' : 'border-yellow-500/30'} space-y-3 mt-3`}>
            <div className="flex items-center gap-2 mb-3">
              {editingTask ? (
                <>
                  <Pencil size={16} className="text-blue-400" />
                  <span className="font-bold text-white">Editar Tarea</span>
                </>
              ) : (
                <>
                  <CalendarPlus size={16} className="text-yellow-400" />
                  <span className="font-bold text-white">Programar Tarea</span>
                </>
              )}
            </div>

            {/* Method Selection */}
            <div>
              <label className="text-xs text-gray-500 block mb-2">Tipo de contacto</label>
              <div className="grid grid-cols-5 gap-2">
                {(['LLAMADA', 'WHATSAPP', 'EMAIL', 'VISITA', 'OTRO'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setScheduledTask(prev => ({ ...prev, method }))}
                    className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                      scheduledTask.method === method
                        ? getMethodColor(method)
                        : 'bg-nexus-surface border border-white/10 text-gray-400'
                    }`}
                  >
                    {getMethodIcon(method)}
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
                  value={scheduledTask.date}
                  onChange={(e) => setScheduledTask(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-nexus-surface border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-nexus-accent [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-2">Hora</label>
                <input
                  type="time"
                  value={scheduledTask.time}
                  onChange={(e) => setScheduledTask(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full bg-nexus-surface border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-nexus-accent [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Alert Time Selector */}
            <div>
              <label className="text-xs text-gray-500 block mb-2">⏰ Alertarme</label>
              <div className="grid grid-cols-4 gap-2">
                {ALERT_TIME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setScheduledTask(prev => ({ ...prev, alertMinutesBefore: option.value }))}
                    className={`p-2 rounded-lg text-xs transition-all ${
                      scheduledTask.alertMinutesBefore === option.value
                        ? 'bg-nexus-accent text-nexus-base font-bold'
                        : 'bg-nexus-surface border border-white/10 text-gray-400 hover:border-white/30'
                    }`}
                  >
                    {option.value >= 60 ? `${option.value/60}h` : `${option.value}m`}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-600 mt-1">antes de la hora programada</p>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-gray-500 block mb-2">Nota (opcional)</label>
              <input
                type="text"
                value={scheduledTask.notes}
                onChange={(e) => setScheduledTask(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ej: Preguntar por la visita del sábado"
                className="w-full bg-nexus-surface border border-white/10 rounded-lg p-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-nexus-accent"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={editingTask ? handleSaveEditTask : handleScheduleTask}
                disabled={!scheduledTask.date || !scheduledTask.time}
                className={`flex-1 ${editingTask ? 'bg-blue-500 hover:bg-blue-400' : 'bg-yellow-500 hover:bg-yellow-400'} text-nexus-base py-2 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {editingTask ? 'Guardar Cambios' : 'Programar Recordatorio'}
              </button>
              <button
                onClick={handleCancelScheduling}
                className="px-4 py-2 border border-white/20 text-gray-400 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadFollowUpTracker;
