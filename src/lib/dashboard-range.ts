/**
 * Ceibo AI - Periodo del dashboard
 *
 * Logica pura (sin React ni Supabase) para elegir el periodo que se muestra en el dashboard:
 * presets, rango personalizado, granularidad del grafico, periodo anterior y deltas.
 *
 * Todas las fechas son 'YYYY-MM-DD' en la zona horaria de la EMPRESA (no en UTC ni en la del
 * navegador), y los rangos son inclusivos en ambos extremos.
 */

import type {
  ChatAnalytics,
  DashboardBucket,
  DashboardData,
  DashboardSummaryRaw,
  SummaryMetrics,
} from './supabase/types';
import { hoursSaved } from './constants';

export type RangePreset = 'today' | '7d' | '30d' | '90d' | 'this_month' | 'last_month' | 'custom';
export type Granularity = 'day' | 'week' | 'month';

export interface DateRange {
  from: string; // YYYY-MM-DD, inclusive
  to: string; // YYYY-MM-DD, inclusive
}

export const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';
export const DEFAULT_PRESET: RangePreset = '30d';
export const MAX_RANGE_DAYS = 731;

export const RANGE_PRESETS: { id: RangePreset; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: '7d', label: '7 días' },
  { id: '30d', label: '30 días' },
  { id: '90d', label: '90 días' },
  { id: 'this_month', label: 'Este mes' },
  { id: 'last_month', label: 'Mes pasado' },
  { id: 'custom', label: 'Personalizado' },
];

export const GRANULARITIES: { id: Granularity; label: string }[] = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------------------------
// Fechas (aritmetica en UTC sobre strings ISO: sin sorpresas de zona horaria ni horario de verano)
// ---------------------------------------------------------------------------------------------

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isValidIso(iso: string | null | undefined): iso is string {
  if (!iso || !ISO_RE.test(iso)) return false;
  return toIso(parseIso(iso)) === iso;
}

export function addDays(iso: string, days: number): string {
  const d = parseIso(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

/** Cantidad de dias del rango, contando ambos extremos. */
export function daysInRange(range: DateRange): number {
  return Math.round((parseIso(range.to).getTime() - parseIso(range.from).getTime()) / 86_400_000) + 1;
}

function startOfMonth(iso: string): string {
  return `${iso.slice(0, 8)}01`;
}

function addMonths(iso: string, months: number): string {
  const d = parseIso(startOfMonth(iso));
  d.setUTCMonth(d.getUTCMonth() + months);
  return toIso(d);
}

/** Lunes de la semana de `iso` (igual que date_trunc('week') de Postgres). */
function startOfWeek(iso: string): string {
  const dow = parseIso(iso).getUTCDay(); // 0 = domingo
  return addDays(iso, -((dow + 6) % 7));
}

/** Fecha de hoy ('YYYY-MM-DD') en la zona horaria dada. */
export function todayInTimezone(timeZone: string = DEFAULT_TIMEZONE, now: Date = new Date()): string {
  const format = (tz: string) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  try {
    return format(timeZone);
  } catch {
    return format(DEFAULT_TIMEZONE);
  }
}

// ---------------------------------------------------------------------------------------------
// Rangos y granularidad
// ---------------------------------------------------------------------------------------------

export function resolveRange(preset: Exclude<RangePreset, 'custom'>, today: string): DateRange {
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case '7d':
      return { from: addDays(today, -6), to: today };
    case '30d':
      return { from: addDays(today, -29), to: today };
    case '90d':
      return { from: addDays(today, -89), to: today };
    case 'this_month':
      return { from: startOfMonth(today), to: today };
    case 'last_month': {
      const first = addMonths(today, -1);
      return { from: first, to: addDays(startOfMonth(today), -1) };
    }
  }
}

/** Valida un rango personalizado; devuelve null si no es usable. Recorta `to` a hoy. */
export function sanitizeCustomRange(from: string | null, to: string | null, today: string): DateRange | null {
  if (!isValidIso(from) || !isValidIso(to)) return null;
  const clampedTo = to > today ? today : to;
  if (from > clampedTo) return null;
  const range = { from, to: clampedTo };
  return daysInRange(range) > MAX_RANGE_DAYS ? null : range;
}

/** Granularidad recomendada segun el largo del rango. */
export function autoGranularity(range: DateRange): Granularity {
  const days = daysInRange(range);
  if (days <= 31) return 'day';
  if (days <= 180) return 'week';
  return 'month';
}

/** Periodo inmediatamente anterior, de la misma duracion. */
export function previousRange(range: DateRange): DateRange {
  const days = daysInRange(range);
  return { from: addDays(range.from, -days), to: addDays(range.from, -1) };
}

// ---------------------------------------------------------------------------------------------
// URL (?rango=30d | ?rango=custom&desde=...&hasta=... , &gran=week)
// ---------------------------------------------------------------------------------------------

export interface ParsedRange {
  preset: RangePreset;
  range: DateRange;
  /** null = automatica */
  granularity: Granularity | null;
}

export function parseRangeParams(params: { get(key: string): string | null }, today: string): ParsedRange {
  const rawPreset = params.get('rango');
  const rawGran = params.get('gran');
  const granularity = GRANULARITIES.some((g) => g.id === rawGran) ? (rawGran as Granularity) : null;

  if (rawPreset === 'custom') {
    const custom = sanitizeCustomRange(params.get('desde'), params.get('hasta'), today);
    if (custom) return { preset: 'custom', range: custom, granularity };
  } else {
    const preset = RANGE_PRESETS.find((p) => p.id === rawPreset && p.id !== 'custom');
    if (preset) {
      return { preset: preset.id, range: resolveRange(preset.id as Exclude<RangePreset, 'custom'>, today), granularity };
    }
  }

  return { preset: DEFAULT_PRESET, range: resolveRange('30d', today), granularity };
}

export function buildRangeQuery(preset: RangePreset, range: DateRange, granularity: Granularity | null): string {
  const q = new URLSearchParams({ rango: preset });
  if (preset === 'custom') {
    q.set('desde', range.from);
    q.set('hasta', range.to);
  }
  if (granularity) q.set('gran', granularity);
  return q.toString();
}

// ---------------------------------------------------------------------------------------------
// Etiquetas
// ---------------------------------------------------------------------------------------------

export function formatShortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTH_NAMES[m - 1]}`;
}

export function formatRangeLabel(range: DateRange): string {
  const [fy] = range.from.split('-');
  const [ty] = range.to.split('-');
  if (range.from === range.to) return `${formatShortDate(range.to)} ${ty}`;
  if (fy === ty) return `${formatShortDate(range.from)} – ${formatShortDate(range.to)} ${ty}`;
  return `${formatShortDate(range.from)} ${fy} – ${formatShortDate(range.to)} ${ty}`;
}

export function presetTitle(preset: RangePreset, range: DateRange): string {
  switch (preset) {
    case 'today':
      return 'Hoy';
    case '7d':
      return 'Últimos 7 días';
    case '30d':
      return 'Últimos 30 días';
    case '90d':
      return 'Últimos 90 días';
    case 'this_month':
      return 'Este mes';
    case 'last_month':
      return 'Mes pasado';
    default:
      return formatRangeLabel(range);
  }
}

/**
 * Titulo del grafico de consultas segun el periodo elegido. "Hoy" es un solo dia, que no da para un
 * grafico de barras: se muestra la semana que termina hoy (ver `chartRangeFor`).
 */
export function chartTitle(preset: RangePreset, range: DateRange): string {
  switch (preset) {
    case 'today':
      return 'Consultas de la semana';
    case '7d':
      return 'Consultas de los últimos 7 días';
    case '30d':
      return 'Consultas de los últimos 30 días';
    case '90d':
      return 'Consultas de los últimos 90 días';
    case 'this_month':
      return 'Consultas de este mes';
    case 'last_month':
      return 'Consultas del mes pasado';
    default:
      return `Consultas del ${formatShortDate(range.from)} al ${formatShortDate(range.to)}`;
  }
}

const GRANULARITY_NOUN: Record<Granularity, string> = { day: 'por día', week: 'por semana', month: 'por mes' };

/** "por día" | "por semana" | "por mes" */
export function granularityNoun(granularity: Granularity): string {
  return GRANULARITY_NOUN[granularity];
}

/** Rango que muestra el grafico: el periodo elegido, salvo "Hoy", que muestra los 7 dias hasta hoy. */
export function chartRangeFor(preset: RangePreset, range: DateRange): DateRange {
  return preset === 'today' ? { from: addDays(range.to, -6), to: range.to } : range;
}

export function formatBucketLabel(iso: string, granularity: Granularity): string {
  if (granularity === 'month') {
    const [y, m] = iso.split('-').map(Number);
    return `${MONTH_NAMES[m - 1]} ${String(y).slice(2)}`;
  }
  return formatShortDate(iso);
}

export function formatBucketTooltip(iso: string, granularity: Granularity): string {
  if (granularity === 'week') return `Semana del ${formatShortDate(iso)} ${iso.slice(0, 4)}`;
  if (granularity === 'month') {
    const [y, m] = iso.split('-').map(Number);
    return `${MONTH_NAMES[m - 1]} ${y}`;
  }
  return `${formatShortDate(iso)} ${iso.slice(0, 4)}`;
}

// ---------------------------------------------------------------------------------------------
// Comparacion con el periodo anterior
// ---------------------------------------------------------------------------------------------

/** Frase corta para acompanar un numero: "36 min hoy", "3,6 h en 30 días". */
export function presetShort(preset: RangePreset): string {
  switch (preset) {
    case 'today':
      return 'hoy';
    case '7d':
      return 'en 7 días';
    case '30d':
      return 'en 30 días';
    case '90d':
      return 'en 90 días';
    case 'this_month':
      return 'este mes';
    case 'last_month':
      return 'el mes pasado';
    default:
      return 'en el período';
  }
}

const WEEKDAYS_2 = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
const WEEKDAYS_3 = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Dia de la semana de una fecha 'YYYY-MM-DD': 'Mi' (corto) o 'Mié' (largo). */
export function weekdayName(iso: string, style: 'short' | 'long' = 'long'): string {
  const dow = parseIso(iso).getUTCDay();
  return (style === 'short' ? WEEKDAYS_2 : WEEKDAYS_3)[dow];
}

/** Fecha local ('YYYY-MM-DD') de un timestamp ISO en la zona horaria de la empresa; '' si no es valida. */
export function localDateOf(timestamp: string | null | undefined, timeZone: string = DEFAULT_TIMEZONE): string {
  const date = timestamp ? new Date(timestamp) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  const format = (tz: string) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  try {
    return format(timeZone);
  } catch {
    return format(DEFAULT_TIMEZONE);
  }
}

export type Delta =
  | { kind: 'none' } // sin datos en ninguno de los dos periodos
  | { kind: 'new' } // no hubo nada antes: no se puede calcular un porcentaje
  | { kind: 'flat' }
  | { kind: 'up'; pct: number }
  | { kind: 'down'; pct: number };

export function computeDelta(current: number, previous: number): Delta {
  if (previous === 0 && current === 0) return { kind: 'none' };
  if (previous === 0) return { kind: 'new' };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { kind: 'flat' };
  return pct > 0 ? { kind: 'up', pct } : { kind: 'down', pct: Math.abs(pct) };
}

// ---------------------------------------------------------------------------------------------
// Conversion de datos
// ---------------------------------------------------------------------------------------------

const num = (v: unknown): number => Number(v) || 0;

export function toSummaryMetrics(raw: DashboardSummaryRaw): SummaryMetrics {
  const totalIA = num(raw.resueltas_ia);
  const totalHuman = num(raw.derivadas_humano);
  const totalConsultas = totalIA + totalHuman;
  return {
    totalConsultas,
    totalIA,
    totalHuman,
    horasAhorradas: hoursSaved(totalIA),
    tasaResolucionIA: totalConsultas > 0 ? Math.round((totalIA / totalConsultas) * 100) : 0,
    pedidosCount: num(raw.pedidos_count),
    reclamosCount: num(raw.reclamos_count),
    valorEstimado: num(raw.valor_estimado),
    leadsConMonto: num(raw.leads_con_monto),
  };
}

export const EMPTY_SUMMARY_RAW: DashboardSummaryRaw = {
  resueltas_ia: 0,
  derivadas_humano: 0,
  total_consultas: 0,
  horas_ahorradas: 0,
  pedidos_count: 0,
  reclamos_count: 0,
  valor_estimado: 0,
  leads_con_monto: 0,
};

function normalizeSummary(raw: Partial<DashboardSummaryRaw> | null | undefined): DashboardSummaryRaw {
  return {
    resueltas_ia: num(raw?.resueltas_ia),
    derivadas_humano: num(raw?.derivadas_humano),
    total_consultas: num(raw?.total_consultas),
    horas_ahorradas: num(raw?.horas_ahorradas),
    // compat: la funcion SQL anterior devolvia presupuestos_count aparte; hoy son una sola categoria
    pedidos_count: num(raw?.pedidos_count) + num((raw as any)?.presupuestos_count),
    reclamos_count: num(raw?.reclamos_count),
    valor_estimado: num(raw?.valor_estimado),
    leads_con_monto: num(raw?.leads_con_monto),
  };
}

/** Normaliza la respuesta del RPC get_dashboard_metrics (numeros que puedan venir como string, faltantes, etc.). */
export function normalizeDashboardData(raw: any): DashboardData {
  if (!raw || typeof raw !== 'object') throw new Error('Respuesta vacía del dashboard');
  const buckets: DashboardBucket[] = (Array.isArray(raw.buckets) ? raw.buckets : []).map((b: any) => ({
    date: String(b.date).split('T')[0],
    resueltas_ia: num(b.resueltas_ia),
    derivadas_humano: num(b.derivadas_humano),
    total_consultas: num(b.total_consultas),
    horas_ahorradas: num(b.horas_ahorradas),
    pedidos_count: num(b.pedidos_count) + num(b.presupuestos_count),
    reclamos_count: num(b.reclamos_count),
  }));
  return {
    timezone: String(raw.timezone || DEFAULT_TIMEZONE),
    from: String(raw.from),
    to: String(raw.to),
    granularity: (raw.granularity as Granularity) || 'day',
    buckets,
    summary: normalizeSummary(raw.summary),
    previous: {
      from: String(raw.previous?.from ?? ''),
      to: String(raw.previous?.to ?? ''),
      summary: normalizeSummary(raw.previous?.summary),
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Modo demo (cliente mock): arma la misma respuesta a partir de las filas diarias del mock
// ---------------------------------------------------------------------------------------------

function bucketStart(iso: string, granularity: Granularity): string {
  if (granularity === 'week') return startOfWeek(iso);
  if (granularity === 'month') return startOfMonth(iso);
  return iso;
}

function nextBucket(iso: string, granularity: Granularity): string {
  if (granularity === 'week') return addDays(iso, 7);
  if (granularity === 'month') return addMonths(iso, 1);
  return addDays(iso, 1);
}

function summarizeRows(rows: ChatAnalytics[]): DashboardSummaryRaw {
  const sum = (pick: (r: ChatAnalytics) => number) => rows.reduce((acc, r) => acc + num(pick(r)), 0);
  const ia = sum((r) => r.resueltas_ia);
  const humano = sum((r) => r.derivadas_humano);
  return {
    resueltas_ia: ia,
    derivadas_humano: humano,
    total_consultas: ia + humano,
    horas_ahorradas: hoursSaved(ia),
    // pedido y presupuesto son una sola categoria (las filas viejas de la vista los traen separados)
    pedidos_count: sum((r) => num(r.pedidos_count) + num(r.presupuestos_count)),
    reclamos_count: sum((r) => r.reclamos_count),
    valor_estimado: sum((r) => r.valor_estimado),
    leads_con_monto: 0,
  };
}

export function buildDashboardFromDailyRows(
  rows: ChatAnalytics[],
  range: DateRange,
  granularity: Granularity,
  timezone: string = DEFAULT_TIMEZONE
): DashboardData {
  const dateOf = (r: ChatAnalytics) => String(r.date).split('T')[0];
  const inRange = (r: ChatAnalytics, rg: DateRange) => dateOf(r) >= rg.from && dateOf(r) <= rg.to;

  const current = rows.filter((r) => inRange(r, range));
  const prevRange = previousRange(range);
  const previous = rows.filter((r) => inRange(r, prevRange));

  const grouped = new Map<string, ChatAnalytics[]>();
  for (const r of current) {
    const key = bucketStart(dateOf(r), granularity);
    grouped.set(key, [...(grouped.get(key) ?? []), r]);
  }

  const buckets: DashboardBucket[] = [];
  const last = bucketStart(range.to, granularity);
  for (let cursor = bucketStart(range.from, granularity); cursor <= last; cursor = nextBucket(cursor, granularity)) {
    const s = summarizeRows(grouped.get(cursor) ?? []);
    buckets.push({
      date: cursor,
      resueltas_ia: s.resueltas_ia,
      derivadas_humano: s.derivadas_humano,
      total_consultas: s.total_consultas,
      horas_ahorradas: s.horas_ahorradas,
      pedidos_count: s.pedidos_count,
      reclamos_count: s.reclamos_count,
    });
  }

  return {
    timezone,
    from: range.from,
    to: range.to,
    granularity,
    buckets,
    summary: summarizeRows(current),
    previous: { from: prevRange.from, to: prevRange.to, summary: summarizeRows(previous) },
  };
}
