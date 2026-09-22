/**
 * Ceibo AI - Tenant-Scoped Supabase Client
 * 
 * Enforces automatic tenant isolation by injecting the user's empresa_id into every query
 * and provides high-level aggregation methods for the main dashboard.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  TenantAnalyticsClient,
  UserTenantSession,
  ChatAnalytics,
  SummaryMetrics,
  ChatAnalyticsRaw,
  ChatMessage,
  ChatSession,
  RecordManagerDocument,
} from './types';
import { calculateSummaryMetrics, MOCK_TENANTS } from './mock-data';

export async function getTenantSession(supabaseClient: any): Promise<UserTenantSession | null> {
  // If the engine has direct helper (like mock engine)
  if (typeof supabaseClient._getCurrentUser === 'function') {
    const user = supabaseClient._getCurrentUser();
    if (!user) return null;
    const empresa = Object.values(MOCK_TENANTS).find((t) => t.id === user.perfil.empresa_id);
    return {
      user: { id: user.id, email: user.email },
      perfil: { ...user.perfil },
      empresa: empresa || null,
    };
  }

  // Otherwise standard Supabase Auth API
  const { data: authData, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !authData?.user) {
    return null;
  }

  const { data: perfil, error: perfilError } = await supabaseClient
    .from('perfiles')
    .select('*, empresas(*)')
    .eq('id', authData.user.id)
    .single();

  if (perfilError || !perfil) {
    return null;
  }

  return {
    user: {
      id: authData.user.id,
      email: authData.user.email || perfil.email,
    },
    perfil: {
      id: perfil.id,
      empresa_id: perfil.empresa_id,
      full_name: perfil.full_name,
      role: perfil.role,
      email: perfil.email,
    },
    empresa: perfil.empresas || null,
  };
}

export function createTenantScopedClient(supabaseClient: any): TenantAnalyticsClient {
  return {
    empresaId: '',

    async getSession(): Promise<UserTenantSession | null> {
      return getTenantSession(supabaseClient);
    },

    async getRecent30Days(): Promise<ChatAnalytics[]> {
      const session = await this.getSession();
      if (!session || !session.perfil?.empresa_id) {
        throw new Error('UNAUTHORIZED: No active tenant session');
      }

      this.empresaId = session.perfil.empresa_id;

      const { data, error } = await supabaseClient
        .from('chat_analytics_daily')
        .select('*')
        .eq('empresa_id', session.perfil.empresa_id)
        .order('date', { ascending: false })
        .limit(30);

      if (error) {
        throw new Error(error.message);
      }

      const rows = (data as ChatAnalytics[]) || [];
      return rows.reverse();
    },

    async getSummaryMetrics(): Promise<SummaryMetrics> {
      const rows = await this.getRecent30Days();
      return calculateSummaryMetrics(rows);
    },

    async getLeads(): Promise<ChatSession[]> {
      const session = await this.getSession();
      if (!session || !session.perfil?.empresa_id) {
        throw new Error('UNAUTHORIZED: No active tenant session');
      }

      const { data, error } = await supabaseClient
        .from('chat_sessions')
        .select('*, assigned:perfiles(full_name)')
        .eq('empresa_id', session.perfil.empresa_id)
        .order('last_message_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data as ChatSession[]) || [];
    },

    async getSessions(): Promise<ChatSession[]> {
      return this.getLeads();
    },

    async getKnowledgeDocuments(): Promise<RecordManagerDocument[]> {
      const { data, error } = await supabaseClient
        .from('record_manager')
        .select('*')
        .eq('empresa_id', this.empresaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching knowledge documents:', error);
        throw error;
      }
      return data || [];
    },

    async assignSession(sessionId: string): Promise<ChatSession> {
      const { data, error } = await supabaseClient.rpc('assign_chat_session', { p_session_id: sessionId });
      if (error) throw new Error(error.message);
      return (Array.isArray(data) ? data[0] : data) as ChatSession;
    },

    async resolveSession(sessionId: string): Promise<ChatSession> {
      const { data, error } = await supabaseClient.rpc('resolve_chat_session', { p_session_id: sessionId });
      if (error) throw new Error(error.message);
      return (Array.isArray(data) ? data[0] : data) as ChatSession;
    },

    async sendHumanMessage(sessionId: string, text: string): Promise<ChatMessage> {
      const { data, error } = await supabaseClient.rpc('send_human_message', { p_session_id: sessionId, p_text: text });
      if (error) throw new Error(error.message);
      return (Array.isArray(data) ? data[0] : data) as ChatMessage;
    },

    async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
      const session = await this.getSession();
      if (!session || !session.perfil?.empresa_id) {
        throw new Error('UNAUTHORIZED: No active tenant session');
      }

      const { data, error } = await supabaseClient
        .from('n8n_chat_histories')
        .select('*')
        .eq('empresa_id', session.perfil.empresa_id)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return (data as ChatMessage[]) || [];
    },
  };
}

// Alias for convenience
export const getTenantScopedClient = createTenantScopedClient;
