/**
 * Ceibo AI Test: modelo del dashboard "Tiempo y Dinero" (src/lib/dashboard-overview.ts)
 * Standalone: `node tests/e2e/test-dashboard-overview.mjs`
 */
import assert from 'node:assert/strict';
import { loadTsModules } from '../helpers/load-ts.mjs';

const { modules, cleanup } = await loadTsModules([
  'src/lib/constants.ts',
  'src/lib/format.ts',
  'src/lib/dashboard-range.ts',
  'src/lib/dashboard-overview.ts',
]);
const O = modules['dashboard-overview'];

let passed = 0;
const failures = [];
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  \x1b[32m[PASS]\x1b[0m ${name}`);
  } catch (err) {
    failures.push({ name, err });
    console.log(`  \x1b[31m[FAIL]\x1b[0m ${name}\n         ${err.message}`);
  }
}

console.log('\nE2E: Dashboard overview model');

// Numeros del boceto de los profesores: 480 consultas que suman exacto
const S = {
  ...O.EMPTY_OVERVIEW_SUMMARY,
  total: 480,
  resueltas: 317,
  ventas: 41,
  reclamos: 18,
  sin_datos: 37,
  sin_valor: 67,
  derivadas: 96,
  resueltas_detalle: { precios: 118, stock: 92, horarios: 54, envios: 36, pagos: 17, otras: 0 },
  sin_valor_detalle: { spam: 29, numero_equivocado: 21, sin_contenido: 17 },
  ventas_valor: 3_200_000,
  ventas_clientes_con_monto: 41,
  ventas_con_vendedor_n: 38,
  ventas_con_vendedor_valor: 2_990_000,
  ventas_sin_asignar_n: 3,
  ventas_sin_asignar_valor: 210_000,
  respuesta_mediana_seg: 8.5,
  respuesta_n: 300,
};
const PREV = { ...O.EMPTY_OVERVIEW_SUMMARY, total: 400, resueltas: 269, ventas: 35 };

// --- Dinero y numeros -------------------------------------------------------------------------
test('moneyParts / moneyShort: pesos, miles y millones', () => {
  assert.deepEqual(O.moneyParts(850), { num: '$850', unit: '' });
  assert.deepEqual(O.moneyParts(78_049), { num: '$78', unit: 'mil' });
  assert.deepEqual(O.moneyParts(7_840), { num: '$7,8', unit: 'mil' });
  assert.deepEqual(O.moneyParts(210_000), { num: '$210', unit: 'mil' });
  assert.deepEqual(O.moneyParts(3_200_000), { num: '$3,2', unit: 'M' });
  assert.deepEqual(O.moneyParts(999_700), { num: '$1', unit: 'M' }); // no queda en "$1.000 mil"
  assert.deepEqual(O.moneyParts(125_400_000), { num: '$125', unit: 'M' });
  assert.deepEqual(O.moneyParts(0), { num: '$0', unit: '' });
  assert.deepEqual(O.moneyParts(NaN), { num: '$0', unit: '' });
  assert.equal(O.moneyShort(3_200_000), '$3,2 M');
  assert.equal(O.moneyShort(78_000), '$78 mil');
});

test('niceMax: escala 1, 2, 5 o 10', () => {
  assert.equal(O.niceMax(4.5), 5);
  assert.equal(O.niceMax(158_000), 200_000);
  assert.equal(O.niceMax(0.8), 1);
  assert.equal(O.niceMax(0), 1);
  assert.equal(O.niceMax(10), 10);
  assert.equal(O.niceMax(11), 20);
});

test('jornadasText: equivalencia en jornadas de 8 horas', () => {
  assert.equal(O.jornadasText(0), '');
  assert.equal(O.jornadasText(5760), ' · equivale a 12 jornadas de trabajo'); // 96 h
  assert.equal(O.jornadasText(480), ' · equivale a 1 jornada de trabajo');
  assert.equal(O.jornadasText(60), ' · menos de una jornada de trabajo');
  assert.equal(O.jornadasText(3804), ' · equivale a 7,9 jornadas de trabajo'); // 63,4 h
});

test('deltaOf: solo muestra variaciones calculables', () => {
  assert.deepEqual(O.deltaOf(118, 100), { dir: 'up', pct: 18 });
  assert.deepEqual(O.deltaOf(80, 100), { dir: 'down', pct: 20 });
  assert.equal(O.deltaOf(10, 10), null);
  assert.equal(O.deltaOf(5, 0), null);
  assert.equal(O.deltaOf(0, 0), null);
});

// --- Fichas -----------------------------------------------------------------------------------
test('buildTiles: las categorias suman el total y llevan sus porcentajes', () => {
  const t = O.buildTiles(S);
  assert.deepEqual(t.map((x) => x.key), ['total', 'resueltas', 'ventas', 'reclamos', 'sin_datos', 'sin_valor']);
  const parts = t.slice(1).reduce((a, x) => a + x.n, 0);
  assert.equal(parts, 480);
  assert.equal(t[0].pct, null);
  assert.equal(t[1].pct, 66); // 317 / 480
  assert.equal(t[2].pct, 9); // 41 / 480
});

test('buildTiles: el desglose omite categorias en cero y ordena por el diseño', () => {
  const t = O.buildTiles(S);
  const resueltas = t[1].details;
  assert.deepEqual(resueltas.map((d) => d.label), [
    'Precios', 'Disponibilidad y stock', 'Horarios y ubicación', 'Envíos', 'Formas de pago',
  ]);
  assert.equal(resueltas[0].pct, 37); // 118 / 317
  assert.equal(resueltas[0].widthPct, 100); // la mas grande llena la barra
  const sinValor = t[5].details;
  assert.equal(sinValor.length, 3);
  assert.equal(sinValor[0].label, 'Spam o publicidad');
  // datos sin las categorias nuevas (bot sin actualizar): todo cae en "Otras consultas"
  const legacy = O.buildTiles({ ...S, resueltas_detalle: { ...S.resueltas_detalle, precios: 0, stock: 0, horarios: 0, envios: 0, pagos: 0, otras: 317 } });
  assert.deepEqual(legacy[1].details.map((d) => d.label), ['Otras consultas']);
  // fichas sin desglose no son expandibles
  assert.equal(O.buildTiles(O.EMPTY_OVERVIEW_SUMMARY)[1].details.length, 0);
});

test('tilesAriaLabel describe la particion', () => {
  assert.match(O.tilesAriaLabel(S), /De 480 consultas: 317 resueltas solo por Ceibo, 41 posibles ventas derivadas/);
  assert.equal(O.tilesAriaLabel(O.EMPTY_OVERVIEW_SUMMARY), 'Sin datos');
});

// --- Vista TIEMPO -----------------------------------------------------------------------------
test('buildTimeModel: horas solo de lo que Ceibo resuelve sola (317 x 12 min)', () => {
  const m = O.buildTimeModel(S, PREV);
  assert.deepEqual(m.hero, { value: '63,4', unit: 'h' });
  assert.equal(m.equivalence, ' · equivale a 7,9 jornadas de trabajo');
  assert.deepEqual(m.compare, { dir: 'up', pct: 18 }); // 317 vs 269
});

test('buildTimeModel: velocidad, resolucion, llegada al equipo y sin/con Ceibo', () => {
  const m = O.buildTimeModel(S, PREV);
  assert.deepEqual(m.response, { value: '9', unit: 'segundos' });
  assert.equal(m.resolved.value, '8 de cada 10'); // 384 / 480
  assert.equal(m.resolved.fraction, 0.8);
  assert.deepEqual(m.reach, { value: '96 de 480', unit: 'consultas' });
  assert.equal(m.without, '100%');
  assert.equal(m.withCeibo, '20%');
  assert.equal(m.withFraction, 0.2);
});

test('buildTimeModel: casos limite (sin datos, extremos, velocidad)', () => {
  const empty = O.buildTimeModel(O.EMPTY_OVERVIEW_SUMMARY, O.EMPTY_OVERVIEW_SUMMARY);
  assert.deepEqual(empty.hero, { value: '0', unit: 'min' });
  assert.equal(empty.resolved.value, '–');
  assert.equal(empty.withCeibo, '–');
  assert.deepEqual(empty.response, { value: '–', unit: '' });
  assert.equal(empty.compare, null);
  // todo se resuelve solo
  assert.equal(O.buildTimeModel({ ...S, derivadas: 0 }, PREV).resolved.value, '100%');
  // velocidad
  const speed = (s) => O.buildTimeModel({ ...S, respuesta_mediana_seg: s }, PREV).response;
  assert.deepEqual(speed(0.4), { value: '<1', unit: 'segundo' });
  assert.deepEqual(speed(1), { value: '1', unit: 'segundo' });
  assert.deepEqual(speed(90), { value: '1,5', unit: 'min' });
});

// --- Vista DINERO -----------------------------------------------------------------------------
test('buildMoneyModel: valor, pedido promedio y lo que espera vendedor', () => {
  const m = O.buildMoneyModel(S, PREV);
  assert.deepEqual(m.hero, { num: '$3,2', unit: 'M' });
  assert.deepEqual(m.avgTicket, { num: '$78', unit: 'mil' });
  assert.deepEqual(m.newOrders, { dir: 'up', pct: 17 }); // 41 vs 35
  assert.deepEqual(m.waiting, { num: '$210', unit: 'mil', count: 3 });
});

test('buildMoneyModel: reparto con vendedor / sin asignar', () => {
  const sp = O.buildMoneyModel(S, PREV).split;
  assert.equal(sp.title, 'Las 41 posibles ventas derivadas');
  assert.equal(sp.subtitle, 'Suman $3.200.000 en total');
  assert.deepEqual([sp.withSeller.n, sp.withSeller.valor, sp.withSeller.pct], [38, '$2.990.000', 93]);
  assert.deepEqual([sp.unassigned.n, sp.unassigned.valor, sp.unassigned.pct], [3, '$210.000', 7]);
  assert.equal(sp.ariaLabel, 'Del valor total, el 93% ya tiene vendedor asignado y el 7% está sin asignar.');
});

test('buildMoneyModel: sin pedidos', () => {
  const m = O.buildMoneyModel(O.EMPTY_OVERVIEW_SUMMARY, O.EMPTY_OVERVIEW_SUMMARY);
  assert.deepEqual(m.hero, { num: '$0', unit: '' });
  assert.equal(m.avgTicket, null);
  assert.equal(m.split.title, 'Posibles ventas derivadas');
  assert.equal(m.split.withSeller.pct, 0);
  assert.equal(m.split.ariaLabel, 'Todavía no hay valor estimado en este período.');
  assert.equal(O.buildMoneyModel({ ...S, ventas: 1 }, PREV).split.title, 'La posible venta derivada');
});

// --- Graficos ---------------------------------------------------------------------------------
function days(from, values, mapper) {
  const out = [];
  const start = new Date(`${from}T00:00:00Z`);
  values.forEach((v, i) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    out.push({ date: d.toISOString().slice(0, 10), total: 0, resueltas: 0, derivadas: 0, valor: 0, ...mapper(v) });
  });
  return out;
}
const RANGE = { from: '2026-09-21', to: '2026-10-20' };
// 30 dias; resueltas = 5 * horas  (porque 1 h = 5 consultas de 12 min)
const HOURS = [3.4, 3.9, 3.6, 3.7, 4.1, 2.2, 0.8, 3.6, 4.0, 3.5, 3.8, 4.3, 2.4, 0.7, 3.7, 4.2, 3.9, 3.6, 4.4, 2.5, 0.9, 3.9, 4.1, 4.0, 3.8, 4.5, 2.3, 0.8, 3.6, 1.8];
const hoursBuckets = days('2026-09-21', HOURS, (h) => ({ resueltas: Math.round(h * 5) }));

test('buildChartModel (horas): escala, promedio, etiquetas y tooltips', () => {
  const c = O.buildChartModel(hoursBuckets, 'hours', 'day', RANGE, '2026-10-20');
  assert.equal(c.bars.length, 30);
  assert.equal(c.max, 5); // el pico es 4,6 h (23 consultas x 12 min)
  assert.equal(c.bars[25].heightPct, 92); // 4,6 de 5
  assert.deepEqual(c.yLabels, { top: '5 h', mid: '2,5 h', bottom: '0' });
  assert.equal(c.bars[0].tip, 'lun 21 sep: 3,4 h');
  assert.equal(c.bars[29].tip, 'mar 20 oct (hasta ahora): 1,8 h');
  assert.equal(c.subtitle, 'Por día · 21 sep – 20 oct 2026');
  // una etiqueta por semana
  assert.deepEqual(c.xLabels.map((l, i) => (l ? i : null)).filter((x) => x !== null), [0, 7, 14, 21, 28]);
  assert.equal(c.xLabels[0], '21 sep');
  assert.equal(c.xLabels[14], '5 oct');
  assert.ok(c.hasData);
});

test('buildChartModel (horas): descripcion accesible con el dia pico', () => {
  const c = O.buildChartModel(hoursBuckets, 'hours', 'day', RANGE);
  assert.match(c.ariaLabel, /^Barras por día, del 21 de septiembre al 20 de octubre\./);
  assert.match(c.ariaLabel, /Promedio 3,2 h por día\./);
  assert.match(c.ariaLabel, /El día con más horas fue el viernes 16 de octubre, con 4,6 h\./);
});

test('buildChartModel (dinero): eje en miles y promedio', () => {
  const money = [120, 145, 98, 132, 122, 84, 18, 110, 152, 126, 118, 134, 92, 22, 134, 140, 115, 149, 129, 78, 16, 128, 158, 131, 122, 137, 88, 20, 118, 64];
  const b = days('2026-09-21', money, (v) => ({ valor: v * 1000 }));
  const c = O.buildChartModel(b, 'money', 'day', RANGE);
  assert.equal(c.max, 200_000);
  assert.deepEqual(c.yLabels, { top: '$200 mil', mid: '$100 mil', bottom: '0' });
  assert.equal(c.bars[22].tip, 'mar 13 oct: $158.000'); // dia pico (igual que el aria-label del diseño)
  assert.equal(c.bars[22].heightPct, 79);
  assert.match(c.ariaLabel, /con \$158\.000\./);
  assert.equal(O.averageText('money', c.average, 'day'), '$106.667');
  assert.equal(O.averageText('hours', 3.2, 'day'), '3,2 h por día');
  assert.equal(O.averageText('hours', 3.2, 'week'), '3,2 h por semana');
});

test('buildChartModel: semanas, meses y sin datos', () => {
  const weeks = days('2026-08-03', [10, 20, 30], (v) => ({ resueltas: v })).map((b, i) => ({ ...b, date: ['2026-08-03', '2026-08-10', '2026-08-17'][i] }));
  const w = O.buildChartModel(weeks, 'hours', 'week', { from: '2026-08-03', to: '2026-08-23' });
  assert.equal(w.bars[0].tip, 'semana del 3 ago: 2 h');
  assert.equal(w.subtitle, 'Por semana · 3 ago – 23 ago 2026');
  assert.match(w.ariaLabel, /La semana con más horas empezó el lunes 17 de agosto/);
  const m = O.buildChartModel([{ date: '2026-09-01', total: 5, resueltas: 5, derivadas: 0, valor: 0 }], 'hours', 'month', { from: '2026-09-01', to: '2026-09-30' });
  assert.equal(m.bars[0].tip, 'sep 2026: 1 h');
  assert.match(m.ariaLabel, /El mes con más horas fue septiembre/);
  const empty = O.buildChartModel(days('2026-09-21', [0, 0, 0], () => ({})), 'money', 'day', { from: '2026-09-21', to: '2026-09-23' });
  assert.equal(empty.hasData, false);
  assert.equal(empty.max, 1);
  assert.equal(empty.averageTopPct, 100);
  assert.ok(!/El día con más/.test(empty.ariaLabel));
  assert.equal(O.buildChartModel([], 'hours', 'day', RANGE).bars.length, 0);
});

// --- Datos ------------------------------------------------------------------------------------
test('normalizeOverview: tolera strings, faltantes y derivadas calculadas', () => {
  const o = O.normalizeOverview({
    timezone: 'America/Argentina/Buenos_Aires',
    from: '2026-09-21',
    to: '2026-09-22',
    granularity: 'day',
    buckets: [{ date: '2026-09-21T00:00:00', total: '4', resueltas: 3, derivadas: 1, valor: '125000.00' }],
    summary: { total: '33', resueltas: '19', ventas: '11', reclamos: 0, sin_datos: '3', respuesta_mediana_seg: '8.5', ventas_valor: '125000' },
  });
  assert.equal(o.buckets[0].date, '2026-09-21');
  assert.equal(o.buckets[0].valor, 125000);
  assert.equal(o.summary.derivadas, 14); // 11 + 0 + 3 cuando el RPC no la manda
  assert.equal(o.summary.respuesta_mediana_seg, 8.5);
  assert.equal(o.previous.summary.total, 0);
  assert.equal(O.normalizeOverview({ summary: {}, from: 'a', to: 'b' }).summary.respuesta_mediana_seg, null);
  assert.throws(() => O.normalizeOverview(null));
});

test('buildOverviewFromDailyRows (demo): misma estructura desde filas diarias', () => {
  const row = (date, ia, hum, ped, rec, val) => ({
    empresa_id: 'x', date, resueltas_ia: ia, derivadas_humano: hum, total_consultas: ia + hum,
    horas_ahorradas: 0, pedidos_count: ped, presupuestos_count: 0, reclamos_count: rec, valor_estimado: val,
  });
  const rows = [row('2026-09-21', 8, 4, 2, 1, 100_000), row('2026-09-22', 6, 2, 1, 0, 50_000)];
  const o = O.buildOverviewFromDailyRows(rows, { from: '2026-09-21', to: '2026-09-23' }, 'day');
  assert.equal(o.summary.total, 20);
  assert.equal(o.summary.resueltas, 14);
  assert.equal(o.summary.ventas, 3);
  assert.equal(o.summary.derivadas, 6); // 3 ventas + 1 reclamo + 2 sin datos
  assert.equal(o.summary.sin_datos, 2);
  assert.equal(o.summary.ventas_valor, 150_000);
  assert.equal(o.buckets.length, 3);
  // las categorias son excluyentes: suman el total aunque las filas viejas se solapen
  const overlap = O.buildOverviewFromDailyRows([row('2026-09-21', 80, 20, 70, 20, 10_000)], { from: '2026-09-21', to: '2026-09-21' }, 'day');
  const s = overlap.summary;
  assert.equal(s.resueltas + s.ventas + s.reclamos + s.sin_datos + s.sin_valor, s.total);
  assert.equal(s.total, 100);
  assert.equal(s.ventas, 20); // pedidos (70) topeados por lo derivado (20)
  assert.equal(s.reclamos, 0);
  assert.equal(o.buckets[0].valor + o.buckets[1].valor + o.buckets[2].valor, 150_000);
});

test('rangeLower y periodSuffix: fechas en minuscula como el diseño', () => {
  assert.equal(O.rangeLower({ from: '2026-09-21', to: '2026-10-20' }), '21 sep – 20 oct 2026');
  assert.equal(O.rangeLower({ from: '2026-09-29', to: '2026-09-29' }), '29 sep 2026');
  assert.equal(O.rangeLower({ from: '2025-12-20', to: '2026-01-05' }), '20 dic 2025 – 5 ene 2026');
  assert.equal(O.periodSuffix('today', RANGE), 'hoy');
  assert.equal(O.periodSuffix('30d', RANGE), 'últimos 30 días');
  assert.equal(O.periodSuffix('this_month', RANGE), 'este mes');
  assert.equal(O.periodSuffix('custom', RANGE), '21 sep – 20 oct 2026');
});

cleanup();
console.log(`\nPassed: ${passed} / ${passed + failures.length}`);
if (failures.length) process.exit(1);
