/**
 * Ceibo AI Test Harness & Shared Test Engine
 * 
 * Provides standalone test execution primitives, fixture data, and the authoritative
 * reference implementation of Supabase Auth & Tenant-scoped data queries conforming
 * to PROJECT.md interface contracts and ORIGINAL_REQUEST.md requirements.
 */

import assert from 'node:assert/strict';

// =============================================================================
// 1. Standalone Mini Test Runner
// =============================================================================

export function createSuite(suiteName) {
  const tests = [];
  let passedCount = 0;
  let failedCount = 0;
  const failures = [];

  const suite = {
    test(name, fn) {
      tests.push({ name, fn });
    },
    async run() {
      console.log(`\n\x1b[1m\x1b[36m======================================================================\x1b[0m`);
      console.log(`\x1b[1m\x1b[36m RUNNING SUITE: ${suiteName}\x1b[0m`);
      console.log(`\x1b[1m\x1b[36m======================================================================\x1b[0m\n`);

      const startTime = Date.now();

      for (const t of tests) {
        process.stdout.write(`  • ${t.name.padEnd(65, '.')} `);
        try {
          await t.fn();
          passedCount++;
          console.log(`\x1b[32m[PASS]\x1b[0m`);
        } catch (err) {
          failedCount++;
          console.log(`\x1b[31m[FAIL]\x1b[0m`);
          failures.push({ name: t.name, error: err });
        }
      }

      const duration = Date.now() - startTime;
      console.log(`\n\x1b[1mSummary for ${suiteName}:\x1b[0m`);
      console.log(`  Passed: \x1b[32m${passedCount}\x1b[0m / ${tests.length}`);
      console.log(`  Failed: \x1b[${failedCount > 0 ? '31' : '32'}m${failedCount}\x1b[0m / ${tests.length}`);
      console.log(`  Duration: ${duration}ms\n`);

      if (failures.length > 0) {
        console.log(`\x1b[31mFailures detail:\x1b[0m`);
        failures.forEach((f, idx) => {
          console.log(`  ${idx + 1}) ${f.name}`);
          console.log(`     Error: ${f.error?.message || f.error}`);
          if (f.error?.stack) {
            console.log(`     Stack: ${f.error.stack.split('\n').slice(1, 4).join('\n')}`);
          }
        });
      }

      return {
        suiteName,
        total: tests.length,
        passed: passedCount,
        failed: failedCount,
        failures,
        duration,
      };
    },
  };

  return suite;
}

// =============================================================================
// 2. Authoritative Test Fixtures
// =============================================================================

export const MOCK_TENANTS = {
  TENANT_A: {
    id: '11111111-1111-4111-a111-111111111111',
    name: 'Ceibo AI Tech Solutions',
    slug: 'ceibo-tech',
    plan: 'enterprise',
  },
  TENANT_B: {
    id: '22222222-2222-4222-b222-222222222222',
    name: 'Rival Retail Corp',
    slug: 'rival-retail',
    plan: 'starter',
  },
};

export const MOCK_USERS = [
  {
    id: 'user-001',
    email: 'admin@ceibo.ai',
    password: 'password123',
    perfil: {
      id: 'user-001',
      empresa_id: MOCK_TENANTS.TENANT_A.id,
      full_name: 'Sofía Rodríguez',
      role: 'admin',
      email: 'admin@ceibo.ai',
    },
  },
  {
    id: 'user-002',
    email: 'member@ceibo.ai',
    password: 'password123',
    perfil: {
      id: 'user-002',
      empresa_id: MOCK_TENANTS.TENANT_A.id,
      full_name: 'Lucas Benítez',
      role: 'member',
      email: 'member@ceibo.ai',
    },
  },
  {
    id: 'user-003',
    email: 'carlos@rival.com',
    password: 'password123',
    perfil: {
      id: 'user-003',
      empresa_id: MOCK_TENANTS.TENANT_B.id,
      full_name: 'Carlos Gómez',
      role: 'admin',
      email: 'carlos@rival.com',
    },
  },
];

export function generateMockAnalytics(empresaId, baseMultiplier, days = 30) {
  const records = [];
  const baseDate = new Date('2026-09-10T00:00:00Z');

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Day-of-week modulation
    const dayOfWeek = d.getUTCDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.45 : 1.0;
    const ia = Math.round((70 + Math.sin(i / 2) * 20 + (i % 7) * 4) * baseMultiplier * weekendFactor);
    const humano = Math.round((18 + Math.cos(i / 3) * 6) * baseMultiplier * weekendFactor);
    // Business standard: 12 minutes (0.2h) per AI resolution
    const horasAhorradas = Math.round((ia * 0.2) * 10) / 10;

    records.push({
      id: `ana-${empresaId.slice(0, 4)}-${dateStr}`,
      empresa_id: empresaId,
      date: dateStr,
      resueltas_ia: ia,
      derivadas_humano: humano,
      total_consultas: ia + humano,
      horas_ahorradas: horasAhorradas,
    });
  }
  return records;
}

export const MOCK_ANALYTICS = [
  ...generateMockAnalytics(MOCK_TENANTS.TENANT_A.id, 1.4, 30),
  ...generateMockAnalytics(MOCK_TENANTS.TENANT_B.id, 0.4, 30),
];

// =============================================================================
// 3. Mathematical Metric Formulas (Authoritative Reference)
// =============================================================================

export function calculateSummaryMetrics(rows) {
  if (!rows || rows.length === 0) {
    return {
      totalConsultas: 0,
      totalIA: 0,
      totalHuman: 0,
      horasAhorradas: 0,
      tasaResolucionIA: 0,
    };
  }

  const totalIA = rows.reduce((acc, r) => acc + (Number(r.resueltas_ia) || 0), 0);
  const totalHuman = rows.reduce((acc, r) => acc + (Number(r.derivadas_humano) || 0), 0);
  const totalConsultas = totalIA + totalHuman;
  // B2B formula: 12 min per AI-resolved consultation = 0.2 hours
  const rawHoras = totalIA * 0.2;
  const horasAhorradas = Math.round(rawHoras * 10) / 10;
  const tasaResolucionIA = totalConsultas > 0 ? Math.round((totalIA / totalConsultas) * 100) : 0;

  return {
    totalConsultas,
    totalIA,
    totalHuman,
    horasAhorradas,
    tasaResolucionIA,
  };
}

// =============================================================================
// 4. In-Memory Mock Supabase Client Provider
// =============================================================================

export function createMockSupabaseEngine(initialUser = null, analyticsDataset = [...MOCK_ANALYTICS]) {
  let currentUser = initialUser;
  let customAnalytics = [...analyticsDataset];

  const engine = {
    _getCurrentUser() {
      return currentUser;
    },
    _setCurrentUser(user) {
      currentUser = user;
    },
    _setAnalytics(dataset) {
      customAnalytics = [...dataset];
    },
    _getAnalytics() {
      return customAnalytics;
    },

    auth: {
      async signInWithPassword({ email, password }) {
        if (!email || !password) {
          return {
            data: { user: null, session: null },
            error: { message: 'El correo electrónico y la contraseña son obligatorios.' },
          };
        }
        const found = MOCK_USERS.find(
          u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
        );
        if (!found) {
          return {
            data: { user: null, session: null },
            error: { message: 'Credenciales inválidas. Verifique su email y contraseña.' },
          };
        }
        currentUser = found;
        return {
          data: {
            user: { id: found.id, email: found.email },
            session: {
              access_token: `mock-token-${found.id}`,
              token_type: 'bearer',
              expires_in: 3600,
              user: { id: found.id, email: found.email },
            },
          },
          error: null,
        };
      },

      async signOut() {
        currentUser = null;
        return { error: null };
      },

      async getUser() {
        if (!currentUser) {
          return { data: { user: null }, error: { message: 'No active session' } };
        }
        return {
          data: { user: { id: currentUser.id, email: currentUser.email } },
          error: null,
        };
      },

      async getSession() {
        if (!currentUser) {
          return { data: { session: null }, error: null };
        }
        return {
          data: {
            session: {
              access_token: `mock-token-${currentUser.id}`,
              token_type: 'bearer',
              expires_in: 3600,
              user: { id: currentUser.id, email: currentUser.email },
            },
          },
          error: null,
        };
      },
    },

    from(table) {
      let filters = [];
      let sortConfig = null;
      let limitCount = null;

      const queryBuilder = {
        select(cols = '*') {
          return queryBuilder;
        },
        eq(col, val) {
          filters.push({ type: 'eq', col, val });
          return queryBuilder;
        },
        gte(col, val) {
          filters.push({ type: 'gte', col, val });
          return queryBuilder;
        },
        lte(col, val) {
          filters.push({ type: 'lte', col, val });
          return queryBuilder;
        },
        order(col, { ascending } = { ascending: true }) {
          sortConfig = { col, ascending };
          return queryBuilder;
        },
        limit(count) {
          limitCount = count;
          return queryBuilder;
        },
        async single() {
          const res = await queryBuilder;
          return {
            data: res.data && res.data.length > 0 ? res.data[0] : null,
            error: res.error,
          };
        },
        then(resolve) {
          let rows = [];

          if (table === 'perfiles') {
            rows = MOCK_USERS.map(u => ({
              ...u.perfil,
              empresas: Object.values(MOCK_TENANTS).find(t => t.id === u.perfil.empresa_id) || null,
            }));
          } else if (table === 'empresas') {
            rows = Object.values(MOCK_TENANTS);
          } else if (table === 'chat_analytics') {
            rows = [...customAnalytics];
          } else {
            return resolve({ data: null, error: { message: `Table '${table}' not found` } });
          }

          // Row Level Security (RLS) enforcement conforming to PostgreSQL DDL:
          // When unauthenticated, current_user_empresa_id() evaluates to NULL, returning 0 rows (fail-closed)
          const userEmpresaId = currentUser?.perfil?.empresa_id;
          if (!userEmpresaId) {
            rows = [];
          } else {
            if (table === 'chat_analytics') {
              rows = rows.filter(r => r.empresa_id === userEmpresaId);
            } else if (table === 'empresas') {
              rows = rows.filter(r => r.id === userEmpresaId);
            } else if (table === 'perfiles') {
              rows = rows.filter(r => r.empresa_id === userEmpresaId);
            }
          }

          // Apply explicit query filters
          for (const f of filters) {
            if (f.type === 'eq') {
              rows = rows.filter(r => r[f.col] === f.val);
            } else if (f.type === 'gte') {
              rows = rows.filter(r => r[f.col] >= f.val);
            } else if (f.type === 'lte') {
              rows = rows.filter(r => r[f.col] <= f.val);
            }
          }

          // Apply sorting
          if (sortConfig) {
            rows.sort((a, b) => {
              const valA = a[sortConfig.col];
              const valB = b[sortConfig.col];
              if (valA < valB) return sortConfig.ascending ? -1 : 1;
              if (valA > valB) return sortConfig.ascending ? 1 : -1;
              return 0;
            });
          }

          // Apply limit
          if (limitCount !== null) {
            rows = rows.slice(0, limitCount);
          }

          resolve({ data: rows, error: null });
        },
      };

      return queryBuilder;
    },
  };

  return engine;
}

// =============================================================================
// 5. Tenant-Scoped Client Factory conforming to PROJECT.md Contract
// =============================================================================

export function createTenantScopedClient(engine) {
  return {
    async getSession() {
      const user = engine._getCurrentUser();
      if (!user) return null;

      const empresa = Object.values(MOCK_TENANTS).find(t => t.id === user.perfil.empresa_id);
      return {
        user: { id: user.id, email: user.email },
        perfil: { ...user.perfil },
        empresa: empresa || null,
      };
    },

    async getRecent30Days() {
      const session = await this.getSession();
      if (!session) {
        throw new Error('UNAUTHORIZED: No active tenant session');
      }

      const { data, error } = await engine
        .from('chat_analytics')
        .select('*')
        .eq('empresa_id', session.perfil.empresa_id)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw new Error(error.message);
      const rows = data || [];
      return rows.reverse();
    },

    async getSummaryMetrics() {
      const rows = await this.getRecent30Days();
      return calculateSummaryMetrics(rows);
    },
  };
}

export function resolveServerUser(cookieValue) {
  if (!cookieValue) return null;
  return MOCK_USERS.find(u => u.id === cookieValue) || null;
}

// =============================================================================
// 6. Navigation Routes Contract Verification Data
// =============================================================================

export const APP_ROUTES = [
  { path: '/', name: 'Dashboard', type: 'core', active: true, title: 'Dashboard' },
  { path: '/login', name: 'Login', type: 'auth', active: true, title: 'Iniciar sesión' },
  { path: '/inbox', name: 'Inbox', type: 'placeholder', active: false, badge: 'Próximamente' },
  { path: '/chats', name: 'Chats', type: 'placeholder', active: false, badge: 'Próximamente' },
  { path: '/documents', name: 'Document Uploads', type: 'placeholder', active: false, badge: 'Próximamente' },
  { path: '/settings', name: 'Settings', type: 'placeholder', active: false, badge: 'Próximamente' },
];
