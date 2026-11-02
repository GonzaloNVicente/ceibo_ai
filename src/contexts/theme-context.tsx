'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_THEME_MODE, THEME_STORAGE_KEY, isThemeMode, type ThemeMode } from '@/lib/theme';

interface ThemeContextValue {
  /** Lo que eligio el usuario */
  mode: ThemeMode;
  /** Lo que se esta mostrando realmente */
  resolved: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: DEFAULT_THEME_MODE,
  resolved: 'light',
  setMode: () => {},
});

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

function applyTheme(mode: ThemeMode): 'light' | 'dark' {
  const dark = mode === 'dark' || (mode === 'system' && systemPrefersDark());
  document.documentElement.classList.toggle('dark', dark);
  return dark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_THEME_MODE);
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  // Lee la preferencia guardada (el almacenamiento puede no estar disponible)
  useEffect(() => {
    let saved: ThemeMode = DEFAULT_THEME_MODE;
    try {
      const raw = localStorage.getItem(THEME_STORAGE_KEY);
      if (isThemeMode(raw)) saved = raw;
    } catch {
      /* sin almacenamiento: queda el modo por defecto */
    }
    setModeState(saved);
    setResolved(applyTheme(saved));
  }, []);

  // En modo automatico, acompaña los cambios del sistema operativo
  useEffect(() => {
    if (mode !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setResolved(applyTheme('system'));
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    setResolved(applyTheme(next));
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignorar */
    }
  }, []);

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
