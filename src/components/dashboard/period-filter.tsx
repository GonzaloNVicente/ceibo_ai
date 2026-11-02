'use client';

import React from 'react';
import { RANGE_PRESETS, type DateRange, type RangePreset } from '@/lib/dashboard-range';

/** Segmentos del selector. Si el periodo activo no esta entre ellos (p. ej. "Mes pasado" por URL), aparece como un segmento extra. */
const SEGMENTS: RangePreset[] = ['today', '7d', '30d', 'this_month', 'custom'];

interface PeriodFilterProps {
  preset: RangePreset;
  range: DateRange;
  /** Hoy en la zona horaria de la empresa: tope de las fechas personalizadas */
  today: string;
  disabled?: boolean;
  onPresetChange: (preset: RangePreset) => void;
  onCustomRangeChange: (range: DateRange) => void;
}

export function PeriodFilter({ preset, range, today, disabled, onPresetChange, onCustomRangeChange }: PeriodFilterProps) {
  const segments = SEGMENTS.includes(preset) ? SEGMENTS : [...SEGMENTS.slice(0, -1), preset, 'custom' as RangePreset];
  const labelOf = (id: RangePreset) => RANGE_PRESETS.find((p) => p.id === id)?.label ?? id;

  return (
    <div className="cb-period cb-noprint">
      <div role="group" aria-label="Período" className="cb-seg">
        {segments.map((id) => (
          <button
            key={id}
            type="button"
            className="cb-btn cb-seg-btn"
            aria-pressed={preset === id}
            disabled={disabled}
            onClick={() => onPresetChange(id)}
          >
            {labelOf(id)}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className="cb-dates">
          <label>
            Desde
            <input
              type="date"
              className="cb-date"
              value={range.from}
              max={range.to}
              disabled={disabled}
              onChange={(e) => e.target.value && onCustomRangeChange({ from: e.target.value, to: range.to })}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              className="cb-date"
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
