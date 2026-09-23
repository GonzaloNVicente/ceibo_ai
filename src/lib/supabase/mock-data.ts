/**
 * Ceibo AI - Authoritative Mock Data & Analytics Calculations
 * Preloaded fixtures for Tenant A ("Ceibo AI Tech Solutions") and Tenant B ("Rival Retail Corp").
 */

import { Empresa, Perfil, ChatAnalytics, ChatAnalyticsRaw, ChatSession, SummaryMetrics, ChatMessage, RecordManagerDocument } from './types';

export const MOCK_TENANTS: Record<string, Empresa> = {
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

export interface MockUserAccount {
  id: string;
  email: string;
  password: string;
  perfil: Perfil;
}

export const MOCK_USERS: MockUserAccount[] = [
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
      full_name: 'Vendedor 1',
      role: 'agente',
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

export function generateMockAnalytics(empresaId: string, baseMultiplier: number, days = 30): ChatAnalytics[] {
  const records: ChatAnalytics[] = [];
  const baseDate = new Date('2026-09-10T00:00:00Z');

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Day-of-week modulation (weekends see lower commercial activity)
    const dayOfWeek = d.getUTCDay();
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.45 : 1.0;
    const ia = Math.round((70 + Math.sin(i / 2) * 20 + (i % 7) * 4) * baseMultiplier * weekendFactor);
    const humano = Math.round((18 + Math.cos(i / 3) * 6) * baseMultiplier * weekendFactor);
    // Business standard: 12 minutes (0.2h) per AI resolution
    const horasAhorradas = Math.round(ia * 0.2 * 10) / 10;
    
    // Distribute total queries roughly into new categories
    const pedidos = Math.round((ia + humano) * 0.4);
    const presupuestos = Math.round((ia + humano) * 0.3);
    const reclamos = Math.round((ia + humano) * 0.2);
    const estimatedValue = pedidos * 15000 + presupuestos * 20000;

    records.push({
      empresa_id: empresaId,
      date: dateStr,
      resueltas_ia: ia,
      derivadas_humano: humano,
      total_consultas: ia + humano,
      horas_ahorradas: horasAhorradas,
      pedidos_count: pedidos,
      presupuestos_count: presupuestos,
      reclamos_count: reclamos,
      valor_estimado: estimatedValue,
    });
  }
  return records;
}

export const MOCK_ANALYTICS: ChatAnalytics[] = [
  ...generateMockAnalytics(MOCK_TENANTS.TENANT_A.id, 1.4, 30),
  ...generateMockAnalytics(MOCK_TENANTS.TENANT_B.id, 0.4, 30),
];

const REALISTIC_NAMES = [
  'Constructora Del Sur SRL',
  'Ferretería López',
  'Corralón Norte S.A.',
  'María Fernanda Ruiz',
  'Juan Carlos Medina',
  'Hermanos González e Hijos',
  'Arquitectura Moderna Estudio',
  'Materiales San Justo',
  'Roberto Sánchez',
  'Lucía Fernández',
];

const QUERY_TYPES = [
  'pedido_presupuesto',
  'reclamo',
  'consulta_stock',
  'consulta_precio',
  'pedido',
  null, // Simulate uncategorized
];

export function generateMockSessions(empresaId: string, count = 50): ChatSession[] {
  const records: ChatSession[] = [];
  const baseDate = new Date('2026-09-10T14:00:00Z');

  for (let i = 0; i < count; i++) {
    const d = new Date(baseDate.getTime() - i * 3600000 * 2.5);
    const isEscalated = Math.random() < 0.35;
    const qTypeIndex = Math.floor(Math.random() * QUERY_TYPES.length);
    const nameIndex = Math.floor(Math.random() * REALISTIC_NAMES.length);
    
    records.push({
      id: `session-${empresaId.slice(0, 4)}-${i}`,
      empresa_id: empresaId,
      customer_phone: `54911${Math.floor(Math.random() * 10000000)}`,
      customer_name: REALISTIC_NAMES[nameIndex],
      query_type: QUERY_TYPES[qTypeIndex],
      related_product_id: `PROD_${Math.floor(Math.random() * 10)}`,
      is_escalated: isEscalated,
      resolution_status: isEscalated ? 'derivado' : 'resuelto',
      assigned_to: null,
      bot_paused: false,
      lead_created_at: isEscalated ? d.toISOString() : null,
      last_message_text: `Mensaje de prueba ${i}`,
      last_message_at: d.toISOString(),
      created_at: new Date(d.getTime() - 1000 * 60 * 10).toISOString(),
    });
  }
  return records;
}

export const MOCK_SESSIONS: ChatSession[] = [
  ...generateMockSessions(MOCK_TENANTS.TENANT_A.id, 150),
  ...generateMockSessions(MOCK_TENANTS.TENANT_B.id, 30),
];

export const MOCK_RAW_ANALYTICS: ChatAnalyticsRaw[] = [];

export function calculateSummaryMetrics(rows: ChatAnalytics[] | null | undefined): SummaryMetrics {
  if (!rows || rows.length === 0) {
    return {
      totalConsultas: 0,
      totalIA: 0,
      totalHuman: 0,
      horasAhorradas: 0,
      tasaResolucionIA: 0,
      pedidosCount: 0,
      presupuestosCount: 0,
      reclamosCount: 0,
      valorEstimado: 0,
    };
  }

  const totalIA = rows.reduce((acc, r) => acc + (Number(r.resueltas_ia) || 0), 0);
  const totalHuman = rows.reduce((acc, r) => acc + (Number(r.derivadas_humano) || 0), 0);
  const pedidosCount = rows.reduce((acc, r) => acc + (Number(r.pedidos_count) || 0), 0);
  const presupuestosCount = rows.reduce((acc, r) => acc + (Number(r.presupuestos_count) || 0), 0);
  const reclamosCount = rows.reduce((acc, r) => acc + (Number(r.reclamos_count) || 0), 0);
  const valorEstimado = rows.reduce((acc, r) => acc + (Number(r.valor_estimado) || 0), 0);
  
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
    pedidosCount,
    presupuestosCount,
    reclamosCount,
    valorEstimado,
  };
}

export const MOCK_CHAT_MESSAGES: ChatMessage[] = MOCK_SESSIONS.flatMap((lead) => {
  const sessionStart = new Date(lead.created_at);
  const messages: ChatMessage[] = [];
  
  messages.push({
    id: `${lead.id}-m1`,
    session_id: lead.id,
    empresa_id: lead.empresa_id,
    message_text: `Hola, me comunico por una consulta sobre ${lead.query_type || 'un producto'}.`,
    sender_type: 'user',
    created_at: sessionStart.toISOString(),
  });

  messages.push({
    id: `${lead.id}-m2`,
    session_id: lead.id,
    empresa_id: lead.empresa_id,
    message_text: `¡Hola! Soy el asistente virtual de la empresa. ¿Me podrías detallar un poco más tu consulta?`,
    sender_type: 'bot',
    created_at: new Date(sessionStart.getTime() + 1000 * 5).toISOString(),
  });

  if (lead.resolution_status === 'derivado') {
    messages.push({
      id: `${lead.id}-m3`,
      session_id: lead.id,
      empresa_id: lead.empresa_id,
      message_text: `Necesito hablar con un vendedor, es para un presupuesto importante.`,
      sender_type: 'user',
      created_at: new Date(sessionStart.getTime() + 1000 * 30).toISOString(),
    });
    messages.push({
      id: `${lead.id}-m4`,
      session_id: lead.id,
      empresa_id: lead.empresa_id,
      message_text: `Entendido. Estoy derivando tu consulta a un representante comercial. En breve te contactarán.`,
      sender_type: 'bot',
      created_at: new Date(sessionStart.getTime() + 1000 * 32).toISOString(),
    });
  } else {
    messages.push({
      id: `${lead.id}-m3`,
      session_id: lead.id,
      empresa_id: lead.empresa_id,
      message_text: `Quería saber si tienen stock del producto.`,
      sender_type: 'user',
      created_at: new Date(sessionStart.getTime() + 1000 * 30).toISOString(),
    });
    messages.push({
      id: `${lead.id}-m4`,
      session_id: lead.id,
      empresa_id: lead.empresa_id,
      message_text: `¡Sí, tenemos stock disponible! Podés pasar por la sucursal o hacer el pedido online.`,
      sender_type: 'bot',
      created_at: new Date(sessionStart.getTime() + 1000 * 32).toISOString(),
    });
  }

  return messages;
});

export const MOCK_DOCUMENTS: RecordManagerDocument[] = [
  { id: 2, created_at: '2026-09-21T18:22:35.395Z', google_drive_file_id: '1TL82sw1Y8hUSj...', hash: '2da08c87...', document_title: 'catalogo_ficticio_corralon.xlsx', data_type: 'tabular', schema: '["Código","Producto","Categoría","Unidad","Precio ARS","Stock","Marca"]', empresa_id: MOCK_TENANTS.TENANT_A.id },
  { id: 4, created_at: '2026-09-21T19:33:44.003Z', google_drive_file_id: '14ad93tMFOIF...', hash: '1ddeb87...', document_title: 'reglas_negocio_corralon.pdf', data_type: 'unstructured', schema: null, empresa_id: MOCK_TENANTS.TENANT_A.id }
];
