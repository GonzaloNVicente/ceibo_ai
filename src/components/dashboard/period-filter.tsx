'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { RANGE_PRESETS, type DateRange, type RangePreset } from '@/lib/dashboard-range';

/** Periodos del control segmentado; "7d", "30d", etc. viven en RANGE_PRESETS. */
const SEGMENTS: RangePreset[] = ['today', '7d', '30d', 'this_month', 'custom'];

interface PeriodFilterProps {
  preset: RangePreset;
  range: DateRange;
  /** Hoy en la zona horaria de la empresa: tope de las fechas personalizadas */
  today: string;
  disabled?: boolean;
  onPresetChange: (preset: RangePreset) => void;
  onCustomRangeChange: (range: DateRange) => void;
  className?: string;
}

const dateInput =
  'h-8 rounded-lg border border-border bg-card px-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20';

/**
 * Control segmentado compacto. Si el periodo activo no esta entre los cinco (p. ej. "Mes pasado"
 * llegado por URL), se agrega un sexto segmento para que el estado siempre sea visible.
 */
export function PeriodFilter({
  preset,
  range,
  today,
  disabled,
  onPresetChange,
  onCustomRangeChange,
  className,
}: PeriodFilterProps) {
  const segments = SEGMENTS.includes(preset) ? SEGMENTS : [...SEGMENTS.slice(0, -1), preset, 'custom' as RangePreset];
  const labelOf = (id: RangePreset) => RANGE_PRESETS.find((p) => p.id === id)?.label ?? id;

  return (
    <div className={cn('flex flex-col items-end gap-2', className)}>
      <div
        role="group"
        aria-label="Período"
        className="inline-flex max-w-full flex-wrap rounded-xl bg-secondary p-1"
      >
        {segments.map((id) => (
          <button
            key={id}
            type="button"
            disabled={disabled}
            aria-pressed={preset === id}
            onClick={() => onPresetChange(id)}
            className={cn(
              'h-8 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:pointer-events-none disabled:opacity-60',
              preset === id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {labelOf(id)}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground">
          <label className="flex items-center gap-1.5">
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
          <label className="flex items-center gap-1.5">
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
  );
}
