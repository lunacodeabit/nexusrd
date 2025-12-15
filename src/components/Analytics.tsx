import React from 'react';
import type { DailyKPI } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface AnalyticsProps {
  data: DailyKPI[];
}

const Analytics: React.FC<AnalyticsProps> = ({ data }) => {
  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-white">Métricas de Rendimiento (Acciones Diarias)</h2>
      
      <div className="bg-nexus-surface p-6 rounded-xl border border-white/5 shadow-lg h-[400px]">
        <h3 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-widest">Actividad Semanal</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="date" stroke="#9ca3af" tick={{fontSize: 12}} tickFormatter={(val) => val.slice(5)} />
            <YAxis stroke="#9ca3af" tick={{fontSize: 12}} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#001f3f', borderColor: '#FF851B', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="callsMade" name="Llamadas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="emailsSent" name="Emails" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="visitsConducted" name="Visitas" fill="#FF851B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Analytics;
