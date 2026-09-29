/**
 * Ceibo AI Test: periodo del dashboard (src/lib/dashboard-range.ts)
 *
 * Standalone: `node tests/e2e/test-dashboard-range.mjs`
 * Transpila el TypeScript en memoria con el compilador del proyecto (sin dependencias nuevas).
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const source = fs.readFileSync(path.join(root, 'src', 'lib', 'dashboard-range.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ceibo-range-')), 'dashboard-range.mjs');
fs.writeFileSync(tmp, outputText);
const R = await import(pathToFileURL(tmp).href);

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
const params = (obj) => ({ get: (k) => (k in obj ? obj[k] : null) });

console.log('\nE2E: Dashboard period helpers');

// --- Fechas y zona horaria -----------------------------------------------------------------
test('todayInTimezone usa la zona de la empresa, no UTC', () => {
  // 2026-09-30 01:30 UTC = 2026-09-29 22:30 en Buenos Aires
  const now = new Date('2026-09-30T01:30:00Z');
  assert.equal(R.todayInTimezone('America/Argentina/Buenos_Aires', now), '2026-09-29');
  assert.equal(R.todayInTimezone('UTC', now), '2026-09-30');
});

test('todayInTimezone con zona invalida cae a Buenos Aires', () => {
  const now = new Date('2026-09-30T01:30:00Z');
  assert.equal(R.todayInTimezone('Zona/Inexistente', now), '2026-09-29');
});

test('addDays cruza meses y años bisiestos', () => {
  assert.equal(R.addDays('2026-09-29', 1), '2026-09-30');
  assert.equal(R.addDays('2026-09-30', 1), '2026-10-01');
  assert.equal(R.addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(R.addDays('2026-01-01', -1), '2025-12-31');
});

test('isValidIso rechaza fechas imposibles', () => {
  assert.equal(R.isValidIso('2026-09-29'), true);
  assert.equal(R.isValidIso('2026-02-30'), false);
  assert.equal(R.isValidIso('29/09/2026'), false);
  assert.equal(R.isValidIso(null), false);
});

// --- Presets ---------------------------------------------------------------------------------
const TODAY = '2026-09-29';

test('presets: hoy, 7d, 30d, 90d cuentan ambos extremos', () => {
  assert.deepEqual(R.resolveRange('today', TODAY), { from: '2026-09-29', to: '2026-09-29' });
  assert.deepEqual(R.resolveRange('7d', TODAY), { from: '2026-09-23', to: '2026-09-29' });
  assert.equal(R.daysInRange(R.resolveRange('30d', TODAY)), 30);
  assert.equal(R.daysInRange(R.resolveRange('90d', TODAY)), 90);
});

test('presets: este mes y mes pasado', () => {
  assert.deepEqual(R.resolveRange('this_month', TODAY), { from: '2026-09-01', to: '2026-09-29' });
  assert.deepEqual(R.resolveRange('last_month', TODAY), { from: '2026-08-01', to: '2026-08-31' });
  // enero -> diciembre del año anterior
  assert.deepEqual(R.resolveRange('last_month', '2026-01-15'), { from: '2025-12-01', to: '2025-12-31' });
  // marzo -> febrero (no bisiesto)
  assert.deepEqual(R.resolveRange('last_month', '2026-03-10'), { from: '2026-02-01', to: '2026-02-28' });
});

test('previousRange: misma duracion, inmediatamente anterior', () => {
  assert.deepEqual(R.previousRange({ from: '2026-09-23', to: '2026-09-29' }), { from: '2026-09-16', to: '2026-09-22' });
  assert.deepEqual(R.previousRange({ from: '2026-09-29', to: '2026-09-29' }), { from: '2026-09-28', to: '2026-09-28' });
});

test('autoGranularity: dia <=31, semana <=180, mes mas alla', () => {
  assert.equal(R.autoGranularity(R.resolveRange('30d', TODAY)), 'day');
  assert.equal(R.autoGranularity({ from: '2026-08-30', to: '2026-09-29' }), 'day'); // 31 dias: ultimo dia diario
  assert.equal(R.autoGranularity({ from: '2026-08-29', to: '2026-09-29' }), 'week'); // 32 dias: pasa a semanal
});

test('autoGranularity: 90d es semanal y 1 año es mensual', () => {
  assert.equal(R.autoGranularity(R.resolveRange('90d', TODAY)), 'week');
  assert.equal(R.autoGranularity({ from: '2025-09-29', to: '2026-09-29' }), 'month');
});

// --- URL -------------------------------------------------------------------------------------
test('parseRangeParams: default 30d si falta o es invalido', () => {
  assert.equal(R.parseRangeParams(params({}), TODAY).preset, '30d');
  assert.equal(R.parseRangeParams(params({ rango: 'xyz' }), TODAY).preset, '30d');
  assert.equal(R.parseRangeParams(params({ rango: '7d' }), TODAY).preset, '7d');
});

test('parseRangeParams: rango personalizado valido, recortado a hoy', () => {
  const p = R.parseRangeParams(params({ rango: 'custom', desde: '2026-09-01', hasta: '2026-12-31' }), TODAY);
  assert.equal(p.preset, 'custom');
  assert.deepEqual(p.range, { from: '2026-09-01', to: '2026-09-29' });
});

test('parseRangeParams: custom invalido vuelve al default (sin romper)', () => {
  const invertido = R.parseRangeParams(params({ rango: 'custom', desde: '2026-09-20', hasta: '2026-09-01' }), TODAY);
  assert.equal(invertido.preset, '30d');
  const basura = R.parseRangeParams(params({ rango: 'custom', desde: 'hola', hasta: '2026-09-01' }), TODAY);
  assert.equal(basura.preset, '30d');
  const enorme = R.parseRangeParams(params({ rango: 'custom', desde: '2020-01-01', hasta: '2026-09-01' }), TODAY);
  assert.equal(enorme.preset, '30d'); // > 731 dias
});

test('parseRangeParams: granularidad manual valida o null', () => {
  assert.equal(R.parseRangeParams(params({ gran: 'week' }), TODAY).granularity, 'week');
  assert.equal(R.parseRangeParams(params({ gran: 'hora' }), TODAY).granularity, null);
});

test('buildRangeQuery <-> parseRangeParams hacen ida y vuelta', () => {
  const range = { from: '2026-09-01', to: '2026-09-15' };
  const qs = new URLSearchParams(R.buildRangeQuery('custom', range, 'week'));
  const back = R.parseRangeParams(qs, TODAY);
  assert.equal(back.preset, 'custom');
  assert.deepEqual(back.range, range);
  assert.equal(back.granularity, 'week');
});

// --- Deltas ----------------------------------------------------------------------------------
test('computeDelta: casos limite', () => {
  assert.deepEqual(R.computeDelta(0, 0), { kind: 'none' });
  assert.deepEqual(R.computeDelta(5, 0), { kind: 'new' });
  assert.deepEqual(R.computeDelta(10, 10), { kind: 'flat' });
  assert.deepEqual(R.computeDelta(12, 10), { kind: 'up', pct: 20 });
  assert.deepEqual(R.computeDelta(5, 10), { kind: 'down', pct: 50 });
  assert.deepEqual(R.computeDelta(0, 10), { kind: 'down', pct: 100 });
});

// --- Modo demo: armado desde filas diarias ---------------------------------------------------
const row = (date, ia, humano, pedidos = 0, valor = 0) => ({
  empresa_id: 'x',
  date,
  resueltas_ia: ia,
  derivadas_humano: humano,
  total_consultas: ia + humano,
  horas_ahorradas: 0,
  pedidos_count: pedidos,
  presupuestos_count: 0,
  reclamos_count: 0,
  valor_estimado: valor,
});

test('buildDashboard (dia): rellena con ceros los dias sin actividad', () => {
  const rows = [row('2026-09-21', 5, 1), row('2026-09-23', 2, 0)];
  const d = R.buildDashboardFromDailyRows(rows, { from: '2026-09-21', to: '2026-09-24' }, 'day');
  assert.deepEqual(d.buckets.map((b) => b.date), ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24']);
  assert.deepEqual(d.buckets.map((b) => b.total_consultas), [6, 0, 2, 0]);
  assert.equal(d.summary.total_consultas, 8);
});

test('buildDashboard (semana): los buckets arrancan en lunes', () => {
  // 2026-09-21 es lunes; 2026-09-27 domingo; 2026-09-28 lunes
  const rows = [row('2026-09-22', 3, 0), row('2026-09-27', 2, 0), row('2026-09-28', 4, 1)];
  const d = R.buildDashboardFromDailyRows(rows, { from: '2026-09-21', to: '2026-09-29' }, 'week');
  assert.deepEqual(d.buckets.map((b) => b.date), ['2026-09-21', '2026-09-28']);
  assert.deepEqual(d.buckets.map((b) => b.total_consultas), [5, 5]);
});

test('buildDashboard (semana): un rango que empieza a mitad de semana incluye el lunes anterior', () => {
  const d = R.buildDashboardFromDailyRows([], { from: '2026-09-24', to: '2026-09-29' }, 'week');
  assert.equal(d.buckets[0].date, '2026-09-21');
});

test('buildDashboard (mes): agrupa por mes calendario', () => {
  const rows = [row('2026-08-15', 10, 0), row('2026-08-31', 1, 1), row('2026-09-02', 4, 0)];
  const d = R.buildDashboardFromDailyRows(rows, { from: '2026-08-01', to: '2026-09-29' }, 'month');
  assert.deepEqual(d.buckets.map((b) => b.date), ['2026-08-01', '2026-09-01']);
  assert.deepEqual(d.buckets.map((b) => b.total_consultas), [12, 4]);
});

test('buildDashboard: filtra fuera del rango y calcula el periodo anterior', () => {
  const rows = [row('2026-09-10', 2, 0, 0, 100), row('2026-09-20', 6, 2, 1, 500), row('2026-08-01', 99, 99)];
  const d = R.buildDashboardFromDailyRows(rows, { from: '2026-09-15', to: '2026-09-29' }, 'day');
  assert.equal(d.summary.total_consultas, 8);
  assert.equal(d.summary.valor_estimado, 500);
  assert.deepEqual([d.previous.from, d.previous.to], ['2026-08-31', '2026-09-14']);
  assert.equal(d.previous.summary.total_consultas, 2);
  assert.equal(d.previous.summary.valor_estimado, 100);
});

test('pedido y presupuesto se cuentan juntos en una sola categoria', () => {
  // filas viejas de la vista traen presupuestos aparte: se suman a pedidos
  const rows = [{ ...row('2026-09-21', 3, 1, 2), presupuestos_count: 3 }];
  const d = R.buildDashboardFromDailyRows(rows, { from: '2026-09-21', to: '2026-09-21' }, 'day');
  assert.equal(d.summary.pedidos_count, 5);
  assert.equal(d.buckets[0].pedidos_count, 5);
  assert.equal('presupuestos_count' in d.summary, false);
  const m = R.toSummaryMetrics(d.summary);
  assert.equal(m.pedidosCount, 5);
  assert.equal('presupuestosCount' in m, false);
});

test('toSummaryMetrics: tasa de resolucion sin division por cero', () => {
  assert.equal(R.toSummaryMetrics(R.EMPTY_SUMMARY_RAW).tasaResolucionIA, 0);
  const m = R.toSummaryMetrics({ ...R.EMPTY_SUMMARY_RAW, resueltas_ia: 3, derivadas_humano: 1 });
  assert.equal(m.tasaResolucionIA, 75);
  assert.equal(m.horasAhorradas, 0.6);
});

test('normalizeDashboardData: tolera numeros como string y campos faltantes', () => {
  const d = R.normalizeDashboardData({
    timezone: 'America/Argentina/Buenos_Aires',
    from: '2026-09-21',
    to: '2026-09-22',
    granularity: 'day',
    buckets: [{ date: '2026-09-21', resueltas_ia: '3', derivadas_humano: 1 }],
    summary: { resueltas_ia: '3', valor_estimado: '125000.00' },
  });
  assert.equal(d.buckets[0].resueltas_ia, 3);
  assert.equal(d.summary.valor_estimado, 125000);
  assert.equal(d.previous.summary.total_consultas, 0);
  assert.throws(() => R.normalizeDashboardData(null));
});

test('normalizeDashboardData: acepta la respuesta vieja con presupuestos_count aparte', () => {
  const d = R.normalizeDashboardData({
    from: '2026-09-21', to: '2026-09-21', granularity: 'day',
    buckets: [{ date: '2026-09-21', pedidos_count: 1, presupuestos_count: 2 }],
    summary: { pedidos_count: 1, presupuestos_count: 2 },
  });
  assert.equal(d.summary.pedidos_count, 3);
  assert.equal(d.buckets[0].pedidos_count, 3);
});

test('etiquetas: rango, bucket y tooltip', () => {
  assert.equal(R.formatRangeLabel({ from: '2026-09-21', to: '2026-09-29' }), '21 Sep – 29 Sep 2026');
  assert.equal(R.formatRangeLabel({ from: '2026-09-29', to: '2026-09-29' }), '29 Sep 2026');
  assert.equal(R.formatRangeLabel({ from: '2025-12-20', to: '2026-01-05' }), '20 Dic 2025 – 5 Ene 2026');
  assert.equal(R.formatBucketLabel('2026-09-21', 'day'), '21 Sep');
  assert.equal(R.formatBucketLabel('2026-09-01', 'month'), 'Sep 26');
  assert.equal(R.formatBucketTooltip('2026-09-21', 'week'), 'Semana del 21 Sep 2026');
  assert.equal(R.presetTitle('7d', { from: '', to: '' }), 'Últimos 7 días');
});

fs.rmSync(path.dirname(tmp), { recursive: true, force: true });

console.log(`\nPassed: ${passed} / ${passed + failures.length}`);
if (failures.length) process.exit(1);
