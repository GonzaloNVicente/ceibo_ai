'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { DerivedOrdersList } from '@/components/dashboard/derived-orders-list';
import { PedidosCard } from '@/components/dashboard/pedidos-card';
import { PeriodFilter } from '@/components/dashboard/period-filter';
import { TimeSavedCard } from '@/components/dashboard/time-saved-card';
import { ActivityChart, type ChartBar, type ChartChip } from '@/components/dashboard/activity-chart';
import { useAuth } from '@/contexts/auth-context';
import { useBotActivity } from '@/hooks/use-bot-activity';
import { createClient } from '@/lib/supabase/client';
import { createTenantScopedClient } from '@/lib/supabase/tenant-client';
import { ChatSession, DashboardData } from '@/lib/supabase/types';
import { MOCK_TENANTS } from '@/lib/supabase/mock-data';
import { formatCount, formatRelativeTime, formatTimeSaved } from '@/lib/format';
import {
  DEFAULT_TIMEZONE,
  EMPTY_SUMMARY_RAW,
  addDays,
  autoGranularity,
  buildRangeQuery,
  chartRangeFor,
  chartTitle,
  computeDelta,
  formatBucketLabel,
  formatBucketTooltip,
  formatRangeLabel,
  granularityNoun,
  parseRangeParams,
  presetShort,
  presetTitle,
  resolveRange,
  sanitizeCustomRange,
  todayInTimezone,
  toSummaryMetrics,
  weekdayName,
  type DateRange,
  type Granularity,
  type RangePreset,
} from '@/lib/dashboard-range';
import { cn } from '@/lib/utils';

const AUTO_REFRESH_MS = 60_000;
const CLOCK_TICK_MS = 30_000;
const REALTIME_DEBOUNCE_MS = 2_000;

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
  const { isOperative } = useBotActivity();

  const [data, setData] = useState<DashboardData | null>(null);
  const [weekData, setWeekData] = useState<DashboardData | null>(null);
  const [orders, setOrders] = useState<ChatSession[]>([]);
  const [catalog, setCatalog] = useState<Record<string, string>>({});
  const [loadingData, setLoadingData] = useState(true); // Start loading immediately
  const [errorState, setErrorState] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const requestId = useRef(0);

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
    (nextPreset: RangePreset, nextRange: DateRange) => {
      router.replace(`/dashboard?${buildRangeQuery(nextPreset, nextRange, manualGranularity)}`, { scroll: false });
    },
    [router, manualGranularity]
  );

  const handlePresetChange = (next: RangePreset) => {
    updateUrl(next, next === 'custom' ? range : resolveRange(next, today));
  };

  const handleCustomRangeChange = (next: DateRange) => {
    const valid = sanitizeCustomRange(next.from, next.to, today);
    if (valid) updateUrl('custom', valid);
  };

  // --- Carga de datos ---
  const loadDashboardData = useCallback(async () => {
    const thisRequest = ++requestId.current;
    setLoadingData(true);
    setErrorState(null);
    try {
      const tenantClient = createTenantScopedClient(createClient());
      // Los graficos de 7 dias siempre terminan en el ultimo dia del periodo elegido
      const weekRange: DateRange = { from: addDays(range.to, -6), to: range.to };
      const weekIsMain = granularity === 'day' && range.from === weekRange.from;

      const [main, week, escalated] = await Promise.all([
        tenantClient.getDashboardMetrics(range, granularity),
        weekIsMain ? Promise.resolve(null) : tenantClient.getDashboardMetrics(weekRange, 'day'),
        tenantClient.getEscalatedOrders(range, timezone),
      ]);
      if (thisRequest !== requestId.current) return; // llego una respuesta mas nueva

      setData(main);
      setWeekData(week ?? main);
      setOrders(escalated);
      setUpdatedAt(Date.now());
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
      setWeekData(null);
      setOrders([]);
    } finally {
      if (thisRequest === requestId.current) setLoadingData(false);
    }
  }, [router, range, granularity, timezone]);

  const loadRef = useRef(loadDashboardData);
  useEffect(() => {
    loadRef.current = loadDashboardData;
  }, [loadDashboardData]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        loadDashboardData();
      }
    }
  }, [authLoading, user, empresa?.id, loadDashboardData, router]);

  // Catalogo (codigo -> nombre) para mostrar nombres de producto en la lista; mejor esfuerzo
  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    createTenantScopedClient(createClient())
      .getProductCatalog()
      .then((c) => {
        if (!cancelled) setCatalog(c);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, empresa?.id]);

  // Tiempo real: reloj de los "hace X min", refresco periodico y cambios en las conversaciones
  useEffect(() => {
    if (authLoading || !user) return;
    const clock = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    const refresh = setInterval(() => {
      if (document.visibilityState === 'visible') loadRef.current();
    }, AUTO_REFRESH_MS);

    let debounce: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe = () => {};
    try {
      const supabase = createClient() as any;
      const channel = supabase
        .channel('dashboard_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions' }, () => {
          clearTimeout(debounce);
          debounce = setTimeout(() => loadRef.current(), REALTIME_DEBOUNCE_MS);
        })
        .subscribe();
      unsubscribe = () => supabase.removeChannel(channel);
    } catch (err) {
      console.warn('Realtime no disponible en el dashboard:', err);
    }

    return () => {
      clearInterval(clock);
      clearInterval(refresh);
      clearTimeout(debounce);
      unsubscribe();
    };
  }, [authLoading, user]);

  // --- Datos derivados ---
  const ready = data !== null;
  const metrics = useMemo(() => toSummaryMetrics(data?.summary ?? EMPTY_SUMMARY_RAW), [data]);
  const prevMetrics = useMemo(() => toSummaryMetrics(data?.previous.summary ?? EMPTY_SUMMARY_RAW), [data]);

  const tenantName = empresa?.name || 'Ceibo AI Tech Solutions';
  const tenantCode =
    empresa?.id && empresa.id !== MOCK_TENANTS.TENANT_A.id
      ? `CEI-${empresa.id.slice(0, 2).toUpperCase()}-${empresa.id.slice(-6).toUpperCase()}`
      : 'CEI-AR-7F42A9';

  const periodPhrase = presetShort(preset);

  // Comparacion con el periodo anterior: solo si hay algo con que comparar
  const timeDelta = computeDelta(metrics.totalIA, prevMetrics.totalIA);
  const comparison =
    timeDelta.kind === 'up'
      ? `▲ ${timeDelta.pct}% vs. período anterior`
      : timeDelta.kind === 'down'
      ? `▼ ${timeDelta.pct}% vs. período anterior`
      : null;

  const weekBuckets = weekData?.buckets ?? [];
  const weekBars = weekBuckets.map((b, i) => ({
    label: weekdayName(b.date, 'short'),
    value: b.resueltas_ia,
    highlight: i === weekBuckets.length - 1,
  }));
  const weekAiTotal = weekBuckets.reduce((acc, b) => acc + b.resueltas_ia, 0);

  // El grafico grande sigue el periodo elegido y su agrupacion (dia / semana / mes).
  // "Hoy" es un solo dia: se muestran los 7 dias que terminan hoy.
  const chartSource = preset === 'today' ? weekData : data;
  const chartBuckets = chartSource?.buckets ?? [];
  const chartGranularity: Granularity = chartSource?.granularity ?? 'day';
  const chartBars: ChartBar[] = chartBuckets.map((b, i) => {
    const isLast = i === chartBuckets.length - 1;
    let label: string;
    if (chartGranularity === 'day' && b.date === today) {
      label = 'Hoy';
    } else if (chartGranularity === 'day' && chartBuckets.length <= 8) {
      label = `${weekdayName(b.date, 'long')} ${Number(b.date.slice(8, 10))}`;
    } else {
      label = formatBucketLabel(b.date, chartGranularity);
    }
    return {
      label,
      tooltipTitle: formatBucketTooltip(b.date, chartGranularity),
      ai: b.resueltas_ia,
      human: b.derivadas_humano,
      isLast,
    };
  });
  const activityTitle = chartTitle(preset, range);
  const activityCaption = `${formatRangeLabel(chartRangeFor(preset, range))} · ${granularityNoun(chartGranularity)}`;

  const chips: ChartChip[] = [
    {
      text: `${formatCount(metrics.totalConsultas)} ${metrics.totalConsultas === 1 ? 'consulta' : 'consultas'} ${periodPhrase}`,
      tone: 'neutral',
    },
    { text: `${metrics.tasaResolucionIA}% resueltas por la IA`, tone: 'good' },
    {
      text: `${formatCount(metrics.reclamosCount)} ${metrics.reclamosCount === 1 ? 'reclamo' : 'reclamos'}`,
      tone: 'brand', // terracota, igual que las derivadas del grafico
    },
  ];

  const unassigned = orders.filter((o) => !o.assigned_to).length;
  const withSeller = orders.length - unassigned;
  // Valor de los pedidos que hoy estan "listos para cerrar" (ultimo monto estimado de cada cliente)
  const estimatedValue = orders.reduce((acc, o) => acc + (Number(o.estimated_amount) || 0), 0);
  const ordersTitle = preset === 'today' ? 'Pedidos derivados hoy' : `Pedidos derivados · ${presetTitle(preset, range)}`;

  return (
    <div className="flex min-h-[calc(100vh-9.5rem)] flex-col gap-5">
      {errorState && (
        <div className="rounded-md bg-destructive/15 p-4 text-destructive border border-destructive/30 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            <h3 className="font-semibold text-lg">Error de Conexión a Base de Datos</h3>
          </div>
          <p className="mt-1 text-sm">{errorState}</p>
        </div>
      )}

      {/* Encabezado compacto */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="font-semibold">{tenantName}</span>
            <span aria-hidden="true">·</span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 font-semibold',
                isOperative ? 'text-success' : 'text-muted-foreground'
              )}
            >
              <span
                className={cn('size-2 rounded-full', isOperative ? 'live-pulse bg-success' : 'bg-muted-foreground/50')}
                aria-hidden="true"
              />
              {isOperative ? 'Asistente activo' : 'Asistente sin actividad reciente'}
            </span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={loadDashboardData}
              disabled={loadingData}
              aria-label="Actualizar datos"
              title="Actualizar datos"
              className={cn(
                'inline-flex items-center gap-1 rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70',
                errorState && 'font-semibold text-negative hover:text-negative'
              )}
            >
              <RefreshCw className={cn('size-3', loadingData && 'animate-spin')} aria-hidden="true" />
              {errorState
                ? 'error de conexión'
                : updatedAt
                ? `actualizado ${formatRelativeTime(new Date(updatedAt).toISOString(), now)}`
                : 'actualizando...'}
            </button>
            <span
              className="inline-flex text-muted-foreground/70"
              title={`Datos aislados para la empresa [${tenantCode}]`}
            >
              <ShieldCheck className="size-3.5" aria-label={`Datos aislados para la empresa ${tenantCode}`} />
            </span>
          </p>
          <h1 className="mt-1 font-display text-[28px] font-bold leading-tight">Rendimiento de tu asistente</h1>
        </div>

        <div className="flex flex-wrap items-start justify-end gap-3">
          <PeriodFilter
            preset={preset}
            range={range}
            today={today}
            onPresetChange={handlePresetChange}
            onCustomRangeChange={handleCustomRangeChange}
          />
          <Link href="/documents" className={buttonVariants({ variant: 'primary' })}>
            <Sparkles className="size-4" aria-hidden="true" />
            Entrenar asistente
          </Link>
        </div>
      </header>

      {/* Dos protagonistas */}
      <div className="grid gap-5 lg:grid-cols-2">
        <TimeSavedCard
          ready={ready}
          time={formatTimeSaved(metrics.totalIA)}
          periodPhrase={periodPhrase}
          resolvedCount={metrics.totalIA}
          comparison={comparison}
          weekTotal={formatTimeSaved(weekAiTotal)}
          weekBars={weekBars}
        />
        <PedidosCard
          ready={ready}
          total={orders.length}
          unassigned={unassigned}
          withSeller={withSeller}
          estimatedValue={estimatedValue}
          reclamos={metrics.reclamosCount}
        />
      </div>

      {/* Fila inferior: ocupa el resto de la pantalla */}
      <div className="grid flex-1 gap-5 lg:grid-cols-[1.65fr_1fr]">
        <ActivityChart
          title={activityTitle}
          caption={activityCaption}
          ready={ready}
          bars={chartBars}
          chips={chips}
        />
        <DerivedOrdersList title={ordersTitle} ready={ready} orders={orders} catalog={catalog} now={now} />
      </div>
    </div>
  );
}
