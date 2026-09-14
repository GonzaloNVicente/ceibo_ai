import React from 'react';
import { MessageSquare, Clock, Sparkles, Users } from 'lucide-react';
import { MetricCard } from './metric-card';
import { SummaryMetrics } from '@/lib/supabase/types';

interface MetricsGridProps {
  metrics: SummaryMetrics;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  // Equivalent full-time sales representatives saved (160h/month = 40h/week * 4 weeks)
  const repEquivalent = metrics.horasAhorradas > 0 ? (metrics.horasAhorradas / 160).toFixed(1) : '0.0';
  const humanPercentage = metrics.totalConsultas > 0 ? 100 - metrics.tasaResolucionIA : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Volumen de Consultas */}
      <MetricCard
        title="Volumen de Consultas"
        value={metrics.totalConsultas.toLocaleString()}
        icon={MessageSquare}
        trendText="+18.4% vs mes anterior"
        subtext="Últimos 30 días de actividad WhatsApp"
        iconColor="text-brand-600"
        iconBgColor="bg-brand-50"
      />

      {/* 2. Horas de Venta Ahorradas */}
      <MetricCard
        title="Horas Ahorradas"
        value={`${metrics.horasAhorradas.toFixed(1)} h`}
        icon={Clock}
        trendText="12 min promedio ahorrado por chat"
        subtext={`Equivale a ~${repEquivalent} asesores FTE de ventas liberados`}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-50"
      />

      {/* 3. Tasa de Resolución IA */}
      <MetricCard
        title="Tasa de Resolución IA"
        value={`${metrics.tasaResolucionIA}%`}
        icon={Sparkles}
        trendText={`${metrics.totalIA.toLocaleString()} resueltas por IA`}
        subtext="Sin intervención de asesor humano"
        iconColor="text-brand-600"
        iconBgColor="bg-brand-50"
        valueColor="text-brand-700"
      />

      {/* 4. Derivadas a Humano */}
      <MetricCard
        title="Derivadas a Humano"
        value={metrics.totalHuman.toLocaleString()}
        icon={Users}
        trendText={`${humanPercentage}% escaladas a cierre`}
        trendPositive={false}
        subtext="Leads calificados para asesor comercial"
        iconColor="text-amber-600"
        iconBgColor="bg-amber-50"
      />
    </div>
  );
}
