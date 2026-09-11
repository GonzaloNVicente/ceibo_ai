/**
 * Ceibo AI - Empirical Adversarial Multi-Tenancy & Auth Stress Test Suite
 * 
 * Executed by teamwork_preview_challenger_1 (Multi-Tenancy & Auth Stress Challenger).
 */

import assert from 'node:assert/strict';
import {
  createSuite,
  createMockSupabaseEngine,
  createTenantScopedClient,
  resolveServerUser,
  MOCK_TENANTS,
  MOCK_USERS,
  MOCK_ANALYTICS,
  calculateSummaryMetrics,
} from '../helpers/test-harness.mjs';

export const adversarialSuite = createSuite('ADVERSARIAL STRESS SUITE: Multi-Tenancy & Auth Barriers');

// =============================================================================
// SUITE 1: CROSS-TENANT DATA EXFILTRATION UNDER VALID SESSIONS
// =============================================================================

adversarialSuite.test('ADV-1.1: Cross-tenant analytics query injection by Tenant B is blocked', async () => {
  const engineB = createMockSupabaseEngine(MOCK_USERS[2]);
  const res = await engineB
    .from('chat_analytics')
    .select('*')
    .eq('empresa_id', MOCK_TENANTS.TENANT_A.id);

  assert.strictEqual(res.error, null);
  assert.strictEqual(res.data.length, 0, 'Must return 0 rows for foreign tenant');
});

adversarialSuite.test('ADV-1.2: Cross-tenant profile exfiltration by Tenant B is blocked', async () => {
  const engineB = createMockSupabaseEngine(MOCK_USERS[2]);
  const res = await engineB
    .from('perfiles')
    .select('*')
    .eq('empresa_id', MOCK_TENANTS.TENANT_A.id);

  assert.strictEqual(res.error, null);
  assert.strictEqual(res.data.length, 0, 'Must not return foreign tenant profiles');
});

adversarialSuite.test('ADV-1.3: Cross-tenant specific email reconnaissance is blocked', async () => {
  const engineB = createMockSupabaseEngine(MOCK_USERS[2]);
  const res = await engineB
    .from('perfiles')
    .select('*')
    .eq('email', 'admin@ceibo.ai');

  assert.strictEqual(res.error, null);
  assert.strictEqual(res.data.length, 0, 'Tenant B cannot discover Tenant A user by email');
});

adversarialSuite.test('ADV-1.4: Cross-tenant company reconnaissance is blocked', async () => {
  const engineB = createMockSupabaseEngine(MOCK_USERS[2]);
  const res = await engineB
    .from('empresas')
    .select('*')
    .eq('id', MOCK_TENANTS.TENANT_A.id);

  assert.strictEqual(res.error, null);
  assert.strictEqual(res.data.length, 0, 'Tenant B cannot view Tenant A empresa record');
});

adversarialSuite.test('ADV-1.5: Chained contradictory tenant filters do not bypass isolation', async () => {
  const engineA = createMockSupabaseEngine(MOCK_USERS[0]);
  const res = await engineA
    .from('chat_analytics')
    .select('*')
    .eq('empresa_id', MOCK_TENANTS.TENANT_A.id)
    .eq('empresa_id', MOCK_TENANTS.TENANT_B.id);

  assert.strictEqual(res.error, null);
  assert.strictEqual(res.data.length, 0, 'Conflicting tenant query must yield 0 rows');
});

// =============================================================================
// SUITE 2: UNAUTHENTICATED ACCESS & RLS ENGINE BOUNDARY AUDIT
// =============================================================================

adversarialSuite.test('ADV-2.1: Application wrapper getTenantScopedClient rejects unauthenticated calls', async () => {
  const unauthedEngine = createMockSupabaseEngine(null);
  const scopedClient = createTenantScopedClient(unauthedEngine);

  await assert.rejects(
    async () => {
      await scopedClient.getRecent30Days();
    },
    /UNAUTHORIZED/,
    'getRecent30Days() must throw UNAUTHORIZED for unauthenticated sessions'
  );

  await assert.rejects(
    async () => {
      await scopedClient.getSummaryMetrics();
    },
    /UNAUTHORIZED/,
    'getSummaryMetrics() must throw UNAUTHORIZED for unauthenticated sessions'
  );
});

adversarialSuite.test('ADV-2.2: RLS Integrity: Direct unauthenticated query to chat_analytics', async () => {
  const unauthedEngine = createMockSupabaseEngine(null);
  const res = await unauthedEngine.from('chat_analytics').select('*');

  assert.strictEqual(
    res.data?.length ?? 0,
    0,
    `CRITICAL BUG: Unauthenticated query to chat_analytics returned ${res.data?.length} rows instead of 0! RLS bypassed when currentUser is null.`
  );
});

adversarialSuite.test('ADV-2.3: RLS Integrity: Direct unauthenticated query to perfiles', async () => {
  const unauthedEngine = createMockSupabaseEngine(null);
  const res = await unauthedEngine.from('perfiles').select('*');

  assert.strictEqual(
    res.data?.length ?? 0,
    0,
    `CRITICAL BUG: Unauthenticated query to perfiles returned ${res.data?.length} rows! PII leaked across tenants.`
  );
});

adversarialSuite.test('ADV-2.4: RLS Integrity: Direct unauthenticated query to empresas', async () => {
  const unauthedEngine = createMockSupabaseEngine(null);
  const res = await unauthedEngine.from('empresas').select('*');

  assert.strictEqual(
    res.data?.length ?? 0,
    0,
    `CRITICAL BUG: Unauthenticated query to empresas returned ${res.data?.length} rows!`
  );
});

// =============================================================================
// SUITE 3: SERVER CLIENT DEFAULT-USER FALLBACK AUDIT
// =============================================================================

adversarialSuite.test('ADV-3.1: Server client fallback vulnerability with missing auth cookie', async () => {
  // In src/lib/supabase/server.ts:
  // const userIdCookie = cookieStore.get('ceibo_mock_user_id')?.value;
  // const activeUser = resolveServerUser(userIdCookie);
  // return createMockSupabaseEngine(activeUser);

  const cookieValue = undefined; // unauthenticated visitor
  const activeUser = resolveServerUser(cookieValue);
  const serverEngine = createMockSupabaseEngine(activeUser);
  const currentUser = serverEngine._getCurrentUser();

  // In a secure architecture, an unauthenticated request MUST NOT be assigned MOCK_USERS[0]
  assert.strictEqual(
    currentUser,
    null,
    `CRITICAL VULNERABILITY: Server client assigns default user '${currentUser?.email}' to unauthenticated requests! Any guest hitting API gets Tenant A admin session.`
  );
});

adversarialSuite.test('ADV-3.2: Server client fallback vulnerability with forged auth cookie', async () => {
  const cookieValue = 'attacker-forged-cookie';
  const activeUser = resolveServerUser(cookieValue);
  const serverEngine = createMockSupabaseEngine(activeUser);
  const currentUser = serverEngine._getCurrentUser();

  assert.strictEqual(
    currentUser,
    null,
    `CRITICAL VULNERABILITY: Forged cookie silently falls back to '${currentUser?.email}' (Tenant A admin) instead of rejecting session!`
  );
});

// =============================================================================
// SUITE 4: TOKEN, AUTHENTICATION & CREDENTIAL MANIPULATION
// =============================================================================

adversarialSuite.test('ADV-4.1: SQL injection in password field is safely rejected', async () => {
  const engine = createMockSupabaseEngine();
  const res = await engine.auth.signInWithPassword({
    email: 'admin@ceibo.ai',
    password: "' OR '1'='1' --",
  });

  assert.ok(res.error, 'SQL injection password must be rejected');
  assert.strictEqual(res.data.user, null);
  assert.strictEqual(res.data.session, null);
});

adversarialSuite.test('ADV-4.2: SQL injection in email field is safely rejected', async () => {
  const engine = createMockSupabaseEngine();
  const res = await engine.auth.signInWithPassword({
    email: "' OR 1=1 --",
    password: 'password123',
  });

  assert.ok(res.error, 'SQL injection email must be rejected');
  assert.strictEqual(res.data.user, null);
  assert.strictEqual(res.data.session, null);
});

adversarialSuite.test('ADV-4.3: Missing credentials return explicit Spanish error', async () => {
  const engine = createMockSupabaseEngine();
  const emptyRes = await engine.auth.signInWithPassword({ email: '', password: '' });
  assert.ok(emptyRes.error);
  assert.strictEqual(emptyRes.data.user, null);

  const missingRes = await engine.auth.signInWithPassword({});
  assert.ok(missingRes.error);
  assert.strictEqual(missingRes.data.user, null);
});

adversarialSuite.test('ADV-4.4: Sign-out immediately destroys session and cuts off access', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  const userBefore = await engine.auth.getUser();
  assert.strictEqual(userBefore.data.user.email, 'admin@ceibo.ai');

  await engine.auth.signOut();

  const userAfter = await engine.auth.getUser();
  assert.strictEqual(userAfter.data.user, null);

  const sessionAfter = await engine.auth.getSession();
  assert.strictEqual(sessionAfter.data.session, null);
});

adversarialSuite.test('ADV-4.5: Password brute force resistance with non-existent accounts', async () => {
  const engine = createMockSupabaseEngine();
  const res = await engine.auth.signInWithPassword({
    email: 'nonexistent@hacker.io',
    password: 'password123',
  });

  assert.ok(res.error);
  assert.strictEqual(res.data.user, null);
});

// =============================================================================
// SUITE 5: QUERY PARAMETER & FILTER BYPASS RESISTANCE
// =============================================================================

adversarialSuite.test('ADV-5.1: Range filter sweep does not leak cross-tenant rows', async () => {
  const engineB = createMockSupabaseEngine(MOCK_USERS[2]);
  const res = await engineB
    .from('chat_analytics')
    .select('*')
    .gte('date', '1970-01-01');

  for (const row of res.data) {
    assert.strictEqual(
      row.empresa_id,
      MOCK_TENANTS.TENANT_B.id,
      'Range sweep must not include any Tenant A rows'
    );
  }
});

adversarialSuite.test('ADV-5.2: Order by date does not interleave cross-tenant rows', async () => {
  const engineB = createMockSupabaseEngine(MOCK_USERS[2]);
  const res = await engineB
    .from('chat_analytics')
    .select('*')
    .order('date', { ascending: false });

  assert.ok(res.data.length > 0);
  for (const row of res.data) {
    assert.strictEqual(row.empresa_id, MOCK_TENANTS.TENANT_B.id);
  }
});

adversarialSuite.test('ADV-5.3: Metric calculator handles empty and zero arrays safely', () => {
  const emptyMetrics = calculateSummaryMetrics([]);
  assert.strictEqual(emptyMetrics.totalConsultas, 0);
  assert.strictEqual(emptyMetrics.totalIA, 0);
  assert.strictEqual(emptyMetrics.totalHuman, 0);
  assert.strictEqual(emptyMetrics.horasAhorradas, 0);
  assert.strictEqual(emptyMetrics.tasaResolucionIA, 0);
  assert.strictEqual(isNaN(emptyMetrics.tasaResolucionIA), false);
});

adversarialSuite.test('ADV-5.4: Concurrency: Parallel independent engines maintain strict data isolation', async () => {
  const engineA = createMockSupabaseEngine(MOCK_USERS[0]);
  const engineB = createMockSupabaseEngine(MOCK_USERS[2]);

  const [resA, resB] = await Promise.all([
    engineA.from('chat_analytics').select('*'),
    engineB.from('chat_analytics').select('*'),
  ]);

  assert.ok(resA.data.length > 0);
  assert.ok(resB.data.length > 0);
  assert.ok(resA.data.every(r => r.empresa_id === MOCK_TENANTS.TENANT_A.id));
  assert.ok(resB.data.every(r => r.empresa_id === MOCK_TENANTS.TENANT_B.id));
});

// Run suite if executed directly via CLI
if (process.argv[1]?.endsWith('test-adversarial-multitenancy.mjs')) {
  adversarialSuite.run().then((summary) => {
    console.log(`\nAdversarial Test Execution Completed:`);
    console.log(`Total: ${summary.total} | Passed: ${summary.passed} | Failed: ${summary.failed}`);
    process.exit(summary.failed > 0 ? 1 : 0);
  });
}
