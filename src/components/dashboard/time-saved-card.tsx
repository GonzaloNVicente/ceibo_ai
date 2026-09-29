import React from 'react';
import { Clock3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MINUTES_SAVED_PER_AI_RESOLUTION } from '@/lib/constants';
import { formatCount } from '@/lib/format';

export interface WeekBar {
  /** Etiqueta corta del dia: "Mi", "Ju" */
  label: string;
  value: number;
  /** Ultimo dia del periodo: se resalta */
  highlight: boolean;
}

interface TimeSavedCardProps {
  ready: boolean;
  time: { value: string; unit: 'min' | 'h' };
  /** "hoy", "en 30 días"... */
  periodPhrase: string;
  resolvedCount: number;
  /** "▲ 18% vs. período anterior": solo si hay comparacion posible */
  comparison?: string | null;
  weekTotal: { value: string; unit: 'min' | 'h' };
  weekBars: WeekBar[];
}

/** El numero gigante se achica cuando tiene muchos digitos para no desbordar la tarjeta. */
function bigNumberSize(length: number): string {
  if (length <= 3) return 'text-[72px] sm:text-[88px] xl:text-[104px]';
  if (length <= 5) return 'text-[60px] sm:text-[72px] xl:text-[84px]';
  return 'text-[48px] sm:text-[56px] xl:text-[64px]';
}

export function TimeSavedCard({
  ready,
  time,
  periodPhrase,
  resolvedCount,
  comparison,
  weekTotal,
  weekBars,
}: TimeSavedCardProps) {
  const max = Math.max(1, ...weekBars.map((b) => b.value));
  const value = ready ? time.value : '–';

  return (
    <section
      aria-label="Tiempo ahorrado por la IA"
      className="flex min-h-[256px] flex-col justify-between gap-5 rounded-[20px] bg-success p-6 text-success-foreground shadow-panel sm:flex-row sm:p-7"
    >
      <div className="flex min-w-0 flex-col justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-white/85">
          <Clock3 className="size-4" strokeWidth={1.8} aria-hidden="true" />
          Tiempo que la IA le ahorró a tu equipo
        </p>

        <div>
          <p className="flex flex-wrap items-baseline gap-x-3 font-display font-bold leading-none tabular-nums">
            <span className={bigNumberSize(value.length)}>{value}</span>
            <span className="text-2xl font-semibold sm:text-[28px]">
              {ready ? time.unit : ''}
              {ready && <span className="ml-2 font-medium text-white/85">{periodPhrase}</span>}
            </span>
          </p>
          <p className="mt-3 text-sm leading-5 text-white/90">
            {ready ? formatCount(resolvedCount) : '–'}{' '}
            {resolvedCount === 1 ? 'consulta resuelta' : 'consultas resueltas'} sin que intervenga nadie · ≈{' '}
            {MINUTES_SAVED_PER_AI_RESOLUTION} min c/u
            {comparison ? <span className="font-semibold"> · {comparison}</span> : null}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-start justify-between gap-4 sm:items-end">
        <div className="sm:text-right">
          <p className="font-display text-[30px] font-bold leading-none tabular-nums">
            {ready ? `${weekTotal.value} ${weekTotal.unit}` : '–'}
          </p>
          <p className="mt-1 text-xs text-white/85">en los últimos 7 días</p>
        </div>

        <div
          role="img"
          aria-label={`Tiempo ahorrado por día en los últimos 7 días: ${weekBars
            .map((b) => `${b.label} ${b.value} consultas resueltas`)
            .join(', ')}`}
          className="flex h-20 items-end gap-2"
        >
          {weekBars.map((bar, i) => (
            <div key={`${bar.label}-${i}`} className="flex h-full w-5 flex-col items-center justify-end gap-1.5">
              <div
                className={cn('w-full rounded-[4px]', bar.highlight ? 'bg-white' : 'bg-white/30')}
                style={{ height: `${Math.max(bar.value > 0 ? 8 : 3, (bar.value / max) * 100)}%` }}
                title={`${bar.label}: ${bar.value}`}
              />
              <span
                className={cn('text-[10px] leading-none', bar.highlight ? 'font-bold text-white' : 'text-white/85')}
              >
                {bar.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
