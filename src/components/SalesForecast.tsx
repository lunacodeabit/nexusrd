import { useMemo, useState } from 'react';
import type { Lead } from '../types';
import { LeadStatus } from '../types';
import {
    XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, AreaChart, Area, ReferenceLine
} from 'recharts';
import {
    TrendingUp, Target, AlertTriangle, CheckCircle2,
    Calendar, DollarSign, Zap
} from 'lucide-react';

interface SalesForecastProps {
    leads: Lead[];
}

export default function SalesForecast({ leads }: SalesForecastProps) {
    const [monthlyGoal, setMonthlyGoal] = useState(1000000); // RD$ goal

    // Historical monthly data (last 6 months)
    const historicalData = useMemo(() => {
        const months: Record<string, {
            month: string;
            leads: number;
            won: number;
            revenue: number;
            conversions: number;
        }> = {};

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
            months[monthKey] = { month: monthName, leads: 0, won: 0, revenue: 0, conversions: 0 };
        }

        // Count leads and revenue
        leads.forEach(lead => {
            const date = new Date(lead.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (months[monthKey]) {
                months[monthKey].leads++;
                if (lead.status === LeadStatus.CLOSED_WON) {
                    months[monthKey].won++;
                    months[monthKey].revenue += lead.budget || 0;
                    months[monthKey].conversions++;
                }
            }
        });

        return Object.values(months);
    }, [leads]);

    // Forecast calculation (simple linear regression)
    const forecast = useMemo(() => {
        if (historicalData.length < 2) return { nextMonth: 0, nextQuarter: 0, trend: 'neutral' };

        const revenueData = historicalData.map(d => d.revenue);
        const n = revenueData.length;

        // Simple trend calculation
        const lastMonthRevenue = revenueData[n - 1];
        const prevMonthRevenue = revenueData[n - 2];

        // Growth rate
        const growthRate = prevMonthRevenue > 0
            ? (lastMonthRevenue - prevMonthRevenue) / prevMonthRevenue
            : 0;

        // Forecast next month (with conservative adjustment)
        const nextMonth = Math.round(lastMonthRevenue * (1 + growthRate * 0.7));
        const nextQuarter = Math.round(nextMonth * 3 * (1 + growthRate * 0.5));

        const trend = growthRate > 0.1 ? 'up' : growthRate < -0.1 ? 'down' : 'neutral';

        return { nextMonth, nextQuarter, trend, growthRate: Math.round(growthRate * 100) };
    }, [historicalData]);

    // Goal progress
    const currentMonthRevenue = useMemo(() => {
        const now = new Date();
        return leads
            .filter(l => {
                const date = new Date(l.createdAt);
                return date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear() &&
                    l.status === LeadStatus.CLOSED_WON;
            })
            .reduce((sum, l) => sum + (l.budget || 0), 0);
    }, [leads]);

    const goalProgress = Math.round((currentMonthRevenue / monthlyGoal) * 100);
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const currentDay = new Date().getDate();
    const expectedProgress = Math.round((currentDay / daysInMonth) * 100);

    // Alerts
    const alerts = useMemo(() => {
        const alertsList: { type: 'warning' | 'success' | 'danger'; message: string }[] = [];

        if (goalProgress < expectedProgress - 20) {
            alertsList.push({
                type: 'danger',
                message: `Estás ${expectedProgress - goalProgress}% por debajo del ritmo esperado`
            });
        } else if (goalProgress >= expectedProgress) {
            alertsList.push({
                type: 'success',
                message: '¡Vas por buen camino para cumplir la meta!'
            });
        }

        if (forecast.trend === 'down') {
            alertsList.push({
                type: 'warning',
                message: 'Tendencia a la baja detectada. Considera aumentar seguimientos.'
            });
        }

        const hotLeads = leads.filter(l => l.score?.category === 'HOT').length;
        if (hotLeads >= 3) {
            alertsList.push({
                type: 'success',
                message: `Tienes ${hotLeads} leads HOT listos para cerrar`
            });
        }

        return alertsList;
    }, [goalProgress, expectedProgress, forecast, leads]);

    // Pipeline value (potential revenue)
    const pipelineValue = useMemo(() => {
        return leads
            .filter(l =>
                l.status !== LeadStatus.CLOSED_WON &&
                l.status !== LeadStatus.CLOSED_LOST
            )
            .reduce((sum, l) => {
                const probability =
                    l.status === LeadStatus.NEGOTIATION ? 0.7 :
                        l.status === LeadStatus.VISIT_SCHEDULED ? 0.4 :
                            l.status === LeadStatus.CONTACTED ? 0.2 :
                                0.1;
                return sum + ((l.budget || 0) * probability);
            }, 0);
    }, [leads]);

    // Chart data with forecast
    const chartData = useMemo(() => {
        const data: Array<{
            month: string;
            leads: number;
            won: number;
            revenue: number;
            conversions: number;
            forecast?: number;
        }> = [...historicalData];

        // Add forecast months
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() + 1);
        data.push({
            month: lastMonth.toLocaleDateString('es-ES', { month: 'short' }) + '*',
            leads: 0,
            won: 0,
            revenue: 0,
            conversions: 0,
            forecast: forecast.nextMonth
        });

        return data;
    }, [historicalData, forecast]);

    const formatCurrency = (value: number) => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
        return `$${value}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                        <Zap className="text-green-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Predicción de Ventas</h2>
                        <p className="text-gray-400 text-sm">Proyecciones basadas en datos históricos</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Meta mensual:</span>
                    <select
                        value={monthlyGoal}
                        onChange={(e) => setMonthlyGoal(parseInt(e.target.value))}
                        className="bg-nexus-surface border border-white/10 rounded-lg px-3 py-1 text-white text-sm"
                    >
                        <option value={500000}>RD$ 500K</option>
                        <option value={1000000}>RD$ 1M</option>
                        <option value={2000000}>RD$ 2M</option>
                        <option value={5000000}>RD$ 5M</option>
                    </select>
                </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <div className="space-y-2">
                    {alerts.map((alert, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg flex items-center gap-3 ${alert.type === 'danger' ? 'bg-red-500/20 border border-red-500/30' :
                                alert.type === 'warning' ? 'bg-yellow-500/20 border border-yellow-500/30' :
                                    'bg-green-500/20 border border-green-500/30'
                                }`}
                        >
                            {alert.type === 'danger' && <AlertTriangle className="text-red-400" size={18} />}
                            {alert.type === 'warning' && <AlertTriangle className="text-yellow-400" size={18} />}
                            {alert.type === 'success' && <CheckCircle2 className="text-green-400" size={18} />}
                            <span className={`text-sm ${alert.type === 'danger' ? 'text-red-300' :
                                alert.type === 'warning' ? 'text-yellow-300' :
                                    'text-green-300'
                                }`}>{alert.message}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ForecastCard
                    icon={<Target size={20} />}
                    label="Progreso Meta"
                    value={`${goalProgress}%`}
                    color={goalProgress >= expectedProgress ? 'text-green-400' : 'text-yellow-400'}
                    subtitle={`${formatCurrency(currentMonthRevenue)} / ${formatCurrency(monthlyGoal)}`}
                />
                <ForecastCard
                    icon={<TrendingUp size={20} />}
                    label="Forecast Mes"
                    value={formatCurrency(forecast.nextMonth)}
                    color="text-blue-400"
                    subtitle={`${(forecast.growthRate || 0) > 0 ? '+' : ''}${forecast.growthRate || 0}% vs anterior`}
                />
                <ForecastCard
                    icon={<Calendar size={20} />}
                    label="Forecast Trimestre"
                    value={formatCurrency(forecast.nextQuarter)}
                    color="text-purple-400"
                    subtitle="Proyección 3 meses"
                />
                <ForecastCard
                    icon={<DollarSign size={20} />}
                    label="Pipeline Valor"
                    value={formatCurrency(pipelineValue)}
                    color="text-orange-400"
                    subtitle="Valor ponderado"
                />
            </div>

            {/* Goal Progress Bar */}
            <div className="bg-nexus-surface p-6 rounded-xl border border-white/5">
                <div className="flex justify-between mb-3">
                    <span className="text-white font-medium">Progreso hacia la meta mensual</span>
                    <span className="text-nexus-accent font-bold">{goalProgress}%</span>
                </div>
                <div className="relative h-6 bg-nexus-base rounded-full overflow-hidden">
                    {/* Expected progress marker */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10"
                        style={{ left: `${expectedProgress}%` }}
                    />
                    {/* Actual progress */}
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${goalProgress >= expectedProgress
                            ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                            : 'bg-gradient-to-r from-yellow-500 to-orange-400'
                            }`}
                        style={{ width: `${Math.min(goalProgress, 100)}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Inicio de mes</span>
                    <span>Día {currentDay} de {daysInMonth} ({expectedProgress}% esperado)</span>
                    <span>Meta: {formatCurrency(monthlyGoal)}</span>
                </div>
            </div>

            {/* Revenue Trend Chart */}
            <div className="bg-nexus-surface p-6 rounded-xl border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-green-400" />
                    Tendencia de Ingresos (6 meses + forecast)
                </h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                            <YAxis
                                stroke="#9ca3af"
                                tick={{ fontSize: 11 }}
                                tickFormatter={(val) => formatCurrency(val)}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0a192f', borderColor: '#FF851B', borderRadius: 8 }}
                                formatter={(value) => [formatCurrency(Number(value) || 0), 'Ingresos']}
                            />
                            <ReferenceLine y={monthlyGoal} stroke="#FF851B" strokeDasharray="5 5" label={{ value: 'Meta', fill: '#FF851B', fontSize: 12 }} />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#10b981"
                                fill="#10b98130"
                                strokeWidth={2}
                                name="Ingresos Reales"
                            />
                            <Area
                                type="monotone"
                                dataKey="forecast"
                                stroke="#3b82f6"
                                fill="#3b82f630"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                name="Forecast"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">* Valores proyectados basados en tendencias históricas</p>
            </div>

            {/* Monthly Breakdown */}
            <div className="bg-nexus-surface p-6 rounded-xl border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4">Desglose Mensual</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-400 border-b border-white/10">
                                <th className="text-left py-2">Mes</th>
                                <th className="text-right py-2">Leads</th>
                                <th className="text-right py-2">Cerrados</th>
                                <th className="text-right py-2">Conversión</th>
                                <th className="text-right py-2">Ingresos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historicalData.map((month, index) => (
                                <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-2 text-white font-medium">{month.month.toUpperCase()}</td>
                                    <td className="py-2 text-right text-gray-300">{month.leads}</td>
                                    <td className="py-2 text-right text-green-400">{month.won}</td>
                                    <td className="py-2 text-right text-blue-400">
                                        {month.leads > 0 ? Math.round((month.won / month.leads) * 100) : 0}%
                                    </td>
                                    <td className="py-2 text-right text-nexus-accent font-medium">
                                        {formatCurrency(month.revenue)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Forecast Card Component
function ForecastCard({ icon, label, value, color, subtitle }: {
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
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
    );
}
