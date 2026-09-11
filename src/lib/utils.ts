import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names safely with tailwind-merge and clsx.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats integer numbers using Spanish/Argentine locale.
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-AR').format(value);
}

/**
 * Formats hours with 1 decimal digit.
 */
export function formatHours(hours: number): string {
  return `${hours.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h`;
}

/**
 * Formats float to percentage string.
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
