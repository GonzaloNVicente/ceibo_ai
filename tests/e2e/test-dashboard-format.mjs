/**
 * Ceibo AI Test: formato y constantes del dashboard (src/lib/format.ts, src/lib/constants.ts)
 * Standalone: `node tests/e2e/test-dashboard-format.mjs`
 */
import assert from 'node:assert/strict';
import { loadTsModules } from '../helpers/load-ts.mjs';

const { modules, cleanup } = await loadTsModules(['src/lib/constants.ts', 'src/lib/format.ts']);
const C = modules.constants;
const F = modules.format;

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

console.log('\nE2E: Dashboard format helpers');

test('constante unica: 12 min por consulta = 0,2 h', () => {
  assert.equal(C.MINUTES_SAVED_PER_AI_RESOLUTION, 12);
  assert.equal(C.HOURS_SAVED_PER_AI_RESOLUTION, 0.2);
  assert.equal(C.hoursSaved(18), 3.6);
  assert.equal(C.hoursSaved(0), 0);
});

test('formatTimeSaved: minutos debajo de una hora, horas con coma desde una hora', () => {
  assert.deepEqual(F.formatTimeSaved(0), { value: '0', unit: 'min' });
  assert.deepEqual(F.formatTimeSaved(3), { value: '36', unit: 'min' });
  assert.deepEqual(F.formatTimeSaved(4), { value: '48', unit: 'min' });
  assert.deepEqual(F.formatTimeSaved(5), { value: '1', unit: 'h' }); // 60 min exactos
  assert.deepEqual(F.formatTimeSaved(18), { value: '3,6', unit: 'h' });
  assert.deepEqual(F.formatTimeSaved(-4), { value: '0', unit: 'min' });
  assert.deepEqual(F.formatTimeSaved(NaN), { value: '0', unit: 'min' });
});

test('formatARS y formatCount usan formato es-AR', () => {
  assert.equal(F.formatARS(622840), '$622.840');
  assert.equal(F.formatARS(0), '$0');
  assert.equal(F.formatARS(1829000.4), '$1.829.000');
  assert.equal(F.formatCount(1234567), '1.234.567');
});

test('formatRelativeTime: ahora / min / h / d', () => {
  const now = new Date('2026-09-29T20:00:00Z').getTime();
  assert.equal(F.formatRelativeTime('2026-09-29T19:59:40Z', now), 'ahora');
  assert.equal(F.formatRelativeTime('2026-09-29T19:48:00Z', now), 'hace 12 min');
  assert.equal(F.formatRelativeTime('2026-09-29T17:00:00Z', now), 'hace 3 h');
  assert.equal(F.formatRelativeTime('2026-09-27T20:00:00Z', now), 'hace 2 d');
  assert.equal(F.formatRelativeTime('2026-09-30T20:00:00Z', now), 'ahora'); // futuro: nunca negativo
  assert.equal(F.formatRelativeTime(null, now), '');
  assert.equal(F.formatRelativeTime('basura', now), '');
});

test('maskPhone: oculta el numero del cliente', () => {
  assert.equal(F.maskPhone('5493364343664'), '+54 9 336 ••• 3664');
  assert.equal(F.maskPhone('+54 9 11 5482-0916'), '+54 9 115 ••• 0916');
  assert.equal(F.maskPhone('123456789012'), '+12 345 ••• 9012');
  assert.equal(F.maskPhone('123'), '+123');
  assert.equal(F.maskPhone(null), 'Sin teléfono');
  assert.ok(!F.maskPhone('5493364343664').includes('4343'), 'no debe filtrar digitos del medio');
});

test('summarizeProduct: codigo, texto libre, lista y vacio', () => {
  const catalog = { 'COR-001': 'Cemento Portland 50 kg', 'COR-002': 'Cal Hidratada 25 kg' };
  assert.equal(F.summarizeProduct('COR-001', catalog), 'Cemento Portland 50 kg');
  assert.equal(F.summarizeProduct('cor-001', catalog), 'Cemento Portland 50 kg'); // minusculas
  assert.equal(F.summarizeProduct('COR-999', catalog), 'COR-999'); // codigo desconocido: tal cual
  assert.equal(F.summarizeProduct('ladrillos huecos', catalog), 'Ladrillos huecos');
  assert.equal(
    F.summarizeProduct('Cemento Portland 50 kg, ladrillos huecos 12x18x33, Cal Hidratada 25 kg', catalog),
    'Cemento Portland 50 kg y 2 más'
  );
  assert.equal(F.summarizeProduct('COR-001, COR-002', catalog), 'Cemento Portland 50 kg y 1 más');
  assert.equal(F.summarizeProduct(null, catalog), 'Producto sin identificar');
  assert.equal(F.summarizeProduct('N/A', catalog), 'Producto sin identificar');
  assert.equal(F.summarizeProduct(' , ', catalog), 'Producto sin identificar');
});

cleanup();
console.log(`\nPassed: ${passed} / ${passed + failures.length}`);
if (failures.length) process.exit(1);
