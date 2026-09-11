/**
 * Ceibo AI - Authoritative Mock Data & Analytics Calculations
 * Preloaded fixtures for Tenant A ("Ceibo AI Tech Solutions") and Tenant B ("Rival Retail Corp").
 */

import { Empresa, Perfil, ChatAnalytics, SummaryMetrics } from './types';

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

export const MOCK_ANALYTICS: ChatAnalytics[] = [
  ...generateMockAnalytics(MOCK_TENANTS.TENANT_A.id, 1.4, 30),
  ...generateMockAnalytics(MOCK_TENANTS.TENANT_B.id, 0.4, 30),
];

export function calculateSummaryMetrics(rows: ChatAnalytics[] | null | undefined): SummaryMetrics {
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
