/**
 * Ceibo AI - In-Memory & Cookie-Backed Mock Supabase Client
 * 
 * Provides an authentic, zero-dependency Supabase client emulator adhering to
 * PostgreSQL Row Level Security (RLS) policies and PROJECT.md interface contracts.
 */

import {
  MOCK_TENANTS,
  MOCK_USERS,
  MOCK_ANALYTICS,
  MockUserAccount,
  MOCK_RAW_ANALYTICS,
  MOCK_CHAT_MESSAGES,
} from './mock-data';
import { Empresa, Perfil, ChatAnalytics, ChatAnalyticsRaw, ChatMessage } from './types';

export interface MockAuthResponse {
  data: {
    user: { id: string; email: string } | null;
    session: {
      access_token: string;
      token_type: string;
      expires_in: number;
      user: { id: string; email: string };
    } | null;
  };
  error: { message: string } | null;
}

export interface QueryFilter {
  type: 'eq' | 'gte' | 'lte';
  col: string;
  val: any;
}

export interface SortConfig {
  col: string;
  ascending: boolean;
}

const SESSION_COOKIE_NAME = 'ceibo_mock_user_id';

function getStoredUserId(): string | null {
  if (typeof window !== 'undefined') {
    // Check localStorage first
    try {
      const stored = window.localStorage.getItem(SESSION_COOKIE_NAME);
      if (stored) return stored;
    } catch {
      // ignore
    }
    // Check document.cookie
    try {
      const match = document.cookie.match(new RegExp(`(^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
      if (match) return decodeURIComponent(match[2]);
    } catch {
      // ignore
    }
  }
  return null;
}

function persistUserId(userId: string | null) {
  if (typeof window !== 'undefined') {
    try {
      if (userId) {
        window.localStorage.setItem(SESSION_COOKIE_NAME, userId);
        document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(userId)}; path=/; max-age=86400; SameSite=Lax`;
      } else {
        window.localStorage.removeItem(SESSION_COOKIE_NAME);
        document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
      }
    } catch {
      // ignore
    }
  }
}

export function createMockSupabaseEngine(
  initialUser: MockUserAccount | null = null,
  analyticsDataset: ChatAnalytics[] = [...MOCK_ANALYTICS]
) {
  let currentUser: MockUserAccount | null = initialUser;
  let customAnalytics: ChatAnalytics[] = [...analyticsDataset];
  let rawAnalyticsDataset: ChatAnalyticsRaw[] = [...MOCK_RAW_ANALYTICS];
  let chatMessagesDataset: ChatMessage[] = [...MOCK_CHAT_MESSAGES];

  // Auto-restore browser session if available and no initialUser passed
  if (!initialUser && typeof window !== 'undefined') {
    const savedId = getStoredUserId();
    if (savedId) {
      const found = MOCK_USERS.find((u) => u.id === savedId);
      if (found) currentUser = found;
    }
  }

  const engine = {
    _getCurrentUser(): MockUserAccount | null {
      return currentUser;
    },
    _setCurrentUser(user: MockUserAccount | null) {
      currentUser = user;
      persistUserId(user ? user.id : null);
    },
    _setAnalytics(dataset: ChatAnalytics[]) {
      customAnalytics = [...dataset];
    },
    _getAnalytics(): ChatAnalytics[] {
      return customAnalytics;
    },

    auth: {
      async signInWithPassword({
        email,
        password,
      }: {
        email?: string;
        password?: string;
      }): Promise<MockAuthResponse> {
        if (!email || !password) {
          return {
            data: { user: null, session: null },
            error: { message: 'El correo electrónico y la contraseña son obligatorios.' },
          };
        }

        const found = MOCK_USERS.find(
          (u) =>
            u.email.toLowerCase() === email.trim().toLowerCase() &&
            u.password === password
        );

        if (!found) {
          return {
            data: { user: null, session: null },
            error: { message: 'Credenciales inválidas. Verifique su email y contraseña.' },
          };
        }

        currentUser = found;
        persistUserId(found.id);

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

      async signOut(): Promise<{ error: null }> {
        currentUser = null;
        persistUserId(null);
        return { error: null };
      },

      async getUser(): Promise<{
        data: { user: { id: string; email: string } | null };
        error: { message: string } | null;
      }> {
        if (!currentUser) {
          return { data: { user: null }, error: { message: 'No active session' } };
        }
        return {
          data: { user: { id: currentUser.id, email: currentUser.email } },
          error: null,
        };
      },

      async getSession(): Promise<{
        data: {
          session: {
            access_token: string;
            token_type: string;
            expires_in: number;
            user: { id: string; email: string };
          } | null;
        };
        error: null;
      }> {
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

    from(table: string) {
      const filters: QueryFilter[] = [];
      let sortConfig: SortConfig | null = null;
      let limitCount: number | null = null;

      const queryBuilder = {
        select(cols = '*') {
          return queryBuilder;
        },
        eq(col: string, val: any) {
          filters.push({ type: 'eq', col, val });
          return queryBuilder;
        },
        gte(col: string, val: any) {
          filters.push({ type: 'gte', col, val });
          return queryBuilder;
        },
        lte(col: string, val: any) {
          filters.push({ type: 'lte', col, val });
          return queryBuilder;
        },
        order(col: string, { ascending } = { ascending: true }) {
          sortConfig = { col, ascending };
          return queryBuilder;
        },
        limit(count: number) {
          limitCount = count;
          return queryBuilder;
        },
        async single(): Promise<{ data: any | null; error: { message: string } | null }> {
          const res = await queryBuilder;
          return {
            data: res.data && res.data.length > 0 ? res.data[0] : null,
            error: res.error,
          };
        },
        then(resolve: (value: { data: any[] | null; error: { message: string } | null }) => void) {
          let rows: any[] = [];

          if (table === 'perfiles') {
            rows = MOCK_USERS.map((u) => ({
              ...u.perfil,
              empresas:
                Object.values(MOCK_TENANTS).find((t) => t.id === u.perfil.empresa_id) || null,
            }));
          } else if (table === 'empresas') {
            rows = Object.values(MOCK_TENANTS);
          } else if (table === 'chat_analytics_daily') {
            rows = [...customAnalytics];
          } else if (table === 'chat_analytics') {
            rows = [...rawAnalyticsDataset];
          } else if (table === 'n8n_chat_histories') {
            rows = [...chatMessagesDataset];
          } else {
            return resolve({ data: null, error: { message: `Table '${table}' not found` } });
          }

          // Row Level Security (RLS) enforcement conforming to PostgreSQL DDL:
          // When unauthenticated, current_user_empresa_id() evaluates to NULL, returning 0 rows (fail-closed)
          const userEmpresaId = currentUser?.perfil?.empresa_id;
          if (!userEmpresaId) {
            rows = [];
          } else {
            if (table === 'chat_analytics_daily' || table === 'chat_analytics' || table === 'n8n_chat_histories') {
              rows = rows.filter((r) => r.empresa_id === userEmpresaId);
            } else if (table === 'empresas') {
              rows = rows.filter((r) => r.id === userEmpresaId);
            } else if (table === 'perfiles') {
              rows = rows.filter((r) => r.empresa_id === userEmpresaId);
            }
          }

          // Apply explicit query filters
          for (const f of filters) {
            if (f.type === 'eq') {
              rows = rows.filter((r) => r[f.col] === f.val);
            } else if (f.type === 'gte') {
              rows = rows.filter((r) => r[f.col] >= f.val);
            } else if (f.type === 'lte') {
              rows = rows.filter((r) => r[f.col] <= f.val);
            }
          }

          // Apply sorting
          if (sortConfig) {
            rows.sort((a, b) => {
              const valA = a[sortConfig!.col];
              const valB = b[sortConfig!.col];
              if (valA < valB) return sortConfig!.ascending ? -1 : 1;
              if (valA > valB) return sortConfig!.ascending ? 1 : -1;
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

// Global browser client singleton for client components
let browserMockInstance: ReturnType<typeof createMockSupabaseEngine> | null = null;

export function getBrowserMockClient(defaultToFirstUser = true) {
  if (!browserMockInstance) {
    // If not authenticated yet, default to Tenant A admin for smooth instant demo
    const defaultUser = defaultToFirstUser ? MOCK_USERS[0] : null;
    browserMockInstance = createMockSupabaseEngine(defaultUser);
  }
  return browserMockInstance;
}
