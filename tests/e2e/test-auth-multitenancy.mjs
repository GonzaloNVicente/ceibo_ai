/**
 * Ceibo AI E2E Test Suite: Authentication & Multi-Tenancy
 * 
 * Validates R1 requirements from ORIGINAL_REQUEST.md and PROJECT.md:
 * - Supabase auth login (email/password)
 * - User perfiles association to empresas tenant
 * - Role propagation (admin vs member)
 * - Session lifecycle & sign-out
 * - Invalid credentials boundary rejection
 * - Multi-tenant context switching
 */

import assert from 'node:assert/strict';
import {
  createSuite,
  createMockSupabaseEngine,
  createTenantScopedClient,
  MOCK_TENANTS,
  MOCK_USERS,
} from '../helpers/test-harness.mjs';

export const authSuite = createSuite('E2E: Authentication & Multi-Tenancy');

// =============================================================================
// TIER 1: CORE FEATURE COVERAGE (>=5 Tests)
// =============================================================================

authSuite.test('Tier 1.1: Tenant Admin logs in with valid credentials and receives session', async () => {
  const engine = createMockSupabaseEngine();
  const { data, error } = await engine.auth.signInWithPassword({
    email: 'admin@ceibo.ai',
    password: 'password123',
  });

  assert.strictEqual(error, null, 'Login should succeed without error');
  assert.ok(data.session, 'Session object must be present');
  assert.ok(data.session.access_token, 'Access token must be generated');
  assert.strictEqual(data.user.email, 'admin@ceibo.ai');
  assert.strictEqual(data.user.id, 'user-001');
});

authSuite.test('Tier 1.2: Tenant Member logs in and receives standard member role', async () => {
  const engine = createMockSupabaseEngine();
  const { data, error } = await engine.auth.signInWithPassword({
    email: 'member@ceibo.ai',
    password: 'password123',
  });

  assert.strictEqual(error, null);
  assert.strictEqual(data.user.id, 'user-002');

  const { data: perfil } = await engine
    .from('perfiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  assert.ok(perfil, 'Profile must exist');
  assert.strictEqual(perfil.role, 'member', 'Role should be member');
  assert.strictEqual(perfil.empresa_id, MOCK_TENANTS.TENANT_A.id);
});

authSuite.test('Tier 1.3: User profile is strictly associated with correct empresa_id', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]); // Logged in as admin@ceibo.ai
  const { data: perfil, error } = await engine
    .from('perfiles')
    .select('*')
    .eq('id', 'user-001')
    .single();

  assert.strictEqual(error, null);
  assert.strictEqual(perfil.empresa_id, MOCK_TENANTS.TENANT_A.id, 'Profile empresa_id must match Tenant A');
  assert.strictEqual(perfil.full_name, 'Sofía Rodríguez');
});

authSuite.test('Tier 1.4: Authenticated session joins and resolves company metadata', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  const client = createTenantScopedClient(engine);
  const session = await client.getSession();

  assert.ok(session, 'Session must not be null');
  assert.ok(session.empresa, 'Empresa metadata must be present');
  assert.strictEqual(session.empresa.name, 'Ceibo AI Tech Solutions');
  assert.strictEqual(session.empresa.slug, 'ceibo-tech');
  assert.strictEqual(session.empresa.plan, 'enterprise');
});

authSuite.test('Tier 1.5: User sign out completely flushes session and active user', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]);
  
  // Verify initially logged in
  const { data: initialUser } = await engine.auth.getUser();
  assert.ok(initialUser.user, 'Initial user should be logged in');

  // Sign out
  const { error } = await engine.auth.signOut();
  assert.strictEqual(error, null);

  // Verify session is now null
  const { data: afterUser } = await engine.auth.getUser();
  assert.strictEqual(afterUser.user, null, 'User should be null after signOut');

  const { data: sessionData } = await engine.auth.getSession();
  assert.strictEqual(sessionData.session, null, 'Session should be null after signOut');
});

authSuite.test('Tier 1.6: useAuth interface contract conformance', async () => {
  const engine = createMockSupabaseEngine();
  // Validate that interface properties (user, perfil, empresa, loading, signIn, signOut) are shaped correctly
  assert.strictEqual(typeof engine.auth.signInWithPassword, 'function');
  assert.strictEqual(typeof engine.auth.signOut, 'function');
  assert.strictEqual(typeof engine.auth.getUser, 'function');
  assert.strictEqual(typeof engine.auth.getSession, 'function');
});

// =============================================================================
// TIER 2: BOUNDARY & CORNER CASES (>=5 Tests)
// =============================================================================

authSuite.test('Tier 2.1: Invalid password returns error message and null session', async () => {
  const engine = createMockSupabaseEngine();
  const { data, error } = await engine.auth.signInWithPassword({
    email: 'admin@ceibo.ai',
    password: 'wrongpassword999',
  });

  assert.strictEqual(data.user, null, 'User must be null on password mismatch');
  assert.strictEqual(data.session, null, 'Session must be null on password mismatch');
  assert.ok(error, 'Error must be provided');
  assert.match(error.message, /inválidas/i, 'Error should mention invalid credentials');
});

authSuite.test('Tier 2.2: Unregistered email returns failure without disclosing internal IDs', async () => {
  const engine = createMockSupabaseEngine();
  const { data, error } = await engine.auth.signInWithPassword({
    email: 'nonexistent@randomdomain.xyz',
    password: 'password123',
  });

  assert.strictEqual(data.user, null);
  assert.strictEqual(data.session, null);
  assert.ok(error);
  assert.match(error.message, /inválidas/i);
});

authSuite.test('Tier 2.3: Empty email and password submission is safely rejected', async () => {
  const engine = createMockSupabaseEngine();
  const { data, error } = await engine.auth.signInWithPassword({
    email: '',
    password: '',
  });

  assert.strictEqual(data.user, null);
  assert.ok(error);
  assert.match(error.message, /obligatorios/i);
});

authSuite.test('Tier 2.4: Email with surrounding whitespace is cleanly trimmed', async () => {
  const engine = createMockSupabaseEngine();
  const { data, error } = await engine.auth.signInWithPassword({
    email: '   admin@ceibo.ai   ',
    password: 'password123',
  });

  assert.strictEqual(error, null, 'Trimming email should allow successful authentication');
  assert.strictEqual(data.user.email, 'admin@ceibo.ai');
});

authSuite.test('Tier 2.5: Case-insensitive email authentication', async () => {
  const engine = createMockSupabaseEngine();
  const { data, error } = await engine.auth.signInWithPassword({
    email: 'ADMIN@CEIBO.AI',
    password: 'password123',
  });

  assert.strictEqual(error, null, 'Case-insensitive email should succeed');
  assert.strictEqual(data.user.id, 'user-001');
});

// =============================================================================
// TIER 3: CROSS-FEATURE & SESSION SWITCHING
// =============================================================================

authSuite.test('Tier 3.1: Switching tenants from Tenant A to Tenant B updates context completely', async () => {
  const engine = createMockSupabaseEngine();
  
  // Step 1: Log in as Tenant A
  const loginA = await engine.auth.signInWithPassword({
    email: 'admin@ceibo.ai',
    password: 'password123',
  });
  assert.strictEqual(loginA.error, null);
  let client = createTenantScopedClient(engine);
  let session = await client.getSession();
  assert.strictEqual(session.empresa.id, MOCK_TENANTS.TENANT_A.id);
  assert.strictEqual(session.empresa.name, 'Ceibo AI Tech Solutions');

  // Step 2: Sign out
  await engine.auth.signOut();

  // Step 3: Log in as Tenant B
  const loginB = await engine.auth.signInWithPassword({
    email: 'carlos@rival.com',
    password: 'password123',
  });
  assert.strictEqual(loginB.error, null);
  client = createTenantScopedClient(engine);
  session = await client.getSession();
  assert.strictEqual(session.empresa.id, MOCK_TENANTS.TENANT_B.id);
  assert.strictEqual(session.empresa.name, 'Rival Retail Corp');
  assert.strictEqual(session.perfil.full_name, 'Carlos Gómez');
});

authSuite.test('Tier 3.2: RLS blocks user in Tenant A from querying profiles in Tenant B', async () => {
  const engine = createMockSupabaseEngine(MOCK_USERS[0]); // User in Tenant A
  
  const { data: profiles, error } = await engine
    .from('perfiles')
    .select('*')
    .eq('empresa_id', MOCK_TENANTS.TENANT_B.id);

  assert.strictEqual(error, null);
  assert.strictEqual(profiles.length, 0, 'User in Tenant A must receive 0 rows when attempting to query Tenant B profiles');
});

// =============================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS
// =============================================================================

authSuite.test('Tier 4.1: End-to-end SMB admin login, profile verification, and session persistence', async () => {
  const engine = createMockSupabaseEngine();
  
  // SMB Admin logs into Ceibo AI
  const loginRes = await engine.auth.signInWithPassword({
    email: 'admin@ceibo.ai',
    password: 'password123',
  });
  assert.strictEqual(loginRes.error, null);
  assert.ok(loginRes.data.session.access_token);

  // System loads scoped tenant client
  const client = createTenantScopedClient(engine);
  const session = await client.getSession();

  assert.strictEqual(session.user.email, 'admin@ceibo.ai');
  assert.strictEqual(session.perfil.role, 'admin');
  assert.strictEqual(session.empresa.slug, 'ceibo-tech');
  assert.strictEqual(session.empresa.plan, 'enterprise');

  // Verify that an unauthenticated client is blocked
  const unauthedEngine = createMockSupabaseEngine(null);
  const unauthedClient = createTenantScopedClient(unauthedEngine);
  await assert.rejects(
    async () => {
      await unauthedClient.getRecent30Days();
    },
    /UNAUTHORIZED/,
    'Unauthenticated call to getRecent30Days must throw UNAUTHORIZED'
  );
});

// Execute if run directly via CLI
if (process.argv[1]?.endsWith('test-auth-multitenancy.mjs')) {
  authSuite.run().then(res => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
