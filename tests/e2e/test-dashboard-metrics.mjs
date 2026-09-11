/**
 * Ceibo AI E2E Test Suite: Dashboard KPI Metrics & Business Formulas
 * 
 * Validates R2 requirements from ORIGINAL_REQUEST.md and PROJECT.md:
 * - "Volumen de consultas" (Total customer WhatsApp inquiries)
 * - "Horas de venta ahorradas" (12 min / 0.2h per AI resolution)
 * - "Tasa de resolución por IA" (%)
 * - "Derivadas a asesor humano"
 * - Division-by-zero protection on empty/zero data
 * - Mathematical precision & rounding guarantees
 */

import assert from 'node:assert/strict';
import {
  createSuite,
  createMockSupabaseEngine,
  createTenantScopedClient,
  calculateSummaryMetrics,
  generateMockAnalytics,
  MOCK_TENANTS,
  MOCK_USERS,
} from '../helpers/test-harness.mjs';

export const metricsSuite = createSuite('E2E: Dashboard KPI Metrics');

// =============================================================================
// TIER 1: CORE FEATURE COVERAGE (>=5 Tests)
// =============================================================================

metricsSuite.test('Tier 1.1: "Volumen de consultas" matches exact sum of 30-day daily records', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]); // Tenant A Admin
  const client = createTenantScopedClient(engine);

  const rows = await client.getRecent30Days();
  assert.strictEqual(rows.length, 30, 'Should load exactly 30 days of data');

  const expectedTotal = rows.reduce((sum, r) => sum + r.resueltas_ia + r.derivadas_humano, 0);
  const metrics = await client.getSummaryMetrics();

  assert.strictEqual(
    metrics.totalConsultas,
    expectedTotal,
    `Volumen total (${metrics.totalConsultas}) must equal sum of daily queries (${expectedTotal})`
  );
  assert.ok(metrics.totalConsultas > 0, 'Total consultas for Tenant A must be greater than zero');
});

metricsSuite.test('Tier 1.2: "Horas de venta ahorradas" conforms to 12 min (0.2h) business standard', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  const client = createTenantScopedClient(engine);

  const rows = await client.getRecent30Days();
  const totalIA = rows.reduce((sum, r) => sum + r.resueltas_ia, 0);

  // Authoritative formula: totalIA * 0.2 hours
  const expectedHoras = Math.round((totalIA * 0.2) * 10) / 10;
  const metrics = await client.getSummaryMetrics();

  assert.strictEqual(
    metrics.horasAhorradas,
    expectedHoras,
    `Horas ahorradas (${metrics.horasAhorradas}) must match totalIA (${totalIA}) * 0.2 = ${expectedHoras}`
  );
});

metricsSuite.test('Tier 1.3: "Tasa de resolución por IA" percentage matches arithmetic formula', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  const client = createTenantScopedClient(engine);

  const metrics = await client.getSummaryMetrics();
  const expectedRate = Math.round((metrics.totalIA / metrics.totalConsultas) * 100);

  assert.strictEqual(
    metrics.tasaResolucionIA,
    expectedRate,
    `Tasa de resolución (${metrics.tasaResolucionIA}%) must equal round((totalIA / totalConsultas) * 100)`
  );
  assert.ok(metrics.tasaResolucionIA >= 0 && metrics.tasaResolucionIA <= 100);
});

metricsSuite.test('Tier 1.4: "Derivadas a asesor humano" tracks total human escalations accurately', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  const client = createTenantScopedClient(engine);

  const rows = await client.getRecent30Days();
  const expectedHuman = rows.reduce((sum, r) => sum + r.derivadas_humano, 0);
  const metrics = await client.getSummaryMetrics();

  assert.strictEqual(metrics.totalHuman, expectedHuman);
  assert.strictEqual(metrics.totalIA + metrics.totalHuman, metrics.totalConsultas);
});

metricsSuite.test('Tier 1.5: Metric summary object contract contains all required fields with numeric types', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  const client = createTenantScopedClient(engine);
  const metrics = await client.getSummaryMetrics();

  assert.strictEqual(typeof metrics.totalConsultas, 'number');
  assert.strictEqual(typeof metrics.totalIA, 'number');
  assert.strictEqual(typeof metrics.totalHuman, 'number');
  assert.strictEqual(typeof metrics.horasAhorradas, 'number');
  assert.strictEqual(typeof metrics.tasaResolucionIA, 'number');
  assert.ok(!Number.isNaN(metrics.horasAhorradas), 'horasAhorradas must not be NaN');
  assert.ok(!Number.isNaN(metrics.tasaResolucionIA), 'tasaResolucionIA must not be NaN');
});

// =============================================================================
// TIER 2: BOUNDARY & CORNER CASES (>=5 Tests)
// =============================================================================

metricsSuite.test('Tier 2.1: Empty analytics table returns zeroed metrics without NaN or crashing', async () => {
  const emptyMetrics = calculateSummaryMetrics([]);

  assert.strictEqual(emptyMetrics.totalConsultas, 0);
  assert.strictEqual(emptyMetrics.totalIA, 0);
  assert.strictEqual(emptyMetrics.totalHuman, 0);
  assert.strictEqual(emptyMetrics.horasAhorradas, 0);
  assert.strictEqual(emptyMetrics.tasaResolucionIA, 0);
  assert.ok(!Number.isNaN(emptyMetrics.tasaResolucionIA));
});

metricsSuite.test('Tier 2.2: 100% AI resolution edge case yields 100% rate and 0 human escalations', async () => {
  const singleDay100 = [
    { resueltas_ia: 150, derivadas_humano: 0, total_consultas: 150, horas_ahorradas: 30.0 },
  ];
  const metrics = calculateSummaryMetrics(singleDay100);

  assert.strictEqual(metrics.totalConsultas, 150);
  assert.strictEqual(metrics.totalIA, 150);
  assert.strictEqual(metrics.totalHuman, 0);
  assert.strictEqual(metrics.tasaResolucionIA, 100);
  assert.strictEqual(metrics.horasAhorradas, 30.0); // 150 * 0.2 = 30.0
});

metricsSuite.test('Tier 2.3: 0% AI resolution edge case (100% human escalation) yields 0% rate and 0.0 hours saved', async () => {
  const singleDay0 = [
    { resueltas_ia: 0, derivadas_humano: 85, total_consultas: 85, horas_ahorradas: 0.0 },
  ];
  const metrics = calculateSummaryMetrics(singleDay0);

  assert.strictEqual(metrics.totalConsultas, 85);
  assert.strictEqual(metrics.totalIA, 0);
  assert.strictEqual(metrics.totalHuman, 85);
  assert.strictEqual(metrics.tasaResolucionIA, 0);
  assert.strictEqual(metrics.horasAhorradas, 0.0);
});

metricsSuite.test('Tier 2.4: High-volume scale testing (50,000 queries) preserves arithmetic precision', async () => {
  const highVolumeData = [
    { resueltas_ia: 40000, derivadas_humano: 10000, total_consultas: 50000 },
  ];
  const metrics = calculateSummaryMetrics(highVolumeData);

  assert.strictEqual(metrics.totalConsultas, 50000);
  assert.strictEqual(metrics.horasAhorradas, 8000.0); // 40000 * 0.2 = 8000.0
  assert.strictEqual(metrics.tasaResolucionIA, 80);
});

metricsSuite.test('Tier 2.5: Decimal rounding precision on non-integer hours (e.g. 17 queries = 3.4h)', async () => {
  const oddQueryData = [
    { resueltas_ia: 17, derivadas_humano: 3 }, // 17 * 0.2 = 3.4 hours
  ];
  const metrics = calculateSummaryMetrics(oddQueryData);

  assert.strictEqual(metrics.totalConsultas, 20);
  assert.strictEqual(metrics.horasAhorradas, 3.4);
  assert.strictEqual(metrics.tasaResolucionIA, 85); // 17 / 20 = 85%
});

// =============================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS
// =============================================================================

metricsSuite.test('Tier 3.1: Metrics for Tenant A and Tenant B remain mathematically distinct and isolated', async () => {
  // Tenant A: Higher volume (1.4x base)
  const engineA = createMockSupabaseEngine(MOCK_USERS[0]);
  const metricsA = await createTenantScopedClient(engineA).getSummaryMetrics();

  // Tenant B: Lower volume (0.4x base)
  const engineB = createMockSupabaseEngine(MOCK_USERS[2]);
  const metricsB = await createTenantScopedClient(engineB).getSummaryMetrics();

  assert.ok(
    metricsA.totalConsultas > metricsB.totalConsultas,
    `Tenant A total (${metricsA.totalConsultas}) should be significantly larger than Tenant B (${metricsB.totalConsultas})`
  );
  assert.ok(
    metricsA.horasAhorradas > metricsB.horasAhorradas,
    `Tenant A hours saved (${metricsA.horasAhorradas}) should exceed Tenant B (${metricsB.horasAhorradas})`
  );
});

metricsSuite.test('Tier 3.2: 7-day sub-windowing produces valid subset metrics proportional to full period', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  const client = createTenantScopedClient(engine);

  const full30Days = await client.getRecent30Days();
  const subset7Days = full30Days.slice(-7);

  const fullMetrics = calculateSummaryMetrics(full30Days);
  const subsetMetrics = calculateSummaryMetrics(subset7Days);

  assert.strictEqual(subset7Days.length, 7);
  assert.ok(subsetMetrics.totalConsultas < fullMetrics.totalConsultas);
  assert.ok(subsetMetrics.horasAhorradas < fullMetrics.horasAhorradas);
});

// =============================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS
// =============================================================================

metricsSuite.test('Tier 4.1: B2B SMB Sales Director ROI evaluation scenario', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  const client = createTenantScopedClient(engine);
  const metrics = await client.getSummaryMetrics();

  // Business ROI metric: equivalent full-time sales representatives saved
  // A standard sales rep works 160 hours per month (40 hrs/wk * 4 wks)
  const equivalentSalesReps = Math.round((metrics.horasAhorradas / 160) * 10) / 10;

  assert.ok(equivalentSalesReps > 0, 'Must reflect tangible staff time saved');
  assert.ok(metrics.tasaResolucionIA >= 60, 'AI resolution rate must be competitive for B2B WhatsApp automation');
});

// Execute if run directly via CLI
if (process.argv[1]?.endsWith('test-dashboard-metrics.mjs')) {
  metricsSuite.run().then(res => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
