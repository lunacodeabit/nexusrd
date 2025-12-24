import React, { useMemo, useState } from 'react';
import type { Lead } from '../types';
import { LeadStatus } from '../types';
import type { TaskCompletion, LeadFollowUp } from '../types/activities';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
  ComposedChart, Area, Line
} from 'recharts';
import {
  TrendingUp, Users, Target,
  Phone, Instagram, FileSpreadsheet,
  ArrowUpRight, ArrowDownRight, Minus,
  BarChart3, Zap
} from 'lucide-react';
import { generateLeadsCSV, downloadCSV } from '../services/exportService';
import ConversionAnalytics from './ConversionAnalytics';
import SalesForecast from './SalesForecast';

interface AdvancedAnalyticsProps {
  leads: Lead[];
  followUps: LeadFollowUp[];
  taskCompletions: TaskCompletion[];
}

type AnalyticsTab = 'overview' | 'conversion' | 'forecast';

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  leads,
  followUps,
  taskCompletions
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');

  // Calculate date range
  const dateRange = useMemo(() => {
    const now = new Date();
    const start = new Date();

    switch (selectedPeriod) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'all':
        start.setFullYear(2020);
        break;
    }

    return { start, end: now };
  }, [selectedPeriod]);

  // Filter data by period
  const filteredLeads = useMemo(() => {
    return leads.filter(l => new Date(l.createdAt) >= dateRange.start);
  }, [leads, dateRange]);

  const filteredFollowUps = useMemo(() => {
    return followUps.filter(f => new Date(f.date) >= dateRange.start);
  }, [followUps, dateRange]);

  const filteredCompletions = useMemo(() => {
    return taskCompletions.filter(c => new Date(c.date) >= dateRange.start && c.completed);
  }, [taskCompletions, dateRange]);

  // KPI Summary
  const kpis = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const hotLeads = filteredLeads.filter(l => l.score?.category === 'HOT').length;
    const closedWon = filteredLeads.filter(l => l.status === LeadStatus.CLOSED_WON).length;
    const totalFollowUps = filteredFollowUps.length;
    const positivResponses = filteredFollowUps.filter(f => f.response === 'POSITIVA').length;
    const totalPosts = filteredCompletions.filter(c => c.taskId.includes('art-') && c.taskId.endsWith('-1')).length;
    const totalActivities = filteredCompletions.length;

    return {
      totalLeads,
      hotLeads,
      closedWon,
      conversionRate: totalLeads > 0 ? ((closedWon / totalLeads) * 100).toFixed(1) : '0',
      totalFollowUps,
      avgFollowUpsPerLead: totalLeads > 0 ? (totalFollowUps / totalLeads).toFixed(1) : '0',
      responseRate: totalFollowUps > 0 ? ((positivResponses / totalFollowUps) * 100).toFixed(1) : '0',
      totalPosts,
      totalActivities
    };
  }, [filteredLeads, filteredFollowUps, filteredCompletions]);

  // Daily correlation data
  const correlationData = useMemo(() => {
    const dailyData: Record<string, {
      date: string;
      posts: number;
      followUps: number;
      newLeads: number;
      activities: number;
    }> = {};

    // Last 14 days
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyData[dateKey] = {
        date: dateKey,
        posts: 0,
        followUps: 0,
        newLeads: 0,
        activities: 0
      };
    }

    // Count activities
    taskCompletions.forEach(c => {
      if (dailyData[c.date] && c.completed) {
        dailyData[c.date].activities++;
        if (c.taskId.includes('art-') && c.taskId.endsWith('-1')) {
          dailyData[c.date].posts++;
        }
      }
    });

    // Count follow-ups
    followUps.forEach(f => {
      const dateKey = f.date.split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].followUps++;
      }
    });

    // Count new leads
    leads.forEach(l => {
      const dateKey = l.createdAt.split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].newLeads++;
      }
    });

    return Object.values(dailyData);
  }, [leads, followUps, taskCompletions]);

  // Lead source distribution
  const sourceData = useMemo(() => {
    const sources: Record<string, number> = {};
    filteredLeads.forEach(l => {
      sources[l.source] = (sources[l.source] || 0) + 1;
    });
    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  // Lead status distribution
  const statusData = useMemo(() => {
    const statuses: Record<string, number> = {};
    filteredLeads.forEach(l => {
      statuses[l.status] = (statuses[l.status] || 0) + 1;
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  // Score distribution
  const scoreData = useMemo(() => {
    const hot = filteredLeads.filter(l => l.score?.category === 'HOT').length;
    const warm = filteredLeads.filter(l => l.score?.category === 'WARM').length;
    const cold = filteredLeads.filter(l => l.score?.category === 'COLD').length;
    const notQualified = filteredLeads.filter(l => !l.score).length;

    return [
      { name: 'HOT 🔥', value: hot, color: '#ef4444' },
      { name: 'WARM ☀️', value: warm, color: '#f59e0b' },
      { name: 'COLD ❄️', value: cold, color: '#3b82f6' },
      { name: 'Sin Calificar', value: notQualified, color: '#6b7280' }
    ].filter(d => d.value > 0);
  }, [filteredLeads]);

  // Follow-up effectiveness
  const followUpEffectiveness = useMemo(() => {
    const byNumber: Record<number, { total: number; positive: number }> = {};

    followUps.forEach(f => {
      if (!byNumber[f.followUpNumber]) {
        byNumber[f.followUpNumber] = { total: 0, positive: 0 };
      }
      byNumber[f.followUpNumber].total++;
      if (f.response === 'POSITIVA') {
        byNumber[f.followUpNumber].positive++;
      }
    });

    return Object.entries(byNumber).map(([num, data]) => ({
      followUp: `S${num}`,
      total: data.total,
      efectividad: data.total > 0 ? Math.round((data.positive / data.total) * 100) : 0
    }));
  }, [followUps]);

  const handleExportCSV = () => {
    const csv = generateLeadsCSV(leads, followUps);
    const date = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `nexus-leads-${date}.csv`);
  };

  const COLORS = ['#FF851B', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b'];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics & Reportes</h2>
          <p className="text-gray-400 text-sm">Mide el impacto de tus acciones en resultados</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
          >
            <FileSpreadsheet size={18} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Analytics Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'overview'
            ? 'bg-nexus-accent text-nexus-base'
            : 'bg-nexus-surface text-gray-400 hover:text-white border border-white/10'
            }`}
        >
          <BarChart3 size={18} />
          Resumen
        </button>
        <button
          onClick={() => setActiveTab('conversion')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'conversion'
            ? 'bg-purple-500 text-white'
            : 'bg-nexus-surface text-gray-400 hover:text-white border border-white/10'
            }`}
        >
          <TrendingUp size={18} />
          Conversión
        </button>
        <button
          onClick={() => setActiveTab('forecast')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'forecast'
            ? 'bg-green-500 text-white'
            : 'bg-nexus-surface text-gray-400 hover:text-white border border-white/10'
            }`}
        >
          <Zap size={18} />
          Predicción
        </button>
      </div>

      {/* Render based on active tab */}
      {activeTab === 'conversion' && (
        <ConversionAnalytics leads={leads} />
      )}

      {activeTab === 'forecast' && (
        <SalesForecast leads={leads} />
      )}

      {activeTab === 'overview' && (
        <>
          {/* Period Filter */}
          <div className="flex gap-2">
            <div className="flex bg-nexus-surface border border-white/10 rounded-lg overflow-hidden">
              {(['week', 'month', 'all'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${selectedPeriod === period
                    ? 'bg-nexus-accent text-nexus-base'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  {period === 'week' ? '7 días' : period === 'month' ? '30 días' : 'Todo'}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <KPICard
              title="Total Leads"
              value={kpis.totalLeads}
              icon={<Users size={20} />}
              color="text-blue-400"
            />
            <KPICard
              title="Leads HOT"
              value={kpis.hotLeads}
              icon={<Target size={20} />}
              color="text-red-400"
              subtitle="🔥"
            />
            <KPICard
              title="Cerrados"
              value={kpis.closedWon}
              icon={<TrendingUp size={20} />}
              color="text-green-400"
              subtitle={`${kpis.conversionRate}%`}
            />
            <KPICard
              title="Seguimientos"
              value={kpis.totalFollowUps}
              icon={<Phone size={20} />}
              color="text-purple-400"
              subtitle={`${kpis.avgFollowUpsPerLead} por lead`}
            />
            <KPICard
              title="Posts"
              value={kpis.totalPosts}
              icon={<Instagram size={20} />}
              color="text-pink-400"
            />
          </div>

          {/* Correlation Chart */}
          <div className="bg-nexus-surface p-6 rounded-xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-nexus-accent" />
              Correlación: Actividades vs Resultados
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              ¿Más posts y seguimientos = más leads? Analiza la relación.
            </p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={correlationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0a192f', borderColor: '#FF851B', borderRadius: 8 }}
                    labelFormatter={(val) => new Date(val).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="activities" name="Actividades" fill="#8b5cf620" stroke="#8b5cf6" />
                  <Bar dataKey="posts" name="Posts" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="followUps" name="Seguimientos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="newLeads" name="Nuevos Leads" stroke="#FF851B" strokeWidth={3} dot={{ fill: '#FF851B', r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Two column layout */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Follow-up Effectiveness */}
            <div className="bg-nexus-surface p-6 rounded-xl border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4">Efectividad por Seguimiento</h3>
              <p className="text-sm text-gray-400 mb-4">¿En qué seguimiento responden mejor?</p>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={followUpEffectiveness}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="followUp" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a192f', borderColor: '#FF851B', borderRadius: 8 }}
                      formatter={(value, name) => [name === 'efectividad' ? `${value}%` : value, name === 'efectividad' ? 'Efectividad' : 'Total']}
                    />
                    <Bar dataKey="total" name="Total" fill="#6b7280" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="efectividad" name="Efectividad %" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Score Distribution */}
            <div className="bg-nexus-surface p-6 rounded-xl border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4">Distribución por Calificación</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={scoreData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={{ stroke: '#9ca3af' }}
                    >
                      {scoreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a192f', borderColor: '#FF851B', borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Source and Status Distribution */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Lead Sources */}
            <div className="bg-nexus-surface p-6 rounded-xl border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4">Fuentes de Leads</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis dataKey="name" type="category" stroke="#9ca3af" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a192f', borderColor: '#FF851B', borderRadius: 8 }} />
                    <Bar dataKey="value" fill="#FF851B" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-nexus-surface p-6 rounded-xl border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4">Pipeline por Estado</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ value }) => `${value}`}
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0a192f', borderColor: '#FF851B', borderRadius: 8 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-gradient-to-r from-nexus-accent/20 to-purple-500/20 p-6 rounded-xl border border-nexus-accent/30">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              💡 Insights Automáticos
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <InsightCard
                title="Tasa de Conversión"
                value={`${kpis.conversionRate}%`}
                trend={parseFloat(kpis.conversionRate) >= 10 ? 'up' : parseFloat(kpis.conversionRate) >= 5 ? 'neutral' : 'down'}
                description={parseFloat(kpis.conversionRate) >= 10 ? '¡Excelente! Sigue así' : 'Necesita mejorar seguimientos'}
              />
              <InsightCard
                title="Promedio Seguimientos"
                value={kpis.avgFollowUpsPerLead}
                trend={parseFloat(kpis.avgFollowUpsPerLead) >= 5 ? 'up' : 'down'}
                description={parseFloat(kpis.avgFollowUpsPerLead) < 5 ? 'Aumenta los seguimientos' : 'Buen ritmo de contacto'}
              />
              <InsightCard
                title="Leads HOT"
                value={`${kpis.hotLeads}/${kpis.totalLeads}`}
                trend={kpis.hotLeads > 0 ? 'up' : 'neutral'}
                description={kpis.hotLeads > 0 ? '¡Prioriza estos leads!' : 'Califica más leads'}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// KPI Card Component
const KPICard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-nexus-surface p-4 rounded-xl border border-white/5">
    <div className="flex items-center justify-between mb-2">
      <span className={color}>{icon}</span>
      {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-xs text-gray-500">{title}</p>
  </div>
);

// Insight Card Component
const InsightCard: React.FC<{
  title: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  description: string;
}> = ({ title, value, trend, description }) => (
  <div className="bg-nexus-base/50 p-4 rounded-lg">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-gray-400">{title}</span>
      {trend === 'up' && <ArrowUpRight size={16} className="text-green-400" />}
      {trend === 'down' && <ArrowDownRight size={16} className="text-red-400" />}
      {trend === 'neutral' && <Minus size={16} className="text-yellow-400" />}
    </div>
    <p className="text-xl font-bold text-white">{value}</p>
    <p className="text-xs text-gray-500 mt-1">{description}</p>
  </div>
);

export default AdvancedAnalytics;
