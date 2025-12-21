import { useState, useEffect } from 'react';
import { Map, CheckCircle2, Clock, Calendar, ChevronDown, ChevronRight, Sparkles, X, Circle } from 'lucide-react';

// Roadmap data structure
interface SubTask {
    name: string;
    completed: boolean;
}

interface RoadmapItem {
    id: string;
    name: string;
    description?: string;
    progress: number; // 0-100
    status: 'completed' | 'in_progress' | 'planned';
    completedDate?: string;
    subTasks?: SubTask[];
}

interface RoadmapPhase {
    id: string;
    name: string;
    icon: string;
    items: RoadmapItem[];
}

// Roadmap data - update this manually as features are completed
const ROADMAP_DATA: RoadmapPhase[] = [
    {
        id: 'core',
        name: 'Core CRM',
        icon: '🏗️',
        items: [
            { id: 'leads', name: 'Gestión de Leads', progress: 100, status: 'completed', completedDate: '2024-11' },
            { id: 'pipeline', name: 'Pipeline Visual', progress: 100, status: 'completed', completedDate: '2024-11' },
            { id: 'contacts', name: 'Contacto de Leads', progress: 100, status: 'completed', completedDate: '2024-11' },
            { id: 'notes', name: 'Notas y Seguimiento', progress: 100, status: 'completed', completedDate: '2024-11' },
        ]
    },
    {
        id: 'team',
        name: 'Gestión de Equipo',
        icon: '👥',
        items: [
            { id: 'roles', name: 'Roles y Permisos', progress: 100, status: 'completed', completedDate: '2024-11' },
            { id: 'team-dashboard', name: 'Dashboard de Equipo', progress: 100, status: 'completed', completedDate: '2024-12' },
            { id: 'user-management', name: 'Gestión de Usuarios', progress: 100, status: 'completed', completedDate: '2024-12' },
            { id: 'ranking', name: 'Ranking de Asesores', progress: 100, status: 'completed', completedDate: '2024-12' },
        ]
    },
    {
        id: 'automation',
        name: 'Automatización',
        icon: '🤖',
        items: [
            { id: 'voice', name: 'Asistente de Voz', progress: 100, status: 'completed', description: 'Crear citas con comandos de voz', completedDate: '2024-12' },
            { id: 'telegram', name: 'Notificaciones Telegram', progress: 100, status: 'completed', completedDate: '2024-12' },
            { id: 'calendar-export', name: 'Export a Calendario', progress: 100, status: 'completed', description: 'Google Calendar e iCal', completedDate: '2024-12' },
            { id: 'smart-dates', name: 'Fechas Inteligentes', progress: 100, status: 'completed', description: 'Nunca agenda en el pasado', completedDate: '2024-12' },
        ]
    },
    {
        id: 'dashboard',
        name: 'Dashboard Interactivo',
        icon: '📊',
        items: [
            { id: 'kpi-cards', name: 'KPI Cards Clickables', progress: 100, status: 'completed', completedDate: '2024-12' },
            { id: 'calendar-view', name: 'Vista de Calendario', progress: 100, status: 'completed', completedDate: '2024-12' },
            { id: 'activity-logs', name: 'Logs de Actividad', progress: 100, status: 'completed', description: 'Llamadas y WhatsApp', completedDate: '2024-12' },
            { id: 'live-updates', name: 'Actualizaciones en Vivo', progress: 100, status: 'completed', completedDate: '2024-12' },
        ]
    },
    {
        id: 'mobile',
        name: 'Mobile & PWA',
        icon: '📱',
        items: [
            { id: 'pwa', name: 'Progressive Web App', progress: 100, status: 'completed', completedDate: '2024-11' },
            { id: 'auto-update', name: 'Auto-Actualización', progress: 100, status: 'completed', description: 'Sin reinstalar', completedDate: '2024-12' },
            {
                id: 'offline',
                name: 'Modo Offline',
                progress: 30,
                status: 'planned',
                description: 'Funcionalidad básica sin internet',
                subTasks: [
                    { name: 'Service Worker básico', completed: true },
                    { name: 'Cache de datos esenciales', completed: false },
                    { name: 'Sincronización al reconectar', completed: false },
                    { name: 'Indicador de estado offline', completed: false },
                ]
            },
        ]
    },
    {
        id: 'integrations',
        name: 'Integraciones',
        icon: '🔌',
        items: [
            { id: 'whatsapp', name: 'WhatsApp Click-to-Chat', progress: 100, status: 'completed', completedDate: '2024-11' },
            {
                id: 'alterestate',
                name: 'AlterEstate Sync',
                progress: 40,
                status: 'in_progress',
                description: 'Importar leads automáticamente',
                subTasks: [
                    { name: 'Webhook endpoint creado', completed: true },
                    { name: 'Multi-user lead assignment', completed: true },
                    { name: 'Test de API AlterEstate', completed: true },
                    { name: 'Google Workspace delegation', completed: false },
                    { name: 'Script central de parsing', completed: false },
                ]
            },
            {
                id: 'email-sync',
                name: 'Sync de Email',
                progress: 0,
                status: 'planned',
                subTasks: [
                    { name: 'OAuth con Gmail', completed: false },
                    { name: 'Parseo de emails entrantes', completed: false },
                    { name: 'Linking automático a leads', completed: false },
                ]
            },
        ]
    },
    {
        id: 'analytics',
        name: 'Analytics Avanzados',
        icon: '📈',
        items: [
            {
                id: 'basic-reports',
                name: 'Reportes Básicos',
                progress: 80,
                status: 'in_progress',
                subTasks: [
                    { name: 'Métricas de equipo', completed: true },
                    { name: 'Ranking de asesores', completed: true },
                    { name: 'Conteo de citas', completed: true },
                    { name: 'Exportar reportes', completed: false },
                ]
            },
            {
                id: 'conversion-analytics',
                name: 'Análisis de Conversión',
                progress: 0,
                status: 'planned',
                subTasks: [
                    { name: 'Funnel de conversión', completed: false },
                    { name: 'Tiempo promedio de cierre', completed: false },
                    { name: 'Análisis por fuente', completed: false },
                ]
            },
            {
                id: 'forecasting',
                name: 'Predicción de Ventas',
                progress: 0,
                status: 'planned',
                subTasks: [
                    { name: 'Modelo de predicción', completed: false },
                    { name: 'Dashboard de forecast', completed: false },
                    { name: 'Alertas de metas', completed: false },
                ]
            },
        ]
    }
];

export default function RoadmapView() {
    const [expandedPhases, setExpandedPhases] = useState<string[]>(
        ROADMAP_DATA.filter(p => p.items.some(i => i.status !== 'completed')).map(p => p.id)
    );
    const [animatedProgress, setAnimatedProgress] = useState<Record<string, number>>({});
    const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null);

    // Animate progress bars on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            const newProgress: Record<string, number> = {};
            ROADMAP_DATA.forEach(phase => {
                phase.items.forEach(item => {
                    newProgress[item.id] = item.progress;
                });
            });
            setAnimatedProgress(newProgress);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const togglePhase = (phaseId: string) => {
        setExpandedPhases(prev =>
            prev.includes(phaseId)
                ? prev.filter(id => id !== phaseId)
                : [...prev, phaseId]
        );
    };

    // Calculate overall progress
    const totalItems = ROADMAP_DATA.reduce((acc, p) => acc + p.items.length, 0);
    const completedItems = ROADMAP_DATA.reduce(
        (acc, p) => acc + p.items.filter(i => i.status === 'completed').length,
        0
    );
    const overallProgress = Math.round((completedItems / totalItems) * 100);

    const getStatusColor = (status: RoadmapItem['status']) => {
        switch (status) {
            case 'completed': return 'text-green-400';
            case 'in_progress': return 'text-yellow-400';
            case 'planned': return 'text-gray-500';
        }
    };

    const getProgressBarColor = (progress: number) => {
        if (progress === 100) return 'bg-green-500';
        if (progress >= 50) return 'bg-yellow-500';
        if (progress > 0) return 'bg-blue-500';
        return 'bg-gray-600';
    };

    const handleItemClick = (item: RoadmapItem) => {
        // Only show modal for items with subtasks that aren't 100% complete
        if (item.subTasks && item.subTasks.length > 0 && item.progress < 100) {
            setSelectedItem(item);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Map className="w-7 h-7 text-nexus-accent" />
                        Roadmap del Producto
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Seguimiento del progreso de desarrollo
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-nexus-accent">{overallProgress}%</div>
                    <p className="text-gray-400 text-sm">{completedItems}/{totalItems} features</p>
                </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="bg-nexus-surface rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-medium">Progreso General</span>
                    <span className="text-nexus-accent font-bold">{overallProgress}%</span>
                </div>
                <div className="h-4 bg-nexus-base rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-nexus-accent to-purple-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${overallProgress}%` }}
                    />
                </div>
                <div className="flex justify-between mt-3 text-sm">
                    <span className="flex items-center gap-1 text-green-400">
                        <CheckCircle2 className="w-4 h-4" /> {completedItems} Completados
                    </span>
                    <span className="flex items-center gap-1 text-yellow-400">
                        <Clock className="w-4 h-4" /> {ROADMAP_DATA.reduce((acc, p) => acc + p.items.filter(i => i.status === 'in_progress').length, 0)} En Progreso
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-4 h-4" /> {ROADMAP_DATA.reduce((acc, p) => acc + p.items.filter(i => i.status === 'planned').length, 0)} Planificados
                    </span>
                </div>
            </div>

            {/* Phases */}
            <div className="space-y-4">
                {ROADMAP_DATA.map((phase) => {
                    const phaseCompleted = phase.items.filter(i => i.status === 'completed').length;
                    const phaseProgress = Math.round((phaseCompleted / phase.items.length) * 100);
                    const isExpanded = expandedPhases.includes(phase.id);

                    return (
                        <div key={phase.id} className="bg-nexus-surface rounded-xl overflow-hidden">
                            {/* Phase Header */}
                            <button
                                onClick={() => togglePhase(phase.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{phase.icon}</span>
                                    <div className="text-left">
                                        <h3 className="text-white font-semibold">{phase.name}</h3>
                                        <p className="text-gray-400 text-sm">{phaseCompleted}/{phase.items.length} completados</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-2 bg-nexus-base rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${getProgressBarColor(phaseProgress)} transition-all duration-500`}
                                            style={{ width: `${phaseProgress}%` }}
                                        />
                                    </div>
                                    <span className={`text-sm font-medium ${phaseProgress === 100 ? 'text-green-400' : 'text-gray-400'}`}>
                                        {phaseProgress}%
                                    </span>
                                    {isExpanded ? (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            </button>

                            {/* Phase Items */}
                            {isExpanded && (
                                <div className="border-t border-white/5 p-4 space-y-3">
                                    {phase.items.map((item) => {
                                        const isClickable = item.subTasks && item.subTasks.length > 0 && item.progress < 100;

                                        return (
                                            <div
                                                key={item.id}
                                                className={`flex items-center gap-4 p-3 bg-nexus-base/50 rounded-lg transition-colors ${isClickable
                                                        ? 'cursor-pointer hover:bg-nexus-base/80 hover:ring-1 hover:ring-nexus-accent/50'
                                                        : ''
                                                    }`}
                                                onClick={() => handleItemClick(item)}
                                            >
                                                {/* Status Icon */}
                                                <div className={`flex-shrink-0 ${getStatusColor(item.status)}`}>
                                                    {item.status === 'completed' && <CheckCircle2 className="w-5 h-5" />}
                                                    {item.status === 'in_progress' && <Clock className="w-5 h-5 animate-pulse" />}
                                                    {item.status === 'planned' && <Calendar className="w-5 h-5" />}
                                                </div>

                                                {/* Item Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-medium ${item.status === 'completed' ? 'text-gray-300' : 'text-white'}`}>
                                                            {item.name}
                                                        </span>
                                                        {item.status === 'completed' && item.completedDate && (
                                                            <span className="text-xs text-gray-500">{item.completedDate}</span>
                                                        )}
                                                        {item.status === 'in_progress' && (
                                                            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                                                        )}
                                                        {isClickable && (
                                                            <span className="text-xs text-nexus-accent/70">Click para detalles</span>
                                                        )}
                                                    </div>
                                                    {item.description && (
                                                        <p className="text-gray-500 text-sm">{item.description}</p>
                                                    )}
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="w-20 flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-nexus-base rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${getProgressBarColor(animatedProgress[item.id] || 0)} transition-all duration-1000 ease-out`}
                                                            style={{ width: `${animatedProgress[item.id] || 0}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-400 w-8">{item.progress}%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Last Updated */}
            <div className="text-center text-gray-500 text-sm">
                Última actualización: Diciembre 21, 2024
            </div>

            {/* Subtasks Modal */}
            {selectedItem && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        className="bg-nexus-surface rounded-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">{selectedItem.name}</h3>
                                {selectedItem.description && (
                                    <p className="text-gray-400 text-sm mt-1">{selectedItem.description}</p>
                                )}
                            </div>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Progress */}
                        <div className="mb-6">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-400 text-sm">Progreso</span>
                                <span className="text-nexus-accent font-bold">{selectedItem.progress}%</span>
                            </div>
                            <div className="h-3 bg-nexus-base rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${getProgressBarColor(selectedItem.progress)} transition-all duration-500`}
                                    style={{ width: `${selectedItem.progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Subtasks List */}
                        <div className="space-y-3">
                            <h4 className="text-white font-medium text-sm uppercase tracking-wider">Subtareas</h4>
                            {selectedItem.subTasks?.map((task, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center gap-3 p-3 rounded-lg ${task.completed
                                            ? 'bg-green-500/10 border border-green-500/20'
                                            : 'bg-nexus-base/50 border border-white/5'
                                        }`}
                                >
                                    {task.completed ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                                    ) : (
                                        <Circle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                    )}
                                    <span className={task.completed ? 'text-gray-300' : 'text-white'}>
                                        {task.name}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="mt-6 p-4 bg-nexus-base rounded-lg">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Completadas</span>
                                <span className="text-green-400 font-medium">
                                    {selectedItem.subTasks?.filter(t => t.completed).length || 0} / {selectedItem.subTasks?.length || 0}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm mt-2">
                                <span className="text-gray-400">Pendientes</span>
                                <span className="text-yellow-400 font-medium">
                                    {selectedItem.subTasks?.filter(t => !t.completed).length || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
