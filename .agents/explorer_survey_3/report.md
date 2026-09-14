# Ceibo AI Codebase Survey & 1:1 Reference UI Migration Plan

**Agent**: `explorer_survey_3`  
**Date**: 2026-09-12  
**Target Workspace**: `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai`  
**Reference Workspace**: `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ref`  

---

## 1. Executive Summary

This report delivers a forensic analysis of the current Next.js application in `ceibo_ai` and provides an exhaustive, step-by-step engineering migration plan to achieve a **1:1 visual match** to the reference Vite UI in `ceibo_ref` (`src/routes/index.tsx` and `src/styles.css`).

### Key Findings:
1. **Typecheck & Test Baseline**:
   - `npx tsc --noEmit` compiles cleanly with **0 errors**.
   - `npm run test:e2e` runs 6 test suites with **89/89 tests passing (100% success rate)**.
2. **Icon & Library Parity**:
   - `lucide-react@^0.475.0` is already installed in `ceibo_ai`. All 14 Lucide icons utilized in the reference UI (`ArrowDownToLine`, `Bot`, `BookOpen`, `Boxes`, `ChevronDown`, `CircleUserRound`, `Gauge`, `Inbox`, `LockKeyhole`, `MessageCircleMore`, `RefreshCw`, `Settings`, `ShieldCheck`, `Sparkles`) have been empirically verified to exist and resolve without errors.
   - `recharts@^2.15.1` is already installed and supports `AreaChart`, `Area`, `CartesianGrid`, `ResponsiveContainer`, `Tooltip`, `XAxis`, and `YAxis`.
3. **Mock Data Preservation**:
   - All inner pages (`inbox`, `chats`, `documents`, `settings`) and the dashboard depend on `TenantAnalyticsClient` methods (`getRecent30Days`, `getLeads`, `getChatMessages`, `calculateSummaryMetrics`) and `useAuth()`. The migration plan preserves every single hook, query call, and handler while replacing the visual presentation layer with the reference DOM and Tailwind classes.

---

## 2. Current State Inventory (`ceibo_ai`)

### 2.1 Dependencies (`package.json`)
```json
{
  "dependencies": {
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.48.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.475.0",
    "next": "14.2.23",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.15.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.17.19",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.1",
    "eslint-config-next": "14.2.23",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3"
  }
}
```

### 2.2 Layout Architecture (`src/components/layout/*`)
- **`app-shell.tsx`**:
  - Sets layout container: `<div className="min-h-screen bg-slate-50 flex">`.
  - Implements desktop `<Sidebar className="hidden md:flex" />` (256px / `w-64`) and mobile drawer.
  - Implements `<Navbar onMenuToggle={...} />` and main content `<main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">`.
- **`sidebar.tsx`**:
  - Uses `w-64` (256px), border `border-slate-200`, and background `bg-white`.
  - Brand header: gradient `from-brand-600 to-teal-500` with `Bot` icon.
  - Nav icons: `LayoutDashboard`, `Inbox`, `MessageSquare`, `FileText`, `Settings`.
  - Bottom card: simple card with "Bot WhatsApp Operativo".
- **`navbar.tsx`**:
  - Uses `Building2`, `ShieldCheck`, `LogOut`, and `Smartphone` icons.
  - Displays tenant name and plan pill in slate styling.

### 2.3 Dashboard Page (`src/app/page.tsx`)
- Imports `MetricsGrid` and `AnalyticsChart`.
- Data loading flow:
  ```ts
  const supabase = createClient();
  const tenantClient = createTenantScopedClient(supabase);
  const rows = await tenantClient.getRecent30Days();
  setAnalytics(rows);
  setMetrics(calculateSummaryMetrics(rows));
  ```
- Subcomponents:
  - `metrics-grid.tsx`: renders 4 independent `MetricCard` components.
  - `metric-card.tsx`: individual cards with slate borders and separate trend badges.
  - `analytics-chart.tsx`: renders `Card` with `SvgChartFallback` during SSR and dynamic `ChartView`.
  - `chart-view.tsx`: Recharts `AreaChart` with `#gradientIA` (#10B981) and `#gradientHumano` (#6366F1).

### 2.4 Inner Pages
1. **`src/app/inbox/page.tsx`**:
   - Manages leads via `tenantClient.getLeads()`.
   - Has filters: search input, query type select (`pedido_presupuesto`, `reclamo`, `consulta_stock`, `consulta_precio`, `pedido`, `uncategorized`), status tabs (`all`, `derivado`, `resuelto`, `uncategorized`), and priority sorting.
   - Action handler `handleAssign(lead.id)` triggers assignment alert.
2. **`src/app/chats/page.tsx`**:
   - Two-pane WhatsApp conversation view:
     - Left pane: session list loaded via `tenantClient.getLeads()`.
     - Right pane: message history loaded via `tenantClient.getChatMessages(selectedSessionId)`.
   - Supports optimistic message sending by agent (`handleSendMessage`).
3. **`src/app/documents/page.tsx`**:
   - Knowledge base management: drag & drop upload zone, file input ref, simulated upload with processing delay, active document table with delete action, and template download trigger.
4. **`src/app/settings/page.tsx`**:
   - 4 settings tabs: `General`, `Asistente de IA`, `WhatsApp API`, `Equipo y Accesos`.
   - Multi-tenant company info, bot configuration, connected WhatsApp credentials, and sales team member list.
5. **`src/app/login/page.tsx`**:
   - Auth screen with Supabase `signIn` and quick demo buttons for Tenant A (`admin@ceibo.ai`) and Tenant B (`carlos@rival.com`).

### 2.5 Mock Data & Multi-Tenant Engine (`src/lib/supabase/*`)
- **`types.ts`**: Formal contracts for `Empresa`, `Perfil`, `ChatAnalytics`, `ChatAnalyticsRaw`, `ChatMessage`, `SummaryMetrics`, `ChartDataPoint`, and `TenantAnalyticsClient`.
- **`mock-data.ts`**:
  - `MOCK_TENANTS`: `TENANT_A` ("Ceibo AI Tech Solutions", `enterprise`), `TENANT_B` ("Rival Retail Corp", `starter`).
  - `generateMockAnalytics`: creates 30 days of realistic daily WhatsApp consultation volumes, modeling weekend drops and calculating `horas_ahorradas = resueltas_ia * 0.2`.
  - `calculateSummaryMetrics`: computes `totalConsultas`, `totalIA`, `totalHuman`, `horasAhorradas`, `tasaResolucionIA`.
  - `generateMockRawAnalytics` and `MOCK_CHAT_MESSAGES`: detailed customer conversation sessions and chat messages.
- **`tenant-client.ts`**: `createTenantScopedClient` injects the active tenant's `empresa_id` into all queries to guarantee isolation.

---

## 3. Reference Architecture Analysis (`ceibo_ref`)

### 3.1 Design Tokens & CSS Properties (`ceibo_ref/src/styles.css`)
- **Fonts**:
  - `--font-sans`: `"Manrope", sans-serif;`
  - `--font-display`: `"Sora", sans-serif;`
- **Key Color Values (OKLCH)**:
  - `--background`: `oklch(0.976 0.006 145.1)` (light warm zinc/slate `#f8faf8`)
  - `--foreground`: `oklch(0.244 0.028 169.1)` (deep forest charcoal `#1c2826`)
  - `--card`: `oklch(1 0 0)` (`#ffffff`)
  - `--primary`: `oklch(0.555 0.163 33.5)` (Ceibo terracotta orange `#c84826`)
  - `--primary-foreground`: `oklch(0.982 0.006 145.1)`
  - `--secondary`: `oklch(0.922 0.008 147.2)`
  - `--muted`: `oklch(0.922 0.008 147.2)`
  - `--muted-foreground`: `oklch(0.494 0.025 167.3)`
  - `--accent`: `oklch(0.368 0.041 166.1)` (deep slate green)
  - `--accent-foreground`: `oklch(0.982 0.006 145.1)`
  - `--border`: `oklch(0.87 0.009 147.4)`
  - `--success`: `oklch(0.49 0.103 162.1)` (emerald green)
  - `--ceibo`: `oklch(0.555 0.163 33.5)` (terracotta)
  - `--ceibo-soft`: `oklch(0.94 0.025 36.5)`
  - `--grid-line`: `oklch(0.87 0.009 147.4 / 62%)`
  - `--sidebar`: `oklch(0.244 0.028 169.1)` (dark emerald charcoal)
  - `--sidebar-foreground`: `oklch(0.922 0.008 147.2)`
  - `--sidebar-accent`: `oklch(0.368 0.041 166.1)`
  - `--sidebar-accent-foreground`: `oklch(0.982 0.006 145.1)`
  - `--sidebar-border`: `oklch(1 0 0 / 12%)`
- **Shadows**:
  - `--shadow-action`: `0 4px 0 oklch(0.41 0.117 33.5)`
  - `--shadow-panel`: `0 16px 44px -34px oklch(0.244 0.028 169.1 / 42%)`
- **Custom Utilities**:
  - `font-display`: `font-family: var(--font-display);`
  - `live-pulse`: keyframe pulsing animation for status dots.

### 3.2 Reference Shell & Sidebar
- **Sidebar**:
  - Fixed position: `fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col bg-sidebar text-sidebar-foreground lg:flex`.
  - Brand Mark:
    ```tsx
    <div className="grid size-11 shrink-0 place-items-center rounded-md bg-primary font-display text-lg font-bold text-primary-foreground shadow-action">
      C
    </div>
    ```
  - Nav items:
    - `Dashboard` (`Gauge`, active state)
    - `Inbox` (`Inbox`, count "24")
    - `Chats` (`MessageCircleMore`)
    - `Base de Conocimiento` (`BookOpen`)
    - `Configuración` (`Settings`)
  - Nav item classes:
    - Base: `flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors`
    - Active: `bg-sidebar-accent text-sidebar-accent-foreground`
    - Inactive: `text-sidebar-foreground/65 hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground`
  - Bottom Status card:
    - `border-t border-sidebar-border pt-4`
    - `bg-sidebar-accent/65 p-3.5 rounded-md`
    - Bot icon with `live-pulse` green dot, text "Bot WhatsApp", "Operativo", "Atención comercial automatizada activa 24/7".
- **Topbar**:
  - `sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md`
  - `flex min-h-16 items-center gap-3 px-4 sm:px-6 xl:px-8`
  - Tenant title: `<p className="truncate text-sm font-bold">Ceibo AI Tech Solutions</p>`
  - Enterprise pill: `<span className="hidden rounded bg-ceibo-soft px-2 py-1 text-[10px] font-bold text-ceibo sm:inline">ENTERPRISE</span>`
  - WhatsApp status: `<MessageCircleMore className="size-3.5 text-success" /> +54 9 11 5482-0916 · Conectado`
  - User profile: Name "Gonzalo Vicente", email "gonzalo@ceibo.ai", avatar square `grid size-9 place-items-center rounded-md bg-accent font-display text-xs font-bold text-accent-foreground` with initials "GV", and `ChevronDown`.

### 3.3 Reference Dashboard (`ceibo_ref/src/routes/index.tsx`)
- Container: `<main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 xl:px-8 xl:py-8">`
- Header:
  - Live indicator: `<span className="live-pulse size-2 rounded-full bg-success" /> En Vivo` + `Actualizado hace 2 min`
  - Title: `<h1 className="max-w-[22ch] font-display text-3xl font-bold leading-[1.08] sm:text-4xl">Dashboard de Rendimiento WhatsApp</h1>`
  - Subtitle: `Métricas comerciales en tiempo real para Ceibo AI Tech Solutions (ENTERPRISE)`
  - Action buttons:
    - `<Button><RefreshCw className="size-4" />Actualizar</Button>` (variant secondary)
    - `<Button><MessageCircleMore className="size-4" />Ver Chats</Button>` (variant secondary)
    - `<Button variant="primary"><Sparkles className="size-4" />Entrenar Asistente</Button>`
- **MetricBand**:
  - Connected strip: `<section aria-label="Métricas principales" className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-panel">`
  - Grid: `<div className="grid sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-border">`
  - Top indicator bar: `<div className="absolute inset-x-0 top-0 h-1 bg-..." />` (`bg-success`, `bg-foreground/20`, or `bg-ceibo`)
  - Typography: `font-display text-[38px] font-bold leading-none`
- **ActivityChart**:
  - Container: `<section className="mt-5 border border-border bg-card p-5 shadow-panel sm:p-6">`
  - Title: `Boxes` icon + `Evolución de consultas` + `Últimos 30 días · 12 Ago a 06 Sep`
  - Legend: `Resueltas por IA` (green square) + `Derivadas a humano` (ceibo square)
  - AreaChart:
    - Area 1 (`ai`): stroke `var(--success)`, strokeWidth 2.5, fill `url(#aiFill)`
    - Area 2 (`human`): stroke `var(--ceibo)`, strokeWidth 2.5, fill `url(#humanFill)`
    - CartesianGrid: `stroke="var(--grid-line)" vertical={false} strokeDasharray="3 5"`
- **Security Footer**:
  - `<footer className="mt-5 flex flex-col gap-3 border border-accent/20 bg-accent/5 p-4 sm:flex-row sm:items-center">`
  - Shield icon: `grid size-10 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground`
  - Text: `Seguridad multi-tenant activa` + `Todas las consultas y registros están aislados criptográficamente para la empresa [CEI-AR-7F42A9].`
  - Right badge: `<LockKeyhole className="size-4" /> Protección verificada` in `text-success`.

---

## 4. Gap Analysis: Current Next.js vs Target Reference UI

| Dimension | Current Next.js (`ceibo_ai`) | Target Reference (`ceibo_ref`) | Action Required |
|---|---|---|---|
| **App Layout** | Flex row with `bg-slate-50`, `w-64` (256px) sidebar, `max-w-7xl` content | Fixed 252px sidebar (`lg:pl-[252px]`), dark `bg-sidebar` theme, `max-w-[1500px]` | Rewrite `app-shell.tsx`, `sidebar.tsx`, `navbar.tsx` |
| **Sidebar Theme** | Light white background (`bg-white`), slate borders | Dark charcoal-teal background (`bg-sidebar`), light text, `bg-sidebar-accent` active | Adopt exact reference classes and structure |
| **Brand Mark** | Bot icon inside gradient circle | Orange square with bold letter "C" (`shadow-action`) | Consolidate into reusable `BrandMark` |
| **Nav Icons** | `LayoutDashboard`, `MessageSquare`, `FileText` | `Gauge`, `MessageCircleMore`, `BookOpen` | Swap to reference Lucide icons |
| **Topbar** | White header, slate icons, `Building2` icon | Dark border, connected WhatsApp phone with status dot, avatar initials box | Consolidate into reference `Topbar` |
| **Metric Cards** | 4 separate cards (`MetricsGrid` / `MetricCard`) | 1 continuous bordered band (`MetricBand`) with 4 divided columns and top accent line | Rewrite into contiguous `MetricBand` |
| **Chart Styling** | Emerald/Indigo with dark slate tooltip | Duotone green (`var(--success)`) & terracotta (`var(--ceibo)`) with `ActivityTooltip` | Reconfigure Recharts with reference gradients & classes |
| **Security Footer** | White card with `ArrowRight` link | Accent card with `ShieldCheck` & `LockKeyhole` "Protección verificada" | Update DOM & classes to match reference |
| **Design Tokens** | Emerald scale, Inter/Space Grotesk, standard slate vars | Oklch semantic vars, Manrope/Sora fonts, Ceibo terracotta & success green | Update `globals.css` and `tailwind.config.ts` |
| **Inner Pages** | Slate cards, gray buttons, standard shadcn styling | Unified design system (`shadow-panel`, `border-border`, `bg-card`, reference buttons) | Reskin `inbox`, `chats`, `documents`, `settings`, `login` |
| **Mock Data Wiring** | Full Supabase client & tenant client calls | Static hardcoded arrays in Vite demo | **Preserve all Next.js Supabase mock wiring** and map into reference UI |

---

## 5. Detailed Migration Path

### Step 1: Design Tokens, CSS Variables & Font Loading
1. **`src/app/globals.css`**:
   - Inject the full OKLCH color token definition into `:root` and `.dark` matching `ceibo_ref/src/styles.css`:
     - `--background`, `--foreground`, `--card`, `--card-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--muted-foreground`, `--accent`, `--border`, `--input`, `--ring`, `--success`, `--ceibo`, `--ceibo-soft`, `--grid-line`, `--sidebar`, `--sidebar-foreground`, `--sidebar-accent`, `--sidebar-border`, `--shadow-action`, `--shadow-panel`.
   - Add `@keyframes live-pulse` and `.live-pulse` utility class.
   - Update body styling:
     ```css
     body {
       @apply bg-background text-foreground font-sans antialiased;
     }
     ```
2. **`tailwind.config.ts`**:
   - Map all semantic colors to `oklch(var(--<name>) / <alpha-value>)` or `var(--<name>)`.
   - Configure `fontFamily.sans` to `['var(--font-sans)', 'Manrope', ...defaultTheme.fontFamily.sans]`.
   - Configure `fontFamily.display` to `['var(--font-display)', 'Sora', 'Space Grotesk', ...defaultTheme.fontFamily.sans]`.
   - Extend `boxShadow`: `action: 'var(--shadow-action)'`, `panel: 'var(--shadow-panel)'`.
   - Preserve `brand` and `neonCyan`/`deepBlue` keys to guarantee backwards compatibility.
3. **`src/app/layout.tsx`**:
   - Update font loading to use `Manrope` (`--font-sans`) and `Sora` (`--font-display`) via `next/font/google`.
   - Apply variables to `<html>` element.

### Step 2: UI Primitives Alignment
1. **`src/components/ui/button.tsx`**:
   - Support `variant="default"`, `variant="primary"`, `variant="outline"`, `variant="secondary"`, `variant="ghost"`.
   - `primary` and `default`: `border border-primary bg-primary text-primary-foreground shadow-action hover:bg-primary/90`.
   - `secondary` and `outline`: `border border-border bg-card text-foreground hover:border-primary/35 hover:bg-secondary`.
   - Default variant should be `secondary` or explicitly passed.
2. **`src/components/ui/badge.tsx`**:
   - Align badge styles to `rounded-md` (or `rounded-full` where specified) with reference color mappings (`bg-primary`, `bg-success/10 text-success`, `bg-ceibo-soft text-ceibo`).
3. **`src/components/ui/card.tsx`**:
   - Update base styling to `rounded-lg border border-border bg-card text-card-foreground shadow-panel`.

### Step 3: Rewrite App Shell, Sidebar, and Topbar
1. **`src/components/layout/sidebar.tsx`**:
   - Consolidate navigation items:
     - `Dashboard`: `href: '/'`, icon: `Gauge`
     - `Inbox`: `href: '/inbox'`, icon: `Inbox`, badge `count: '24'`
     - `Chats`: `href: '/chats'`, icon: `MessageCircleMore`
     - `Base de Conocimiento`: `href: '/documents'`, icon: `BookOpen`
     - `Configuración`: `href: '/settings'`, icon: `Settings`
   - Include `BrandMark` component:
     ```tsx
     export function BrandMark() {
       return (
         <div className="grid size-11 shrink-0 place-items-center rounded-md bg-primary font-display text-lg font-bold text-primary-foreground shadow-action">
           C
         </div>
       );
     }
     ```
   - Sidebar container: `<aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col bg-sidebar text-sidebar-foreground lg:flex">`.
   - Bottom card: Bot WhatsApp operational card with `Bot` icon, `live-pulse` green indicator, and description.
2. **`src/components/layout/navbar.tsx`** (or `topbar.tsx`):
   - Sticky header: `<header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">`.
   - Displays tenant name (`empresa?.name || 'Ceibo AI Tech Solutions'`), plan badge (`ENTERPRISE`), WhatsApp channel number (`+54 9 11 5482-0916`) with green connected indicator.
   - User profile info (`perfil?.full_name || 'Gonzalo Vicente'`, `user?.email || 'gonzalo@ceibo.ai'`), square avatar initials box (`GV`), and dropdown / sign out action.
3. **`src/components/layout/app-shell.tsx`**:
   - Outer shell: `<div id="dashboard" className="min-h-screen bg-background text-foreground">`.
   - Desktop sidebar + content container with `lg:pl-[252px]`.
   - Topbar inside main container.
   - Content wrapper: `<main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 xl:px-8 xl:py-8">{children}</main>`.
   - Mobile bottom bar with live bot indicator for screens `< lg`.
   - Responsive mobile menu drawer using `mobileMenuOpen` state.

### Step 4: 1:1 Rewrite of Dashboard (`src/app/page.tsx`)
1. **Mock Data Wiring Preservation**:
   - Maintain `useAuth()` to retrieve current `user`, `empresa`, `perfil`.
   - Keep `loadDashboardData` calling `createClient()` -> `createTenantScopedClient(supabase).getRecent30Days()`.
   - Keep `calculateSummaryMetrics(rows)` to calculate `totalConsultas`, `totalIA`, `totalHuman`, `horasAhorradas`, `tasaResolucionIA`.
2. **Exact DOM Structure**:
   - **Header section**:
     - Status pill: `<span className="live-pulse size-2 rounded-full bg-success" /> En Vivo` + `Actualizado hace 2 min`.
     - Heading: `<h1 className="max-w-[22ch] font-display text-3xl font-bold leading-[1.08] sm:text-4xl">Dashboard de Rendimiento WhatsApp</h1>`.
     - Subtitle: `Métricas comerciales en tiempo real para {tenantName} ({tenantPlan})`.
     - Action buttons:
       - `<Button onClick={loadDashboardData} disabled={loadingData}><RefreshCw className="size-4" />Actualizar</Button>`
       - `<Link href="/chats"><Button><MessageCircleMore className="size-4" />Ver Chats</Button></Link>`
       - `<Link href="/documents"><Button variant="primary"><Sparkles className="size-4" />Entrenar Asistente</Button></Link>`
   - **`MetricBand`**:
     - Continuous panel `<section aria-label="Métricas principales" className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-panel">`.
     - Grid `<div className="grid sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-border">`.
     - 4 articles with absolute top accent bar:
       1. Volumen de Consultas: value formatted with thousands separator, `+18.4% vs. mes anterior`, tone `success`.
       2. Horas Ahorradas: formatted hours, `12 min promedio ahorrado por chat`, FTE calculation, tone `neutral`.
       3. Tasa de Resolución IA: percentage, resueltas por IA, tone `success`.
       4. Derivadas a Humano: total human count, escaladas a cierre, tone `ceibo`.
   - **`ActivityChart`**:
     - Container `<section className="mt-5 border border-border bg-card p-5 shadow-panel sm:p-6">`.
     - Header with `Boxes` icon in `text-primary`, title `Evolución de consultas`, subtitle with date range.
     - Custom legend: `Resueltas por IA` (green square) & `Derivadas a humano` (ceibo orange square).
     - ResponsiveContainer `h-[310px] w-full`.
     - AreaChart with linear gradients (`#aiFill` stopColor `var(--success)`, `#humanFill` stopColor `var(--ceibo)`).
     - CartesianGrid `stroke="var(--grid-line)" vertical={false} strokeDasharray="3 5"`.
     - Custom `ActivityTooltip` matching reference card styling.
     - 2 Area curves: `dataKey="ai"` (stroke `var(--success)`) and `dataKey="human"` (stroke `var(--ceibo)`).
   - **Security Footer**:
     - `<footer className="mt-5 flex flex-col gap-3 border border-accent/20 bg-accent/5 p-4 sm:flex-row sm:items-center">`.
     - ShieldCheck icon in `bg-accent text-accent-foreground`.
     - Text: `Seguridad multi-tenant activa` for tenant `[{empresaIdSlug}]`.
     - LockKeyhole icon with `text-success` "Protección verificada".

### Step 5: Reskinning Inner Pages to Reference Design Language
1. **`src/app/inbox/page.tsx`**:
   - Header with `font-display text-3xl font-bold`.
   - Filter inputs styled with `border-border bg-card text-foreground focus:ring-ring`.
   - Tabs styled with reference active borders and colors.
   - Lead table styled with `border border-border bg-card shadow-panel rounded-lg`, `TableHeader` and `TableRow` using `border-b border-border hover:bg-muted/50`.
   - Badges mapped to `bg-success/10 text-success` (Atendido), `bg-destructive/10 text-destructive` (Pendiente), and `bg-ceibo/10 text-ceibo` (Sin categorizar).
   - Preserve `getLeads()`, `handleAssign()`, tab filtering, search filtering, and priority sorting.
2. **`src/app/chats/page.tsx`**:
   - Container styled with `border border-border bg-card shadow-panel rounded-lg`.
   - Left pane session list with `bg-muted/20 border-r border-border`, active lead highlighted with `bg-sidebar-accent/15 border-l-4 border-l-primary`.
   - Chat window: header with client name, status dot.
   - Message bubbles: user messages in `bg-card border border-border text-foreground`, bot/agent messages in `bg-primary text-primary-foreground`.
   - Preserve `getLeads()`, `getChatMessages()`, and optimistic message sending.
3. **`src/app/documents/page.tsx`**:
   - Header with `font-display`.
   - Drag & drop upload card with `border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30`.
   - Active documents table with `border border-border bg-card shadow-panel rounded-lg`.
   - Badges: `Listo` (`bg-success/10 text-success`), `Procesando` (`bg-accent/10 text-accent`).
   - Preserve file upload simulation, status updates, deletion, and template download alert.
4. **`src/app/settings/page.tsx`**:
   - Header with `font-display`.
   - Navigation tabs: active state with `bg-sidebar-accent text-sidebar-accent-foreground font-semibold`.
   - Form cards: `border border-border bg-card shadow-panel rounded-lg`.
   - Input controls: `border-border bg-card focus:ring-ring`.
   - Buttons: `variant="primary"` for save actions.
   - Preserve all 4 tabs (`general`, `bot`, `whatsapp`, `team`) and tenant profile editing.
5. **`src/app/login/page.tsx`**:
   - Background: `bg-background text-foreground`.
   - Header: `BrandMark` "C" box + `font-display text-3xl font-bold` "Ceibo AI".
   - Login card: `border border-border bg-card shadow-panel rounded-lg`.
   - Submit button: `Button variant="primary"` with `ArrowRight`.
   - Demo tenant quick switch buttons styled with reference borders and typography.
   - Preserve Supabase `signIn` handling and redirection.

---

## 6. Verification and Regression Guard Strategy

1. **Compilation & Typechecking**:
   - Execute: `npx tsc --noEmit`
   - Requirement: Zero errors.
2. **E2E & Multi-Tenant Regression Suites**:
   - Execute: `npm run test:e2e`
   - Validates all 89 tests across 6 suites:
     - Authentication & Multi-Tenancy (14 tests)
     - Dashboard KPI Metrics (13 tests)
     - 30-Day Chart Data Pipeline (15 tests)
     - Navigation & Shell Routes (14 tests)
     - Multi-Tenant Data Isolation (13 tests)
     - Adversarial Multi-Tenancy & Auth (20 tests)
3. **Design System & Visual Parity Verification**:
   - Verify presence of exact Tailwind tokens (`bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-accent`, `border-sidebar-border`, `bg-card`, `bg-primary`, `text-primary-foreground`, `shadow-action`, `shadow-panel`, `bg-ceibo`, `bg-success`).
   - Verify exact DOM structure of Dashboard (`MetricBand` with 4 divided columns, `ActivityChart` with Recharts duotone gradient areas, security footer).
   - Verify zero console errors and clean hydration in browser.
