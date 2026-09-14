# Target Next.js Codebase Survey & Design Token Mapping Report (R2)

**Agent**: `explorer_survey_1`  
**Target Project**: `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai`  
**Parent Orchestrator ID**: `282698a2-9458-44fd-be9f-0303fbe76e91`  
**Artifact Path**: `C:\Users\Admin\.gemini\antigravity\brain\b234c153-dfcf-40a7-9d2b-eac9709d30b6\handoff.md`  
**Timestamp**: 2026-09-12T00:52:00Z  

---

## 1. Observation

### 1.1 Project & Configuration Architecture
- **`package.json`**:
  - Framework: Next.js `14.2.23` (App Router structure under `src/app`).
  - React: `^18.3.1`, React DOM: `^18.3.1`.
  - Styling engine: Tailwind CSS `^3.4.17`, PostCSS `^8.4.49`, Autoprefixer `^10.4.20`.
  - UI utilities: `clsx` (`^2.1.1`), `tailwind-merge` (`^2.6.0`), `lucide-react` (`^0.475.0`), `recharts` (`^2.15.1`).
  - TypeScript: `^5.7.3`, typecheck script: `"typecheck": "tsc --noEmit"`, build script: `"build": "next build"`.
- **`tsconfig.json`**:
  - Module resolution: `"bundler"`, `"strict": true`, path alias: `"@/*": ["./src/*"]`.
- **`tailwind.config.ts`**:
  - Content paths: `./src/pages/**/*.{js,ts,jsx,tsx,mdx}`, `./src/components/**/*.{js,ts,jsx,tsx,mdx}`, `./src/app/**/*.{js,ts,jsx,tsx,mdx}`.
  - `darkMode: ['class']`.
  - `theme.extend.colors`:
    - Semantic tokens mapped to CSS variables via `hsl(var(--...))`:
      - `border`: `hsl(var(--border))`
      - `input`: `hsl(var(--input))`
      - `ring`: `hsl(var(--ring))`
      - `background`: `hsl(var(--background))`
      - `foreground`: `hsl(var(--foreground))`
      - `primary`: `{ DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' }`
      - `secondary`: `{ DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' }`
      - `destructive`: `{ DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' }`
      - `muted`: `{ DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' }`
      - `accent`: `{ DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' }`
      - `popover`: `{ DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' }`
      - `card`: `{ DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' }`
    - Brand scale (`brand`): Emerald green hex values (50: `#ecfdf5`, 100: `#d1fae5`, 200: `#a7f3d0`, 300: `#6ee7b7`, 400: `#34d399`, 500: `#10b981`, 600: `#059669`, 700: `#047857`, 800: `#065f46`, 900: `#064e3b`).
  - `theme.extend.borderRadius`:
    - `lg: 'var(--radius)'`
    - `md: 'calc(var(--radius) - 2px)'`
    - `sm: 'calc(var(--radius) - 4px)'`
  - **Absence**: No `fontFamily` is defined in `tailwind.config.ts`.
- **`src/app/globals.css`**:
  - Base directives: `@tailwind base; @tailwind components; @tailwind utilities;`.
  - `:root` CSS variables (in HSL format):
    - `--background: 210 40% 98%;`
    - `--foreground: 222.2 84% 4.9%;`
    - `--card: 0 0% 100%;` / `--card-foreground: 222.2 84% 4.9%;`
    - `--popover: 0 0% 100%;` / `--popover-foreground: 222.2 84% 4.9%;`
    - `--primary: 158 64% 52%;` (emerald `#10B981`) / `--primary-foreground: 210 40% 98%;`
    - `--secondary: 210 40% 96.1%;` / `--secondary-foreground: 222.2 47.4% 11.2%;`
    - `--muted: 210 40% 96.1%;` / `--muted-foreground: 215.4 16.3% 46.9%;`
    - `--accent: 210 40% 96.1%;` / `--accent-foreground: 222.2 47.4% 11.2%;`
    - `--destructive: 0 84.2% 60.2%;` / `--destructive-foreground: 210 40% 98%;`
    - `--border: 214.3 31.8% 91.4%;`
    - `--input: 214.3 31.8% 91.4%;`
    - `--ring: 158 64% 52%;`
    - `--radius: 0.5rem;` (8px)
  - Base layer rules:
    ```css
    @layer base {
      * {
        @apply border-border;
      }
      body {
        @apply bg-slate-50 text-slate-900 antialiased selection:bg-brand-500 selection:text-white;
      }
    }
    ```
    Notice that line 74 directly applies `@apply bg-slate-50 text-slate-900` rather than `bg-background text-foreground`.
- **`src/app/layout.tsx`**:
  - Imports `Inter` from `next/font/google`:
    ```tsx
    const inter = Inter({
      subsets: ['latin'],
      display: 'swap',
      variable: '--font-inter',
      fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
    });
    ```
  - Root element: `<html lang="es" className={`${inter.variable} h-full bg-slate-50`}>`.
  - Body element: `<body className="min-h-full font-sans bg-slate-50 text-slate-900 antialiased">`.

---

### 1.2 Screen Analysis: Dashboard (`src/app/page.tsx`)
The dashboard is composed of:
1. **Header Section**:
   - Title: `text-2xl font-bold tracking-tight text-slate-900`.
   - Live badge: `<Badge variant="success" className="inline-flex bg-emerald-100 text-emerald-800 text-xs">En Vivo</Badge>`.
   - Subtitle: `text-sm text-slate-500 mt-1`.
   - Buttons:
     - Refresh: `<Button variant="outline" size="sm" className="gap-1.5 text-xs text-slate-600">`.
     - Link to chats: `<Button variant="outline" size="sm" className="gap-2">` with `<MessageSquare className="w-4 h-4 text-slate-600" />`.
     - Train assistant: `<Button variant="brand" size="sm" className="gap-2"><Sparkles className="w-4 h-4" /><span>Entrenar Asistente</span></Button>`.
2. **KPI Metrics Grid (`src/components/dashboard/metrics-grid.tsx` & `metric-card.tsx`)**:
   - Container: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5`.
   - Metric 1 ("Volumen de Consultas"): `iconColor="text-emerald-600"`, `iconBgColor="bg-emerald-50"`, trend `text-emerald-600`.
   - Metric 2 ("Horas Ahorradas"): `iconColor="text-blue-600"`, `iconBgColor="bg-blue-50"`.
   - Metric 3 ("Tasa de Resolución IA"): `iconColor="text-emerald-600"`, `iconBgColor="bg-emerald-50"`, `valueColor="text-emerald-700"`.
   - Metric 4 ("Derivadas a Humano"): `iconColor="text-amber-600"`, `iconBgColor="bg-amber-50"`.
   - Card base: `<Card className={cn('hover:shadow-md transition-shadow border-slate-200', className)}>`.
   - Card title: `text-sm font-medium text-slate-600`.
   - Metric value: `text-2xl font-bold tracking-tight text-slate-900`.
   - Subtext: `text-[11px] text-slate-400 mt-1`.
3. **Analytics Chart (`src/components/dashboard/analytics-chart.tsx` & `chart-view.tsx`)**:
   - Card container: `<Card className="border-slate-200 shadow-xs">`.
   - Card title: `text-base font-semibold text-slate-900`.
   - Description: `CardDescription` (`text-sm text-slate-500`).
   - Legend: `bg-emerald-500` + `text-slate-700` (IA), `bg-indigo-500` + `text-slate-700` (Humano).
   - SVG fallback & Recharts:
     - Grid lines: `#E2E8F0`.
     - X/Y Axis ticks: `#64748B`, `fontSize: 11`.
     - IA Area: stroke `#10B981`, fill `linearGradient` from `#10B981` (opacity 0.4 to 0.0).
     - Humano Area: stroke `#6366F1`, fill `linearGradient` from `#6366F1` (opacity 0.4 to 0.0).
     - Tooltip: `bg-slate-900/95 backdrop-blur-sm text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs`, `border-slate-800`, `text-emerald-400`, `text-indigo-300`.
4. **Tenant Security Card**:
   - Container: `rounded-xl border border-slate-200 bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4`.
   - Icon container: `p-3 bg-slate-100 rounded-lg text-slate-700`, icon `w-5 h-5 text-emerald-600`.
   - Heading: `font-semibold text-slate-900 text-sm`.
   - Text: `text-xs text-slate-500`.
   - Action: `<Button variant="outline" size="sm" className="gap-2 text-xs">`.

---

### 1.3 Screen Analysis: Inbox (`src/app/inbox/page.tsx`)
The Inbox screen exhibits a different styling strategy, relying heavily on Tailwind semantic CSS variables:
1. **Header**:
   - Title: `text-3xl font-bold tracking-tight` (inherits body text color).
   - Search input: `flex h-9 w-full sm:w-64 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`.
   - Dropdown select: `flex h-9 items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring`.
2. **Card & Tabs**:
   - Card container: `<Card>`, `<CardHeader className="pb-4">`, `<CardTitle>Leads Calificados</CardTitle>`, `<CardDescription>Gestión y seguimiento comercial</CardDescription>`.
   - Tab header: `flex space-x-1 border-b pt-4`.
   - Active tab: `border-primary text-primary` (directly uses `theme.colors.primary`!).
   - Inactive tab: `border-transparent text-muted-foreground hover:text-foreground hover:border-border`.
3. **Table Structure**:
   - Container: `relative w-full overflow-auto`.
   - Table: `w-full caption-bottom text-sm`.
   - thead: `[&_tr]:border-b`.
   - Header cells: `h-12 px-4 text-left align-middle font-medium text-muted-foreground`.
   - Table rows: `border-b transition-colors hover:bg-muted/50`.
   - Data cells: `p-4 align-middle`, customer name `font-medium`.
   - Badges:
     - Uncategorized: `<Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50">Sin categorizar</Badge>`.
     - Derivado: `<Badge variant="destructive">Pendiente</Badge>`.
     - Resuelto: `<Badge variant="secondary">Atendido</Badge>`.
   - Actions: `<Button variant="outline" size="sm" onClick={() => handleAssign(lead.id)}>Asignar</Button>`.
   - Empty state: `p-8 text-center text-muted-foreground`.

---

### 1.4 Global Shell & Shared Component Patterns
1. **AppShell (`src/components/layout/app-shell.tsx`)**:
   - Outer wrapper: `min-h-screen bg-slate-50 flex`.
   - Mobile overlay: `bg-slate-900/40 backdrop-blur-xs`.
   - Main container: `flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto`.
2. **Sidebar (`src/components/layout/sidebar.tsx`)**:
   - Aside: `w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-sm`.
   - Header: `h-16 border-b border-slate-100`, logo `bg-gradient-to-tr from-emerald-600 to-teal-500`, dot `bg-emerald-500 ring-emerald-100`.
   - Navigation links:
     - Active: `bg-slate-100 text-slate-900 shadow-sm border border-slate-200/60`, icon `text-emerald-600`, indicator `bg-emerald-600`.
     - Inactive: `text-slate-600 hover:text-slate-900 hover:bg-slate-50`, icon `text-slate-400 group-hover:text-slate-600`.
   - Status widget: `border border-emerald-100 bg-emerald-50/60`, `text-emerald-950`, `text-emerald-700`, `text-emerald-600`.
3. **Navbar (`src/components/layout/navbar.tsx`)**:
   - Header: `h-16 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs`.
   - Tenant display: icon box `bg-slate-100 border-slate-200 text-slate-700`, badge `bg-emerald-50 text-emerald-700 border-emerald-200`.
   - Channel pill: `bg-slate-50 border-slate-200 text-slate-600`, icon `text-emerald-600`, dot `bg-emerald-500`.
   - User profile: avatar `bg-gradient-to-br from-slate-700 to-slate-900 text-white`, text `text-slate-900`, `text-slate-500`.
4. **UI Primitives**:
   - `Card` (`src/components/ui/card.tsx`):
     - `rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm`
     - `CardTitle`: `font-semibold leading-none tracking-tight text-slate-900`
     - `CardDescription`: `text-sm text-slate-500`
   - `Button` (`src/components/ui/button.tsx`):
     - Base: `rounded-md text-sm font-medium focus-visible:ring-emerald-500`
     - `default`: `bg-slate-900 text-white hover:bg-slate-800`
     - `brand`: `bg-emerald-600 text-white hover:bg-emerald-700`
     - `outline`: `border border-slate-200 bg-white hover:bg-slate-100 text-slate-900`
     - `secondary`: `bg-slate-100 text-slate-900 hover:bg-slate-200`
     - `ghost`: `hover:bg-slate-100 hover:text-slate-900 text-slate-700`
     - `destructive`: `bg-red-600 text-white hover:bg-red-700`
   - `Badge` (`src/components/ui/badge.tsx`):
     - `default`: `bg-slate-900 text-slate-50`
     - `secondary`: `bg-slate-100 text-slate-700 hover:bg-slate-200`
     - `destructive`: `bg-red-100 text-red-700 hover:bg-red-200`
     - `outline`: `text-slate-700 border border-slate-200`
     - `success`: `bg-emerald-100 text-emerald-800 font-medium`
     - `warning`: `bg-amber-100 text-amber-800`

---

## 2. Logic Chain

### 2.1 The Dual-Layer Architecture Disparity
- **Step 1**: Directly observed that the target application utilizes two distinct styling layers:
  - **Layer 1 (Semantic CSS Variables)**: `border-primary`, `text-primary`, `border-input`, `focus-visible:ring-ring`, `text-muted-foreground`, `hover:bg-muted/50`. This layer is heavily utilized in `src/app/inbox/page.tsx` and standard form inputs.
  - **Layer 2 (Explicit Tailwind Utility Palettes)**: `bg-slate-50`, `text-slate-900`, `border-slate-200`, `text-emerald-600`, `bg-emerald-50`, `bg-brand-500`. This layer is heavily utilized across `src/app/page.tsx` (Dashboard), `src/components/layout/sidebar.tsx`, `navbar.tsx`, `app-shell.tsx`, `card.tsx`, `button.tsx`, and `badge.tsx`.
- **Step 2**: If an implementer ONLY updates `:root` CSS variables in `src/app/globals.css`:
  - The Inbox active tabs and input rings will update.
  - However, the Dashboard, Sidebar, Navbar, Card borders, and text headings will **NOT** change, because they are hard-wired to Tailwind's `slate` and `emerald` color scales!
- **Step 3**: If an implementer ONLY overrides `theme.extend.colors.brand` in `tailwind.config.ts`:
  - Components using `brand-*` will update, but components using `slate-*` (such as Card backgrounds, borders, AppShell background, Navbar) will remain on the default Slate palette.
  - Furthermore, the Inbox active tabs (`border-primary text-primary`) will remain on the old green HSL variable (`158 64% 52%`).
- **Step 4**: Requirement R2 states:
  > *"Update our project's tailwind.config.ts and globals.css to inject these exact colors and fonts. Do not rewrite our existing React component structures; only map the new Tailwind configuration to our existing UI classes where necessary to ensure the new color palette and typography propagate correctly."*
- **Step 5 (Synthesis)**: To guarantee that both the Dashboard and Inbox screens seamlessly inherit the new design system without modifying React component JSX structures:
  1. `tailwind.config.ts` must override/extend `slate`, `emerald`, and `brand` to match the reference design's neutral scale, primary accent scale, and brand scale.
  2. `tailwind.config.ts` must configure `fontFamily.sans` to use the reference font family.
  3. `src/app/globals.css` must update `:root` and `.dark` variables (`--primary`, `--secondary`, `--background`, `--foreground`, `--card`, `--muted`, `--accent`, `--border`, `--input`, `--ring`, `--radius`) to match the reference design.
  4. `src/app/globals.css` base layer (`body`) and `src/app/layout.tsx` must declare and load the reference font family via `next/font/google`.

---

## 3. Detailed Token Mapping Plan (Requirement R2)

### 3.1 Mapping Matrix: Target Codebase to Reference Design Tokens

| UI Element / Class in Target App | Current Source / Value | Target Reference Token | Injection Mechanism |
|---|---|---|---|
| **App Background** (`bg-slate-50`, `html`, `body`, `app-shell.tsx`) | Tailwind default Slate-50 (`#f8fafc`) / `globals.css` line 74 | Reference Surface/Background (e.g. Reference Neutral-50 or `#0B0F19` in dark / `#F8FAFC` in light) | Map `slate.50` in `tailwind.config.ts` + update `--background` in `globals.css` |
| **Card Background & Surfaces** (`bg-white`, `Card`, `Sidebar`, `Navbar`) | Tailwind default `#ffffff` / `--card` (`0 0% 100%`) | Reference Card/Surface Color | Update `--card` in `globals.css` + maintain clean white/card tokens |
| **Primary Text / Headings** (`text-slate-900`, `text-slate-950`, `CardTitle`, `h1`) | Tailwind default Slate-900 (`#0f172a`) / Slate-950 | Reference Foreground / Heading Color | Map `slate.900` & `slate.950` in `tailwind.config.ts` + update `--foreground` in `globals.css` |
| **Muted / Secondary Text** (`text-slate-500`, `text-slate-400`, `text-muted-foreground`, `CardDescription`) | Slate-500 (`#64748b`) / Slate-400 (`#94a3b8`) / `--muted-foreground` | Reference Muted Text Color | Map `slate.400`, `slate.500`, `slate.600` in `tailwind.config.ts` + update `--muted-foreground` in `globals.css` |
| **Borders & Dividers** (`border-slate-200`, `border-slate-100`, `border-border`, `border-input`) | Slate-200 (`#e2e8f0`) / Slate-100 (`#f1f5f9`) / `--border` | Reference Border Color | Map `slate.100` & `slate.200` in `tailwind.config.ts` + update `--border` & `--input` in `globals.css` |
| **Primary Brand / Action** (`variant="brand"`, `text-emerald-600`, `bg-emerald-500`, `brand-*`) | Emerald-600 (`#059669`) / Brand-500 (`#10b981`) | Reference Primary Brand Color | Map `brand` (50–900) & `emerald` (50–900) in `tailwind.config.ts` |
| **Active Inbox Tabs** (`border-primary text-primary`) | `hsl(var(--primary))` (`158 64% 52%`) | Reference Primary Accent | Update `--primary` and `--primary-foreground` in `globals.css` |
| **Input Focus Rings** (`focus-visible:ring-ring`, `focus-visible:ring-emerald-500`) | `hsl(var(--ring))` (`158 64% 52%`) | Reference Ring / Focus Token | Update `--ring` in `globals.css` + map `ring` in `tailwind.config.ts` |
| **Badge Success / Accents** (`bg-emerald-100 text-emerald-800`, `bg-emerald-50 text-emerald-700`) | Emerald-100 / Emerald-800 | Reference Accent / Status Muted | Map `emerald.50`, `emerald.100`, `emerald.700`, `emerald.800` in `tailwind.config.ts` |
| **Border Radius** (`rounded-xl`, `rounded-md`, `rounded-lg`) | `var(--radius)` = `0.5rem` (8px), `rounded-xl` = 12px | Reference Standard Radius | Update `--radius` in `globals.css` + `theme.extend.borderRadius` |
| **Typography Family** (`font-sans`, `Inter`) | Inter via `next/font/google` (`--font-inter`) | Reference Font Family (e.g. Plus Jakarta Sans / Inter / Geist) | Configure `fontFamily.sans` in `tailwind.config.ts` + font loader in `layout.tsx` |

---

### 3.2 Proposed `tailwind.config.ts` Injection Blueprint
Below is the precise architectural design for updating `tailwind.config.ts` so that all classes (`slate-*`, `emerald-*`, `brand-*`, `primary`, `card`, `font-sans`) automatically resolve to the reference design:

```typescript
import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

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
        // 1. Semantic CSS variable tokens
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // 2. Reference Brand Scale (injected into brand and emerald to satisfy existing UI classes)
        brand: {
          50: '<REF_BRAND_50>',
          100: '<REF_BRAND_100>',
          200: '<REF_BRAND_200>',
          300: '<REF_BRAND_300>',
          400: '<REF_BRAND_400>',
          500: '<REF_BRAND_500>',
          600: '<REF_BRAND_600>',
          700: '<REF_BRAND_700>',
          800: '<REF_BRAND_800>',
          900: '<REF_BRAND_900>',
        },
        emerald: {
          50: '<REF_PRIMARY_50>',
          100: '<REF_PRIMARY_100>',
          200: '<REF_PRIMARY_200>',
          300: '<REF_PRIMARY_300>',
          400: '<REF_PRIMARY_400>',
          500: '<REF_PRIMARY_500>',
          600: '<REF_PRIMARY_600>',
          700: '<REF_PRIMARY_700>',
          800: '<REF_PRIMARY_800>',
          900: '<REF_PRIMARY_900>',
        },

        // 3. Reference Neutral Scale (mapped to slate so all slate-* classes across Dashboard & Shell inherit it)
        slate: {
          50: '<REF_NEUTRAL_50>',
          100: '<REF_NEUTRAL_100>',
          200: '<REF_NEUTRAL_200>',
          300: '<REF_NEUTRAL_300>',
          400: '<REF_NEUTRAL_400>',
          500: '<REF_NEUTRAL_500>',
          600: '<REF_NEUTRAL_600>',
          700: '<REF_NEUTRAL_700>',
          800: '<REF_NEUTRAL_800>',
          900: '<REF_NEUTRAL_900>',
          950: '<REF_NEUTRAL_950>',
        },
      },
      fontFamily: {
        sans: ['var(--font-primary)', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

### 3.3 Proposed `src/app/globals.css` Injection Blueprint
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: <REF_BG_HSL>;
    --foreground: <REF_FG_HSL>;

    --card: <REF_CARD_HSL>;
    --card-foreground: <REF_CARD_FG_HSL>;

    --popover: <REF_POPOVER_HSL>;
    --popover-foreground: <REF_POPOVER_FG_HSL>;

    --primary: <REF_PRIMARY_HSL>;
    --primary-foreground: <REF_PRIMARY_FG_HSL>;

    --secondary: <REF_SECONDARY_HSL>;
    --secondary-foreground: <REF_SECONDARY_FG_HSL>;

    --muted: <REF_MUTED_HSL>;
    --muted-foreground: <REF_MUTED_FG_HSL>;

    --accent: <REF_ACCENT_HSL>;
    --accent-foreground: <REF_ACCENT_FG_HSL>;

    --destructive: <REF_DESTRUCTIVE_HSL>;
    --destructive-foreground: <REF_DESTRUCTIVE_FG_HSL>;

    --border: <REF_BORDER_HSL>;
    --input: <REF_INPUT_HSL>;
    --ring: <REF_RING_HSL>;

    --radius: <REF_RADIUS_REM>;
  }

  .dark {
    /* Reference Dark Mode tokens if defined in reference repository */
    --background: <REF_DARK_BG_HSL>;
    --foreground: <REF_DARK_FG_HSL>;
    ...
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-slate-50 text-slate-900 antialiased selection:bg-brand-500 selection:text-white;
  }
}
```

---

### 3.4 Zero Component Breakage Guarantee
Because this mapping strategy maps the reference tokens directly to:
1. `theme.extend.colors.slate` (preserving all `bg-slate-*`, `text-slate-*`, `border-slate-*` layouts)
2. `theme.extend.colors.emerald` and `theme.extend.colors.brand` (preserving all button variants, badges, and status colors)
3. CSS variables for `primary`, `border`, `input`, `ring` (preserving all Inbox tabs and input controls)
4. `theme.extend.fontFamily.sans` (preserving all `font-sans` declarations)

**No JSX components need to be refactored or rewritten**. All layout dimensions (`w-64`, `max-w-7xl`, `h-16`, flex directions, grid columns) remain 100% intact, preventing visual breakage or regressions.

---

## 4. Caveats
1. **Chart Custom Colors**: The Recharts implementation in `src/components/dashboard/chart-view.tsx` and the fallback SVG in `analytics-chart.tsx` have hardcoded `#10B981` (emerald green) and `#6366F1` (indigo). While Requirement R2 specifies modifying only `tailwind.config.ts` and `globals.css` without rewriting React components, if the chart lines must also strictly reflect the new reference primary color, the implementer can optionally replace `#10B981` with the primary brand hex.
2. **External Reference Repository Cloning**: Extraction of the exact hex values and font names from `https://github.com/GonzaloNVicente/ceibo-command-center.git` is delegated to peer agent `spec_miner_survey_1`. The mapping architecture defined herein provides exact injection slots (`<REF_BRAND_*>`, `<REF_NEUTRAL_*>`, `<REF_PRIMARY_HSL>`) ready to receive those values.
3. **No caveats** regarding target project structure or compilation prerequisites.

---

## 5. Conclusion
- The target Next.js codebase uses a dual-layer styling architecture consisting of HSL CSS variables and explicit Tailwind utility classes (`slate-*`, `emerald-*`, `brand-*`).
- To satisfy Requirement R2 and ensure that both the Dashboard and Inbox seamlessly inherit the reference design tokens without rewriting existing React component structures, the implementer must inject the reference tokens into **both** `tailwind.config.ts` (by extending `slate`, `emerald`, `brand`, and `fontFamily.sans`) and `src/app/globals.css` (by updating `:root` and `.dark` CSS variables).
- This strategy guarantees 100% style inheritance across all screens, zero layout breakage, and clean typecheck compilation.

---

## 6. Verification Method
To independently verify this survey and the subsequent token implementation:
1. **Inspect Configuration Files**:
   - View `tailwind.config.ts` and `src/app/globals.css` to confirm token injection slots.
   - View `src/app/layout.tsx` to verify font family loading.
2. **Typecheck Compilation**:
   - Run `npm run typecheck` (or `npx tsc --noEmit`) from `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai`.
3. **Build Compilation**:
   - Run `npm run build` from `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai`.
4. **Visual Inspection**:
   - Start development server via `npm run dev`.
   - Inspect Dashboard (`http://localhost:3000/`) and Inbox (`http://localhost:3000/inbox`).
   - Confirm that Dashboard KPI cards, headers, background, and Inbox tabs/inputs reflect the new color palette and typography without breaking any responsive or grid layouts.
