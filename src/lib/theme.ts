/**
 * Ceibo AI - Tema claro / oscuro / automatico
 *
 * El modo se guarda en localStorage y se aplica como clase `dark` en <html>. El script de abajo corre
 * ANTES de pintar (en el <head>) para que la pagina no parpadee al cargar. Por defecto la app abre en
 * modo claro; "Automático" sigue la preferencia del sistema operativo.
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'ceibo.theme';
export const DEFAULT_THEME_MODE: ThemeMode = 'light';

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** Script en linea para el <head>: aplica el tema guardado antes del primer pintado. */
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem('${THEME_STORAGE_KEY}');if(m!=='light'&&m!=='dark'&&m!=='system'){m='${DEFAULT_THEME_MODE}'}var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})();`;
