import { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Trophy,
  Activity,
  Target,
  ChevronRight,
  RefreshCw,
  UserX,
  CheckCircle2,
  UserCog,
  BarChart3
} from 'lucide-react';
import { useTeamData } from '../hooks/useTeamData';
import { useUserRole } from '../hooks/useUserRole';
import type { TeamMemberPerformance } from '../types';
import AsesorDetailModal from './AsesorDetailModal';
import UserManagement from './UserManagement';

type TabView = 'dashboard' | 'users';

export default function SuperAdminDashboard() {
  const { canViewTeam, isAdmin, role } = useUserRole();
  const { teamMembers, teamStats, isLoading, refetch } = useTeamData();
  const [selectedAsesor, setSelectedAsesor] = useState<TeamMemberPerformance | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeView, setActiveView] = useState<TabView>('dashboard');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (!canViewTeam) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <UserX className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Acceso Restringido</h2>
          <p className="text-gray-400">No tienes permisos para ver esta sección.</p>
          <p className="text-gray-500 text-sm mt-2">Rol actual: {role || 'asesor'}</p>
        </div>
      </div>
    );
  }

  // Tab navigation for admins
  const renderTabs = () => (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => setActiveView('dashboard')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          activeView === 'dashboard'
            ? 'bg-nexus-accent text-black'
            : 'bg-nexus-surface text-gray-400 hover:text-white'
        }`}
      >
        <BarChart3 className="w-4 h-4" />
        Dashboard Equipo
      </button>
      {isAdmin && (
        <button
          onClick={() => setActiveView('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeView === 'users'
              ? 'bg-nexus-accent text-black'
              : 'bg-nexus-surface text-gray-400 hover:text-white'
          }`}
        >
          <UserCog className="w-4 h-4" />
          Gestión Usuarios
        </button>
      )}
    </div>
  );

  // User Management View
  if (activeView === 'users' && isAdmin) {
    return (
      <div className="space-y-6">
        {renderTabs()}
        <UserManagement />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto text-nexus-accent animate-spin mb-4" />
          <p className="text-gray-400">Cargando datos del equipo...</p>
        </div>
      </div>
    );
  }

  // Identify inactive asesores (no activity in 3+ days)
  const inactiveMembers = teamMembers.filter(m => {
    if (!m.last_activity) return true;
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return new Date(m.last_activity) < threeDaysAgo;
  });

  // Top performers (sorted by wins)
  const topPerformers = [...teamMembers]
    .sort((a, b) => b.leads_won - a.leads_won)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      {renderTabs()}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-nexus-accent" />
            Panel de Supervisión
          </h1>
          <p className="text-gray-400 mt-1">
            Monitorea el rendimiento de tu equipo en tiempo real
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-nexus-surface rounded-lg text-gray-300 hover:bg-nexus-surface/80 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Total Asesores"
          value={teamStats?.totalAsesores || 0}
          subtext={`${teamStats?.activeToday || 0} activos hoy`}
          color="blue"
        />
        <StatCard
          icon={<Target className="w-6 h-6" />}
          label="Leads Totales"
          value={teamStats?.totalLeads || 0}
          subtext="En el pipeline"
          color="purple"
        />
        <StatCard
          icon={<Trophy className="w-6 h-6" />}
          label="Conversiones"
          value={teamStats?.leadsWonThisMonth || 0}
          subtext={`${(teamStats?.conversionRate || 0).toFixed(1)}% tasa`}
          color="green"
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6" />}
          label="Inactivos"
          value={inactiveMembers.length}
          subtext="+3 días sin actividad"
          color={inactiveMembers.length > 0 ? 'red' : 'gray'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ranking de Asesores */}
        <div className="lg:col-span-2 bg-nexus-surface rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Ranking de Asesores
          </h2>
          
          {teamMembers.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No hay asesores registrados</p>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member, index) => (
                <AsesorRow
                  key={member.user_id}
                  member={member}
                  rank={index + 1}
                  onClick={() => setSelectedAsesor(member)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Alertas y Top Performers */}
        <div className="space-y-6">
          {/* Alertas de Inactividad */}
          <div className="bg-nexus-surface rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Alertas de Inactividad
            </h2>
            
            {inactiveMembers.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-10 h-10 mx-auto text-green-500 mb-2" />
                <p className="text-gray-400 text-sm">¡Todo el equipo está activo!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {inactiveMembers.map(member => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20 cursor-pointer hover:bg-red-500/20 transition-colors"
                    onClick={() => setSelectedAsesor(member)}
                  >
                    <div>
                      <p className="text-white font-medium">{member.full_name}</p>
                      <p className="text-red-400 text-xs">
                        {member.last_activity 
                          ? `Última actividad: ${formatTimeAgo(member.last_activity)}`
                          : 'Sin actividad registrada'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-red-400" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats - Top 3 */}
          <div className="bg-nexus-surface rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-nexus-accent" />
              Top Performers
            </h2>
            
            <div className="space-y-3">
              {topPerformers.slice(0, 3).map((member, index) => (
                <div 
                  key={member.user_id}
                  className="flex items-center gap-3"
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                    ${index === 0 ? 'bg-yellow-500 text-black' : ''}
                    ${index === 1 ? 'bg-gray-400 text-black' : ''}
                    ${index === 2 ? 'bg-amber-700 text-white' : ''}
                  `}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{member.full_name}</p>
                    <p className="text-gray-400 text-xs">{member.leads_won} ventas cerradas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Asesor Detail Modal */}
      {selectedAsesor && (
        <AsesorDetailModal
          asesor={selectedAsesor}
          onClose={() => setSelectedAsesor(null)}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  icon, 
  label, 
  value, 
  subtext, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  subtext: string;
  color: 'blue' | 'purple' | 'green' | 'red' | 'gray';
}) {
  const colors = {
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
    green: 'bg-green-500/20 text-green-400',
    red: 'bg-red-500/20 text-red-400',
    gray: 'bg-gray-500/20 text-gray-400'
  };

  return (
    <div className="bg-nexus-surface rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <p className="text-gray-500 text-sm mt-1">{subtext}</p>
    </div>
  );
}

// Asesor Row Component
function AsesorRow({ 
  member, 
  rank, 
  onClick 
}: { 
  member: TeamMemberPerformance; 
  rank: number;
  onClick: () => void;
}) {
  const isInactive = !member.last_activity || 
    new Date(member.last_activity) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const conversionRate = member.total_leads > 0 
    ? ((member.leads_won / member.total_leads) * 100).toFixed(0) 
    : '0';

  return (
    <div 
      className="flex items-center gap-4 p-4 bg-nexus-base/50 rounded-lg hover:bg-nexus-base cursor-pointer transition-colors group"
      onClick={onClick}
    >
      {/* Rank */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0
        ${rank === 1 ? 'bg-yellow-500 text-black' : ''}
        ${rank === 2 ? 'bg-gray-400 text-black' : ''}
        ${rank === 3 ? 'bg-amber-700 text-white' : ''}
        ${rank > 3 ? 'bg-gray-700 text-gray-400' : ''}
      `}>
        {rank}
      </div>

      {/* Name & Status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white font-medium truncate">{member.full_name}</p>
          {isInactive && (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
              Inactivo
            </span>
          )}
        </div>
        <p className="text-gray-500 text-xs truncate">{member.email}</p>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className="text-gray-400 text-xs">Leads</p>
          <p className="text-white font-semibold">{member.total_leads}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs">Ganados</p>
          <p className="text-green-400 font-semibold">{member.leads_won}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs">Perdidos</p>
          <p className="text-red-400 font-semibold">{member.leads_lost}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs">Conversión</p>
          <p className="text-nexus-accent font-semibold">{conversionRate}%</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs">Tareas</p>
          <p className="text-white font-semibold">
            {member.tasks_completed}/{member.total_tasks}
          </p>
        </div>
      </div>

      {/* Activity Indicator */}
      <div className="flex items-center gap-2">
        <Activity className={`w-4 h-4 ${isInactive ? 'text-red-400' : 'text-green-400'}`} />
        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
      </div>
    </div>
  );
}

// Helper: Format time ago
function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  if (diffHours > 0) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffMins > 0) return `hace ${diffMins} min`;
  return 'hace un momento';
}
