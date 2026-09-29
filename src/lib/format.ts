/**
 * Ceibo AI - Formato de numeros, tiempos y textos para el dashboard (es-AR)
 */

import { MINUTES_SAVED_PER_AI_RESOLUTION } from './constants';

const LOCALE = 'es-AR';

/** 1234567 -> "1.234.567" */
export function formatCount(n: number): string {
  return (Number(n) || 0).toLocaleString(LOCALE);
}

/** 622840 -> "$622.840" */
export function formatARS(n: number): string {
  return `$${Math.round(Number(n) || 0).toLocaleString(LOCALE)}`;
}

/**
 * Tiempo ahorrado por `aiResolved` consultas resueltas por la IA.
 * Menos de una hora se muestra en minutos ("36 min"); desde una hora, en horas con coma ("3,6 h").
 */
export function formatTimeSaved(aiResolved: number): { value: string; unit: 'min' | 'h' } {
  const minutes = Math.max(0, Math.round((Number(aiResolved) || 0) * MINUTES_SAVED_PER_AI_RESOLUTION));
  if (minutes < 60) return { value: String(minutes), unit: 'min' };
  const hours = minutes / 60;
  return { value: hours.toLocaleString(LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: 1 }), unit: 'h' };
}

/** "ahora" | "hace 12 min" | "hace 3 h" | "hace 2 d" */
export function formatRelativeTime(iso: string | null | undefined, now: number = Date.now()): string {
  const then = iso ? new Date(iso).getTime() : NaN;
  if (Number.isNaN(then)) return '';
  const minutes = Math.floor(Math.max(0, now - then) / 60_000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
}

/** "5493364343664" -> "+54 9 336 ••• 3664" (no se muestra el telefono completo del cliente) */
export function maskPhone(phone: string | null | undefined): string {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.length < 8) return digits ? `+${digits}` : 'Sin teléfono';
  const last4 = digits.slice(-4);
  if (digits.startsWith('549') && digits.length >= 11) {
    return `+54 9 ${digits.slice(3, 6)} ••• ${last4}`;
  }
  return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ••• ${last4}`;
}

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * Nombre legible del producto de un pedido. `related_product_id` viene mezclado desde el bot:
 * un codigo del catalogo ("COR-001"), texto libre ("ladrillos huecos") o una lista separada por
 * comas. Con `catalog` (codigo -> nombre) se traducen los codigos.
 */
export function summarizeProduct(raw: string | null | undefined, catalog: Record<string, string> = {}): string {
  const text = String(raw ?? '').trim();
  if (!text || text.toUpperCase() === 'N/A') return 'Producto sin identificar';

  const parts = text
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => catalog[p.toUpperCase()] ?? capitalize(p));

  if (parts.length === 0) return 'Producto sin identificar';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} y ${parts.length - 1} más`;
}
