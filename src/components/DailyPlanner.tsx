import React, { useState } from 'react';
import { 
  Plus, Clock, CheckCircle2, Trash2, Edit3, X,
  Calendar, Bell, Repeat, ChevronDown, ChevronUp,
  Briefcase, User, Users, Settings, MoreHorizontal
} from 'lucide-react';
import { usePersonalTasks } from '../hooks/usePersonalTasks';
import type { PersonalTask, TaskCategory, TaskPriority, TaskFormData } from '../types';

interface DailyPlannerProps {
  compact?: boolean;
}

const CATEGORY_CONFIG: Record<TaskCategory, { label: string; icon: React.ReactNode; color: string }> = {
  personal: { label: 'Personal', icon: <User size={14} />, color: 'text-blue-400 bg-blue-500/20' },
  trabajo: { label: 'Trabajo', icon: <Briefcase size={14} />, color: 'text-purple-400 bg-purple-500/20' },
  cliente: { label: 'Cliente', icon: <Users size={14} />, color: 'text-green-400 bg-green-500/20' },
  admin: { label: 'Admin', icon: <Settings size={14} />, color: 'text-orange-400 bg-orange-500/20' },
  otro: { label: 'Otro', icon: <MoreHorizontal size={14} />, color: 'text-gray-400 bg-gray-500/20' },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  alta: { label: '🔴 Alta', color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/30' },
  media: { label: '🟡 Media', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20 border-yellow-500/30' },
  baja: { label: '🟢 Baja', color: 'text-green-400', bgColor: 'bg-green-500/20 border-green-500/30' },
};

const ALERT_OPTIONS = [
  { value: 0, label: 'Sin alerta' },
  { value: 5, label: '5 minutos' },
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
  { value: 120, label: '2 horas' },
];

const DailyPlanner: React.FC<DailyPlannerProps> = ({ compact: _compact = false }) => {
  const { todaysTasks, upcomingTasks, addTask, toggleComplete, deleteTask, updateTask } = usePersonalTasks();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    category: 'trabajo',
    priority: 'media',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '',
    duration_minutes: 30,
    alert_minutes_before: 15,
    is_recurring: false,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'trabajo',
      priority: 'media',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '',
      duration_minutes: 30,
      alert_minutes_before: 15,
      is_recurring: false,
    });
    setEditingTask(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingTask) {
      await updateTask(editingTask.id, {
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category,
        priority: formData.priority,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time || undefined,
        duration_minutes: formData.duration_minutes || undefined,
        alert_minutes_before: formData.alert_minutes_before || undefined,
        is_recurring: formData.is_recurring,
        recurrence_pattern: formData.recurrence_pattern,
      });
    } else {
      await addTask(formData);
    }

    resetForm();
    setIsFormOpen(false);
  };

  const handleEdit = (task: PersonalTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      category: task.category,
      priority: task.priority,
      scheduled_date: task.scheduled_date,
      scheduled_time: task.scheduled_time || '',
      duration_minutes: task.duration_minutes || 30,
      alert_minutes_before: task.alert_minutes_before || 15,
      is_recurring: task.is_recurring,
      recurrence_pattern: task.recurrence_pattern,
    });
    setIsFormOpen(true);
  };

  const formatTime = (time?: string) => {
    if (!time) return 'Sin hora';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const TaskItem: React.FC<{ task: PersonalTask; showDate?: boolean }> = ({ task, showDate }) => {
    const category = CATEGORY_CONFIG[task.category];
    const priority = PRIORITY_CONFIG[task.priority];

    return (
      <div 
        className={`group flex items-start gap-3 p-3 rounded-lg border transition-all ${
          task.is_completed 
            ? 'bg-white/5 border-white/5 opacity-60' 
            : `${priority.bgColor} hover:border-white/20`
        }`}
      >
        {/* Checkbox */}
        <button
          onClick={() => toggleComplete(task.id)}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            task.is_completed 
              ? 'bg-green-500 border-green-500' 
              : 'border-white/30 hover:border-green-400'
          }`}
        >
          {task.is_completed && <CheckCircle2 size={12} className="text-white" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-medium ${task.is_completed ? 'line-through text-gray-500' : 'text-white'}`}>
              {task.title}
            </p>
            <span className={`px-1.5 py-0.5 rounded text-xs flex items-center gap-1 ${category.color}`}>
              {category.icon} {category.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            {task.scheduled_time && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> {formatTime(task.scheduled_time)}
              </span>
            )}
            {showDate && (
              <span className="flex items-center gap-1">
                <Calendar size={12} /> {new Date(task.scheduled_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
              </span>
            )}
            {task.alert_minutes_before && task.alert_minutes_before > 0 && (
              <span className="flex items-center gap-1">
                <Bell size={12} /> {task.alert_minutes_before}m
              </span>
            )}
            {task.is_recurring && (
              <span className="flex items-center gap-1 text-purple-400">
                <Repeat size={12} /> Recurrente
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleEdit(task)}
            className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white"
            title="Editar"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-nexus-accent" />
          <h3 className="font-bold text-white">Mi Planner</h3>
          <span className="px-2 py-0.5 bg-nexus-accent/20 text-nexus-accent text-xs rounded-full">
            {todaysTasks.length} hoy
          </span>
        </div>
        <button
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="flex items-center gap-1 px-3 py-1.5 bg-nexus-accent text-nexus-base text-sm font-bold rounded-lg hover:bg-orange-400 transition-colors"
        >
          <Plus size={16} />
          Nueva Tarea
        </button>
      </div>

      {/* Today's Tasks */}
      {todaysTasks.length > 0 ? (
        <div className="space-y-2">
          {todaysTasks.map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No hay tareas para hoy</p>
          <button
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="text-nexus-accent hover:underline text-sm mt-1"
          >
            Agregar una tarea
          </button>
        </div>
      )}

      {/* Upcoming Tasks Toggle */}
      {upcomingTasks.length > 0 && (
        <div className="border-t border-white/10 pt-3">
          <button
            onClick={() => setShowUpcoming(!showUpcoming)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full"
          >
            {showUpcoming ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Próximos 7 días ({upcomingTasks.length})
          </button>
          {showUpcoming && (
            <div className="space-y-2 mt-3">
              {upcomingTasks.map(task => (
                <TaskItem key={task.id} task={task} showDate />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Task Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-nexus-surface rounded-xl border border-white/10 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white">
                {editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
              </h3>
              <button
                onClick={() => { setIsFormOpen(false); resetForm(); }}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Título *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-nexus-base border border-white/10 rounded-lg text-white focus:border-nexus-accent focus:outline-none"
                  placeholder="¿Qué necesitas hacer?"
                  autoFocus
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-nexus-base border border-white/10 rounded-lg text-white focus:border-nexus-accent focus:outline-none resize-none"
                  placeholder="Detalles adicionales..."
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as TaskCategory })}
                    className="w-full px-3 py-2 bg-nexus-base border border-white/10 rounded-lg text-white focus:border-nexus-accent focus:outline-none"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Prioridad</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full px-3 py-2 bg-nexus-base border border-white/10 rounded-lg text-white focus:border-nexus-accent focus:outline-none"
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fecha *</label>
                  <input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 bg-nexus-base border border-white/10 rounded-lg text-white focus:border-nexus-accent focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Hora</label>
                  <input
                    type="time"
                    value={formData.scheduled_time}
                    onChange={e => setFormData({ ...formData, scheduled_time: e.target.value })}
                    className="w-full px-3 py-2 bg-nexus-base border border-white/10 rounded-lg text-white focus:border-nexus-accent focus:outline-none"
                  />
                </div>
              </div>

              {/* Alert */}
              <div>
                <label className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  <Bell size={14} /> Recordatorio
                </label>
                <select
                  value={formData.alert_minutes_before}
                  onChange={e => setFormData({ ...formData, alert_minutes_before: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-nexus-base border border-white/10 rounded-lg text-white focus:border-nexus-accent focus:outline-none"
                >
                  {ALERT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Recurring Toggle */}
              <div className="flex items-center gap-3 p-3 bg-nexus-base rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_recurring: !formData.is_recurring })}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center ${
                    formData.is_recurring ? 'bg-nexus-accent justify-end' : 'bg-white/20 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full mx-1" />
                </button>
                <div>
                  <p className="text-sm text-white">Tarea recurrente</p>
                  <p className="text-xs text-gray-400">Se repetirá automáticamente</p>
                </div>
              </div>

              {formData.is_recurring && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Repetir</label>
                  <select
                    value={formData.recurrence_pattern || 'daily'}
                    onChange={e => setFormData({ ...formData, recurrence_pattern: e.target.value as any })}
                    className="w-full px-3 py-2 bg-nexus-base border border-white/10 rounded-lg text-white focus:border-nexus-accent focus:outline-none"
                  >
                    <option value="daily">Diariamente</option>
                    <option value="weekly">Semanalmente</option>
                    <option value="monthly">Mensualmente</option>
                  </select>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-nexus-accent text-nexus-base font-bold rounded-lg hover:bg-orange-400 transition-colors"
                >
                  {editingTask ? 'Guardar Cambios' : 'Crear Tarea'}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); resetForm(); }}
                  className="px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyPlanner;
