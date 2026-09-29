import React from 'react';
import { Boxes } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChartBar {
  /** Texto del eje ("Mié 23", "22 Sep", "Sep 26", "Hoy") */
  label: string;
  /** Texto del tooltip nativo ("Semana del 22 Sep 2026") */
  tooltipTitle: string;
  ai: number;
  human: number;
  /** Ultimo bucket del periodo: se resalta */
  isLast: boolean;
}

export interface ChartChip {
  text: string;
  /** bueno = verde, malo = rojo, marca = terracota (mismo color que las derivadas), neutral = gris */
  tone: 'good' | 'bad' | 'brand' | 'neutral';
}

const CHIP_TONES: Record<ChartChip['tone'], string> = {
  neutral: 'bg-secondary text-muted-foreground',
  good: 'bg-success/10 text-success',
  bad: 'bg-negative/10 text-negative',
  brand: 'bg-ceibo-soft text-ceibo',
};

interface ActivityChartProps {
  title: string;
  /** "21 Sep – 29 Sep 2026 · por día" */
  caption: string;
  ready: boolean;
  bars: ChartBar[];
  chips: ChartChip[];
}

// Espacio reservado (px) bajo las barras para la etiqueta del eje y sobre ellas para el total
const LABEL_SPACE = 28;
const TOTAL_SPACE = 26;
/** Hasta esta cantidad de barras se escribe el total encima de cada una */
const MAX_BARS_WITH_TOTAL = 16;
/** Cantidad aproximada de etiquetas del eje que entran sin pisarse */
const MAX_AXIS_LABELS = 8;

export function ActivityChart({ title, caption, ready, bars, chips }: ActivityChartProps) {
  const count = bars.length;
  const max = Math.max(1, ...bars.map((b) => b.ai + b.human));
  const dense = count > MAX_BARS_WITH_TOTAL;
  // Con muchas barras se muestra una etiqueta cada `step`, contando desde la ultima (que siempre se ve)
  const step = Math.max(1, Math.ceil(count / MAX_AXIS_LABELS));
  const summary = bars
    .map((b) => `${b.tooltipTitle}: ${b.ai + b.human} consultas (${b.ai} resueltas por la IA, ${b.human} derivadas)`)
    .join('; ');

  return (
    <section
      aria-label={title}
      className="flex min-h-[380px] flex-col rounded-[20px] border border-border bg-card p-5 shadow-panel sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <Boxes className="size-5 text-success" strokeWidth={1.8} aria-hidden="true" />
            {title}
          </h2>
          <p className="mt-0.5 pl-7 text-xs text-muted-foreground">{caption}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm bg-success" aria-hidden="true" />
            Resueltas por IA
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm bg-ceibo" aria-hidden="true" />
            Derivadas a vendedor
          </span>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li
            key={chip.text}
            className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold tabular-nums', CHIP_TONES[chip.tone])}
          >
            {chip.text}
          </li>
        ))}
      </ul>

      <div
        role="img"
        aria-label={`${title}. ${caption}. ${summary}`}
        className={cn('mt-4 grid flex-1', dense ? 'gap-0.5 sm:gap-1' : 'gap-1.5 sm:gap-3')}
        style={{ gridTemplateColumns: `repeat(${Math.max(1, count)}, minmax(0, 1fr))` }}
      >
        {bars.map((bar, i) => {
          const total = bar.ai + bar.human;
          const ratio = total / max;
          const showLabel = (count - 1 - i) % step === 0;
          const inset = dense ? 'inset-x-[8%]' : 'inset-x-[16%]';

          return (
            <div
              key={`${bar.tooltipTitle}-${i}`}
              className={cn('relative min-h-[200px] rounded-xl', bar.isLast && 'bg-secondary/70')}
              title={`${bar.tooltipTitle}: ${total} consultas · ${bar.ai} resueltas por la IA · ${bar.human} derivadas`}
            >
              {ready && total > 0 ? (
                <div
                  className={cn('absolute flex flex-col-reverse', inset)}
                  style={{
                    bottom: LABEL_SPACE,
                    height: `max(4px, calc((100% - ${LABEL_SPACE + TOTAL_SPACE}px) * ${ratio}))`,
                  }}
                >
                  {!dense && (
                    <span
                      className="absolute inset-x-0 text-center text-xs font-bold tabular-nums text-foreground"
                      style={{ bottom: '100%', paddingBottom: 4 }}
                    >
                      {total}
                    </span>
                  )}
                  <div
                    className="w-full bg-success"
                    style={{ height: `${(bar.ai / total) * 100}%`, borderRadius: bar.human > 0 ? 0 : '6px 6px 0 0' }}
                  />
                  <div className="w-full rounded-t-md bg-ceibo" style={{ height: `${(bar.human / total) * 100}%` }} />
                </div>
              ) : (
                <div className={cn('absolute flex flex-col items-center gap-1.5', inset)} style={{ bottom: LABEL_SPACE }}>
                  {ready && !dense && <span className="text-[11px] text-muted-foreground">Cerrado</span>}
                  <span className="h-px w-full bg-border" aria-hidden="true" />
                </div>
              )}

              {showLabel && (
                <span
                  className={cn(
                    'absolute bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-xs',
                    bar.isLast ? 'font-bold text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {bar.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
