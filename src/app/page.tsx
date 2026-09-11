'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricsGrid } from '@/components/dashboard/metrics-grid';
import { AnalyticsChart } from '@/components/dashboard/analytics-chart';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { createTenantScopedClient } from '@/lib/supabase/tenant-client';
import { ChatAnalytics, SummaryMetrics } from '@/lib/supabase/types';
import { calculateSummaryMetrics } from '@/lib/supabase/mock-data';

export default function DashboardPage() {
  const router = useRouter();
  const { user, empresa, perfil, loading: authLoading } = useAuth();

  const [analytics, setAnalytics] = useState<ChatAnalytics[]>([]);
  const [metrics, setMetrics] = useState<SummaryMetrics>({
    totalConsultas: 0,
    totalIA: 0,
    totalHuman: 0,
    horasAhorradas: 0,
    tasaResolucionIA: 0,
  });
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const supabase = createClient();
      const tenantClient = createTenantScopedClient(supabase);
      const rows = await tenantClient.getRecent30Days();
      setAnalytics(rows);
      setMetrics(calculateSummaryMetrics(rows));
    } catch (err: any) {
      console.error('Error fetching dashboard analytics:', err);
      if (err?.message?.includes('UNAUTHORIZED')) {
        router.push('/login');
        return;
      }
      setError(err?.message || 'Error al cargar métricas de WhatsApp.');
    } finally {
      setLoadingData(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        loadDashboardData();
      }
    }
  }, [authLoading, user, empresa?.id, loadDashboardData, router]);

  if (authLoading || (loadingData && analytics.length === 0)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-slate-600">
          Cargando métricas y análisis de WhatsApp...
        </p>
      </div>
    );
  }

  const tenantName = empresa?.name || 'Ceibo AI Tech Solutions';
  const tenantPlan = (empresa?.plan || 'enterprise').toUpperCase();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Dashboard de Rendimiento WhatsApp
            </h1>
            <Badge variant="success" className="inline-flex bg-emerald-100 text-emerald-800 text-xs">
              En Vivo
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Métricas comerciales en tiempo real para <strong>{tenantName}</strong> ({tenantPlan}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={loadingData}
            className="gap-1.5 text-xs text-slate-600"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </Button>

          <Link href="/chats">
            <Button variant="outline" size="sm" className="gap-2">
              <MessageSquare className="w-4 h-4 text-slate-600" />
              <span>Ver Chats</span>
            </Button>
          </Link>

          <Link href="/documents">
            <Button variant="brand" size="sm" className="gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Entrenar Asistente</span>
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* 4 Metric KPI Cards */}
      <MetricsGrid metrics={metrics} />

      {/* 30-Day Comparative Chart */}
      <AnalyticsChart analytics={analytics} />

      {/* Multi-Tenant Security & Context Footer */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-100 rounded-lg text-slate-700">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm">
              Seguridad Multi-Tenant Activa ({tenantName})
            </h4>
            <p className="text-xs text-slate-500">
              Todas las consultas y registros están aislados criptográficamente para la empresa{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">
                {perfil?.empresa_id || empresa?.id}
              </code>
              .
            </p>
          </div>
        </div>

        <Link href="/settings">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <span>Ver detalles del tenant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
