import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, Phone, MessageSquare, Home } from 'lucide-react';

interface ScheduledTask {
    id: string;
    leadId: string;
    leadName: string;
    method: 'LLAMADA' | 'WHATSAPP' | 'EMAIL' | 'VISITA' | 'OTRO';
    scheduledDate: string;
    scheduledTime: string;
    notes: string;
    completed: boolean;
}

interface CalendarViewProps {
    isOpen: boolean;
    onClose: () => void;
}

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function CalendarView({ isOpen, onClose }: CalendarViewProps) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Get tasks from localStorage
    const tasks = useMemo(() => {
        const saved = localStorage.getItem('nexus_scheduled_tasks');
        if (!saved) return [];
        return JSON.parse(saved) as ScheduledTask[];
    }, [isOpen]); // Re-read when modal opens

    // Get tasks grouped by date
    const tasksByDate = useMemo(() => {
        const map: Record<string, ScheduledTask[]> = {};
        tasks.forEach(task => {
            if (!map[task.scheduledDate]) {
                map[task.scheduledDate] = [];
            }
            map[task.scheduledDate].push(task);
        });
        return map;
    }, [tasks]);

    // Calendar logic
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const days = useMemo(() => {
        const result = [];

        // Empty cells for days before month starts
        for (let i = 0; i < firstDayOfMonth; i++) {
            result.push(null);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            result.push(day);
        }

        return result;
    }, [currentMonth, currentYear, daysInMonth, firstDayOfMonth]);

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const getDateString = (day: number) => {
        const month = String(currentMonth + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        return `${currentYear}-${month}-${dayStr}`;
    };

    const isToday = (day: number) => {
        return day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();
    };

    const getTasksForDay = (day: number) => {
        const dateStr = getDateString(day);
        return tasksByDate[dateStr] || [];
    };

    const getMethodIcon = (method: ScheduledTask['method']) => {
        switch (method) {
            case 'LLAMADA': return <Phone size={12} className="text-green-400" />;
            case 'WHATSAPP': return <MessageSquare size={12} className="text-green-400" />;
            case 'VISITA': return <Home size={12} className="text-purple-400" />;
            default: return <Clock size={12} className="text-gray-400" />;
        }
    };

    const selectedDayTasks = selectedDate ? (tasksByDate[selectedDate] || []) : [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-nexus-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/10">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        📅 Calendario de Citas
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-4">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={prevMonth}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <ChevronLeft size={20} className="text-white" />
                        </button>
                        <h3 className="text-lg font-bold text-white">
                            {MONTHS[currentMonth]} {currentYear}
                        </h3>
                        <button
                            onClick={nextMonth}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <ChevronRight size={20} className="text-white" />
                        </button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAYS.map(day => (
                            <div key={day} className="text-center text-xs text-gray-500 font-medium py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, index) => {
                            if (day === null) {
                                return <div key={`empty-${index}`} className="h-16" />;
                            }

                            const dateStr = getDateString(day);
                            const dayTasks = getTasksForDay(day);
                            const isSelected = selectedDate === dateStr;
                            const hasTasks = dayTasks.length > 0;
                            const hasCompletedOnly = hasTasks && dayTasks.every(t => t.completed);
                            const hasIncomplete = hasTasks && dayTasks.some(t => !t.completed);

                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                                    className={`h-16 rounded-lg border transition-all relative ${isSelected
                                        ? 'bg-nexus-accent/20 border-nexus-accent'
                                        : isToday(day)
                                            ? 'bg-blue-500/20 border-blue-500/50'
                                            : 'bg-nexus-base border-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <span className={`text-sm font-medium ${isToday(day) ? 'text-blue-400' : 'text-white'
                                        }`}>
                                        {day}
                                    </span>

                                    {/* Task indicators */}
                                    {hasTasks && (
                                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                            {hasIncomplete && (
                                                <div className="w-2 h-2 rounded-full bg-nexus-accent" />
                                            )}
                                            {hasCompletedOnly && (
                                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                            )}
                                            {dayTasks.length > 1 && (
                                                <span className="text-[10px] text-gray-400 ml-1">
                                                    +{dayTasks.length - 1}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Selected Day Tasks */}
                    {selectedDate && (
                        <div className="mt-4 border-t border-white/10 pt-4">
                            <h4 className="text-sm font-bold text-white mb-3">
                                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-DO', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                })}
                            </h4>

                            {selectedDayTasks.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">
                                    No hay citas programadas para este día
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {selectedDayTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className={`p-3 rounded-lg border ${task.completed
                                                ? 'bg-green-500/10 border-green-500/20'
                                                : 'bg-nexus-base border-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {getMethodIcon(task.method)}
                                                <span className={`font-medium ${task.completed ? 'text-green-400 line-through' : 'text-white'
                                                    }`}>
                                                    {task.leadName}
                                                </span>
                                                <span className="text-xs text-gray-500 ml-auto">
                                                    {task.scheduledTime}
                                                </span>
                                            </div>
                                            {task.notes && (
                                                <p className="text-xs text-gray-400 mt-1 truncate">
                                                    {task.notes}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
