import { useMemo } from 'react';
import type { Lead } from '../types';
import { LeadStatus } from '../types';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, FunnelChart, Funnel, LabelList, Cell
} from 'recharts';
import {
    TrendingUp, Clock, Target, ArrowRight,
    CheckCircle2, XCircle, Timer, Percent
} from 'lucide-react';

interface ConversionAnalyticsProps {
    leads: Lead[];
}

const FUNNEL_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

export default function ConversionAnalytics({ leads }: ConversionAnalyticsProps) {

    // Funnel data - stages of the sales pipeline
    const funnelData = useMemo(() => {
        const stages = [
            { name: 'Nuevos', status: LeadStatus.NEW, count: 0, color: '#3b82f6' },
            { name: 'Contactados', status: LeadStatus.CONTACTED, count: 0, color: '#8b5cf6' },
            { name: 'Visita Agendada', status: LeadStatus.VISIT_SCHEDULED, count: 0, color: '#f59e0b' },
            { name: 'En Negociación', status: LeadStatus.NEGOTIATION, count: 0, color: '#10b981' },
            { name: 'Cerrados', status: LeadStatus.CLOSED_WON, count: 0, color: '#22c55e' },
        ];

        leads.forEach(lead => {
            const stage = stages.find(s => s.status === lead.status);
            if (stage) stage.count++;
        });

        // Also count all leads that passed through each stage
        const cumulativeStages = stages.map((stage, index) => {
            let total = 0;
            for (let i = index; i < stages.length; i++) {
                total += stages[i].count;
            }
            return { ...stage, value: index === 0 ? leads.length : total };
        });

        return cumulativeStages;
    }, [leads]);

    // Time to close analysis
    const timeToCloseData = useMemo(() => {
        const closedLeads = leads.filter(l =>
            l.status === LeadStatus.CLOSED_WON || l.status === LeadStatus.CLOSED_LOST
        );

        if (closedLeads.length === 0) return { avgDays: 0, breakdown: [] };

        const daysToClose = closedLeads.map(lead => {
            const created = new Date(lead.createdAt);
            const closed = lead.lastContactDate ? new Date(lead.lastContactDate) : new Date();
            const days = Math.ceil((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            return { lead, days };
        });

        const avgDays = daysToClose.reduce((sum, item) => sum + item.days, 0) / daysToClose.length;

        // Breakdown by time ranges
        const breakdown = [
            { range: '1-7 días', count: daysToClose.filter(d => d.days <= 7).length },
            { range: '8-14 días', count: daysToClose.filter(d => d.days > 7 && d.days <= 14).length },
            { range: '15-30 días', count: daysToClose.filter(d => d.days > 14 && d.days <= 30).length },
            { range: '30+ días', count: daysToClose.filter(d => d.days > 30).length },
        ];

        return { avgDays: Math.round(avgDays), breakdown };
    }, [leads]);

    // Source analysis
    const sourceAnalysis = useMemo(() => {
        const sources: Record<string, { total: number; won: number; lost: number }> = {};

        leads.forEach(lead => {
            if (!sources[lead.source]) {
                sources[lead.source] = { total: 0, won: 0, lost: 0 };
            }
            sources[lead.source].total++;
            if (lead.status === LeadStatus.CLOSED_WON) sources[lead.source].won++;
            if (lead.status === LeadStatus.CLOSED_LOST) sources[lead.source].lost++;
        });

        return Object.entries(sources)
            .map(([source, data]) => ({
                source,
                total: data.total,
                won: data.won,
                lost: data.lost,
                conversionRate: data.total > 0 ? Math.round((data.won / data.total) * 100) : 0
            }))
            .sort((a, b) => b.conversionRate - a.conversionRate);
    }, [leads]);

    // Conversion metrics
    const metrics = useMemo(() => {
        const total = leads.length;
        const won = leads.filter(l => l.status === LeadStatus.CLOSED_WON).length;
        const lost = leads.filter(l => l.status === LeadStatus.CLOSED_LOST).length;
        const contacted = leads.filter(l => l.status !== LeadStatus.NEW).length;
        const withVisit = leads.filter(l =>
            l.status === LeadStatus.VISIT_SCHEDULED ||
            l.status === LeadStatus.NEGOTIATION ||
            l.status === LeadStatus.CLOSED_WON
        ).length;

        return {
            total,
            won,
            lost,
            contactRate: total > 0 ? Math.round((contacted / total) * 100) : 0,
            visitRate: contacted > 0 ? Math.round((withVisit / contacted) * 100) : 0,
            closeRate: total > 0 ? Math.round((won / total) * 100) : 0,
            winRate: (won + lost) > 0 ? Math.round((won / (won + lost)) * 100) : 0
        };
    }, [leads]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                    <TrendingUp className="text-purple-400" size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Análisis de Conversión</h2>
                    <p className="text-gray-400 text-sm">Entiende el journey de tus leads</p>
                </div>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    icon={<Target size={20} />}
                    label="Tasa de Contacto"
                    value={`${metrics.contactRate}%`}
                    color="text-blue-400"
                    subtitle="Leads contactados"
                />
                <MetricCard
                    icon={<ArrowRight size={20} />}
                    label="Leads → Visita"
                    value={`${metrics.visitRate}%`}
                    color="text-purple-400"
                    subtitle="Llegaron a visita"
                />
                <MetricCard
                    icon={<Percent size={20} />}
                    label="Tasa de Cierre"
                    value={`${metrics.closeRate}%`}
                    color="text-green-400"
                    subtitle="Del total de leads"
                />
                <MetricCard
                    icon={<Timer size={20} />}
                    label="Tiempo Promedio"
                    value={`${timeToCloseData.avgDays}d`}
                    color="text-orange-400"
                    subtitle="Días hasta cierre"
                />
            </div>

            {/* Funnel Chart */}
            <div className="bg-nexus-surface p-6 rounded-xl border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4">Embudo de Conversión</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <FunnelChart>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0a192f', borderColor: '#FF851B', borderRadius: 8 }}
                                formatter={(value, name) => [`${value} leads`, name]}
                            />
                            <Funnel
                                dataKey="value"
                                data={funnelData}
                                isAnimationActive
                            >
                                <LabelList
                                    position="right"
                                    fill="#fff"
                                    stroke="none"
                                    dataKey="name"
                                    fontSize={12}
                                />
                                <LabelList
                                    position="center"
                                    fill="#fff"
                                    stroke="none"
                                    dataKey="value"
                                    fontSize={14}
                                    fontWeight="bold"
                                />
                                {funnelData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                                ))}
                            </Funnel>
                        </FunnelChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Time to Close Breakdown */}
                <div className="bg-nexus-surface p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-orange-400" />
                        Tiempo Hasta Cierre
                    </h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={timeToCloseData.breakdown} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis type="number" stroke="#9ca3af" />
                                <YAxis dataKey="range" type="category" stroke="#9ca3af" tick={{ fontSize: 11 }} width={80} />
                                <Tooltip contentStyle={{ backgroundColor: '#0a192f', borderColor: '#FF851B', borderRadius: 8 }} />
                                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Leads" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Source Performance */}
                <div className="bg-nexus-surface p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Target size={20} className="text-green-400" />
                        Rendimiento por Fuente
                    </h3>
                    <div className="space-y-3">
                        {sourceAnalysis.slice(0, 5).map((source, index) => (
                            <div key={source.source} className="flex items-center gap-3">
                                <span className="text-gray-400 w-6">{index + 1}.</span>
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-white">{source.source}</span>
                                        <span className="text-green-400 font-bold">{source.conversionRate}%</span>
                                    </div>
                                    <div className="h-2 bg-nexus-base rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                                            style={{ width: `${source.conversionRate}%` }}
                                        />
                                    </div>
                                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <CheckCircle2 size={10} className="text-green-400" /> {source.won} ganados
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <XCircle size={10} className="text-red-400" /> {source.lost} perdidos
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Metric Card Component
function MetricCard({ icon, label, value, color, subtitle }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
    subtitle: string;
}) {
    return (
        <div className="bg-nexus-surface p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-2">
                <span className={color}>{icon}</span>
                <span className="text-gray-400 text-sm">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
    );
}
