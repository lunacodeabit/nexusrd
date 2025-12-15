import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, Circle, Calendar, Clock, Instagram, 
  MessageSquare, Building2, BookOpen, Users,
  TrendingUp, ChevronLeft, ChevronRight, BarChart3
} from 'lucide-react';
import { 
  DAILY_TASKS, 
  getDayOfWeek, 
  formatDateKey,
  type DailyTask,
  type TaskCompletion 
} from '../types/activities';
import { notificationSound } from '../services/notificationSound';

interface DailyActivitiesProps {
  completions: TaskCompletion[];
  onToggleTask: (taskId: string, date: string, dayOfWeek: TaskCompletion['dayOfWeek']) => void;
}

const DailyActivities: React.FC<DailyActivitiesProps> = ({ completions, onToggleTask }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<DailyTask['timeSlot']>('8:00 AM');

  const dateKey = formatDateKey(selectedDate);
  const dayOfWeek = getDayOfWeek(selectedDate);

  // Get tasks for selected time slot
  const tasksForSlot = useMemo(() => {
    return DAILY_TASKS.filter(t => t.timeSlot === selectedTimeSlot);
  }, [selectedTimeSlot]);

  // Group tasks by category
  const tasksByCategory = useMemo(() => {
    const grouped: Record<string, DailyTask[]> = {};
    tasksForSlot.forEach(task => {
      if (!grouped[task.category]) {
        grouped[task.category] = [];
      }
      grouped[task.category].push(task);
    });
    return grouped;
  }, [tasksForSlot]);

  // Check if task is completed
  const isTaskCompleted = (taskId: string): boolean => {
    return completions.some(c => c.taskId === taskId && c.date === dateKey && c.completed);
  };

  // Handle task toggle with sound
  const handleToggleTask = (taskId: string) => {
    const wasCompleted = isTaskCompleted(taskId);
    if (!wasCompleted) {
      notificationSound.playClick();
    }
    onToggleTask(taskId, dateKey, dayOfWeek);
  };

  // Calculate daily progress
  const dailyProgress = useMemo(() => {
    const todayCompletions = completions.filter(c => c.date === dateKey && c.completed);
    const totalTasks = DAILY_TASKS.length;
    return {
      completed: todayCompletions.length,
      total: totalTasks,
      percentage: Math.round((todayCompletions.length / totalTasks) * 100)
    };
  }, [completions, dateKey]);

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday
    
    let totalCompleted = 0;
    let postCount = 0;
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      const dayKey = formatDateKey(day);
      
      const dayCompletions = completions.filter(c => c.date === dayKey && c.completed);
      totalCompleted += dayCompletions.length;
      
      // Count Instagram posts specifically
      postCount += dayCompletions.filter(c => c.taskId.includes('art-') && c.taskId.includes('-1')).length;
    }
    
    return { totalCompleted, postCount };
  }, [completions, selectedDate]);

  const navigateDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SUBIR_ARTES': return <Instagram size={16} />;
      case 'SUBIR_PROPIEDADES': return <Building2 size={16} />;
      case 'OTRAS_ACCIONES': return <BookOpen size={16} />;
      case 'INDICADORES': return <TrendingUp size={16} />;
      default: return <Circle size={16} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SUBIR_ARTES': return 'text-pink-400 border-pink-500/30 bg-pink-500/10';
      case 'SUBIR_PROPIEDADES': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'OTRAS_ACCIONES': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'INDICADORES': return 'text-nexus-accent border-nexus-accent/30 bg-nexus-accent/10';
      default: return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'SUBIR_ARTES': return 'SUBIR ARTES';
      case 'SUBIR_PROPIEDADES': return 'SUBIR PROPIEDADES';
      case 'OTRAS_ACCIONES': return 'OTRAS ACCIONES';
      case 'INDICADORES': return 'INDICADORES DE GESTIÓN';
      default: return category;
    }
  };

  const timeSlots: DailyTask['timeSlot'][] = ['8:00 AM', '8:30 AM', '3:00 PM', '6:00 PM'];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Actividades Diarias</h2>
          <p className="text-gray-400 text-sm">Acciones de un Asesor Altamente Productivo</p>
        </div>
        
        {/* Weekly Stats Mini */}
        <div className="flex gap-4">
          <div className="bg-nexus-surface border border-white/10 rounded-lg px-4 py-2">
            <p className="text-xs text-gray-500">Esta semana</p>
            <p className="text-lg font-bold text-nexus-accent">{weeklyStats.totalCompleted} tareas</p>
          </div>
          <div className="bg-nexus-surface border border-white/10 rounded-lg px-4 py-2">
            <p className="text-xs text-gray-500">Posts</p>
            <p className="text-lg font-bold text-pink-400">{weeklyStats.postCount} 📸</p>
          </div>
        </div>
      </div>

      {/* Date Navigator */}
      <div className="bg-nexus-surface rounded-lg p-4 border border-white/5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-400" />
          </button>
          
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center">
              <Calendar size={18} className="text-nexus-accent" />
              <span className="text-lg font-bold text-white">
                {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
            <span className="text-sm text-gray-500">{dayOfWeek}</span>
          </div>
          
          <button
            onClick={() => navigateDate(1)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Daily Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Progreso del día</span>
            <span className="text-white font-bold">{dailyProgress.completed}/{dailyProgress.total}</span>
          </div>
          <div className="h-2 bg-nexus-base rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-nexus-accent to-green-400 transition-all duration-500"
              style={{ width: `${dailyProgress.percentage}%` }}
            />
          </div>
          <p className="text-right text-xs text-gray-500 mt-1">{dailyProgress.percentage}% completado</p>
        </div>
      </div>

      {/* Time Slot Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {timeSlots.map((slot) => (
          <button
            key={slot}
            onClick={() => setSelectedTimeSlot(slot)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              selectedTimeSlot === slot
                ? 'bg-nexus-accent text-nexus-base'
                : 'bg-nexus-surface border border-white/10 text-gray-400 hover:border-white/30'
            }`}
          >
            <Clock size={16} />
            {slot}
          </button>
        ))}
      </div>

      {/* Tasks by Category */}
      <div className="space-y-4">
        {Object.entries(tasksByCategory).map(([category, tasks]) => (
          <div key={category} className="bg-nexus-surface rounded-lg border border-white/5 overflow-hidden">
            {/* Category Header */}
            <div className={`flex items-center gap-2 px-4 py-3 border-b border-white/5 ${getCategoryColor(category)}`}>
              {getCategoryIcon(category)}
              <span className="font-bold text-sm">{getCategoryLabel(category)}</span>
              <span className="ml-auto text-xs opacity-75">
                {tasks.filter(t => isTaskCompleted(t.id)).length}/{tasks.length}
              </span>
            </div>
            
            {/* Tasks List */}
            <div className="divide-y divide-white/5">
              {tasks.map((task) => {
                const completed = isTaskCompleted(task.id);
                return (
                  <button
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all ${
                      completed ? 'bg-green-500/5' : ''
                    }`}
                  >
                    {completed ? (
                      <CheckCircle2 size={20} className="text-green-400 flex-shrink-0" />
                    ) : (
                      <Circle size={20} className="text-gray-600 flex-shrink-0" />
                    )}
                    <span className={`text-left ${completed ? 'text-green-400 line-through' : 'text-gray-300'}`}>
                      {task.name}
                    </span>
                    {completed && (
                      <span className="ml-auto text-xs text-green-500">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-nexus-surface rounded-lg p-4 border border-white/5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <BarChart3 size={16} className="text-nexus-accent" />
          Resumen de Hoy
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-nexus-base rounded-lg p-3 text-center">
            <Instagram size={20} className="text-pink-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Posts</p>
            <p className="text-lg font-bold text-white">
              {completions.filter(c => c.date === dateKey && c.taskId.includes('art-') && c.taskId.endsWith('-1') && c.completed).length}
            </p>
          </div>
          <div className="bg-nexus-base rounded-lg p-3 text-center">
            <MessageSquare size={20} className="text-green-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Status WA</p>
            <p className="text-lg font-bold text-white">
              {completions.filter(c => c.date === dateKey && c.taskId.includes('-3') && c.completed).length}
            </p>
          </div>
          <div className="bg-nexus-base rounded-lg p-3 text-center">
            <Building2 size={20} className="text-blue-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Propiedades</p>
            <p className="text-lg font-bold text-white">
              {completions.filter(c => c.date === dateKey && c.taskId.startsWith('prop-') && c.completed).length}
            </p>
          </div>
          <div className="bg-nexus-base rounded-lg p-3 text-center">
            <Users size={20} className="text-nexus-accent mx-auto mb-1" />
            <p className="text-xs text-gray-500">Tarjetas</p>
            <p className="text-lg font-bold text-white">
              {completions.filter(c => c.date === dateKey && c.taskId === 'other-2' && c.completed).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyActivities;
