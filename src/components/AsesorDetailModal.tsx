import { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  MessageSquare,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useTeamData } from '../hooks/useTeamData';
import type { TeamMemberPerformance, Lead, ScheduledTask, DailyActivitySummary } from '../types';

interface AsesorDetailModalProps {
  asesor: TeamMemberPerformance;
  onClose: () => void;
}

export default function AsesorDetailModal({ asesor, onClose }: AsesorDetailModalProps) {
  const { getAsesorLeads, getAsesorTasks, getAsesorActivity, getAsesorAppointments } = useTeamData();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [appointments, setAppointments] = useState<ScheduledTask[]>([]);
  const [activity, setActivity] = useState<DailyActivitySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'tasks' | 'appointments' | 'activity'>('overview');
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!asesor.user_id) return;
      setIsLoading(true);
      try {
        const [leadsData, tasksData, activityData, appointmentsData] = await Promise.all([
          getAsesorLeads(asesor.user_id),
          getAsesorTasks(asesor.user_id),
          getAsesorActivity(asesor.user_id, 30),
          getAsesorAppointments ? getAsesorAppointments(asesor.user_id) : Promise.resolve([])
        ]);
        if (isMounted) {
          setLeads(leadsData);
          setTasks(tasksData);
          setActivity(activityData);
          setAppointments(appointmentsData || []);
        }
      } catch (err) {
        console.error('Error fetching asesor data:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [asesor.user_id]); // Solo depende del user_id, no de las funciones

  // Calculate stats
  const conversionRate = asesor.total_leads > 0
    ? ((asesor.leads_won / asesor.total_leads) * 100).toFixed(1)
    : '0';

  const taskCompletionRate = asesor.total_tasks > 0
    ? ((asesor.tasks_completed / asesor.total_tasks) * 100).toFixed(1)
    : '0';

  const pendingTasks = tasks.filter(t => !t.is_completed);
  const recentActivity = activity.slice(0, 7); // Last 7 days

  // Leads by status
  const leadsByStatus = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-nexus-surface rounded-xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-nexus-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 md:w-7 md:h-7 text-nexus-accent" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-white truncate">{asesor.full_name}</h2>
              <p className="text-gray-400 text-xs md:text-sm truncate">{asesor.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs - Scrollable on mobile */}
        <div className="flex border-b border-gray-700 overflow-x-auto scrollbar-hide">
          {[
            { id: 'overview', label: 'Resumen', icon: TrendingUp },
            { id: 'leads', label: `Leads (${leads.length})`, icon: Target },
            { id: 'tasks', label: `Tareas (${pendingTasks.length})`, icon: CheckCircle2 },
            { id: 'appointments', label: `Citas (${appointments.length})`, icon: Calendar },
            { id: 'activity', label: 'Actividad', icon: Activity }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 md:px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0
                ${activeTab === tab.id
                  ? 'text-nexus-accent border-b-2 border-nexus-accent'
                  : 'text-gray-400 hover:text-white'}`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-nexus-accent border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* KPI Cards - Main Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KPICard
                      label="Total Leads"
                      value={asesor.total_leads}
                      icon={<Target className="w-5 h-5" />}
                      color="blue"
                    />
                    <KPICard
                      label="Ventas Cerradas"
                      value={asesor.leads_won}
                      icon={<CheckCircle2 className="w-5 h-5" />}
                      color="green"
                    />
                    <KPICard
                      label="Perdidos"
                      value={asesor.leads_lost}
                      icon={<XCircle className="w-5 h-5" />}
                      color="red"
                    />
                    <KPICard
                      label="Conversión"
                      value={`${asesor.conversion_rate ?? conversionRate}%`}
                      icon={<TrendingUp className="w-5 h-5" />}
                      color="orange"
                    />
                  </div>

                  {/* Advanced Metrics */}
                  <div className="bg-nexus-base rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-nexus-accent" />
                      Métricas Avanzadas
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Hot Leads */}
                      <div className="bg-nexus-surface p-4 rounded-lg text-center">
                        <div className="text-3xl mb-1">🔥</div>
                        <p className="text-2xl font-bold text-orange-400">{asesor.hot_leads || 0}</p>
                        <p className="text-gray-500 text-xs">Hot Leads</p>
                      </div>
                      {/* Warm Leads */}
                      <div className="bg-nexus-surface p-4 rounded-lg text-center">
                        <div className="text-3xl mb-1">🌡️</div>
                        <p className="text-2xl font-bold text-yellow-400">{asesor.warm_leads || 0}</p>
                        <p className="text-gray-500 text-xs">Warm Leads</p>
                      </div>
                      {/* Cold Leads */}
                      <div className="bg-nexus-surface p-4 rounded-lg text-center">
                        <div className="text-3xl mb-1">❄️</div>
                        <p className="text-2xl font-bold text-blue-400">{asesor.cold_leads || 0}</p>
                        <p className="text-gray-500 text-xs">Cold Leads</p>
                      </div>
                      {/* Active Leads */}
                      <div className="bg-nexus-surface p-4 rounded-lg text-center">
                        <div className="text-3xl mb-1">📊</div>
                        <p className="text-2xl font-bold text-green-400">{asesor.active_leads || 0}</p>
                        <p className="text-gray-500 text-xs">Activos</p>
                      </div>
                    </div>
                  </div>

                  {/* Follow-up Stats */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-nexus-base rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        Efectividad de Seguimientos
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Total Seguimientos</span>
                          <span className="text-white font-semibold">{asesor.total_follow_ups || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Promedio por Lead</span>
                          <span className="text-nexus-accent font-semibold">{asesor.avg_follow_ups || 0}</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden mt-2">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-nexus-accent rounded-full transition-all"
                            style={{ width: `${Math.min((asesor.avg_follow_ups || 0) * 20, 100)}%` }}
                          />
                        </div>
                        <p className="text-gray-500 text-xs text-center">
                          {(asesor.avg_follow_ups || 0) >= 4 ? '¡Excelente seguimiento!' :
                            (asesor.avg_follow_ups || 0) >= 2 ? 'Buen seguimiento' :
                              'Puede mejorar seguimientos'}
                        </p>
                      </div>
                    </div>

                    {/* Conversion Analysis */}
                    <div className="bg-nexus-base rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        Análisis de Conversión
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Tasa de Conversión</span>
                          <span className={`font-bold ${(asesor.conversion_rate || 0) >= 30 ? 'text-green-400' : (asesor.conversion_rate || 0) >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {asesor.conversion_rate || 0}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Esta Semana</span>
                          <span className="text-white font-semibold">+{asesor.leads_this_week} leads</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden mt-2">
                          <div
                            className={`h-full rounded-full transition-all ${(asesor.conversion_rate || 0) >= 30 ? 'bg-green-500' :
                              (asesor.conversion_rate || 0) >= 15 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                            style={{ width: `${Math.min(asesor.conversion_rate || 0, 100)}%` }}
                          />
                        </div>
                        <p className="text-gray-500 text-xs text-center">
                          {(asesor.conversion_rate || 0) >= 30 ? '¡Excelente rendimiento!' :
                            (asesor.conversion_rate || 0) >= 15 ? 'Buen rendimiento' :
                              'Necesita mejorar conversiones'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Activity & Tasks */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Last Activity */}
                    <div className="bg-nexus-base rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        Última Actividad
                      </h3>
                      <p className="text-gray-400">
                        {asesor.last_activity
                          ? formatDate(asesor.last_activity)
                          : 'Sin actividad registrada'}
                      </p>
                      {recentActivity.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {recentActivity.slice(0, 3).map((day, i) => (
                            <div key={i} className="text-sm text-gray-500">
                              {day.activity_date}: {day.total_actions} acciones
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Task Performance */}
                    <div className="bg-nexus-base rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-gray-400" />
                        Rendimiento de Tareas
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Completadas</span>
                            <span className="text-white">{taskCompletionRate}%</span>
                          </div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all"
                              style={{ width: `${taskCompletionRate}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">{asesor.tasks_completed}</p>
                          <p className="text-gray-500 text-xs">de {asesor.total_tasks}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pipeline Distribution */}
                  <div className="bg-nexus-base rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-4">Distribución del Pipeline</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(leadsByStatus).map(([status, count]) => (
                        <div key={status} className="bg-nexus-surface p-3 rounded-lg">
                          <p className="text-gray-400 text-xs truncate">{status}</p>
                          <p className="text-white text-xl font-bold">{count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Leads Tab */}
              {activeTab === 'leads' && (
                <div className="space-y-3">
                  {leads.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No hay leads registrados</p>
                  ) : (
                    leads.map(lead => (
                      <div
                        key={lead.id}
                        className="bg-nexus-base rounded-lg overflow-hidden"
                      >
                        <div
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-nexus-base/80"
                          onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                        >
                          <div className="flex items-center gap-3">
                            <StatusBadge status={lead.status} />
                            <div>
                              <p className="text-white font-medium">{lead.name}</p>
                              <p className="text-gray-500 text-xs">{lead.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {lead.score && (
                              <span className={`px-2 py-1 rounded text-xs font-medium
                                ${lead.score.category === 'HOT' ? 'bg-red-500/20 text-red-400' : ''}
                                ${lead.score.category === 'WARM' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                                ${lead.score.category === 'COLD' ? 'bg-blue-500/20 text-blue-400' : ''}
                              `}>
                                {lead.score.category}
                              </span>
                            )}
                            {expandedLead === lead.id ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>

                        {expandedLead === lead.id && (
                          <div className="px-4 pb-4 border-t border-gray-700 pt-3 space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                              <Mail className="w-4 h-4" />
                              {lead.email || 'Sin email'}
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <MessageSquare className="w-4 h-4" />
                              Fuente: {lead.source}
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <Calendar className="w-4 h-4" />
                              Próximo seguimiento: {lead.nextFollowUpDate || 'No definido'}
                            </div>
                            {lead.notes && (
                              <div className="flex items-start gap-2 text-gray-400">
                                <FileText className="w-4 h-4 mt-0.5" />
                                <p className="flex-1">{lead.notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tasks Tab */}
              {activeTab === 'tasks' && (
                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No hay tareas programadas</p>
                  ) : (
                    <>
                      {/* Pending Tasks */}
                      {pendingTasks.length > 0 && (
                        <div>
                          <h3 className="text-yellow-400 font-medium mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Pendientes ({pendingTasks.length})
                          </h3>
                          <div className="space-y-2">
                            {pendingTasks.map(task => (
                              <TaskRow key={task.id} task={task} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Completed Tasks */}
                      {tasks.filter(t => t.is_completed).length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-green-400 font-medium mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Completadas ({tasks.filter(t => t.is_completed).length})
                          </h3>
                          <div className="space-y-2 opacity-70">
                            {tasks.filter(t => t.is_completed).slice(0, 5).map(task => (
                              <TaskRow key={task.id} task={task} />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Appointments Tab */}
              {activeTab === 'appointments' && (
                <div className="space-y-4">
                  {appointments.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No hay citas programadas</p>
                  ) : (
                    <>
                      {/* Summary */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-nexus-base rounded-lg p-4 text-center">
                          <div className="text-3xl mb-1">🖥️</div>
                          <p className="text-2xl font-bold text-purple-400">
                            {appointments.filter(a => a.appointment_type === 'virtual').length}
                          </p>
                          <p className="text-gray-500 text-xs">Virtuales</p>
                        </div>
                        <div className="bg-nexus-base rounded-lg p-4 text-center">
                          <div className="text-3xl mb-1">🏠</div>
                          <p className="text-2xl font-bold text-green-400">
                            {appointments.filter(a => a.appointment_type === 'in_person').length}
                          </p>
                          <p className="text-gray-500 text-xs">Presenciales</p>
                        </div>
                      </div>

                      {/* Appointments List */}
                      <div className="space-y-2">
                        {appointments.map(apt => (
                          <div
                            key={apt.id}
                            className={`p-4 rounded-lg flex items-center gap-3 ${apt.is_completed ? 'bg-green-500/10' : 'bg-nexus-base'}`}
                          >
                            <div className={`p-2 rounded-lg ${apt.appointment_type === 'virtual' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
                              {apt.appointment_type === 'virtual' ? '🖥️' : '🏠'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">{apt.lead_name}</p>
                              <p className="text-gray-500 text-xs">
                                {apt.scheduled_date} a las {apt.scheduled_time}
                              </p>
                              {apt.notes && (
                                <p className="text-gray-400 text-xs mt-1 truncate">{apt.notes}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end">
                              <span className={`text-xs px-2 py-1 rounded ${apt.appointment_type === 'virtual' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
                                {apt.appointment_type === 'virtual' ? 'Virtual' : 'Presencial'}
                              </span>
                              {apt.is_completed && (
                                <CheckCircle2 className="w-4 h-4 text-green-400 mt-1" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="space-y-4">
                  {activity.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No hay actividad registrada</p>
                  ) : (
                    activity.map((day, i) => (
                      <div key={i} className="bg-nexus-base rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white font-medium">{formatDate(day.activity_date)}</h3>
                          <span className="text-gray-400 text-sm">{day.total_actions} acciones</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                          <ActivityStat label="Leads creados" value={day.leads_created} />
                          <ActivityStat label="Actualizaciones" value={day.leads_updated} />
                          <ActivityStat label="Tareas completadas" value={day.tasks_completed} />
                          <ActivityStat label="Llamadas" value={day.calls_made} />
                          <ActivityStat label="WhatsApp" value={day.whatsapp_sent} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function KPICard({ label, value, icon, color }: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'orange';
}) {
  const colors = {
    blue: 'text-blue-400 bg-blue-500/20',
    green: 'text-green-400 bg-green-500/20',
    red: 'text-red-400 bg-red-500/20',
    orange: 'text-orange-400 bg-orange-500/20'
  };

  return (
    <div className="bg-nexus-base rounded-lg p-4">
      <div className={`w-8 h-8 rounded-lg ${colors[color]} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-gray-500 text-xs">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    'NUEVO': 'bg-blue-500/20 text-blue-400',
    'CONTACTADO': 'bg-yellow-500/20 text-yellow-400',
    'VISITA_AGENDADA': 'bg-purple-500/20 text-purple-400',
    'NEGOCIACION': 'bg-orange-500/20 text-orange-400',
    'CERRADO_GANADO': 'bg-green-500/20 text-green-400',
    'CERRADO_PERDIDO': 'bg-red-500/20 text-red-400'
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function TaskRow({ task }: { task: ScheduledTask }) {
  const taskTypeIcons: Record<string, React.ReactNode> = {
    call: <Phone className="w-4 h-4" />,
    whatsapp: <MessageSquare className="w-4 h-4" />,
    visit: <Calendar className="w-4 h-4" />,
    email: <Mail className="w-4 h-4" />,
    other: <FileText className="w-4 h-4" />
  };

  return (
    <div className={`p-3 rounded-lg flex items-center gap-3 ${task.is_completed ? 'bg-green-500/10' : 'bg-nexus-surface'}`}>
      <div className={`p-2 rounded ${task.is_completed ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
        {taskTypeIcons[task.task_type] || taskTypeIcons.other}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{task.lead_name}</p>
        <p className="text-gray-500 text-xs">
          {task.scheduled_date} a las {task.scheduled_time}
        </p>
      </div>
      {task.is_completed && (
        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
      )}
    </div>
  );
}

function ActivityStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-nexus-surface rounded p-2">
      <p className="text-white font-bold">{value}</p>
      <p className="text-gray-500 text-xs">{label}</p>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  });
}
