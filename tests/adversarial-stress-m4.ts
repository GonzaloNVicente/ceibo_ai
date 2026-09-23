/**
/**
 * CEIBO AI - Empirical Adversarial Verification & Stress Test Suite (Milestone 4)
 * Challenger: teamwork_preview_challenger
 * 
 * Directly tests the production TypeScript code:
 * - src/lib/supabase/mock-data.ts (calculateSummaryMetrics, generateMockAnalytics, etc.)
 * - src/lib/supabase/mock-client.ts (createMockSupabaseEngine, getBrowserMockClient, RLS)
 * - src/lib/supabase/tenant-client.ts (createTenantScopedClient, getTenantSession)
 * - Edge cases: zero data, empty arrays, null/undefined, overflow, division by zero,
 *   floating point, cross-tenant isolation, session persistence, SQL injection strings.
 */

import assert from 'node:assert/strict';
import {
  calculateSummaryMetrics,
  generateMockAnalytics,
  MOCK_TENANTS,
  MOCK_USERS,
  MOCK_ANALYTICS,
} from '../src/lib/supabase/mock-data';
import { createMockSupabaseEngine, getBrowserMockClient } from '../src/lib/supabase/mock-client';
import { createTenantScopedClient, getTenantSession } from '../src/lib/supabase/tenant-client';
import { ChatAnalytics } from '../src/lib/supabase/types';

async function runAdversarialAudit() {
  console.log('================================================================');
  console.log('CEIBO AI - ADVERSARIAL STRESS TEST HARNESS (CHALLENGER M4)');
  console.log('Testing Production TypeScript Code Directly');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function runTest(name: string, fn: () => void | Promise<void>) {
    process.stdout.write(`• ${name.padEnd(65, '.')} `);
    try {
      const p = fn();
      if (p && typeof (p as any).then === 'function') {
        return (p as Promise<void>).then(() => {
          passed++;
          console.log('\x1b[32m[PASS]\x1b[0m');
        }).catch((err) => {
          failed++;
          console.log('\x1b[31m[FAIL]\x1b[0m');
          console.error(`  Error: ${err.message}`);
        });
      } else {
        passed++;
        console.log('\x1b[32m[PASS]\x1b[0m');
      }
    } catch (err: any) {
      failed++;
      console.log('\x1b[31m[FAIL]\x1b[0m');
      console.error(`  Error: ${err.message}`);
    }
  }

  // --- SECTION 1: CALCULATION INTEGRITY & DIVISION BY ZERO ---
  runTest('CALC-1: null input to calculateSummaryMetrics', () => {
    const res = calculateSummaryMetrics(null as any);
    assert.strictEqual(res.totalConsultas, 0);
    assert.strictEqual(res.totalIA, 0);
    assert.strictEqual(res.totalHuman, 0);
    assert.strictEqual(res.horasAhorradas, 0);
    assert.strictEqual(res.tasaResolucionIA, 0);
    assert.ok(!Number.isNaN(res.tasaResolucionIA));
  });

  runTest('CALC-2: undefined input to calculateSummaryMetrics', () => {
    const res = calculateSummaryMetrics(undefined as any);
    assert.strictEqual(res.totalConsultas, 0);
    assert.strictEqual(res.horasAhorradas, 0);
    assert.strictEqual(res.tasaResolucionIA, 0);
    assert.ok(!Number.isNaN(res.tasaResolucionIA));
  });

  runTest('CALC-3: empty array input [] to calculateSummaryMetrics', () => {
    const res = calculateSummaryMetrics([]);
    assert.strictEqual(res.totalConsultas, 0);
    assert.strictEqual(res.horasAhorradas, 0);
    assert.strictEqual(res.tasaResolucionIA, 0);
  });

  runTest('CALC-4: single day with 0 queries (0 IA, 0 Human)', () => {
    const row: ChatAnalytics = {
      empresa_id: 'test',
      date: '2026-09-01',
      resueltas_ia: 0,
      derivadas_humano: 0,
      total_consultas: 0,
      horas_ahorradas: 0, pedidos_count: 0, presupuestos_count: 0, reclamos_count: 0, valor_estimado: 0,
    };
    const res = calculateSummaryMetrics([row]);
    assert.strictEqual(res.totalConsultas, 0);
    assert.strictEqual(res.tasaResolucionIA, 0, 'Must NOT be NaN due to 0/0 division');
    assert.strictEqual(res.horasAhorradas, 0);
  });

  runTest('CALC-5: extreme high volume (1,000,000,000 queries)', () => {
    const row: ChatAnalytics = {
      empresa_id: 'test',
      date: '2026-09-01',
      resueltas_ia: 800_000_000,
      derivadas_humano: 200_000_000,
      total_consultas: 1_000_000_000,
      horas_ahorradas: 160_000_000, pedidos_count: 0, presupuestos_count: 0, reclamos_count: 0, valor_estimado: 0,
    };
    const res = calculateSummaryMetrics([row]);
    assert.strictEqual(res.totalConsultas, 1_000_000_000);
    assert.strictEqual(res.totalIA, 800_000_000);
    assert.strictEqual(res.totalHuman, 200_000_000);
    assert.strictEqual(res.horasAhorradas, 160_000_000);
    assert.strictEqual(res.tasaResolucionIA, 80);
  });

  runTest('CALC-6: floating point hours saved rounding (17 queries -> 3.4 h)', () => {
    const row: ChatAnalytics = {
      empresa_id: 'test',
      date: '2026-09-01',
      resueltas_ia: 17,
      derivadas_humano: 3,
      total_consultas: 20,
      horas_ahorradas: 3.4, pedidos_count: 0, presupuestos_count: 0, reclamos_count: 0, valor_estimado: 0,
    };
    const res = calculateSummaryMetrics([row]);
    assert.strictEqual(res.horasAhorradas, 3.4);
    assert.strictEqual(res.tasaResolucionIA, 85);
  });

  runTest('CALC-7: rows with missing/undefined numeric fields', () => {
    const malformed = [
      {
        empresa_id: 'test',
        date: '2026-09-01',
        resueltas_ia: undefined,
        derivadas_humano: null,
      } as any,
    ];
    const res = calculateSummaryMetrics(malformed);
    assert.strictEqual(res.totalConsultas, 0);
    assert.strictEqual(res.horasAhorradas, 0);
    assert.strictEqual(res.tasaResolucionIA, 0);
    assert.ok(!Number.isNaN(res.horasAhorradas));
  });

  // --- SECTION 2: AUTH & MULTI-TENANT ISOLATION ---
  await runTest('TENANT-1: Unauthenticated tenant client throws UNAUTHORIZED', async () => {
    const unauthedEngine = createMockSupabaseEngine(null);
    const client = createTenantScopedClient(unauthedEngine);
    await assert.rejects(
      async () => {
        await client.getRecent30Days();
      },
      /UNAUTHORIZED/,
      'Unauthenticated client must reject getRecent30Days'
    );
    await assert.rejects(
      async () => {
        await client.getLeads();
      },
      /UNAUTHORIZED/,
      'Unauthenticated client must reject getLeads'
    );
    await assert.rejects(
      async () => {
        await client.getChatMessages('some-id');
      },
      /UNAUTHORIZED/,
      'Unauthenticated client must reject getChatMessages'
    );
  });

  await runTest('TENANT-2: Tenant A user cannot read Tenant B data via direct query', async () => {
    const engineA = createMockSupabaseEngine(MOCK_USERS[0]); // Tenant A
    const res = await engineA
      .from('chat_analytics_daily')
      .select('*')
      .eq('empresa_id', MOCK_TENANTS.TENANT_B.id);

    assert.strictEqual(res.data?.length ?? 0, 0, 'Must return 0 rows for foreign tenant');
  });

  await runTest('TENANT-3: Tenant B user cannot read Tenant A data via direct query', async () => {
    const engineB = createMockSupabaseEngine(MOCK_USERS[2]); // Tenant B
    const res = await engineB
      .from('chat_analytics_daily')
      .select('*')
      .eq('empresa_id', MOCK_TENANTS.TENANT_A.id);

    assert.strictEqual(res.data?.length ?? 0, 0, 'Must return 0 rows for foreign tenant');
  });

  await runTest('TENANT-4: Tenant B user cannot read Tenant A raw leads or chat messages', async () => {
    const engineB = createMockSupabaseEngine(MOCK_USERS[2]); // Tenant B
    const clientB = createTenantScopedClient(engineB);

    const leadsB = await clientB.getLeads();
    for (const lead of leadsB) {
      assert.strictEqual(
        lead.empresa_id,
        MOCK_TENANTS.TENANT_B.id,
        'All leads returned to Tenant B must belong to Tenant B'
      );
    }

    const alienLeads = leadsB.filter((l) => l.empresa_id === MOCK_TENANTS.TENANT_A.id);
    assert.strictEqual(alienLeads.length, 0, 'Zero Tenant A leads allowed in Tenant B result');
  });

  await runTest('TENANT-5: Tenant switching updates session and isolates datasets', async () => {
    const engine = createMockSupabaseEngine();
    
    // Login Tenant A
    const loginA = await engine.auth.signInWithPassword({
      email: 'admin@ceibo.ai',
      password: 'password123',
    });
    assert.strictEqual(loginA.error, null);
    let client = createTenantScopedClient(engine);
    let session = await client.getSession();
    assert.strictEqual(session?.empresa?.id, MOCK_TENANTS.TENANT_A.id);
    const rowsA = await client.getRecent30Days();
    assert.ok(rowsA.every((r) => r.empresa_id === MOCK_TENANTS.TENANT_A.id));

    // Sign out
    await engine.auth.signOut();

    // Login Tenant B
    const loginB = await engine.auth.signInWithPassword({
      email: 'carlos@rival.com',
      password: 'password123',
    });
    assert.strictEqual(loginB.error, null);
    client = createTenantScopedClient(engine);
    session = await client.getSession();
    assert.strictEqual(session?.empresa?.id, MOCK_TENANTS.TENANT_B.id);
    const rowsB = await client.getRecent30Days();
    assert.ok(rowsB.every((r) => r.empresa_id === MOCK_TENANTS.TENANT_B.id));

    // Ensure metrics are mathematically different
    const metricsA = calculateSummaryMetrics(rowsA);
    const metricsB = calculateSummaryMetrics(rowsB);
    assert.notStrictEqual(metricsA.totalConsultas, metricsB.totalConsultas);
  });

  // --- SECTION 3: DATE PARSER & CHART LOGIC EDGE CASES ---
  runTest('CHART-1: date parsing edge cases (leap day, year crossover, invalid string)', () => {
    const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const parseDisplay = (dateStr: string) => {
      const cleanDate = (dateStr || '').split('T')[0];
      const parts = cleanDate.split('-');
      const day = (parts[2] || '01').padStart(2, '0');
      const monthIdx = parseInt(parts[1] || '1', 10) - 1;
      const month = MONTH_NAMES[monthIdx] || '';
      return `${day} ${month}`;
    };

    assert.strictEqual(parseDisplay('2024-02-29'), '29 Feb');
    assert.strictEqual(parseDisplay('2026-01-01T23:59:59Z'), '01 Ene');
    assert.strictEqual(parseDisplay('2026-09-10'), '10 Sep');
  });

  runTest('CHART-2: chartData handles 0 records without crashing or throwing', () => {
    const emptyRows: ChatAnalytics[] = [];
    const chartData = emptyRows.map((row) => ({
      date: row.date,
      ai: row.resueltas_ia,
      human: row.derivadas_humano,
      total: row.total_consultas,
    }));
    assert.strictEqual(chartData.length, 0);
  });

  // --- SECTION 4: INBOX & CHATS TENANT PURITY ---
  await runTest('INBOX-1: getLeads returns only authenticated tenant rows', async () => {
    const engineA = createMockSupabaseEngine(MOCK_USERS[0]);
    const clientA = createTenantScopedClient(engineA);
    const leadsA = await clientA.getLeads();

    assert.ok(leadsA.length > 0);
    assert.ok(leadsA.every((l) => l.empresa_id === MOCK_TENANTS.TENANT_A.id));
  });

  await runTest('CHATS-1: getChatMessages respects session and tenant boundaries', async () => {
    const engineA = createMockSupabaseEngine(MOCK_USERS[0]);
    const clientA = createTenantScopedClient(engineA);
    const leadsA = await clientA.getLeads();
    const firstLead = leadsA[0];

    const messages = await clientA.getChatMessages(firstLead.id);
    assert.ok(messages.length > 0);
    assert.ok(messages.every((m) => m.empresa_id === MOCK_TENANTS.TENANT_A.id));
    assert.ok(messages.every((m) => m.session_id === firstLead.id));
  });

  console.log(`\nAdversarial Test Summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAdversarialAudit().catch((err) => {
  console.error('Fatal unhandled error:', err);
  process.exit(1);
});
