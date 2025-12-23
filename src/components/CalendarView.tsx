import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, Phone, MessageSquare, Home, Plus, Check, Trash2, Edit3 } from 'lucide-react';
import { useAppointments } from '../hooks/useAppointments';
import type { Appointment } from '../services/appointmentService';

// ScheduledTask type uses Appointment from service
type ScheduledTask = Appointment;

interface CalendarViewProps {
    isOpen: boolean;
    onClose: () => void;
}

interface AppointmentFormData {
    lead_name: string;
    method: 'LLAMADA' | 'WHATSAPP' | 'VISITA';
    scheduled_date: string;
    scheduled_time: string;
    notes: string;
    appointment_type: 'virtual' | 'in_person';
}

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const emptyForm: AppointmentFormData = {
    lead_name: '',
    method: 'LLAMADA',
    scheduled_date: '',
    scheduled_time: '09:00',
    notes: '',
    appointment_type: 'virtual'
};

export default function CalendarView({ isOpen, onClose }: CalendarViewProps) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<AppointmentFormData>(emptyForm);

    // Get tasks from Supabase via hook
    const { appointments, create, update, remove, complete } = useAppointments();

    // Get tasks grouped by date
    const tasksByDate = useMemo(() => {
        const map: Record<string, ScheduledTask[]> = {};
        appointments.forEach(task => {
            if (!map[task.scheduled_date]) {
                map[task.scheduled_date] = [];
            }
            map[task.scheduled_date].push(task);
        });
        return map;
    }, [appointments]);

    // Calendar logic
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const days = useMemo(() => {
        const result = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            result.push(null);
        }
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

    // Form handlers
    const handleOpenForm = (date?: string, appointment?: ScheduledTask) => {
        if (appointment) {
            setEditingId(appointment.id);
            setFormData({
                lead_name: appointment.lead_name,
                method: appointment.method as 'LLAMADA' | 'WHATSAPP' | 'VISITA',
                scheduled_date: appointment.scheduled_date,
                scheduled_time: appointment.scheduled_time,
                notes: appointment.notes || '',
                appointment_type: appointment.appointment_type || 'virtual'
            });
        } else {
            setEditingId(null);
            setFormData({
                ...emptyForm,
                scheduled_date: date || selectedDate || new Date().toISOString().split('T')[0]
            });
        }
        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (!formData.lead_name || !formData.scheduled_date) return;

        if (editingId) {
            await update(editingId, {
                method: formData.method,
                scheduled_date: formData.scheduled_date,
                scheduled_time: formData.scheduled_time,
                notes: formData.notes,
                appointment_type: formData.appointment_type
            });
        } else {
            await create({
                lead_name: formData.lead_name,
                method: formData.method,
                scheduled_date: formData.scheduled_date,
                scheduled_time: formData.scheduled_time,
                notes: formData.notes,
                appointment_type: formData.appointment_type
            });
        }
        setShowForm(false);
        setFormData(emptyForm);
        setEditingId(null);
    };

    const handleComplete = async (id: string) => {
        await complete(id);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar esta cita?')) {
            await remove(id);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-nexus-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/10">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        📅 Calendario de Citas
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleOpenForm()}
                            className="flex items-center gap-1 px-3 py-1.5 bg-nexus-accent text-nexus-base font-bold rounded-lg hover:bg-orange-400 transition-colors text-sm"
                        >
                            <Plus size={16} />
                            Nueva Cita
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                            <ChevronLeft size={20} className="text-white" />
                        </button>
                        <h3 className="text-lg font-bold text-white">
                            {MONTHS[currentMonth]} {currentYear}
                        </h3>
                        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
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
                            const hasCompletedOnly = hasTasks && dayTasks.every(t => t.status === 'completed');
                            const hasIncomplete = hasTasks && dayTasks.some(t => t.status === 'pending');

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
                                    <span className={`text-sm font-medium ${isToday(day) ? 'text-blue-400' : 'text-white'}`}>
                                        {day}
                                    </span>

                                    {hasTasks && (
                                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                            {hasIncomplete && <div className="w-2 h-2 rounded-full bg-nexus-accent" />}
                                            {hasCompletedOnly && <div className="w-2 h-2 rounded-full bg-green-500" />}
                                            {dayTasks.length > 1 && (
                                                <span className="text-[10px] text-gray-400 ml-1">+{dayTasks.length - 1}</span>
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
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-white">
                                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-DO', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long'
                                    })}
                                </h4>
                                <button
                                    onClick={() => handleOpenForm(selectedDate)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-nexus-accent hover:bg-nexus-accent/10 rounded transition-colors"
                                >
                                    <Plus size={14} />
                                    Agregar
                                </button>
                            </div>

                            {selectedDayTasks.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">
                                    No hay citas programadas para este día
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {selectedDayTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className={`p-3 rounded-lg border ${task.status === 'completed'
                                                ? 'bg-green-500/10 border-green-500/20'
                                                : 'bg-nexus-base border-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {getMethodIcon(task.method)}
                                                <span className={`font-medium flex-1 ${task.status === 'completed' ? 'text-green-400 line-through' : 'text-white'}`}>
                                                    {task.lead_name}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {task.scheduled_time}
                                                </span>

                                                {/* Action buttons */}
                                                <div className="flex items-center gap-1 ml-2">
                                                    {task.status !== 'completed' && (
                                                        <button
                                                            onClick={() => handleComplete(task.id)}
                                                            className="p-1 text-green-400 hover:bg-green-400/20 rounded transition-colors"
                                                            title="Marcar completada"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleOpenForm(undefined, task)}
                                                        className="p-1 text-blue-400 hover:bg-blue-400/20 rounded transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(task.id)}
                                                        className="p-1 text-red-400 hover:bg-red-400/20 rounded transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            {task.notes && (
                                                <p className="text-xs text-gray-400 mt-1 truncate">{task.notes}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Appointment Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-nexus-surface rounded-xl w-full max-w-md p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">
                            {editingId ? 'Editar Cita' : 'Nueva Cita'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Nombre del Lead *</label>
                                <input
                                    type="text"
                                    value={formData.lead_name}
                                    onChange={e => setFormData(prev => ({ ...prev, lead_name: e.target.value }))}
                                    className="w-full bg-nexus-base border border-white/10 rounded-lg px-3 py-2 text-white focus:border-nexus-accent focus:outline-none"
                                    placeholder="Juan Pérez"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Fecha *</label>
                                    <input
                                        type="date"
                                        value={formData.scheduled_date}
                                        onChange={e => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                                        className="w-full bg-nexus-base border border-white/10 rounded-lg px-3 py-2 text-white focus:border-nexus-accent focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Hora</label>
                                    <input
                                        type="time"
                                        value={formData.scheduled_time}
                                        onChange={e => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                                        className="w-full bg-nexus-base border border-white/10 rounded-lg px-3 py-2 text-white focus:border-nexus-accent focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Método</label>
                                    <select
                                        value={formData.method}
                                        onChange={e => setFormData(prev => ({ ...prev, method: e.target.value as AppointmentFormData['method'] }))}
                                        className="w-full bg-nexus-base border border-white/10 rounded-lg px-3 py-2 text-white focus:border-nexus-accent focus:outline-none"
                                    >
                                        <option value="LLAMADA">📞 Llamada</option>
                                        <option value="WHATSAPP">💬 WhatsApp</option>
                                        <option value="VISITA">🏠 Visita</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Tipo</label>
                                    <select
                                        value={formData.appointment_type}
                                        onChange={e => setFormData(prev => ({ ...prev, appointment_type: e.target.value as 'virtual' | 'in_person' }))}
                                        className="w-full bg-nexus-base border border-white/10 rounded-lg px-3 py-2 text-white focus:border-nexus-accent focus:outline-none"
                                    >
                                        <option value="virtual">💻 Virtual</option>
                                        <option value="in_person">🏢 Presencial</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Notas</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full bg-nexus-base border border-white/10 rounded-lg px-3 py-2 text-white focus:border-nexus-accent focus:outline-none resize-none"
                                    rows={2}
                                    placeholder="Notas adicionales..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowForm(false); setEditingId(null); setFormData(emptyForm); }}
                                className="flex-1 px-4 py-2 border border-white/20 text-gray-400 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!formData.lead_name || !formData.scheduled_date}
                                className="flex-1 px-4 py-2 bg-nexus-accent text-nexus-base font-bold rounded-lg hover:bg-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {editingId ? 'Guardar Cambios' : 'Crear Cita'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

