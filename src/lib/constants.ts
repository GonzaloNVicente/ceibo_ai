/**
 * Ceibo AI - Constantes de negocio compartidas
 */

/**
 * Minutos que se estima que ahorra al equipo cada consulta que la IA resuelve sola
 * (sin que intervenga un vendedor). UNICA fuente de verdad en el front.
 *
 * Ojo: la base repite esta regla en SQL (`round(ia * 0.2, 1)` en get_dashboard_metrics(),
 * _dashboard_summary() y la vista chat_analytics_daily). Si se cambia aca, cambiarla tambien alla.
 */
export const MINUTES_SAVED_PER_AI_RESOLUTION = 12;

export const HOURS_SAVED_PER_AI_RESOLUTION = MINUTES_SAVED_PER_AI_RESOLUTION / 60; // 0,2 h

/** Horas ahorradas por `aiResolved` consultas resueltas por la IA, redondeadas a 1 decimal. */
export function hoursSaved(aiResolved: number): number {
  return Math.round(aiResolved * HOURS_SAVED_PER_AI_RESOLUTION * 10) / 10;
}
