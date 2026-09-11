'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatAnalytics, ChartDataPoint } from '@/lib/supabase/types';

// Native SVG Fallback rendered during SSR and initial hydration
function SvgChartFallback({ data }: { data: ChartDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 w-full flex items-center justify-center text-xs text-slate-400">
        No hay datos de consultas en los últimos 30 días.
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.total), 10);
  const height = 240;
  const width = 800;
  const stepX = width / (data.length - 1 || 1);

  // Generate SVG path points
  const pointsIA = data
    .map((d, i) => `${i * stepX},${height - (d.ia / maxVal) * (height - 30)}`)
    .join(' ');

  const pointsHumano = data
    .map((d, i) => `${i * stepX},${height - (d.humano / maxVal) * (height - 30)}`)
    .join(' ');

  return (
    <div className="h-72 w-full flex flex-col justify-end">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 overflow-visible">
        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            y1={height - ratio * (height - 30)}
            x2={width}
            y2={height - ratio * (height - 30)}
            stroke="#E2E8F0"
            strokeDasharray="3 3"
          />
        ))}

        {/* Humano line */}
        <polyline
          fill="none"
          stroke="#6366F1"
          strokeWidth="2.5"
          points={pointsHumano}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* IA line */}
        <polyline
          fill="none"
          stroke="#10B981"
          strokeWidth="2.5"
          points={pointsIA}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* X-Axis labels */}
      <div className="flex justify-between text-[11px] text-slate-400 mt-2 px-1">
        <span>{data[0]?.displayDate}</span>
        <span>{data[Math.floor(data.length / 2)]?.displayDate}</span>
        <span>{data[data.length - 1]?.displayDate}</span>
      </div>
    </div>
  );
}

// Dynamically import Recharts to avoid SSR hydration issues
const ChartView = dynamic(() => import('./chart-view'), {
  ssr: false,
  loading: () => null,
});

interface AnalyticsChartProps {
  analytics: ChatAnalytics[];
}

export function AnalyticsChart({ analytics }: AnalyticsChartProps) {
  // Format data for Recharts presentation
  const chartData: ChartDataPoint[] = React.useMemo(() => {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return analytics.map((row) => {
      const cleanDate = (row.date || '').split('T')[0];
      const parts = cleanDate.split('-');
      const day = (parts[2] || '01').padStart(2, '0');
      const monthIdx = parseInt(parts[1] || '1', 10) - 1;
      const displayDate = `${day} ${monthNames[monthIdx] || ''}`;

      return {
        date: row.date,
        displayDate,
        ia: row.resueltas_ia,
        humano: row.derivadas_humano,
        total: row.total_consultas,
        horasAhorradas: row.horas_ahorradas,
      };
    });
  }, [analytics]);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-4">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">
            Evolución de consultas — últimos 30 días
          </CardTitle>
          <CardDescription>
            Comparativa diaria entre consultas resueltas autónomamente por Ceibo AI vs casos derivados a asesores.
          </CardDescription>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-500" />
            <span className="font-medium text-slate-700">Resueltas por IA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-indigo-500" />
            <span className="font-medium text-slate-700">Derivadas a humano</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {mounted ? (
          <ChartView data={chartData} />
        ) : (
          <SvgChartFallback data={chartData} />
        )}
      </CardContent>
    </Card>
  );
}
