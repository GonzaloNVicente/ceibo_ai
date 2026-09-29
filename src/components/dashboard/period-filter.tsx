'use client';

import React from 'react';
import { CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  GRANULARITIES,
  RANGE_PRESETS,
  formatRangeLabel,
  type DateRange,
  type Granularity,
  type RangePreset,
} from '@/lib/dashboard-range';

interface PeriodFilterProps {
  preset: RangePreset;
  range: DateRange;
  /** Granularidad elegida a mano; null = automatica */
  manualGranularity: Granularity | null;
  /** Granularidad que efectivamente se esta usando */
  granularity: Granularity;
  /** Hoy en la zona horaria de la empresa: tope de las fechas personalizadas */
  today: string;
  disabled?: boolean;
  onPresetChange: (preset: RangePreset) => void;
  onCustomRangeChange: (range: DateRange) => void;
  onGranularityChange: (granularity: Granularity | null) => void;
}

const pill = (active: boolean) =>
  cn(
    'inline-flex h-8 items-center rounded-md border px-3 text-xs font-semibold transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-60',
    active
      ? 'border-primary bg-primary text-primary-foreground shadow-action'
      : 'border-border bg-card text-muted-foreground hover:border-primary/35 hover:text-foreground'
  );

const dateInput =
  'h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20';

export function PeriodFilter({
  preset,
  range,
  manualGranularity,
  granularity,
  today,
  disabled,
  onPresetChange,
  onCustomRangeChange,
  onGranularityChange,
}: PeriodFilterProps) {
  const granularityLabel = GRANULARITIES.find((g) => g.id === granularity)?.label ?? '';

  return (
    <section
      aria-label="Filtro de período"
      className="mt-6 rounded-lg border border-border bg-card p-4 shadow-panel"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <CalendarRange className="size-4" strokeWidth={1.8} />
            Período
            <span className="ml-1 font-semibold normal-case tracking-normal text-foreground">
              {formatRangeLabel(range)}
            </span>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Rango de fechas">
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={disabled}
                aria-pressed={preset === p.id}
                onClick={() => onPresetChange(p.id)}
                className={pill(preset === p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {preset === 'custom' && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <label className="flex items-center gap-2">
                Desde
                <input
                  type="date"
                  className={dateInput}
                  value={range.from}
                  max={range.to}
                  disabled={disabled}
                  onChange={(e) => e.target.value && onCustomRangeChange({ from: e.target.value, to: range.to })}
                />
              </label>
              <label className="flex items-center gap-2">
                Hasta
                <input
                  type="date"
                  className={dateInput}
                  value={range.to}
                  min={range.from}
                  max={today}
                  disabled={disabled}
                  onChange={(e) => e.target.value && onCustomRangeChange({ from: range.from, to: e.target.value })}
                />
              </label>
            </div>
          )}
        </div>

        <div className="shrink-0">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Agrupar gráfico por
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Granularidad del gráfico">
            <button
              type="button"
              disabled={disabled}
              aria-pressed={manualGranularity === null}
              onClick={() => onGranularityChange(null)}
              className={pill(manualGranularity === null)}
              title="Elige día, semana o mes según el largo del período"
            >
              Auto{manualGranularity === null ? ` · ${granularityLabel}` : ''}
            </button>
            {GRANULARITIES.map((g) => (
              <button
                key={g.id}
                type="button"
                disabled={disabled}
                aria-pressed={manualGranularity === g.id}
                onClick={() => onGranularityChange(g.id)}
                className={pill(manualGranularity === g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
