/**
 * Ceibo AI - Supabase Database & Multi-Tenant Types
 * Conforms to interface contracts specified in PROJECT.md and ORIGINAL_REQUEST.md.
 */

export interface Empresa {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'growth' | 'enterprise';
  assistant_name?: string;
  timezone?: string;
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
  pedidos_count: number;
  presupuestos_count: number;
  reclamos_count: number;
  valor_estimado: number;
}

export type ChatAnalyticsDaily = ChatAnalytics;

export interface ChatSession {
  id: string;
  empresa_id: string;
  customer_phone: string;
  customer_name: string | null;
  query_type: string | null;
  related_product_id: string | null;
  is_escalated: boolean;
  resolution_status: 'resuelto' | 'derivado';
  assigned_to: string | null;
  bot_paused: boolean;
  lead_created_at: string | null;
  last_message_text: string | null;
  last_message_at: string;
  created_at: string;
  assigned?: { full_name: string | null } | null;
}

export interface ChatAnalyticsRaw {
  id: string;
  session_id: string | null;
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
  session_id: string; // References ChatSession.id
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
  pedidosCount: number;
  presupuestosCount: number;
  reclamosCount: number;
  valorEstimado: number;
}

export interface ChartDataPoint {
  date: string; // 'YYYY-MM-DD'
  displayDate: string; // e.g. '10 Sep'
  ia: number;
  humano: number;
  total: number;
  horasAhorradas: number;
}

export interface RecordManagerDocument {
  id: number;
  created_at: string;
  google_drive_file_id: string | null;
  hash: string | null;
  document_title: string;
  data_type: 'tabular' | 'unstructured';
  schema: string | null;
  empresa_id: string;
}

export interface TenantAnalyticsClient {
  empresaId: string;
  getSession(): Promise<UserTenantSession | null>;
  getRecent30Days(): Promise<ChatAnalytics[]>;
  getSummaryMetrics(): Promise<SummaryMetrics>;
  getLeads(): Promise<ChatSession[]>;
  getSessions(): Promise<ChatSession[]>;
  getKnowledgeDocuments(): Promise<RecordManagerDocument[]>;
  assignSession(sessionId: string): Promise<ChatSession>;
  resolveSession(sessionId: string): Promise<ChatSession>;
  sendHumanMessage(sessionId: string, text: string): Promise<ChatMessage>;
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  updateEmpresaSettings(name: string, assistantName: string, timezone: string): Promise<any>;
  getLastActivity(): Promise<string | null>;
  deleteKnowledgeDocument(documentId: number): Promise<void>;
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
