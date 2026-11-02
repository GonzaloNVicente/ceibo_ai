'use client';

import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';
import { cn } from '@/lib/utils';
import type { ThemeMode } from '@/lib/theme';

const OPTIONS: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { mode: 'light', label: 'Tema claro', Icon: Sun },
  { mode: 'dark', label: 'Tema oscuro', Icon: Moon },
  { mode: 'system', label: 'Tema automático (sigue al sistema)', Icon: Monitor },
];

/** Interruptor claro / oscuro / automatico (control segmentado, solo iconos con nombre accesible). */
export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useTheme();
  return (
    <div role="group" aria-label="Tema de la aplicación" className={cn('ui-seg', className)}>
      {OPTIONS.map(({ mode: m, label, Icon }) => (
        <button
          key={m}
          type="button"
          className="ui-seg-item !min-h-7 !px-2"
          aria-pressed={mode === m}
          aria-label={label}
          title={label}
          onClick={() => setMode(m)}
        >
          <Icon className="size-4" strokeWidth={1.9} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
