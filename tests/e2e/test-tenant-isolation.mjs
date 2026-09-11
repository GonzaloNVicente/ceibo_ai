/**
 * Ceibo AI E2E Test Suite: Multi-Tenant Data Isolation & Security
 * 
 * Validates R1 & Acceptance Criteria from ORIGINAL_REQUEST.md and PROJECT.md:
 * - "RLS or filtering successfully prevents a user from seeing another empresa_id's data"
 * - Auto-filtering queries by empresa_id
 * - Defense-in-depth: Application-layer tenant scoping + Row Level Security (RLS)
 * - Adversarial cross-tenant query injection rejection
 * - Complete data barrier between Tenant A (Ceibo AI) and Tenant B (Rival Retail)
 */

import assert from 'node:assert/strict';
import {
  createSuite,
  createMockSupabaseEngine,
  createTenantScopedClient,
  MOCK_TENANTS,
  MOCK_USERS,
  MOCK_ANALYTICS,
} from '../helpers/test-harness.mjs';

export const isolationSuite = createSuite('E2E: Multi-Tenant Data Isolation');

// =============================================================================
// TIER 1: CORE FEATURE COVERAGE (>=5 Tests)
// =============================================================================

isolationSuite.test('Tier 1.1: Tenant A user querying chat_analytics strictly receives Tenant A rows', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]); // Tenant A Admin
  const { data, error } = await engine.from('chat_analytics').select('*');

  assert.strictEqual(error, null);
  assert.ok(data.length > 0, 'Must return rows for Tenant A');

  for (const row of data) {
    assert.strictEqual(
      row.empresa_id,
      MOCK_TENANTS.TENANT_A.id,
      `Row empresa_id (${row.empresa_id}) must match Tenant A ID (${MOCK_TENANTS.TENANT_A.id})`
    );
  }
});

isolationSuite.test('Tier 1.2: Tenant B user querying chat_analytics strictly receives Tenant B rows', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[2]); // Tenant B Admin (carlos@rival.com)
  const { data, error } = await engine.from('chat_analytics').select('*');

  assert.strictEqual(error, null);
  assert.ok(data.length > 0, 'Must return rows for Tenant B');

  for (const row of data) {
    assert.strictEqual(
      row.empresa_id,
      MOCK_TENANTS.TENANT_B.id,
      `Row empresa_id (${row.empresa_id}) must match Tenant B ID (${MOCK_TENANTS.TENANT_B.id})`
    );
  }
});

isolationSuite.test('Tier 1.3: Tenant A user querying perfiles only sees colleagues within Tenant A', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  const { data, error } = await engine.from('perfiles').select('*');

  assert.strictEqual(error, null);
  assert.ok(data.length >= 2, 'Should see users belonging to Tenant A (admin + member)');

  for (const profile of data) {
    assert.strictEqual(
      profile.empresa_id,
      MOCK_TENANTS.TENANT_A.id,
      'Profiles returned must belong strictly to Tenant A'
    );
  }
});

isolationSuite.test('Tier 1.4: Tenant B user querying perfiles only sees Tenant B profiles', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[2]);
  const { data, error } = await engine.from('perfiles').select('*');

  assert.strictEqual(error, null);
  assert.strictEqual(data.length, 1, 'Only Carlos should be in Tenant B');
  assert.strictEqual(data[0].email, 'carlos@rival.com');
  assert.strictEqual(data[0].empresa_id, MOCK_TENANTS.TENANT_B.id);
});

isolationSuite.test('Tier 1.5: Application wrapper getTenantScopedClient automatically enforces tenant boundaries', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  const client = createTenantScopedClient(engine);

  const data = await client.getRecent30Days();
  assert.strictEqual(data.length, 30);

  const alienRows = data.filter(r => r.empresa_id !== MOCK_TENANTS.TENANT_A.id);
  assert.strictEqual(alienRows.length, 0, 'Zero alien tenant rows allowed in scoped client response');
});

// =============================================================================
// TIER 2: BOUNDARY & ADVERSARIAL PENETRATION (>=5 Tests)
// =============================================================================

isolationSuite.test('Tier 2.1: Adversarial Direct Query: Tenant A explicitly requesting Tenant B empresa_id is blocked', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]); // User in Tenant A
  
  // Attacker deliberately targets Tenant B's data
  const { data, error } = await engine
    .from('chat_analytics')
    .select('*')
    .eq('empresa_id', MOCK_TENANTS.TENANT_B.id);

  assert.strictEqual(error, null);
  assert.strictEqual(
    data.length,
    0,
    'RLS and tenant filtering must return 0 rows when attempting to query foreign tenant data'
  );
});

isolationSuite.test('Tier 2.2: Adversarial Direct Query: Tenant B explicitly requesting Tenant A empresa_id is blocked', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[2]); // User in Tenant B (Carlos)

  // Attacker in Tenant B attempts to read Ceibo AI analytics
  const { data, error } = await engine
    .from('chat_analytics')
    .select('*')
    .eq('empresa_id', MOCK_TENANTS.TENANT_A.id);

  assert.strictEqual(error, null);
  assert.strictEqual(
    data.length,
    0,
    'Tenant B user must receive 0 rows when querying Tenant A data'
  );
});

isolationSuite.test('Tier 2.3: Unfiltered wildcard query (.select("*")) NEVER leaks across tenant partition', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);

  // Query without any .eq() filter
  const { data } = await engine.from('chat_analytics').select('*');

  // Verify that not a single row from Tenant B exists in the result set
  const leakedRows = data.filter(r => r.empresa_id === MOCK_TENANTS.TENANT_B.id);
  assert.strictEqual(leakedRows.length, 0, 'Zero Tenant B rows should leak in unfiltered query');
});

isolationSuite.test('Tier 2.4: Cross-tenant company access: User cannot view details of foreign empresa', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]); // Tenant A

  const { data: companies } = await engine
    .from('empresas')
    .select('*')
    .eq('id', MOCK_TENANTS.TENANT_B.id);

  assert.strictEqual(
    companies.length,
    0,
    'User in Tenant A must not be able to retrieve Tenant B company record'
  );
});

isolationSuite.test('Tier 2.5: Unauthenticated guest access to analytics is 100% blocked', async () => {
  const unauthedEngine = createMockSupabaseEngine(null);
  const client = createTenantScopedClient(unauthedEngine);

  await assert.rejects(
    async () => {
      await client.getRecent30Days();
    },
    /UNAUTHORIZED/,
    'Unauthenticated access must throw UNAUTHORIZED'
  );
});

// =============================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS
// =============================================================================

isolationSuite.test('Tier 3.1: Date range filters combined with tenant scoping maintain zero-leakage guarantee', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);

  const targetDate = '2026-09-05';
  const { data } = await engine
    .from('chat_analytics')
    .select('*')
    .gte('date', targetDate);

  for (const row of data) {
    assert.strictEqual(row.empresa_id, MOCK_TENANTS.TENANT_A.id);
    assert.ok(row.date >= targetDate);
  }
});

isolationSuite.test('Tier 3.2: Aggregate metric calculations strictly isolate datasets between tenants', async () => {
  const engineA = createMockSupabaseEngine(MOCK_USERS[0]);
  const metricsA = await createTenantScopedClient(engineA).getSummaryMetrics();

  const engineB = createMockSupabaseEngine(MOCK_USERS[2]);
  const metricsB = await createTenantScopedClient(engineB).getSummaryMetrics();

  // Sum of isolated metrics should match total of individual mock datasets
  const rawRowsA = MOCK_ANALYTICS.filter(r => r.empresa_id === MOCK_TENANTS.TENANT_A.id);
  const rawRowsB = MOCK_ANALYTICS.filter(r => r.empresa_id === MOCK_TENANTS.TENANT_B.id);

  const expectedTotalA = rawRowsA.reduce((sum, r) => sum + r.resueltas_ia + r.derivadas_humano, 0);
  const expectedTotalB = rawRowsB.reduce((sum, r) => sum + r.resueltas_ia + r.derivadas_humano, 0);

  assert.strictEqual(metricsA.totalConsultas, expectedTotalA);
  assert.strictEqual(metricsB.totalConsultas, expectedTotalB);
});

// =============================================================================
// TIER 4: REAL-WORLD ADVERSARIAL PENETRATION SCENARIO
// =============================================================================

isolationSuite.test('Tier 4.1: Adversarial Penetration Simulation: Foreign JWT bearer attack is 100% blocked', async () => {
  // Scenario: Competitor (Carlos at Rival Retail) tries to snoop on Ceibo AI's high sales numbers
  // 1. Attacker authenticates with their legitimate account
  const competitorEngine = createMockSupabaseEngine();
  const authRes = await competitorEngine.auth.signInWithPassword({
    email: 'carlos@rival.com',
    password: 'password123',
  });
  assert.strictEqual(authRes.error, null);

  // 2. Attacker crafts manual database queries targeting Ceibo AI's empresa_id
  const foreignEmpresaId = MOCK_TENANTS.TENANT_A.id;
  const attackQuery = await competitorEngine
    .from('chat_analytics')
    .select('*')
    .eq('empresa_id', foreignEmpresaId);

  // 3. Verify security barrier: 0 rows returned, no data leaked
  assert.strictEqual(attackQuery.data.length, 0, 'Adversarial query must return exactly 0 rows');

  // 4. Verify competitor cannot read Ceibo AI profile list
  const profileAttack = await competitorEngine
    .from('perfiles')
    .select('*')
    .eq('empresa_id', foreignEmpresaId);

  assert.strictEqual(profileAttack.data.length, 0, 'Competitor must not view victim tenant profiles');
});

// Execute if run directly via CLI
if (process.argv[1]?.endsWith('test-tenant-isolation.mjs')) {
  isolationSuite.run().then(res => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
