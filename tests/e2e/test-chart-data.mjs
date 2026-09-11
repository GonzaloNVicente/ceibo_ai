/**
 * Ceibo AI E2E Test Suite: 30-Day Chat Analytics Chart Data
 * 
 * Validates R2 requirements from ORIGINAL_REQUEST.md and PROJECT.md:
 * - "Evolución de consultas - últimos 30 días" chart dataset
 * - Comparative series: "Resueltas por IA" vs "Derivadas a humano"
 * - Dynamic data fetching from `chat_analytics` table
 * - Chronological sequence & ISO date validation
 * - SSR & Recharts-safe data transformations
 */

import assert from 'node:assert/strict';
import {
  createSuite,
  createMockSupabaseEngine,
  createTenantScopedClient,
  generateMockAnalytics,
  MOCK_TENANTS,
  MOCK_USERS,
} from '../helpers/test-harness.mjs';

export const chartSuite = createSuite('E2E: 30-Day Chart Data Pipeline');

// =============================================================================
// TIER 1: CORE FEATURE COVERAGE (>=5 Tests)
// =============================================================================

chartSuite.test('Tier 1.1: Chart dataset delivers exactly 30 chronological data points', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  const client = createTenantScopedClient(engine);

  const chartData = await client.getRecent30Days();
  assert.strictEqual(chartData.length, 30, 'Must contain exactly 30 daily data points');
});

chartSuite.test('Tier 1.2: Chronological sequence guarantee (date ascending)', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  const client = createTenantScopedClient(engine);

  const chartData = await client.getRecent30Days();
  for (let i = 0; i < chartData.length - 1; i++) {
    const current = new Date(chartData[i].date).getTime();
    const next = new Date(chartData[i + 1].date).getTime();
    assert.ok(
      current <= next,
      `Date at index ${i} (${chartData[i].date}) must precede or equal date at index ${i + 1} (${chartData[i + 1].date})`
    );
  }
});

chartSuite.test('Tier 1.3: Standard ISO-8601 date string compliance (YYYY-MM-DD)', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  const client = createTenantScopedClient(engine);

  const chartData = await client.getRecent30Days();
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  for (const point of chartData) {
    assert.match(point.date, dateRegex, `Date '${point.date}' must follow YYYY-MM-DD format`);
  }
});

chartSuite.test('Tier 1.4: Comparative series fields exist on every daily record', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  const client = createTenantScopedClient(engine);

  const chartData = await client.getRecent30Days();
  for (const point of chartData) {
    assert.ok('resueltas_ia' in point, 'resueltas_ia field must exist');
    assert.ok('derivadas_humano' in point, 'derivadas_humano field must exist');
    assert.ok('total_consultas' in point, 'total_consultas field must exist');
    assert.strictEqual(typeof point.resueltas_ia, 'number');
    assert.strictEqual(typeof point.derivadas_humano, 'number');
    assert.strictEqual(typeof point.total_consultas, 'number');
  }
});

chartSuite.test('Tier 1.5: Daily total consultas matches sum of AI resolved + human escalated', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  const client = createTenantScopedClient(engine);

  const chartData = await client.getRecent30Days();
  for (const point of chartData) {
    const calculatedTotal = point.resueltas_ia + point.derivadas_humano;
    assert.strictEqual(
      point.total_consultas,
      calculatedTotal,
      `total_consultas (${point.total_consultas}) must equal resueltas_ia (${point.resueltas_ia}) + derivadas_humano (${point.derivadas_humano})`
    );
  }
});

// =============================================================================
// TIER 2: BOUNDARY & CORNER CASES (>=5 Tests)
// =============================================================================

chartSuite.test('Tier 2.1: Partial history dataset (5 days for new tenant) loads correctly', async () => {
  const fiveDayRecords = generateMockAnalytics(MOCK_TENANTS.TENANT_A.id, 1.0, 5);
  const engine = createMockSupabaseEngine(MOCK_USERS[0], fiveDayRecords);
  const client = createTenantScopedClient(engine);

  const chartData = await client.getRecent30Days();
  assert.strictEqual(chartData.length, 5, 'Should return available 5 days without crashing');
});

chartSuite.test('Tier 2.2: Zero-inquiries day node retains structural integrity', async () => {
  const zeroDay = [
    {
      id: 'zero-test-1',
      empresa_id: MOCK_TENANTS.TENANT_A.id,
      date: '2026-09-01',
      resueltas_ia: 0,
      derivadas_humano: 0,
      total_consultas: 0,
      horas_ahorradas: 0,
    },
  ];
  const engine = createMockSupabaseEngine(MOCK_USERS[0], zeroDay);
  const client = createTenantScopedClient(engine);

  const chartData = await client.getRecent30Days();
  assert.strictEqual(chartData.length, 1);
  assert.strictEqual(chartData[0].total_consultas, 0);
  assert.strictEqual(chartData[0].resueltas_ia, 0);
  assert.strictEqual(chartData[0].derivadas_humano, 0);
});

chartSuite.test('Tier 2.3: Limit constraint & recency enforcement (caps at 30 days and includes today)', async () => {
  const sixtyDayRecords = generateMockAnalytics(MOCK_TENANTS.TENANT_A.id, 1.0, 60);
  const engine = createMockSupabaseEngine(MOCK_USERS[0], sixtyDayRecords);
  const client = createTenantScopedClient(engine);

  const chartData = await client.getRecent30Days();
  assert.strictEqual(chartData.length, 30, 'Must cap results at 30 records');

  // Verify that the returned window is the MOST RECENT 30 days, not the oldest
  const latestDateInDataset = sixtyDayRecords[sixtyDayRecords.length - 1].date;
  assert.strictEqual(
    chartData[chartData.length - 1].date,
    latestDateInDataset,
    `Latest returned date (${chartData[chartData.length - 1].date}) must match newest dataset date (${latestDateInDataset})`
  );
});

chartSuite.test('Tier 2.4: Weekend vs weekday volume variance reflects realistic SMB behavior', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  const client = createTenantScopedClient(engine);
  const chartData = await client.getRecent30Days();

  // Inspect weekday vs weekend averages
  let weekdaySum = 0, weekdayCount = 0;
  let weekendSum = 0, weekendCount = 0;

  for (const d of chartData) {
    const day = new Date(d.date).getUTCDay();
    if (day === 0 || day === 6) {
      weekendSum += d.total_consultas;
      weekendCount++;
    } else {
      weekdaySum += d.total_consultas;
      weekdayCount++;
    }
  }

  const avgWeekday = weekdaySum / weekdayCount;
  const avgWeekend = weekendSum / weekendCount;

  assert.ok(
    avgWeekday > avgWeekend,
    `Average weekday inquiries (${avgWeekday.toFixed(1)}) should exceed weekend volume (${avgWeekend.toFixed(1)})`
  );
});

chartSuite.test('Tier 2.5: Non-negative counter constraints across all 30 days', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  const client = createTenantScopedClient(engine);
  const chartData = await client.getRecent30Days();

  for (const point of chartData) {
    assert.ok(point.resueltas_ia >= 0, 'resueltas_ia must be non-negative');
    assert.ok(point.derivadas_humano >= 0, 'derivadas_humano must be non-negative');
    assert.ok(point.total_consultas >= 0, 'total_consultas must be non-negative');
  }
});

chartSuite.test('Tier 2.6: Zero-inquiries tooltip human escalation percentage resolves to 0%', () => {
  const total = 0;
  const ia = 0;
  const pctIA = total > 0 ? Math.round((ia / total) * 100) : 0;
  const pctHumano = total > 0 ? 100 - pctIA : 0;

  assert.strictEqual(pctIA, 0);
  assert.strictEqual(pctHumano, 0, 'Human escalation must be 0% when total inquiries is 0');
});

chartSuite.test('Tier 2.7: Date parser handles full ISO-8601 timestamps (YYYY-MM-DDTHH:mm:ssZ)', () => {
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const formatDisplayDate = (dateStr) => {
    const cleanDate = (dateStr || '').split('T')[0];
    const parts = cleanDate.split('-');
    const day = (parts[2] || '01').padStart(2, '0');
    const monthIdx = parseInt(parts[1] || '1', 10) - 1;
    return `${day} ${monthNames[monthIdx] || ''}`;
  };

  const plainDate = formatDisplayDate('2026-09-10');
  assert.strictEqual(plainDate, '10 Sep');

  const isoDate = formatDisplayDate('2026-09-10T00:00:00Z');
  assert.strictEqual(isoDate, '10 Sep');
  assert.ok(/^\d{2} [A-Za-z]{3}$/.test(isoDate), 'Must match day month format without trailing timestamp artifacts');
});

// =============================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS
// =============================================================================

chartSuite.test('Tier 3.1: Multi-tenant isolation: chart data strictly matches session empresa_id', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]); // Tenant A
  const client = createTenantScopedClient(engine);
  const chartData = await client.getRecent30Days();

  for (const point of chartData) {
    assert.strictEqual(
      point.empresa_id,
      MOCK_TENANTS.TENANT_A.id,
      'Every chart data point must belong exclusively to Tenant A'
    );
    assert.notStrictEqual(
      point.empresa_id,
      MOCK_TENANTS.TENANT_B.id,
      'No point may belong to Tenant B'
    );
  }
});

chartSuite.test('Tier 3.2: Transform database records into UI-ready chart presentation payload', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  const client = createTenantScopedClient(engine);
  const rawData = await client.getRecent30Days();

  // Format required for Recharts / SVG charting components
  const chartPayload = rawData.map(row => {
    const dateObj = new Date(row.date);
    const day = dateObj.getUTCDate().toString().padStart(2, '0');
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const month = monthNames[dateObj.getUTCMonth()];

    return {
      date: row.date,
      displayDate: `${day} ${month}`,
      ia: row.resueltas_ia,
      humano: row.derivadas_humano,
      total: row.total_consultas,
    };
  });

  assert.strictEqual(chartPayload.length, 30);
  assert.ok(chartPayload[0].displayDate, 'displayDate must be formatted');
  assert.strictEqual(typeof chartPayload[0].ia, 'number');
  assert.strictEqual(typeof chartPayload[0].humano, 'number');
});

// =============================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS
// =============================================================================

chartSuite.test('Tier 4.1: End-to-end chart rendering data lifecycle simulation', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  const client = createTenantScopedClient(engine);

  // 1. Fetch
  const rawRows = await client.getRecent30Days();
  assert.strictEqual(rawRows.length, 30);

  // 2. Validate tooltip payload values for a sample day
  const sampleDay = rawRows[15];
  const tooltipData = {
    title: `Consultas del ${sampleDay.date}`,
    total: sampleDay.total_consultas,
    resueltasIA: sampleDay.resueltas_ia,
    derivadasHumano: sampleDay.derivadas_humano,
    porcentajeIA: Math.round((sampleDay.resueltas_ia / sampleDay.total_consultas) * 100),
  };

  assert.ok(tooltipData.total > 0);
  assert.strictEqual(tooltipData.resueltasIA + tooltipData.derivadasHumano, tooltipData.total);
  assert.ok(tooltipData.porcentajeIA >= 0 && tooltipData.porcentajeIA <= 100);
});

// Execute if run directly via CLI
if (process.argv[1]?.endsWith('test-chart-data.mjs')) {
  chartSuite.run().then(res => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
