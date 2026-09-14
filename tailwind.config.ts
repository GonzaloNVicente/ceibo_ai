import type { Config } from 'tailwindcss';

function withOpacity(variableName: string) {
  return `color-mix(in oklch, var(${variableName}) calc(<alpha-value> * 100%), transparent)`;
}

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: withOpacity('--border'),
        input: withOpacity('--input'),
        ring: withOpacity('--ring'),
        background: withOpacity('--background'),
        foreground: withOpacity('--foreground'),
        primary: {
          DEFAULT: withOpacity('--primary'),
          foreground: withOpacity('--primary-foreground'),
        },
        secondary: {
          DEFAULT: withOpacity('--secondary'),
          foreground: withOpacity('--secondary-foreground'),
        },
        destructive: {
          DEFAULT: withOpacity('--destructive'),
          foreground: withOpacity('--destructive-foreground'),
        },
        muted: {
          DEFAULT: withOpacity('--muted'),
          foreground: withOpacity('--muted-foreground'),
        },
        accent: {
          DEFAULT: withOpacity('--accent'),
          foreground: withOpacity('--accent-foreground'),
        },
        popover: {
          DEFAULT: withOpacity('--popover'),
          foreground: withOpacity('--popover-foreground'),
        },
        card: {
          DEFAULT: withOpacity('--card'),
          foreground: withOpacity('--card-foreground'),
        },
        sidebar: {
          DEFAULT: withOpacity('--sidebar'),
          foreground: withOpacity('--sidebar-foreground'),
          primary: withOpacity('--sidebar-primary'),
          'primary-foreground': withOpacity('--sidebar-primary-foreground'),
          accent: withOpacity('--sidebar-accent'),
          'accent-foreground': withOpacity('--sidebar-accent-foreground'),
          border: withOpacity('--sidebar-border'),
          ring: withOpacity('--sidebar-ring'),
        },
        'sidebar-foreground': withOpacity('--sidebar-foreground'),
        'sidebar-accent': withOpacity('--sidebar-accent'),
        'sidebar-accent-foreground': withOpacity('--sidebar-accent-foreground'),
        'sidebar-border': withOpacity('--sidebar-border'),
        ceibo: {
          DEFAULT: withOpacity('--ceibo'),
          soft: withOpacity('--ceibo-soft'),
        },
        'ceibo-soft': withOpacity('--ceibo-soft'),
        success: {
          DEFAULT: withOpacity('--success'),
          foreground: withOpacity('--success-foreground'),
        },
        'success-foreground': withOpacity('--success-foreground'),
        'grid-line': withOpacity('--grid-line'),
        chart: {
          1: withOpacity('--chart-1'),
          2: withOpacity('--chart-2'),
          3: withOpacity('--chart-3'),
          4: withOpacity('--chart-4'),
          5: withOpacity('--chart-5'),
        },
        // Ceibo accents (backwards-compatible)
        neonCyan: '#00e5ff',
        deepBlue: '#0044ff',
        // Ceibo brand palette (backwards-compatible 10-shade scale)
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Sora', 'Space Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        action: 'var(--shadow-action)',
        panel: 'var(--shadow-panel)',
      },
      animation: {
        'live-pulse': 'live-pulse 1.8s ease-in-out infinite',
      },
      keyframes: {
        'live-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.42', transform: 'scale(0.82)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
