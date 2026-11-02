'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FocusTabs, PANEL_IDS, type DashTab } from '@/components/dashboard/focus-tabs';
import { Icon } from '@/components/dashboard/icons';
import { MoneyPanel, TimePanel } from '@/components/dashboard/panels';
import { PeriodFilter } from '@/components/dashboard/period-filter';
import { EmptyState, ErrorAlert, PanelSkeleton, TilesSkeleton } from '@/components/dashboard/states';
import { TilesRow, type DataState } from '@/components/dashboard/tiles-row';
import { useAuth } from '@/contexts/auth-context';
import { useBotActivity } from '@/hooks/use-bot-activity';
import { createClient } from '@/lib/supabase/client';
import { createTenantScopedClient } from '@/lib/supabase/tenant-client';
import type { DashboardOverview } from '@/lib/supabase/types';
import { formatRelativeTime } from '@/lib/format';
import {
  DEFAULT_TIMEZONE,
  autoGranularity,
  buildRangeQuery,
  daysInRange,
  parseRangeParams,
  resolveRange,
  sanitizeCustomRange,
  todayInTimezone,
  type DateRange,
  type Granularity,
  type RangePreset,
} from '@/lib/dashboard-range';
import {
  EMPTY_OVERVIEW_SUMMARY,
  buildChartModel,
  buildMoneyModel,
  buildTiles,
  buildTimeModel,
  periodSuffix,
  rangeLower,
  tilesAriaLabel,
} from '@/lib/dashboard-overview';

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

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true); // Start loading immediately
  const [errorState, setErrorState] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const requestId = useRef(0);

  // --- Periodo y pestaña elegidos (viven en la URL: se pueden compartir y sobreviven a recargar) ---
  const timezone = empresa?.timezone || DEFAULT_TIMEZONE;
  const today = useMemo(() => todayInTimezone(timezone), [timezone]);
  const {
    preset,
    range,
    granularity: manualGranularity,
  } = useMemo(() => parseRangeParams(searchParams, today), [searchParams, today]);
  const granularity: Granularity = manualGranularity ?? autoGranularity(range);
  const tab: DashTab = searchParams.get('vista') === 'dinero' ? 'dinero' : 'tiempo';
  const rangeKey = `${range.from}|${range.to}|${granularity}`;

  const updateUrl = useCallback(
    (nextPreset: RangePreset, nextRange: DateRange, nextTab: DashTab) => {
      const query = buildRangeQuery(nextPreset, nextRange, manualGranularity);
      router.replace(`/dashboard?${query}${nextTab === 'dinero' ? '&vista=dinero' : ''}`, { scroll: false });
    },
    [router, manualGranularity]
  );

  const handlePresetChange = (next: RangePreset) => {
    updateUrl(next, next === 'custom' ? range : resolveRange(next, today), tab);
  };
  const handleCustomRangeChange = (next: DateRange) => {
    const valid = sanitizeCustomRange(next.from, next.to, today);
    if (valid) updateUrl('custom', valid, tab);
  };
  const handleTab = (next: DashTab) => updateUrl(preset, range, next);
  // Sin datos: se sugiere un periodo MAS LARGO que el elegido (nunca el mismo)
  const emptySuggestion =
    preset === 'today' || preset === '7d'
      ? { hint: 'Probá con 30 días.', label: 'Ver los últimos 30 días', next: '30d' as const }
      : preset === '30d' || preset === 'this_month' || preset === 'last_month'
      ? { hint: 'Probá con 90 días.', label: 'Ver los últimos 90 días', next: '90d' as const }
      : null;

  // --- Carga de datos ---
  const loadDashboardData = useCallback(async () => {
    const thisRequest = ++requestId.current;
    setLoadingData(true);
    setErrorState(null);
    try {
      const tenantClient = createTenantScopedClient(createClient());
      const result = await tenantClient.getDashboardOverview(range, granularity);
      if (thisRequest !== requestId.current) return; // llego una respuesta mas nueva
      setOverview(result);
      setLoadedKey(`${range.from}|${range.to}|${granularity}`);
      setUpdatedAt(Date.now());
    } catch (err: any) {
      if (thisRequest !== requestId.current) return;
      console.error('Error fetching dashboard overview:', err);
      if (err?.message?.includes('UNAUTHORIZED')) {
        router.push('/login');
        return;
      }
      // If it's a real database error, surface it instead of silently failing (ver CLAUDE.md, bug 5)
      setErrorState(err?.message || 'Error desconocido al conectar con la base de datos.');
      setOverview(null);
      setLoadedKey(null);
    } finally {
      if (thisRequest === requestId.current) setLoadingData(false);
    }
  }, [router, range, granularity]);

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

  // --- Estado de la pantalla ---
  // "cargando" solo cuando todavia no hay datos de ESTE periodo (el refresco de fondo no parpadea)
  const loading = loadingData && (overview === null || loadedKey !== rangeKey);
  const summary = overview?.summary ?? EMPTY_OVERVIEW_SUMMARY;
  const previous = overview?.previous.summary ?? EMPTY_OVERVIEW_SUMMARY;
  const state: DataState = errorState ? 'error' : overview && overview.summary.total === 0 ? 'empty' : 'ok';

  const tiles = useMemo(() => buildTiles(summary), [summary]);
  const timeModel = useMemo(() => buildTimeModel(summary, previous), [summary, previous]);
  const moneyModel = useMemo(() => buildMoneyModel(summary, previous), [summary, previous]);
  const chartGranularity: Granularity = overview?.granularity ?? granularity;
  const hoursChart = useMemo(
    () => buildChartModel(overview?.buckets ?? [], 'hours', chartGranularity, range, today),
    [overview, chartGranularity, range, today]
  );
  const moneyChart = useMemo(
    () => buildChartModel(overview?.buckets ?? [], 'money', chartGranularity, range, today),
    [overview, chartGranularity, range, today]
  );

  const periodChip =
    preset === 'today' ? 'hoy' : preset === 'this_month' ? 'este mes' : preset === 'last_month' ? 'mes pasado' : `${daysInRange(range)} días`;
  const tenantName = empresa?.name || 'Ceibo AI Tech Solutions';
  const rel = updatedAt ? formatRelativeTime(new Date(updatedAt).toISOString(), now) : '';
  const updatedText = loading
    ? 'actualizando…'
    : errorState
    ? updatedAt
      ? `última actualización ${rel}`
      : 'sin datos'
    : `actualizado ${rel || 'ahora'}`;

  // Descargar informe = imprimir (la hoja incluye las dos vistas y "Guardar como PDF")
  const handleDownload = () => {
    const previousTitle = document.title;
    document.title = `Informe Ceibo AI · ${rangeLower(range)}`;
    const restore = () => {
      document.title = previousTitle;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
  };

  return (
    <div className="cb-dash">
      {errorState && (
        <ErrorAlert
          message="No pudimos conectarnos con Ceibo."
          detail={process.env.NODE_ENV !== 'production' ? errorState : null}
          onRetry={loadDashboardData}
        />
      )}

      <div className="cb-context">
        <p className="cb-ctx-line">
          <strong>{tenantName}</strong>
          <span aria-hidden="true">·</span>
          {errorState ? (
            <span className="cb-status is-bad">
              <i aria-hidden="true" />
              Sin conexión
            </span>
          ) : isOperative ? (
            <span className="cb-status is-ok">
              <i aria-hidden="true" />
              Asistente activo
            </span>
          ) : (
            <span className="cb-status is-idle">
              <i aria-hidden="true" />
              Sin actividad reciente
            </span>
          )}
          <span aria-hidden="true">·</span>
          <span>{updatedText}</span>
        </p>
        <PeriodFilter
          preset={preset}
          range={range}
          today={today}
          onPresetChange={handlePresetChange}
          onCustomRangeChange={handleCustomRangeChange}
        />
      </div>

      {loading ? (
        <TilesSkeleton />
      ) : (
        <TilesRow
          title={`Qué hizo Ceibo con cada consulta · ${periodSuffix(preset, range)}`}
          tiles={tiles}
          state={state}
          periodChip={periodChip}
          segLabel={tilesAriaLabel(summary)}
        />
      )}

      <FocusTabs tab={tab} onTab={handleTab} loading={loading} state={state} time={timeModel} money={moneyModel} />

      <div aria-hidden="true" className="cb-sec is-gap">
        <span className="t">{state === 'empty' ? 'Detalle' : tab === 'tiempo' ? 'Detalle de tiempo' : 'Detalle de dinero'}</span>
        <i />
      </div>

      {loading ? (
        <PanelSkeleton />
      ) : state === 'empty' ? (
        <EmptyState
          suggestion={
            emptySuggestion
              ? {
                  hint: emptySuggestion.hint,
                  label: emptySuggestion.label,
                  onSelect: () => updateUrl(emptySuggestion.next, resolveRange(emptySuggestion.next, today), tab),
                }
              : null
          }
        />
      ) : (
        <>
          <TimePanel
            id={PANEL_IDS.tiempo}
            labelledBy="cb-tab-tiempo"
            hidden={tab !== 'tiempo'}
            state={state}
            model={timeModel}
            chart={hoursChart}
            granularity={chartGranularity}
          />
          <MoneyPanel
            id={PANEL_IDS.dinero}
            labelledBy="cb-tab-dinero"
            hidden={tab !== 'dinero'}
            state={state}
            model={moneyModel}
            chart={moneyChart}
            granularity={chartGranularity}
          />
        </>
      )}

      <footer className="cb-foot">
        <p>
          <b>Cómo calculamos estos números.</b> Tiempo: 12 minutos por cada consulta que Ceibo resuelve sola. Dinero:
          el último monto estimado de cada cliente (cantidad pedida × precio de tu catálogo). Una consulta es un
          mensaje de un cliente que Ceibo respondió.
        </p>
        <button
          type="button"
          className="cb-btn cb-download cb-noprint"
          disabled={loading || state !== 'ok'}
          onClick={handleDownload}
        >
          <Icon name="download" size={16} stroke={2.1} />
          Descargar informe
        </button>
      </footer>
    </div>
  );
}
