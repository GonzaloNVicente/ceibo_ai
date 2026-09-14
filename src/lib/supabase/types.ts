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
  empresa_id: string; // Foreign key to Empresa
  full_name: string | null;
  role: 'admin' | 'agente';
  email: string;
  created_at?: string;
  updated_at?: string;
  empresas?: Empresa | null;
}

export interface ChatAnalytics {
  empresa_id: string;
  date: string; // ISO-8601 'YYYY-MM-DD'
  resueltas_ia: number;
  derivadas_humano: number;
  total_consultas: number;
  horas_ahorradas: number; // calculated as resueltas_ia * 0.2
}

export type ChatAnalyticsDaily = ChatAnalytics;

export interface ChatAnalyticsRaw {
  id: string;
  created_at: string;
  customer_phone: string | null;
  query_type: string | null;
  query_text: string;
  related_product_id: string | null;
  bot_response: string;
  is_escalated: boolean;
  resolution_status: string;
  customer_name: string | null;
  empresa_id: string;
}

export interface ChatMessage {
  id: string;
  session_id: string; // References ChatAnalyticsRaw.id
  empresa_id: string;
  message_text: string;
  sender_type: 'user' | 'bot' | 'human_agent';
  created_at: string;
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
  getLeads(): Promise<ChatAnalyticsRaw[]>;
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
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
