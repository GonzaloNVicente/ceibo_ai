/**
 * Ceibo AI - Supabase Database & Multi-Tenant Types
 * Conforms to interface contracts specified in PROJECT.md and ORIGINAL_REQUEST.md.
 */

export interface Empresa {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'growth' | 'enterprise';
  created_at?: string;
  updated_at?: string;
}

export interface Perfil {
  id: string;
  empresa_id: string;
  full_name: string;
  role: 'admin' | 'member';
  email: string;
  created_at?: string;
  updated_at?: string;
  empresas?: Empresa | null;
}

export interface ChatAnalytics {
  id: string;
  empresa_id: string;
  date: string; // ISO-8601 'YYYY-MM-DD'
  resueltas_ia: number;
  derivadas_humano: number;
  total_consultas: number;
  horas_ahorradas: number; // calculated as resueltas_ia * 0.2
  created_at?: string;
}

export interface UserTenantSession {
  user: {
    id: string;
    email: string;
  };
  perfil: Perfil;
  empresa: Empresa | null;
}

export interface SummaryMetrics {
  totalConsultas: number;
  totalIA: number;
  totalHuman: number;
  horasAhorradas: number;
  tasaResolucionIA: number;
}

export interface ChartDataPoint {
  date: string; // 'YYYY-MM-DD'
  displayDate: string; // e.g. '10 Sep'
  ia: number;
  humano: number;
  total: number;
  horasAhorradas: number;
}

export interface TenantAnalyticsClient {
  empresaId: string;
  getSession(): Promise<UserTenantSession | null>;
  getRecent30Days(): Promise<ChatAnalytics[]>;
  getSummaryMetrics(): Promise<SummaryMetrics>;
}

export interface AuthContextType {
  user: { id: string; email: string } | null;
  perfil: Perfil | null;
  empresa: Empresa | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  switchTenant?: (tenantEmail: string) => Promise<{ error?: string }>;
}
