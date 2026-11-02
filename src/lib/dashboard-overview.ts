/**
 * Ceibo AI - Modelo del dashboard "Tiempo y Dinero"
 *
 * Logica pura (sin React ni Supabase): convierte la respuesta de get_dashboard_overview() en lo que
 * muestra cada pieza de la pantalla (fichas, tarjetas, graficos). Esta separada de los componentes
 * para poder testearla y para que el modo demo arme exactamente la misma estructura.
 *
 * Unidad de conteo: la CONSULTA. Cada consulta cae en una sola categoria, asi que las fichas suman el
 * total. El dinero se cuenta por cliente: ultimo monto estimado de cada cliente con pedido.
 */

import { MINUTES_SAVED_PER_AI_RESOLUTION } from './constants';
import { computeDelta, formatRangeLabel, type DateRange, type Granularity, type RangePreset } from './dashboard-range';
import { buildDashboardFromDailyRows } from './dashboard-range';
import { formatARS, formatCount, formatTimeSaved } from './format';
import type { ChatAnalytics, DashboardOverview, OverviewBucket, OverviewSummary } from './supabase/types';

const LOCALE = 'es-AR';
const num = (v: unknown): number => Number(v) || 0;

// ---------------------------------------------------------------------------------------------
// Datos
// ---------------------------------------------------------------------------------------------

export const EMPTY_OVERVIEW_SUMMARY: OverviewSummary = {
  total: 0,
  resueltas: 0,
  ventas: 0,
  reclamos: 0,
  sin_datos: 0,
  sin_valor: 0,
  derivadas: 0,
  resueltas_detalle: { precios: 0, stock: 0, horarios: 0, envios: 0, pagos: 0, otras: 0 },
  sin_valor_detalle: { spam: 0, numero_equivocado: 0, sin_contenido: 0 },
  ventas_valor: 0,
  ventas_clientes_con_monto: 0,
  ventas_con_vendedor_n: 0,
  ventas_con_vendedor_valor: 0,
  ventas_sin_asignar_n: 0,
  ventas_sin_asignar_valor: 0,
  respuesta_mediana_seg: null,
  respuesta_n: 0,
};

function normalizeSummary(raw: any): OverviewSummary {
  const r = raw ?? {};
  const rd = r.resueltas_detalle ?? {};
  const vd = r.sin_valor_detalle ?? {};
  const mediana = r.respuesta_mediana_seg;
  const ventas = num(r.ventas);
  const reclamos = num(r.reclamos);
  const sinDatos = num(r.sin_datos);
  return {
    total: num(r.total),
    resueltas: num(r.resueltas),
    ventas,
    reclamos,
    sin_datos: sinDatos,
    sin_valor: num(r.sin_valor),
    derivadas: r.derivadas == null ? ventas + reclamos + sinDatos : num(r.derivadas),
    resueltas_detalle: {
      precios: num(rd.precios),
      stock: num(rd.stock),
      horarios: num(rd.horarios),
      envios: num(rd.envios),
      pagos: num(rd.pagos),
      otras: num(rd.otras),
    },
    sin_valor_detalle: {
      spam: num(vd.spam),
      numero_equivocado: num(vd.numero_equivocado),
      sin_contenido: num(vd.sin_contenido),
    },
    ventas_valor: num(r.ventas_valor),
    ventas_clientes_con_monto: num(r.ventas_clientes_con_monto),
    ventas_con_vendedor_n: num(r.ventas_con_vendedor_n),
    ventas_con_vendedor_valor: num(r.ventas_con_vendedor_valor),
    ventas_sin_asignar_n: num(r.ventas_sin_asignar_n),
    ventas_sin_asignar_valor: num(r.ventas_sin_asignar_valor),
    respuesta_mediana_seg: mediana == null || Number.isNaN(Number(mediana)) ? null : Number(mediana),
    respuesta_n: num(r.respuesta_n),
  };
}

/** Normaliza la respuesta del RPC get_dashboard_overview (numeros como string, campos faltantes). */
export function normalizeOverview(raw: any): DashboardOverview {
  if (!raw || typeof raw !== 'object') throw new Error('Respuesta vacía del dashboard');
  const buckets: OverviewBucket[] = (Array.isArray(raw.buckets) ? raw.buckets : []).map((b: any) => ({
    date: String(b.date).split('T')[0],
    total: num(b.total),
    resueltas: num(b.resueltas),
    derivadas: num(b.derivadas),
    valor: num(b.valor),
  }));
  return {
    timezone: String(raw.timezone || 'America/Argentina/Buenos_Aires'),
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

/** Modo demo (cliente mock): arma la misma estructura desde las filas diarias del mock. */
export function buildOverviewFromDailyRows(
  rows: ChatAnalytics[],
  range: DateRange,
  granularity: Granularity,
  timezone?: string
): DashboardOverview {
  const d = buildDashboardFromDailyRows(rows, range, granularity, timezone);
  const toSummary = (s: typeof d.summary): OverviewSummary => {
    // Las categorias son EXCLUYENTES (como en la base real): lo derivado se reparte entre ventas,
    // reclamos y "sin datos"; los conteos de las filas viejas pueden superar a lo derivado.
    const derivadas = s.derivadas_humano;
    const ventas = Math.min(s.pedidos_count, derivadas);
    const reclamos = Math.min(s.reclamos_count, derivadas - ventas);
    return {
      ...EMPTY_OVERVIEW_SUMMARY,
      total: s.resueltas_ia + derivadas,
      resueltas: s.resueltas_ia,
      ventas,
      reclamos,
      sin_datos: derivadas - ventas - reclamos,
      derivadas,
      resueltas_detalle: { ...EMPTY_OVERVIEW_SUMMARY.resueltas_detalle, otras: s.resueltas_ia },
      ventas_valor: s.valor_estimado,
      ventas_clientes_con_monto: ventas,
      ventas_con_vendedor_n: ventas,
      ventas_con_vendedor_valor: s.valor_estimado,
    };
  };
  const totalPedidos = d.summary.pedidos_count || 1;
  return {
    timezone: d.timezone,
    from: d.from,
    to: d.to,
    granularity: d.granularity,
    buckets: d.buckets.map((b) => ({
      date: b.date,
      total: b.total_consultas,
      resueltas: b.resueltas_ia,
      derivadas: b.derivadas_humano,
      valor: d.summary.valor_estimado * (b.pedidos_count / totalPedidos),
    })),
    summary: toSummary(d.summary),
    previous: { from: d.previous.from, to: d.previous.to, summary: toSummary(d.previous.summary) },
  };
}

// ---------------------------------------------------------------------------------------------
// Fechas en minuscula, como en el diseño ("21 sep – 20 oct 2026", "lun 21 sep")
// ---------------------------------------------------------------------------------------------

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_LONG = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const WEEKDAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const WEEKDAYS_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function parts(iso: string): { y: number; m: number; d: number; dow: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d, dow: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
}

/** "21 sep" */
export function dateShortLower(iso: string): string {
  const { m, d } = parts(iso);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

/** "21 sep – 20 oct 2026" (con año en ambos extremos si cruza de año) */
export function rangeLower(range: DateRange): string {
  const a = parts(range.from);
  const b = parts(range.to);
  if (range.from === range.to) return `${dateShortLower(range.to)} ${b.y}`;
  if (a.y === b.y) return `${dateShortLower(range.from)} – ${dateShortLower(range.to)} ${b.y}`;
  return `${dateShortLower(range.from)} ${a.y} – ${dateShortLower(range.to)} ${b.y}`;
}

/** "viernes 16 de octubre" */
function longDate(iso: string): string {
  const { m, d, dow } = parts(iso);
  return `${WEEKDAYS_LONG[dow]} ${d} de ${MONTHS_LONG[m - 1]}`;
}

/** Sufijo del titulo de las fichas: "hoy", "últimos 30 días", "este mes", "21 sep – 20 oct 2026". */
export function periodSuffix(preset: RangePreset, range: DateRange): string {
  switch (preset) {
    case 'today':
      return 'hoy';
    case '7d':
      return 'últimos 7 días';
    case '30d':
      return 'últimos 30 días';
    case '90d':
      return 'últimos 90 días';
    case 'this_month':
      return 'este mes';
    case 'last_month':
      return 'el mes pasado';
    default:
      return rangeLower(range);
  }
}

// ---------------------------------------------------------------------------------------------
// Numeros
// ---------------------------------------------------------------------------------------------

const decimals = (v: number, max = 1) =>
  v.toLocaleString(LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: max });

/** 3200000 -> {num:'$3,2', unit:'M'} · 78000 -> {num:'$78', unit:'mil'} · 850 -> {num:'$850', unit:''} */
export function moneyParts(value: number): { num: string; unit: '' | 'mil' | 'M' } {
  const v = Math.max(0, Number(value) || 0);
  if (v < 1000) return { num: `$${Math.round(v)}`, unit: '' };
  const thousands = v / 1000;
  const t = thousands < 10 ? Math.round(thousands * 10) / 10 : Math.round(thousands);
  if (t < 1000) return { num: `$${decimals(t)}`, unit: 'mil' };
  const millions = v / 1_000_000;
  const m = millions < 100 ? Math.round(millions * 10) / 10 : Math.round(millions);
  return { num: `$${decimals(m)}`, unit: 'M' };
}

/** "$3,2 M" · "$78 mil" */
export function moneyShort(value: number): string {
  const p = moneyParts(value);
  return p.unit ? `${p.num} ${p.unit}` : p.num;
}

/** Escala "linda" para el eje: el menor 1, 2, 5 o 10 × 10^k que cubre el maximo. */
export function niceMax(value: number): number {
  if (!(value > 0)) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const f = value / exp;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nf * exp;
}

/** Jornadas de trabajo (8 h) equivalentes a `minutes`. */
export function jornadasText(minutes: number): string {
  const j = minutes / 60 / 8;
  if (!(j > 0)) return '';
  if (j < 1) return ' · menos de una jornada de trabajo';
  const r = j < 10 ? Math.round(j * 10) / 10 : Math.round(j);
  return r === 1 ? ' · equivale a 1 jornada de trabajo' : ` · equivale a ${decimals(r)} jornadas de trabajo`;
}

export type DeltaDir = { dir: 'up' | 'down'; pct: number };

/** Comparacion con el periodo anterior; null si no hay variacion calculable (para no mostrar ruido). */
export function deltaOf(current: number, previous: number): DeltaDir | null {
  const d = computeDelta(current, previous);
  if (d.kind === 'up') return { dir: 'up', pct: d.pct };
  if (d.kind === 'down') return { dir: 'down', pct: d.pct };
  return null;
}

// ---------------------------------------------------------------------------------------------
// Fichas "Que hizo Ceibo con cada consulta"
// ---------------------------------------------------------------------------------------------

export type TileKey = 'total' | 'resueltas' | 'ventas' | 'reclamos' | 'sin_datos' | 'sin_valor';
export type TileTone = 'inv' | 'blue' | 'green' | 'red' | 'gray';
export type TileIcon = 'chat' | 'check' | 'cart' | 'alert' | 'question' | 'slash';

export interface TileDetail {
  label: string;
  n: number;
  pct: number;
  widthPct: number;
}

export interface TileModel {
  key: TileKey;
  label: string;
  n: number;
  /** % del total de consultas; null en la ficha del total */
  pct: number | null;
  tone: TileTone;
  icon: TileIcon;
  popTitle?: string;
  details: TileDetail[];
}

function detailsOf(rows: [string, number][], tileN: number): TileDetail[] {
  const present = rows.filter(([, n]) => n > 0);
  const max = Math.max(1, ...present.map(([, n]) => n));
  return present.map(([label, n]) => ({
    label,
    n,
    pct: tileN > 0 ? Math.round((n / tileN) * 100) : 0,
    widthPct: Math.round((n / max) * 100),
  }));
}

export function buildTiles(s: OverviewSummary): TileModel[] {
  const pct = (n: number) => (s.total > 0 ? Math.round((n / s.total) * 100) : 0);
  const rd = s.resueltas_detalle;
  const vd = s.sin_valor_detalle;
  return [
    { key: 'total', label: 'Consultas recibidas', n: s.total, pct: null, tone: 'inv', icon: 'chat', details: [] },
    {
      key: 'resueltas',
      label: 'Resueltas solo por Ceibo',
      n: s.resueltas,
      pct: pct(s.resueltas),
      tone: 'blue',
      icon: 'check',
      popTitle: 'Qué resolvió Ceibo solo',
      details: detailsOf(
        [
          ['Precios', rd.precios],
          ['Disponibilidad y stock', rd.stock],
          ['Horarios y ubicación', rd.horarios],
          ['Envíos', rd.envios],
          ['Formas de pago', rd.pagos],
          ['Otras consultas', rd.otras],
        ],
        s.resueltas
      ),
    },
    { key: 'ventas', label: 'Posibles ventas derivadas', n: s.ventas, pct: pct(s.ventas), tone: 'green', icon: 'cart', details: [] },
    { key: 'reclamos', label: 'Reclamos derivados a tu equipo', n: s.reclamos, pct: pct(s.reclamos), tone: 'red', icon: 'alert', details: [] },
    { key: 'sin_datos', label: 'Sin datos para responder', n: s.sin_datos, pct: pct(s.sin_datos), tone: 'gray', icon: 'question', details: [] },
    {
      key: 'sin_valor',
      label: 'Sin valor (spam y otros)',
      n: s.sin_valor,
      pct: pct(s.sin_valor),
      tone: 'gray',
      icon: 'slash',
      popTitle: 'Consultas sin valor',
      details: detailsOf(
        [
          ['Spam o publicidad', vd.spam],
          ['Número equivocado', vd.numero_equivocado],
          ['Mensajes sin contenido (saludos, stickers)', vd.sin_contenido],
        ],
        s.sin_valor
      ),
    },
  ];
}

/** Texto para lectores de pantalla de la barra de proporciones. */
export function tilesAriaLabel(s: OverviewSummary): string {
  if (s.total === 0) return 'Sin datos';
  return (
    `De ${formatCount(s.total)} consultas: ${formatCount(s.resueltas)} resueltas solo por Ceibo, ` +
    `${formatCount(s.ventas)} posibles ventas derivadas, ${formatCount(s.reclamos)} reclamos derivados, ` +
    `${formatCount(s.sin_datos)} sin datos para responder y ${formatCount(s.sin_valor)} sin valor.`
  );
}

// ---------------------------------------------------------------------------------------------
// Vista TIEMPO
// ---------------------------------------------------------------------------------------------

export interface TimeModel {
  hero: { value: string; unit: 'min' | 'h' };
  equivalence: string;
  compare: DeltaDir | null;
  response: { value: string; unit: string };
  resolved: { value: string; fraction: number; label: string };
  reach: { value: string; unit: string };
  without: string;
  withCeibo: string;
  withFraction: number;
}

function responseParts(seconds: number | null): { value: string; unit: string } {
  if (seconds == null) return { value: '–', unit: '' };
  if (seconds < 1) return { value: '<1', unit: 'segundo' };
  if (seconds < 60) {
    const r = Math.round(seconds);
    return { value: String(r), unit: r === 1 ? 'segundo' : 'segundos' };
  }
  return { value: decimals(seconds / 60), unit: 'min' };
}

export function buildTimeModel(s: OverviewSummary, prev: OverviewSummary): TimeModel {
  const hasData = s.total > 0;
  const fraction = hasData ? (s.total - s.derivadas) / s.total : 0;
  const tenths = Math.round(fraction * 10);
  const resolvedValue = !hasData
    ? '–'
    : tenths >= 1 && tenths <= 9
    ? `${tenths} de cada 10`
    : `${Math.round(fraction * 100)}%`;
  const withFraction = hasData ? s.derivadas / s.total : 0;
  return {
    hero: formatTimeSaved(s.resueltas),
    equivalence: jornadasText(s.resueltas * MINUTES_SAVED_PER_AI_RESOLUTION),
    compare: deltaOf(s.resueltas, prev.resueltas),
    response: responseParts(s.respuesta_mediana_seg),
    resolved: {
      value: resolvedValue,
      fraction,
      label: hasData ? `${resolvedValue} consultas se resuelven sin intervención` : 'Sin datos',
    },
    reach: hasData ? { value: `${formatCount(s.derivadas)} de ${formatCount(s.total)}`, unit: 'consultas' } : { value: '–', unit: '' },
    without: hasData ? '100%' : '–',
    withCeibo: hasData ? `${Math.round(withFraction * 100)}%` : '–',
    withFraction,
  };
}

// ---------------------------------------------------------------------------------------------
// Vista DINERO
// ---------------------------------------------------------------------------------------------

export interface MoneyModel {
  hero: { num: string; unit: string };
  avgTicket: { num: string; unit: string } | null;
  newOrders: DeltaDir | null;
  waiting: { num: string; unit: string; count: number };
  split: {
    title: string;
    subtitle: string;
    withSeller: { n: number; valor: string; pct: number; flex: number };
    unassigned: { n: number; valor: string; pct: number; flex: number };
    ariaLabel: string;
  };
}

export function buildMoneyModel(s: OverviewSummary, prev: OverviewSummary): MoneyModel {
  const total = s.ventas_valor;
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);
  const wp = pct(s.ventas_con_vendedor_valor);
  const up = pct(s.ventas_sin_asignar_valor);
  const ticket = s.ventas_clientes_con_monto > 0 ? moneyParts(total / s.ventas_clientes_con_monto) : null;
  const waiting = moneyParts(s.ventas_sin_asignar_valor);
  return {
    hero: moneyParts(total),
    avgTicket: ticket,
    newOrders: deltaOf(s.ventas, prev.ventas),
    waiting: { ...waiting, count: s.ventas_sin_asignar_n },
    split: {
      title: s.ventas === 1 ? 'La posible venta derivada' : s.ventas > 0 ? `Las ${formatCount(s.ventas)} posibles ventas derivadas` : 'Posibles ventas derivadas',
      subtitle: `Suman ${formatARS(total)} en total`,
      withSeller: { n: s.ventas_con_vendedor_n, valor: formatARS(s.ventas_con_vendedor_valor), pct: wp, flex: s.ventas_con_vendedor_valor },
      unassigned: { n: s.ventas_sin_asignar_n, valor: formatARS(s.ventas_sin_asignar_valor), pct: up, flex: s.ventas_sin_asignar_valor },
      ariaLabel:
        total > 0
          ? `Del valor total, el ${wp}% ya tiene vendedor asignado y el ${up}% está sin asignar.`
          : 'Todavía no hay valor estimado en este período.',
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Graficos de barras (horas devueltas por periodo / valor por periodo)
// ---------------------------------------------------------------------------------------------

export type ChartKind = 'hours' | 'money';

export interface ChartBar {
  value: number;
  heightPct: number;
  tip: string;
}

export interface ChartModel {
  bars: ChartBar[];
  xLabels: string[];
  max: number;
  average: number;
  averageTopPct: number;
  yLabels: { top: string; mid: string; bottom: string };
  subtitle: string;
  ariaLabel: string;
  hasData: boolean;
}

function xLabelStep(count: number): number {
  if (count <= 8) return 1;
  if (count <= 14) return 2;
  if (count <= 31) return 7;
  return Math.ceil(count / 5);
}

const unitWord: Record<Granularity, string> = { day: 'día', week: 'semana', month: 'mes' };

function hoursText(v: number): string {
  return `${decimals(v)} h`;
}

export function buildChartModel(
  buckets: OverviewBucket[],
  kind: ChartKind,
  granularity: Granularity,
  range: DateRange,
  today?: string
): ChartModel {
  const hoursPer = MINUTES_SAVED_PER_AI_RESOLUTION / 60;
  const values = buckets.map((b) => (kind === 'hours' ? b.resueltas * hoursPer : b.valor));
  const total = values.reduce((a, v) => a + v, 0);
  const peak = Math.max(0, ...values);
  const max = niceMax(peak);
  const average = values.length > 0 ? total / values.length : 0;
  const fmt = (v: number) => (kind === 'hours' ? hoursText(v) : formatARS(v));
  const axis = (v: number) => (v === 0 ? '0' : kind === 'hours' ? hoursText(v) : moneyShort(v));

  const tipFor = (b: OverviewBucket, i: number): string => {
    const { m, y, dow, d } = parts(b.date);
    if (granularity === 'week') return `semana del ${d} ${MONTHS_SHORT[m - 1]}`;
    if (granularity === 'month') return `${MONTHS_SHORT[m - 1]} ${y}`;
    return `${WEEKDAYS_SHORT[dow]} ${d} ${MONTHS_SHORT[m - 1]}${today && b.date === today && i === buckets.length - 1 ? ' (hasta ahora)' : ''}`;
  };

  const step = xLabelStep(buckets.length);
  const bars: ChartBar[] = values.map((v, i) => ({
    value: v,
    heightPct: max > 0 ? Math.round(Math.min(100, (v / max) * 100) * 100) / 100 : 0,
    tip: `${tipFor(buckets[i], i)}: ${fmt(v)}`,
  }));
  const xLabels = buckets.map((b, i) => {
    if (i % step !== 0) return '';
    const { m, y } = parts(b.date);
    return granularity === 'month' ? `${MONTHS_SHORT[m - 1]} ${String(y).slice(2)}` : dateShortLower(b.date);
  });

  const hasData = total > 0;
  const peakIdx = values.indexOf(peak);
  const noun = unitWord[granularity];
  let peakSentence = '';
  if (hasData && peakIdx >= 0) {
    const pb = buckets[peakIdx];
    const what = kind === 'hours' ? 'horas' : 'valor';
    peakSentence =
      granularity === 'day'
        ? ` El día con más ${what} fue el ${longDate(pb.date)}, con ${fmt(peak)}.`
        : granularity === 'week'
        ? ` La semana con más ${what} empezó el ${longDate(pb.date)}, con ${fmt(peak)}.`
        : ` El mes con más ${what} fue ${MONTHS_LONG[parts(pb.date).m - 1]}, con ${fmt(peak)}.`;
  }

  return {
    bars,
    xLabels,
    max,
    average,
    averageTopPct: max > 0 ? Math.max(0, Math.min(100, (1 - average / max) * 100)) : 100,
    yLabels: { top: axis(max), mid: axis(max / 2), bottom: '0' },
    subtitle: `${granularity === 'day' ? 'Por día · ' : granularity === 'week' ? 'Por semana · ' : 'Por mes · '}${rangeLower(range)}`,
    ariaLabel:
      `Barras por ${noun}, del ${longDate(range.from).replace(/^\S+ /, '')} al ${longDate(range.to).replace(/^\S+ /, '')}. ` +
      `Promedio ${fmt(average)} por ${noun}.${peakSentence}`,
    hasData,
  };
}

/** Texto de la leyenda del promedio: "3,2 h por día" / "$106.667". */
export function averageText(kind: ChartKind, average: number, granularity: Granularity): string {
  return kind === 'hours' ? `${hoursText(average)} por ${unitWord[granularity]}` : formatARS(average);
}

// Re-export para que los componentes tengan un solo punto de entrada
export { formatRangeLabel };
