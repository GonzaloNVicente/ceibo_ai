# Specification Report: Dashboard 1:1 Visual Clone Parity

**Project**: Ceibo AI (`ceibo_ai`)  
**Reference Source**: `ceibo_ref/src/routes/index.tsx` & `ceibo_ref/src/styles.css`  
**Target Target File**: `ceibo_ai/src/app/page.tsx` (and related dashboard components)  
**Date**: 2026-09-14  
**Author**: teamwork_preview_spec_miner (`spec_miner_dashboard_1`)  

---

## 1. Executive Summary

This specification report details the complete, exhaustive blueprint for rewriting `ceibo_ai/src/app/page.tsx` into a **1:1 visual clone** of the authoritative reference implementation found in `ceibo_ref/src/routes/index.tsx`.

The target Next.js dashboard already operates within an `AppShell` (`src/components/layout/app-shell.tsx`) that provides the fixed 252px desktop sidebar, sticky topbar, and outer container layout. Therefore, the dashboard page content inside `<main>` consists of four core visual blocks:
1. **Page Header & Live Pulse Status Pill**: Title with Sora 38px typography, animated status pill ("En Vivo" with 1.8s `live-pulse` dot), relative update time, and 3 action buttons ("Actualizar", "Ver Chats", "Entrenar Asistente" with `shadow-action`).
2. **MetricBand Unified 4-KPI Card**: A single contiguous card (`rounded-lg border border-border bg-card shadow-panel`) split by responsive dividing borders (`xl:divide-x xl:divide-border`), topped by colored status accent strips (`h-1` `bg-success`, `bg-foreground/20`, `bg-ceibo`), 38px numbers, detail indicators, and subtitle notes.
3. **ActivityChart (Recharts AreaChart)**: Contiguous card (`border border-border bg-card p-5 shadow-panel sm:p-6`) with `Boxes` icon, Sora heading, dual colored legend indicators, and a fixed 310px height `ResponsiveContainer` rendering dual linear gradients (`#aiFill` forest green `var(--success)` and `#humanFill` terracotta `var(--ceibo)`), dashed cartesian grid lines, and custom hover tooltip (`ActivityTooltip`).
4. **Multi-Tenant Security Footer**: Subtle accent banner (`border border-accent/20 bg-accent/5 p-4`) containing a rounded square `ShieldCheck` icon badge, tenant cryptographic isolation notice with bold tenant code badge `[CEI-AR-7F42A9]`, and desktop verified protection pill with `LockKeyhole`.

This report specifies the exact DOM elements, class names, design tokens, Lucide icons, Recharts parameters, and the precise mathematical wiring required to connect `useAuth` and `createTenantScopedClient` from Supabase without breaking any existing E2E tests.

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Header | Live Status Pill | Pill badge displaying "En Vivo" with pulsing dot and relative timestamp | Pulsing state, time string | `inline-flex h-7 items-center gap-2 rounded-full border border-success/25 bg-success/10 px-2.5 text-xs font-bold text-success` | Falls back to static pill if CSS animation unsupported | `ceibo_ref/src/routes/index.tsx:276-281` |
| 2 | Header | Dashboard Title & Description | Primary page heading in Sora display font with tenant context | `tenantName`, `tenantPlan` | `h1` (`font-display text-3xl font-bold sm:text-4xl max-w-[22ch]`) + `p` (`text-sm leading-6 text-muted-foreground`) | Uses fallback tenant 'Ceibo AI Tech Solutions' | `ceibo_ref/src/routes/index.tsx:282-284` |
| 3 | Header | Action Button Group | Three action buttons: Actualizar (secondary), Ver Chats (secondary), Entrenar Asistente (primary with shadow-action) | Click handlers, loading state | 3 interactive `<Button>` elements with icons | Disabled button state during fetch | `ceibo_ref/src/routes/index.tsx:285-290` |
| 4 | KPI Band | Unified 4-Metric Grid | Single card with 4 columns divided by `xl:divide-x xl:divide-border`, responsive wrap on `sm:grid-cols-2` | 4 metric objects `{ label, value, detail, note, tone }` | Contiguous section with internal borders and top accent strips | Displays 0 / empty values safely | `ceibo_ref/src/routes/index.tsx:190-209` |
| 5 | KPI Band | Top Accent Indicator Strip | 4px high horizontal bar atop each KPI cell indicating category tone | `tone`: `'success'`, `'ceibo'`, `'neutral'` | Absolute positioned `div` (`h-1 bg-success / bg-ceibo / bg-foreground/20`) | Defaults to `bg-foreground/20` | `ceibo_ref/src/routes/index.tsx:199` |
| 6 | KPI Band | Sora 38px Metric Values | Huge numerical value rendered in font-display Sora with optional tone color | Numerical strings (e.g. "3.588", "588.6 h", "82%", "645") | `p.font-display.text-[38px].font-bold.leading-none` | Zero format string | `ceibo_ref/src/routes/index.tsx:201` |
| 7 | Chart | Activity AreaChart Card | 310px high comparative chart displaying 30-day AI-resolved vs human-escalated consultations | `activity` array `[{ date, ai, human }]` | Recharts `ResponsiveContainer` + `AreaChart` with dual monotone areas | Empty data state / fallback | `ceibo_ref/src/routes/index.tsx:225-265` |
| 8 | Chart | Dual Linear Gradients | SVG gradient definitions for AI (#aiFill) and Human (#humanFill) fills with opacity transition (0.28/0.2 to 0.02/0.01) | `--success` & `--ceibo` CSS variables | SVG `<defs>` linear gradients | Gracefully defaults to solid stroke | `ceibo_ref/src/routes/index.tsx:244-253` |
| 9 | Chart | ActivityTooltip | Custom hover tooltip displaying date label and quantitative breakdown per series | Recharts `payload`, `label`, `active` | Card styled container with exact quantities and series labels | Returns `null` when inactive | `ceibo_ref/src/routes/index.tsx:211-223` |
| 10 | Security | Multi-Tenant Active Banner | Security notice card reassuring SMB users of cryptographic tenant isolation | Tenant code / identifier | `footer` with `ShieldCheck` square badge, text, and `LockKeyhole` pill | Fallback tenant identifier | `ceibo_ref/src/routes/index.tsx:295-306` |
| 11 | Security | Verified Protection Pill | Desktop pill badge signaling verified cryptographic security | None (static status) | `div` with `LockKeyhole` icon and "Protección verificada" in `text-success` | Hidden on mobile (`hidden md:flex`) | `ceibo_ref/src/routes/index.tsx:303-305` |
| 12 | Layout | Mobile Bottom Status Bar | Mobile-only bottom status bar rendered on small viewports | None | `div.lg:hidden` with WhatsApp bot pulse and `CircleUserRound` | Provided by `AppShell` | `ceibo_ref/src/routes/index.tsx:308-312` |

---

## 3. Edge Cases

| # | Feature | Input | Observed / Required Behavior |
|---|---------|-------|------------------------------|
| 1 | MetricBand | Empty dataset (`rows = []`) | Returns `{ totalConsultas: 0, totalIA: 0, totalHuman: 0, horasAhorradas: 0, tasaResolucionIA: 0 }`. Card displays "0", "0.0 h", "0%", "0" without `NaN` or divide-by-zero crashes. |
| 2 | MetricBand | 100% AI resolution (`totalHuman = 0`) | Tasa de resolución displays "100%", Derivadas a humano displays "0", detail displays "0% escaladas a cierre". |
| 3 | MetricBand | 100% Human escalation (`totalIA = 0`) | Tasa de resolución displays "0%", Horas ahorradas displays "0.0 h", FTE displays "~0.0". |
| 4 | ActivityChart | SSR Hydration in Next.js | Recharts throws hydration errors if dimensions are measured before DOM mount. Must wrap in client check (`mounted` state or dynamic client component). |
| 5 | ActivityChart | Single data point (`rows.length = 1`) | Recharts AreaChart renders single node without line breakdown; custom tooltip handles single point without error. |
| 6 | ActivityChart | Date label formatting on month boundaries | First date and last date include month (e.g. "12 Ago", "06 Sep"), while intermediate days render only day number ("13", "14") matching reference format. |
| 7 | Action Buttons | Rapid re-clicking "Actualizar" | Button enters disabled state with animated spinner (`animate-spin` on `RefreshCw`) preventing duplicate in-flight API requests. |
| 8 | Security Footer | Tenant without explicit slug | Fallback tenant identifier format: `[CEI-AR-7F42A9]` ensures no undefined bracket strings. |

---

## 4. Exact DOM Structure & Element Hierarchy

The complete DOM hierarchy of the reference dashboard page (the content inside `<main>` of `AppShell`) is structured as follows:

```text
main.mx-auto.max-w-[1500px].px-4.py-6.sm:px-6.xl:px-8.xl:py-8
│
├── div.flex.flex-col.gap-5.xl:flex-row.xl:items-end.xl:justify-between (PAGE HEADER)
│   ├── div (Title & Status Subgroup)
│   │   ├── div.mb-3.flex.items-center.gap-2 (Status Pill Row)
│   │   │   ├── span.inline-flex.h-7.items-center.gap-2.rounded-full.border.border-success/25.bg-success/10.px-2.5.text-xs.font-bold.text-success
│   │   │   │   ├── span.live-pulse.size-2.rounded-full.bg-success (Pulsing Green Dot)
│   │   │   │   └── text: "En Vivo"
│   │   │   └── span.text-xs.text-muted-foreground
│   │   │       └── text: "Actualizado hace 2 min" (or dynamic relative time)
│   │   ├── h1.max-w-[22ch].font-display.text-3xl.font-bold.leading-[1.08].sm:text-4xl
│   │   │   └── text: "Dashboard de Rendimiento WhatsApp"
│   │   └── p.mt-3.max-w-3xl.text-sm.leading-6.text-muted-foreground
│   │       └── text: "Métricas comerciales en tiempo real para {tenantName} ({tenantPlan})"
│   │
│   └── div.flex.flex-wrap.gap-2 (Action Buttons Subgroup)
│       ├── button.inline-flex.items-center.justify-center.gap-2.rounded-md.text-sm.font-semibold.border.border-border.bg-card.text-foreground.shadow-none.hover:border-primary/35.hover:bg-secondary.h-10.px-3.5
│       │   ├── svg.size-4 (RefreshCw icon)
│       │   └── text: "Actualizar"
│       ├── a (Link to /chats)
│       │   └── button.inline-flex.items-center.justify-center.gap-2.rounded-md.text-sm.font-semibold.border.border-border.bg-card.text-foreground.hover:border-primary/35.hover:bg-secondary.h-10.px-3.5
│       │       ├── svg.size-4 (MessageCircleMore icon)
│       │       └── text: "Ver Chats"
│       └── a (Link to /documents)
│           └── button.inline-flex.items-center.justify-center.gap-2.rounded-md.text-sm.font-semibold.border.border-primary.bg-primary.text-primary-foreground.shadow-action.hover:bg-primary/90.h-10.px-3.5
│               ├── svg.size-4 (Sparkles icon)
│               └── text: "Entrenar Asistente"
│
├── section[aria-label="Métricas principales"].mt-6.overflow-hidden.rounded-lg.border.border-border.bg-card.shadow-panel (METRIC BAND)
│   └── div.grid.sm:grid-cols-2.xl:grid-cols-4.xl:divide-x.xl:divide-border
│       │
│       ├── article.relative.min-h-48.p-5.border-b.border-border.xl:border-b-0.sm:border-r.sm:border-border.xl:border-r-0 (Card 1: Volumen)
│       │   ├── div.absolute.inset-x-0.top-0.h-1.bg-success (Green Accent Strip)
│       │   ├── p.text-sm.font-bold.text-muted-foreground: "Volumen de Consultas"
│       │   ├── p.mt-3.font-display.text-[38px].font-bold.leading-none.text-foreground: "3.588"
│       │   ├── p.mt-3.text-xs.font-bold.text-success: "+18.4% vs. mes anterior"
│       │   └── p.mt-2.max-w-[27ch].text-[11px].leading-4.text-muted-foreground: "Últimos 30 días de actividad WhatsApp"
│       │
│       ├── article.relative.min-h-48.p-5.border-b.border-border.xl:border-b-0 (Card 2: Horas Ahorradas)
│       │   ├── div.absolute.inset-x-0.top-0.h-1.bg-foreground/20 (Slate Accent Strip)
│       │   ├── p.text-sm.font-bold.text-muted-foreground: "Horas Ahorradas"
│       │   ├── p.mt-3.font-display.text-[38px].font-bold.leading-none.text-foreground: "588.6 h"
│       │   ├── p.mt-3.text-xs.font-bold.text-foreground/70: "12 min promedio ahorrado por chat"
│       │   └── p.mt-2.max-w-[27ch].text-[11px].leading-4.text-muted-foreground: "Equivale a ~3.7 asesores FTE de ventas liberados"
│       │
│       ├── article.relative.min-h-48.p-5.sm:border-r.sm:border-border.xl:border-r-0 (Card 3: Tasa Resolución)
│       │   ├── div.absolute.inset-x-0.top-0.h-1.bg-success (Green Accent Strip)
│       │   ├── p.text-sm.font-bold.text-muted-foreground: "Tasa de Resolución IA"
│       │   ├── p.mt-3.font-display.text-[38px].font-bold.leading-none.text-foreground: "82%"
│       │   ├── p.mt-3.text-xs.font-bold.text-success: "2.943 resueltas por IA"
│       │   └── p.mt-2.max-w-[27ch].text-[11px].leading-4.text-muted-foreground: "Sin intervención de asesor humano"
│       │
│       └── article.relative.min-h-48.p-5 (Card 4: Derivadas Humano)
│           ├── div.absolute.inset-x-0.top-0.h-1.bg-ceibo (Terracotta Accent Strip)
│           ├── p.text-sm.font-bold.text-muted-foreground: "Derivadas a Humano"
│           ├── p.mt-3.font-display.text-[38px].font-bold.leading-none.text-ceibo: "645"
│           ├── p.mt-3.text-xs.font-bold.text-ceibo: "18% escaladas a cierre"
│           └── p.mt-2.max-w-[27ch].text-[11px].leading-4.text-muted-foreground: "Leads calificados para asesor comercial"
│
├── section.mt-5.border.border-border.bg-card.p-5.shadow-panel.sm:p-6 (ACTIVITY CHART)
│   ├── div.flex.flex-col.gap-4.sm:flex-row.sm:items-start.sm:justify-between (Chart Header & Legend)
│   │   ├── div (Title group)
│   │   │   ├── div.flex.items-center.gap-2
│   │   │   │   ├── svg.size-5.text-primary[strokeWidth=1.8] (Boxes icon)
│   │   │   │   └── h2.font-display.text-lg.font-bold: "Evolución de consultas"
│   │   │   └── p.mt-1.text-xs.text-muted-foreground: "Últimos 30 días · 12 Ago a 06 Sep"
│   │   └── div.flex.flex-wrap.gap-x-4.gap-y-2.text-xs.font-semibold.text-muted-foreground (Legend)
│   │       ├── span.flex.items-center.gap-2
│   │       │   ├── span.size-2.5.rounded-sm.bg-success
│   │       │   └── text: "Resueltas por IA"
│   │       └── span.flex.items-center.gap-2
│   │           ├── span.size-2.5.rounded-sm.bg-ceibo
│   │           └── text: "Derivadas a humano"
│   └── div.mt-5.h-[310px].w-full (Chart Canvas Wrapper)
│       └── ResponsiveContainer (Recharts AreaChart)
│
└── footer.mt-5.flex.flex-col.gap-3.border.border-accent/20.bg-accent/5.p-4.sm:flex-row.sm:items-center (SECURITY FOOTER)
    ├── div.grid.size-10.shrink-0.place-items-center.rounded-md.bg-accent.text-accent-foreground
    │   └── svg.size-5[strokeWidth=1.8] (ShieldCheck icon)
    ├── div.min-w-0
    │   ├── p.text-sm.font-bold: "Seguridad multi-tenant activa"
    │   └── p.mt-0.5.text-xs.leading-5.text-muted-foreground
    │       ├── text: "Todas las consultas y registros están aislados criptográficamente para la empresa "
    │       └── span.font-bold.text-foreground: "[CEI-AR-7F42A9]"
    └── div.ml-auto.hidden.items-center.gap-2.text-xs.font-semibold.text-success.md:flex
        ├── svg.size-4 (LockKeyhole icon)
        └── text: "Protección verificada"
```

---

## 5. Exhaustive Section-by-Section Breakdown

### Section 1: Dashboard Header, Live Status Pill & Action Buttons

#### Reference HTML / JSX:
```tsx
<div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
  <div>
    <div className="mb-3 flex items-center gap-2">
      <span className="inline-flex h-7 items-center gap-2 rounded-full border border-success/25 bg-success/10 px-2.5 text-xs font-bold text-success">
        <span className="live-pulse size-2 rounded-full bg-success" /> En Vivo
      </span>
      <span className="text-xs text-muted-foreground">Actualizado hace 2 min</span>
    </div>
    <h1 className="max-w-[22ch] font-display text-3xl font-bold leading-[1.08] sm:text-4xl">
      Dashboard de Rendimiento WhatsApp
    </h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
      Métricas comerciales en tiempo real para {tenantName} ({tenantPlan})
    </p>
  </div>
  <div className="flex flex-wrap gap-2">
    <Button aria-label="Actualizar métricas" onClick={loadDashboardData} disabled={loadingData}>
      <RefreshCw className={`size-4 ${loadingData ? "animate-spin" : ""}`} />
      Actualizar
    </Button>
    <Link href="/chats">
      <Button>
        <MessageCircleMore className="size-4" />
        Ver Chats
      </Button>
    </Link>
    <Link href="/documents">
      <Button variant="primary">
        <Sparkles className="size-4" />
        Entrenar Asistente
      </Button>
    </Link>
  </div>
</div>
```

#### Tailwind Classes & Styles:
- **Outer Header Wrapper**: `flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between`
- **Status Sub-row**: `mb-3 flex items-center gap-2`
- **Live Pill**:
  - Border: `border border-success/25`
  - Background: `bg-success/10`
  - Text: `text-xs font-bold text-success`
  - Dimensions & Shape: `inline-flex h-7 items-center gap-2 rounded-full px-2.5`
- **Pulsing Dot**:
  - Size: `size-2` (8px by 8px)
  - Shape: `rounded-full`
  - Background: `bg-success`
  - Animation: `live-pulse` (keyframes `0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.42; transform: scale(0.82); }`)
- **Relative Timestamp**: `text-xs text-muted-foreground`
- **Title (H1)**:
  - Font: `font-display` (Sora, sans-serif)
  - Size: `text-3xl sm:text-4xl`
  - Weight & Line-height: `font-bold leading-[1.08]`
  - Maximum width: `max-w-[22ch]` (keeps title neatly wrapped across 2 lines)
- **Subtitle Paragraph**: `mt-3 max-w-3xl text-sm leading-6 text-muted-foreground`
- **Button Group Wrapper**: `flex flex-wrap gap-2`
- **Buttons**:
  - Base button: `h-10 px-3.5 rounded-md text-sm font-semibold`
  - Default/Secondary button: `border border-border bg-card text-foreground hover:border-primary/35 hover:bg-secondary`
  - Primary button: `border border-primary bg-primary text-primary-foreground shadow-action hover:bg-primary/90`
  - Icons inside buttons: `size-4` (16px)

---

### Section 2: MetricBand Unified 4-KPI Card

#### Reference HTML / JSX:
```tsx
<section aria-label="Métricas principales" className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-panel">
  <div className="grid sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-border">
    {/* Card 1: Volumen de Consultas */}
    <article className="relative min-h-48 p-5 border-b border-border xl:border-b-0 sm:border-r sm:border-border xl:border-r-0">
      <div className="absolute inset-x-0 top-0 h-1 bg-success" />
      <p className="text-sm font-bold text-muted-foreground">Volumen de Consultas</p>
      <p className="mt-3 font-display text-[38px] font-bold leading-none text-foreground">
        {totalConsultas.toLocaleString()}
      </p>
      <p className="mt-3 text-xs font-bold text-success">+18.4% vs. mes anterior</p>
      <p className="mt-2 max-w-[27ch] text-[11px] leading-4 text-muted-foreground">
        Últimos 30 días de actividad WhatsApp
      </p>
    </article>

    {/* Card 2: Horas Ahorradas */}
    <article className="relative min-h-48 p-5 border-b border-border xl:border-b-0">
      <div className="absolute inset-x-0 top-0 h-1 bg-foreground/20" />
      <p className="text-sm font-bold text-muted-foreground">Horas Ahorradas</p>
      <p className="mt-3 font-display text-[38px] font-bold leading-none text-foreground">
        {horasAhorradas.toFixed(1)} h
      </p>
      <p className="mt-3 text-xs font-bold text-foreground/70">
        12 min promedio ahorrado por chat
      </p>
      <p className="mt-2 max-w-[27ch] text-[11px] leading-4 text-muted-foreground">
        Equivale a ~{repEquivalent} asesores FTE de ventas liberados
      </p>
    </article>

    {/* Card 3: Tasa de Resolución IA */}
    <article className="relative min-h-48 p-5 sm:border-r sm:border-border xl:border-r-0">
      <div className="absolute inset-x-0 top-0 h-1 bg-success" />
      <p className="text-sm font-bold text-muted-foreground">Tasa de Resolución IA</p>
      <p className="mt-3 font-display text-[38px] font-bold leading-none text-foreground">
        {tasaResolucionIA}%
      </p>
      <p className="mt-3 text-xs font-bold text-success">
        {totalIA.toLocaleString()} resueltas por IA
      </p>
      <p className="mt-2 max-w-[27ch] text-[11px] leading-4 text-muted-foreground">
        Sin intervención de asesor humano
      </p>
    </article>

    {/* Card 4: Derivadas a Humano */}
    <article className="relative min-h-48 p-5">
      <div className="absolute inset-x-0 top-0 h-1 bg-ceibo" />
      <p className="text-sm font-bold text-muted-foreground">Derivadas a Humano</p>
      <p className="mt-3 font-display text-[38px] font-bold leading-none text-ceibo">
        {totalHuman.toLocaleString()}
      </p>
      <p className="mt-3 text-xs font-bold text-ceibo">
        {humanPercentage}% escaladas a cierre
      </p>
      <p className="mt-2 max-w-[27ch] text-[11px] leading-4 text-muted-foreground">
        Leads calificados para asesor comercial
      </p>
    </article>
  </div>
</section>
```

#### Tailwind Classes & Styles:
- **Card Container**: `mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-panel`
- **Internal Grid**: `grid sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-border`
- **Article Cell Base**: `relative min-h-48 p-5`
- **Responsive Dividers**:
  - Cells 0 and 1: `border-b border-border xl:border-b-0`
  - Cells 0 and 2: `sm:border-r sm:border-border xl:border-r-0`
- **Top Accent Strip**: `absolute inset-x-0 top-0 h-1` + color (`bg-success`, `bg-foreground/20`, or `bg-ceibo`)
- **Metric Label**: `text-sm font-bold text-muted-foreground`
- **Metric Number**: `mt-3 font-display text-[38px] font-bold leading-none` + (`text-foreground` or `text-ceibo` for human escalation)
- **Detail Line**: `mt-3 text-xs font-bold` + (`text-success`, `text-ceibo`, or `text-foreground/70`)
- **Note Paragraph**: `mt-2 max-w-[27ch] text-[11px] leading-4 text-muted-foreground`

---

### Section 3: ActivityChart (Recharts AreaChart)

#### Reference HTML / JSX:
```tsx
<section className="mt-5 border border-border bg-card p-5 shadow-panel sm:p-6">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <div className="flex items-center gap-2">
        <Boxes className="size-5 text-primary" strokeWidth={1.8} />
        <h2 className="font-display text-lg font-bold">Evolución de consultas</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Últimos 30 días · {dateRangeStr}</p>
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-muted-foreground">
      <span className="flex items-center gap-2">
        <span className="size-2.5 rounded-sm bg-success" />Resueltas por IA
      </span>
      <span className="flex items-center gap-2">
        <span className="size-2.5 rounded-sm bg-ceibo" />Derivadas a humano
      </span>
    </div>
  </div>
  <div className="mt-5 h-[310px] w-full" aria-label="Gráfico de consultas resueltas por IA y derivadas a humano">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="aiFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--success)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--success)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="humanFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ceibo)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--ceibo)" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--grid-line)" vertical={false} strokeDasharray="3 5" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          interval={4}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
        />
        <Tooltip content={<ActivityTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
        <Area
          isAnimationActive={false}
          type="monotone"
          dataKey="ai"
          name="resueltas por IA"
          stroke="var(--success)"
          strokeWidth={2.5}
          fill="url(#aiFill)"
          activeDot={{ r: 4, fill: "var(--success)", stroke: "var(--card)", strokeWidth: 2 }}
        />
        <Area
          isAnimationActive={false}
          type="monotone"
          dataKey="human"
          name="derivadas a humano"
          stroke="var(--ceibo)"
          strokeWidth={2.5}
          fill="url(#humanFill)"
          activeDot={{ r: 4, fill: "var(--ceibo)", stroke: "var(--card)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
</section>
```

#### Custom Tooltip:
```tsx
function ActivityTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 shadow-panel">
      <p className="mb-1.5 text-xs font-bold">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="text-[11px] text-muted-foreground">
          <span className="font-bold text-foreground">{item.value}</span> {item.name}
        </p>
      ))}
    </div>
  );
}
```

#### Tailwind Classes & Styles:
- **Card Container**: `mt-5 border border-border bg-card p-5 shadow-panel sm:p-6`
- **Header Flex Row**: `flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between`
- **Title Subgroup**:
  - Icon: `<Boxes className="size-5 text-primary" strokeWidth={1.8} />`
  - Title: `<h2 className="font-display text-lg font-bold">Evolución de consultas</h2>`
  - Subtitle: `<p className="mt-1 text-xs text-muted-foreground">Últimos 30 días · {startDate} a {endDate}</p>`
- **Legend Group**: `flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-muted-foreground`
  - Legend square markers: `size-2.5 rounded-sm bg-success` and `size-2.5 rounded-sm bg-ceibo`
- **Chart Canvas Wrapper**: `mt-5 h-[310px] w-full` (with `aria-label="Gráfico de consultas resueltas por IA y derivadas a humano"`)

---

### Section 4: Multi-Tenant Security Footer

#### Reference HTML / JSX:
```tsx
<footer className="mt-5 flex flex-col gap-3 border border-accent/20 bg-accent/5 p-4 sm:flex-row sm:items-center">
  <div className="grid size-10 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
    <ShieldCheck className="size-5" strokeWidth={1.8} />
  </div>
  <div className="min-w-0">
    <p className="text-sm font-bold">Seguridad multi-tenant activa</p>
    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
      Todas las consultas y registros están aislados criptográficamente para la empresa{" "}
      <span className="font-bold text-foreground">[{tenantCode}]</span>.
    </p>
  </div>
  <div className="ml-auto hidden items-center gap-2 text-xs font-semibold text-success md:flex">
    <LockKeyhole className="size-4" /> Protección verificada
  </div>
</footer>
```

#### Tailwind Classes & Styles:
- **Footer Container**: `mt-5 flex flex-col gap-3 border border-accent/20 bg-accent/5 p-4 sm:flex-row sm:items-center`
- **Icon Square Tile**: `grid size-10 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground`
- **Icon**: `ShieldCheck` with `size-5` (20px) and `strokeWidth={1.8}`
- **Title**: `text-sm font-bold`
- **Description**: `mt-0.5 text-xs leading-5 text-muted-foreground`
- **Tenant Code Highlight**: `font-bold text-foreground` (e.g. `[CEI-AR-7F42A9]`)
- **Right Verification Pill**:
  - Visibility: `ml-auto hidden items-center gap-2 text-xs font-semibold text-success md:flex`
  - Icon: `LockKeyhole` with `size-4` (16px)

---

## 6. Complete Styling & Design Tokens Specification

### Colors (OKLCH via CSS Variables):
- `--background`: `oklch(0.976 0.006 145.1)` (light canvas #f5f8f5)
- `--foreground`: `oklch(0.244 0.028 169.1)` (dark forest slate #12251e)
- `--card`: `oklch(1 0 0)` (#ffffff)
- `--border`: `oklch(0.87 0.009 147.4)` (pale sage border)
- `--primary` / `--ceibo`: `oklch(0.555 0.163 33.5)` (warm terracotta #bf442b)
- `--success`: `oklch(0.49 0.103 162.1)` (deep emerald forest #0e724e)
- `--accent`: `oklch(0.368 0.041 166.1)` (forest green #1b3a2f)
- `--grid-line`: `oklch(0.87 0.009 147.4 / 62%)`

### Typography:
- `font-sans`: Manrope (`var(--font-sans)`)
- `font-display`: Sora (`var(--font-display)`)
- `font-feature-settings: "tnum" 1, "ss01" 1;` (tabular numbers on all numerical outputs)

### Shadows & Radii:
- `shadow-action`: `0 4px 0 oklch(0.41 0.117 33.5)` (tactile 3D bottom bevel on primary buttons & brand mark)
- `shadow-panel`: `0 16px 44px -34px oklch(0.244 0.028 169.1 / 42%)` (soft floating card elevation)
- `rounded-lg`: 8px (`0.5rem`)
- `rounded-md`: 6px (`calc(var(--radius) - 2px)`)
- `rounded-sm`: 4px (`calc(var(--radius) - 4px)`)

### Keyframe Animations:
- `live-pulse`: 1.8s `ease-in-out` infinite loop pulsing opacity and scale on status indicators.

---

## 7. Lucide Icons Catalog

| Icon Name | Import Source | Size Class / Pixels | Stroke Width | Color / Tailwind Classes | Location in Dashboard |
|---|---|---|---|---|---|
| `RefreshCw` | `lucide-react` | `size-4` (16px) | Default (2.0) | In Button: `size-4`, animated with `animate-spin` when loading | Header Action Button 1 ("Actualizar") |
| `MessageCircleMore` | `lucide-react` | `size-4` (16px) | Default (2.0) | In Button: `size-4 text-foreground` | Header Action Button 2 ("Ver Chats") |
| `Sparkles` | `lucide-react` | `size-4` (16px) | Default (2.0) | In Primary Button: `size-4 text-primary-foreground` | Header Action Button 3 ("Entrenar Asistente") |
| `Boxes` | `lucide-react` | `size-5` (20px) | `1.8` | `size-5 text-primary` | Activity Chart Header Title |
| `ShieldCheck` | `lucide-react` | `size-5` (20px) | `1.8` | `size-5 text-accent-foreground` | Security Footer Icon Tile |
| `LockKeyhole` | `lucide-react` | `size-4` (16px) | Default (2.0) | `size-4 text-success` | Security Footer Right Protection Pill |
| `CircleUserRound` | `lucide-react` | `size-4` (16px) | Default (2.0) | `size-4 text-muted-foreground` | Mobile Bottom Bar (in AppShell) |

---

## 8. Recharts Configuration Specification

### ResponsiveContainer
- Width: `100%`
- Height: `100%`
- Wrapper height: `h-[310px]`

### AreaChart
- `data`: `ChartDataPoint[]` mapped from Supabase 30-day rows.
- `margin`: `{ top: 10, right: 8, left: -20, bottom: 0 }`

### SVG Defs (Gradients)
1. **AI Gradient** (`id="aiFill"`):
   - Vector: `x1="0" y1="0" x2="0" y2="1"`
   - Stop 1: `offset="0%" stopColor="var(--success)" stopOpacity={0.28}`
   - Stop 2: `offset="100%" stopColor="var(--success)" stopOpacity={0.02}`
2. **Human Gradient** (`id="humanFill"`):
   - Vector: `x1="0" y1="0" x2="0" y2="1"`
   - Stop 1: `offset="0%" stopColor="var(--ceibo)" stopOpacity={0.2}`
   - Stop 2: `offset="100%" stopColor="var(--ceibo)" stopOpacity={0.01}`

### CartesianGrid
- `stroke`: `"var(--grid-line)"`
- `vertical`: `false`
- `strokeDasharray`: `"3 5"`

### XAxis
- `dataKey`: `"date"`
- `axisLine`: `false`
- `tickLine`: `false`
- `tick`: `{ fill: "var(--muted-foreground)", fontSize: 10 }`
- `interval`: `4`
- `dy`: `8`

### YAxis
- `axisLine`: `false`
- `tickLine`: `false`
- `tick`: `{ fill: "var(--muted-foreground)", fontSize: 10 }`

### Tooltip
- `content`: `<ActivityTooltip />`
- `cursor`: `{ stroke: "var(--border)", strokeWidth: 1 }`

### Areas
1. **AI Area**:
   - `isAnimationActive`: `false`
   - `type`: `"monotone"`
   - `dataKey`: `"ai"`
   - `name`: `"resueltas por IA"`
   - `stroke`: `"var(--success)"`
   - `strokeWidth`: `2.5`
   - `fill`: `"url(#aiFill)"`
   - `activeDot`: `{ r: 4, fill: "var(--success)", stroke: "var(--card)", strokeWidth: 2 }`
2. **Human Area**:
   - `isAnimationActive`: `false`
   - `type`: `"monotone"`
   - `dataKey`: `"human"`
   - `name`: `"derivadas a humano"`
   - `stroke`: `"var(--ceibo)"`
   - `strokeWidth`: `2.5`
   - `fill`: `"url(#humanFill)"`
   - `activeDot`: `{ r: 4, fill: "var(--ceibo)", stroke: "var(--card)", strokeWidth: 2 }`

---

## 9. Supabase Mock-Data Integration Blueprint

### Data Flow Architecture
The target file `src/app/page.tsx` must keep its connection to Supabase Auth and the tenant-scoped mock analytics client:

```tsx
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { createTenantScopedClient } from '@/lib/supabase/tenant-client';
import { ChatAnalytics, SummaryMetrics } from '@/lib/supabase/types';
import { calculateSummaryMetrics } from '@/lib/supabase/mock-data';
```

### State Management
```tsx
const { user, empresa, perfil, loading: authLoading } = useAuth();
const [analytics, setAnalytics] = useState<ChatAnalytics[]>([]);
const [metrics, setMetrics] = useState<SummaryMetrics>({
  totalConsultas: 0,
  totalIA: 0,
  totalHuman: 0,
  horasAhorradas: 0,
  tasaResolucionIA: 0,
});
const [loadingData, setLoadingData] = useState(true);
const [lastUpdated, setLastUpdated] = useState<string>('hace 2 min');
const [mounted, setMounted] = useState(false);
```

### Data Transformations for Recharts
Map `analytics` rows to the chart items expected by the reference AreaChart:
```tsx
const chartData = useMemo(() => {
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return analytics.map((row, index) => {
    const cleanDate = (row.date || '').split('T')[0];
    const parts = cleanDate.split('-');
    const day = (parts[2] || '01').padStart(2, '0');
    const monthIdx = parseInt(parts[1] || '1', 10) - 1;
    const month = monthNames[monthIdx] || '';
    
    // Label format matching reference: boundaries display "12 Ago", interior points display "13", "14"
    const isBoundary = index === 0 || index === analytics.length - 1 || day === '01';
    const displayDate = isBoundary ? `${day} ${month}` : `${parseInt(day, 10)}`;

    return {
      date: displayDate,
      fullDate: row.date,
      ai: row.resueltas_ia,
      human: row.derivadas_humano,
      total: row.total_consultas,
    };
  });
}, [analytics]);
```

### Date Range Computation
```tsx
const dateRangeStr = useMemo(() => {
  if (analytics.length === 0) return 'Últimos 30 días';
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const first = analytics[0]?.date?.split('T')[0]?.split('-');
  const last = analytics[analytics.length - 1]?.date?.split('T')[0]?.split('-');
  if (!first || !last) return 'Últimos 30 días';
  const startDay = first[2];
  const startMonth = monthNames[parseInt(first[1], 10) - 1];
  const endDay = last[2];
  const endMonth = monthNames[parseInt(last[1], 10) - 1];
  return `${startDay} ${startMonth} a ${endDay} ${endMonth}`;
}, [analytics]);
```

### Next.js SSR Hydration Safety
To guarantee that Recharts will not cause hydration mismatches when rendered on Next.js App Router:
1. `mounted` state hook sets to `true` after initial client mount.
2. If `!mounted`, render an SVG fallback with identical 310px height or skeleton.
3. Once `mounted === true`, render `ResponsiveContainer` and `AreaChart`.

---

## 10. Conclusion & Recommended Next Steps
- Implement the consolidated `src/app/page.tsx` directly containing the 1:1 visual clone structure or modularized dashboard components (`metric-band.tsx`, `activity-chart.tsx`).
- Verify compilation via `npx tsc --noEmit`.
- Run E2E test runner via `node tests/run-all-tests.mjs` to confirm all 89/89 tests continue to pass.
