'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartDataPoint } from '@/lib/supabase/types';

interface ChartViewProps {
  data: ChartDataPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const ia = payload.find((p: any) => p.dataKey === 'ia')?.value || 0;
    const humano = payload.find((p: any) => p.dataKey === 'humano')?.value || 0;
    const total = ia + humano;
    const horasAhorradas = Math.round(ia * 0.2 * 10) / 10;
    const pctIA = total > 0 ? Math.round((ia / total) * 100) : 0;
    const pctHumano = total > 0 ? 100 - pctIA : 0;

    return (
      <div className="bg-slate-900/95 backdrop-blur-sm text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[200px]">
        <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 flex justify-between">
          <span>{label}</span>
          <span className="text-slate-400 font-normal">Total: {total}</span>
        </div>
        <div className="flex items-center justify-between text-brand-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
            <span>Resueltas por IA:</span>
          </div>
          <span className="font-semibold">{ia} ({pctIA}%)</span>
        </div>
        <div className="flex items-center justify-between text-indigo-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>Derivadas a Humano:</span>
          </div>
          <span className="font-semibold">{humano} ({pctHumano}%)</span>
        </div>
        <div className="pt-1 border-t border-slate-800 text-[11px] text-brand-300/90 flex justify-between">
          <span>Horas ahorradas:</span>
          <span className="font-semibold">{horasAhorradas} h</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function ChartView({ data }: ChartViewProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradientIA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="gradientHumano" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="displayDate"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#64748B' }}
            interval={4}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#64748B' }}
          />
          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="ia"
            name="ia"
            stroke="#10B981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#gradientIA)"
            activeDot={{ r: 5, stroke: '#10B981', strokeWidth: 2, fill: '#FFFFFF' }}
          />
          <Area
            type="monotone"
            dataKey="humano"
            name="humano"
            stroke="#6366F1"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#gradientHumano)"
            activeDot={{ r: 5, stroke: '#6366F1', strokeWidth: 2, fill: '#FFFFFF' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
