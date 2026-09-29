'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Boxes,
  LockKeyhole,
  MessageCircleMore,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { PeriodFilter } from '@/components/dashboard/period-filter';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { createTenantScopedClient } from '@/lib/supabase/tenant-client';
import { DashboardData } from '@/lib/supabase/types';
import { MOCK_TENANTS } from '@/lib/supabase/mock-data';
import {
  DEFAULT_TIMEZONE,
  EMPTY_SUMMARY_RAW,
  autoGranularity,
  buildRangeQuery,
  computeDelta,
  formatBucketLabel,
  formatBucketTooltip,
  formatRangeLabel,
  parseRangeParams,
  presetTitle,
  resolveRange,
  sanitizeCustomRange,
  todayInTimezone,
  toSummaryMetrics,
  type DateRange,
  type Granularity,
  type RangePreset,
} from '@/lib/dashboard-range';

function ActivityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string; payload?: { tooltipTitle?: string } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 shadow-panel">
      <p className="mb-1.5 text-xs font-bold">{payload[0]?.payload?.tooltipTitle ?? label}</p>
      {payload.map((item) => (
        <p key={item.name} className="text-[11px] text-muted-foreground">
          <span className="font-bold text-foreground">{item.value}</span> {item.name}
        </p>
      ))}
    </div>
  );
}

type DeltaTone = 'good' | 'bad' | 'neutral';
interface DeltaView {
  text: string;
  tone: DeltaTone;
  icon?: 'up' | 'down';
}

/** Compara con el periodo anterior. `upIsGood=false` deja el color neutro (p. ej. derivadas a humano). */
function percentDelta(current: number, previous: number, upIsGood: boolean): DeltaView | null {
  const d = computeDelta(current, previous);
  switch (d.kind) {
    case 'none':
      return null;
    case 'new':
      return { text: 'Sin datos en el período anterior', tone: 'neutral' };
    case 'flat':
      return { text: 'Sin cambios vs. período anterior', tone: 'neutral' };
    case 'up':
      return { text: `${d.pct}% vs. período anterior`, tone: upIsGood ? 'good' : 'neutral', icon: 'up' };
    case 'down':
      return { text: `${d.pct}% vs. período anterior`, tone: upIsGood ? 'bad' : 'neutral', icon: 'down' };
  }
}

function pointsDelta(current: number, previous: number, hadPrevious: boolean, hasCurrent: boolean): DeltaView | null {
  if (!hasCurrent && !hadPrevious) return null;
  if (!hadPrevious) return { text: 'Sin datos en el período anterior', tone: 'neutral' };
  const diff = current - previous;
  if (diff === 0) return { text: 'Sin cambios vs. período anterior', tone: 'neutral' };
  return {
    text: `${Math.abs(diff)} pts vs. período anterior`,
    tone: diff > 0 ? 'good' : 'bad',
    icon: diff > 0 ? 'up' : 'down',
  };
}

function DeltaLine({ delta }: { delta: DeltaView | null }) {
  if (!delta) return <div className="mt-2 h-4" aria-hidden="true" />;
  const color =
    delta.tone === 'good' ? 'text-success' : delta.tone === 'bad' ? 'text-destructive' : 'text-muted-foreground';
  return (
    <p className={`mt-2 flex h-4 items-center gap-1 text-[11px] font-semibold ${color}`}>
      {delta.icon === 'up' && <TrendingUp className="size-3.5" strokeWidth={2.2} />}
      {delta.icon === 'down' && <TrendingDown className="size-3.5" strokeWidth={2.2} />}
      {delta.text}
    </p>
  );
}

export default function DashboardPage() {
  // useSearchParams() exige un limite de Suspense en Next 14 (App Router)
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, empresa, loading: authLoading } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loadingData, setLoadingData] = useState(true); // Start loading immediately
  const [errorState, setErrorState] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('actualizando...');
  const [mounted, setMounted] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Periodo elegido (vive en la URL: se puede compartir y sobrevive a recargar) ---
  const timezone = empresa?.timezone || DEFAULT_TIMEZONE;
  const today = useMemo(() => todayInTimezone(timezone), [timezone]);
  const {
    preset,
    range,
    granularity: manualGranularity,
  } = useMemo(() => parseRangeParams(searchParams, today), [searchParams, today]);
  const granularity: Granularity = manualGranularity ?? autoGranularity(range);

  const updateUrl = useCallback(
    (nextPreset: RangePreset, nextRange: DateRange, nextGranularity: Granularity | null) => {
      router.replace(`/dashboard?${buildRangeQuery(nextPreset, nextRange, nextGranularity)}`, { scroll: false });
    },
    [router]
  );

  const handlePresetChange = (next: RangePreset) => {
    if (next === 'custom') {
      updateUrl('custom', range, manualGranularity);
    } else {
      updateUrl(next, resolveRange(next, today), manualGranularity);
    }
  };

  const handleCustomRangeChange = (next: DateRange) => {
    const valid = sanitizeCustomRange(next.from, next.to, today);
    if (valid) updateUrl('custom', valid, manualGranularity);
  };

  const handleGranularityChange = (next: Granularity | null) => updateUrl(preset, range, next);

  // --- Carga de datos ---
  const loadDashboardData = useCallback(async () => {
    const thisRequest = ++requestId.current;
    setLoadingData(true);
    setErrorState(null);
    try {
      const supabase = createClient();
      const tenantClient = createTenantScopedClient(supabase);
      const result = await tenantClient.getDashboardMetrics(range, granularity);
      if (thisRequest !== requestId.current) return; // llego una respuesta mas nueva
      setData(result);
      setLastUpdated('hace un momento');
    } catch (err: any) {
      if (thisRequest !== requestId.current) return;
      console.error('Error fetching dashboard analytics:', err);
      if (err?.message?.includes('UNAUTHORIZED')) {
        router.push('/login');
        return;
      }
      // If it's a real database error, surface it instead of silently failing
      setErrorState(err.message || 'Error desconocido al conectar con la base de datos.');
      setData(null);
      setLastUpdated('error de conexión');
    } finally {
      if (thisRequest === requestId.current) setLoadingData(false);
    }
  }, [router, range, granularity]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        loadDashboardData();
      }
    }
  }, [authLoading, user, empresa?.id, loadDashboardData, router]);

  const tenantName = empresa?.name || 'Ceibo AI Tech Solutions';
  const tenantPlan = (empresa?.plan || 'enterprise').toUpperCase();
  const tenantCode =
    empresa?.id && empresa.id !== MOCK_TENANTS.TENANT_A.id
      ? `CEI-${empresa.id.slice(0, 2).toUpperCase()}-${empresa.id.slice(-6).toUpperCase()}`
      : 'CEI-AR-7F42A9';

  const metrics = useMemo(() => toSummaryMetrics(data?.summary ?? EMPTY_SUMMARY_RAW), [data]);
  const prevMetrics = useMemo(() => toSummaryMetrics(data?.previous.summary ?? EMPTY_SUMMARY_RAW), [data]);

  const periodName = presetTitle(preset, range);
  const repEquivalent = metrics.horasAhorradas > 0 ? (metrics.horasAhorradas / 160).toFixed(1) : '0.0';
  const humanPercentage = metrics.totalConsultas > 0 ? 100 - metrics.tasaResolucionIA : 0;
  const leadsConMonto = metrics.leadsConMonto ?? 0;

  const metricCards = useMemo(
    () => [
      {
        label: 'Volumen de Consultas',
        value: metrics.totalConsultas.toLocaleString(),
        delta: percentDelta(metrics.totalConsultas, prevMetrics.totalConsultas, true),
        note: `${periodName} de actividad WhatsApp`,
        tone: 'success' as const,
      },
      {
        label: 'Horas Ahorradas',
        value: `${metrics.horasAhorradas.toFixed(1)} h`,
        delta: percentDelta(metrics.horasAhorradas, prevMetrics.horasAhorradas, true),
        note: `Equivale a ~${repEquivalent} asesores FTE de ventas liberados`,
        tone: 'neutral' as const,
      },
      {
        label: 'Tasa de Resolución IA',
        value: `${metrics.tasaResolucionIA}%`,
        delta: pointsDelta(
          metrics.tasaResolucionIA,
          prevMetrics.tasaResolucionIA,
          prevMetrics.totalConsultas > 0,
          metrics.totalConsultas > 0
        ),
        detail: `${metrics.totalIA.toLocaleString()} resueltas por IA`,
        note: 'Sin intervención de asesor humano',
        tone: 'success' as const,
      },
      {
        label: 'Derivadas a Humano',
        value: metrics.totalHuman.toLocaleString(),
        delta: percentDelta(metrics.totalHuman, prevMetrics.totalHuman, false),
        detail: (
          <div className="flex flex-col gap-1 mt-1 text-foreground/80 font-normal">
            <div className="flex justify-between items-center text-[11px]"><span>Pedidos y presupuestos:</span> <span className="font-bold">{metrics.pedidosCount}</span></div>
            <div className="flex justify-between items-center text-[11px]"><span>Reclamos:</span> <span className="font-bold">{metrics.reclamosCount}</span></div>
          </div>
        ),
        note: `${humanPercentage}% escaladas a cierre. Leads calificados.`,
        tone: 'ceibo' as const,
      },
    ],
    [metrics, prevMetrics, repEquivalent, humanPercentage, periodName]
  );

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.buckets.map((b) => ({
      date: formatBucketLabel(b.date, data.granularity),
      tooltipTitle: formatBucketTooltip(b.date, data.granularity),
      fullDate: b.date,
      ai: b.resueltas_ia,
      human: b.derivadas_humano,
      total: b.total_consultas,
    }));
  }, [data]);

  const dateRangeStr = `${periodName} · ${formatRangeLabel(range)}`;
  const pipelineDelta = percentDelta(metrics.valorEstimado, prevMetrics.valorEstimado, true);
  const hasData = metrics.totalConsultas > 0;

  return (
    <>
      {errorState && (
        <div className="mb-6 rounded-md bg-destructive/15 p-4 text-destructive border border-destructive/30 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            <h3 className="font-semibold text-lg">Error de Conexión a Base de Datos</h3>
          </div>
          <p className="mt-1 text-sm">{errorState}</p>
        </div>
      )}

      {/* Dashboard Page Header */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-success/25 bg-success/10 px-2.5 text-xs font-bold text-success">
              <span className="live-pulse size-2 rounded-full bg-success" /> En Vivo
            </span>
            <span className="text-xs text-muted-foreground">Actualizado {lastUpdated}</span>
          </div>
          <h1 className="max-w-[22ch] font-display text-3xl font-bold leading-[1.08] sm:text-4xl">
            Dashboard de Rendimiento WhatsApp
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Métricas comerciales en tiempo real para {tenantName} ({tenantPlan})
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button aria-label="Actualizar métricas" onClick={loadDashboardData} disabled={loadingData}>
            <RefreshCw className={`size-4 ${loadingData ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Link href="/chats">
            <Button>
              <MessageCircleMore className="size-4" />
              Ver Chats
            </Button>
          </Link>
          <Link href="/documents">
            <Button variant="primary">
              <Sparkles className="size-4" />
              Entrenar Asistente
            </Button>
          </Link>
        </div>
      </div>

      {/* Selector de periodo: controla tarjetas, pipeline y grafico */}
      <PeriodFilter
        preset={preset}
        range={range}
        manualGranularity={manualGranularity}
        granularity={granularity}
        today={today}
        onPresetChange={handlePresetChange}
        onCustomRangeChange={handleCustomRangeChange}
        onGranularityChange={handleGranularityChange}
      />

      {/* Highlighted Income Card */}
      <section className="mt-6 overflow-hidden rounded-lg border border-success/40 bg-success/5 shadow-sm p-6 relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="w-24 h-24 text-success" />
        </div>
        <div className="relative z-10">
          <p className="font-sans text-sm font-bold text-success/80 uppercase tracking-wider">Valor Estimado en Pipeline</p>
          <p className="mt-2 font-display text-4xl sm:text-5xl font-bold text-success">
            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(metrics.valorEstimado)}
          </p>
          <DeltaLine delta={pipelineDelta} />
          <p className="font-sans mt-2 max-w-lg text-sm text-muted-foreground">
            {periodName}: último monto estimado de cada cliente con pedido o presupuesto (cantidad pedida × precio de tu catálogo)
            {leadsConMonto > 0 ? ` · ${leadsConMonto} ${leadsConMonto === 1 ? 'cliente' : 'clientes'}` : ''}.
          </p>
        </div>
      </section>

      {/* MetricBand: Unified 4-KPI Card */}
      <section aria-label="Métricas principales" className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-panel">
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-border">
          {metricCards.map((metric, index) => (
            <article
              key={metric.label}
              className={`relative min-h-48 p-5 ${index < 2 ? 'border-b border-border xl:border-b-0' : ''} ${index % 2 === 0 ? 'sm:border-r sm:border-border xl:border-r-0' : ''}`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 ${
                  metric.tone === 'ceibo'
                    ? 'bg-ceibo'
                    : metric.tone === 'success'
                    ? 'bg-success'
                    : 'bg-foreground/20'
                }`}
              />
              <p className="font-sans text-sm font-bold text-muted-foreground">{metric.label}</p>
              <p
                className={`mt-3 font-display text-[38px] font-bold leading-none ${
                  metric.tone === 'ceibo' ? 'text-ceibo' : 'text-foreground'
                }`}
              >
                {metric.value}
              </p>
              <DeltaLine delta={metric.delta} />
              <div
                className={`font-sans mt-2 text-xs font-bold ${
                  metric.tone === 'success'
                    ? 'text-success'
                    : metric.tone === 'ceibo'
                    ? 'text-ceibo'
                    : 'text-foreground/70'
                }`}
              >
                {metric.detail}
              </div>
              <p className="font-sans mt-2 max-w-[27ch] text-[11px] leading-4 text-muted-foreground">
                {metric.note}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ActivityChart: 310px Recharts AreaChart with dual gradients */}
      <section className="mt-5 border border-border bg-card p-5 shadow-panel sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="size-5 text-primary" strokeWidth={1.8} />
              <h2 className="font-display text-lg font-bold">Evolución de consultas</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {dateRangeStr} · por {granularity === 'day' ? 'día' : granularity === 'week' ? 'semana' : 'mes'}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-sm bg-success" />
              Resueltas por IA
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-sm bg-ceibo" />
              Derivadas a humano
            </span>
          </div>
        </div>
        <div
          className="relative mt-5 h-[310px] w-full"
          aria-label="Gráfico de consultas resueltas por IA y derivadas a humano"
        >
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="aiFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--success)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--success)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="humanFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--ceibo)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--ceibo)" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--grid-line)" vertical={false} strokeDasharray="3 5" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                />
                <Tooltip
                  content={<ActivityTooltip />}
                  cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="ai"
                  name="resueltas por IA"
                  stroke="var(--success)"
                  strokeWidth={2.5}
                  fill="url(#aiFill)"
                  activeDot={{ r: 4, fill: 'var(--success)', stroke: 'var(--card)', strokeWidth: 2 }}
                />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="human"
                  name="derivadas a humano"
                  stroke="var(--ceibo)"
                  strokeWidth={2.5}
                  fill="url(#humanFill)"
                  activeDot={{ r: 4, fill: 'var(--ceibo)', stroke: 'var(--card)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full animate-pulse rounded-md bg-secondary/30" />
          )}
          {mounted && !loadingData && !errorState && !hasData && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <p className="rounded-md border border-border bg-card/90 px-4 py-2 text-sm text-muted-foreground shadow-panel">
                No hay consultas en este período
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Security Footer: Multi-Tenant Active Banner */}
      <footer className="mt-5 flex flex-col gap-3 border border-accent/20 bg-accent/5 p-4 sm:flex-row sm:items-center">
        <div className="grid size-10 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
          <ShieldCheck className="size-5" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold">Seguridad multi-tenant activa</p>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            Todas las consultas y registros están aislados criptográficamente para la empresa{' '}
            <span className="font-bold text-foreground">[{tenantCode}]</span>.
          </p>
        </div>
        <div className="ml-auto hidden items-center gap-2 text-xs font-semibold text-success md:flex">
          <LockKeyhole className="size-4" /> Protección verificada
        </div>
      </footer>
    </>
  );
}
