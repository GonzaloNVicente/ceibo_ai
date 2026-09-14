# Specification Mining Report: Reference Dashboard UI

**Source Target:** `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ref\src\routes\index.tsx`  
**Related Specs:** `styles.css`, `__root.tsx`, `components/ui/button.tsx`, `badge.tsx`, `card.tsx`, `table.tsx`, `chart.tsx`  
**Author:** Dashboard Reference Spec Miner (`spec_miner_survey_1`)  
**Date:** 2026-09-12T02:20:00Z  

---

## 1. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Navigation | Fixed Desktop Sidebar | 252px fixed left sidebar with branding, navigation links, and WhatsApp bot status | `navItems` array, current active path | Fixed sidebar DOM (`<aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col bg-sidebar text-sidebar-foreground lg:flex">`) | Silent graceful degradation on `<lg` screens (`hidden lg:flex`) | `ceibo_ref/src/routes/index.tsx:103-155` |
| 2 | Brand | BrandMark Icon | Square rounded badge with terracotta/crimson background, letter 'C', Sora font, bevel action shadow | None | `<div className="grid size-11 shrink-0 place-items-center rounded-md bg-primary font-display text-lg font-bold text-primary-foreground shadow-action">C</div>` | None | `ceibo_ref/src/routes/index.tsx:95-101` |
| 3 | Navigation | Navigation Item Badges | Pill counter badge next to Inbox navigation item showing unread/pending inquiries | `item.count` string (e.g. `"24"`) | `<span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">24</span>` | Not rendered if `count` is undefined | `ceibo_ref/src/routes/index.tsx:130-132` |
| 4 | Status Indicator | Bot Status Footer | Live operational indicator at bottom of sidebar showing pulsing green dot and status text | Static operational status | Card with `live-pulse` CSS keyframe dot, "Bot WhatsApp", "Operativo", 24/7 caption | Static display | `ceibo_ref/src/routes/index.tsx:138-152` |
| 5 | Header / Nav | Sticky Topbar | Responsive top navbar with mobile brand, tenant name, enterprise badge, WhatsApp phone + status, and user avatar | Tenant metadata, WhatsApp connection state, user profile info | Sticky `<header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">` | Gracefully hides user email and tenant connection on small screens | `ceibo_ref/src/routes/index.tsx:157-188` |
| 6 | Page Header | Live Pulse Badge | Header status pill with pulsating emerald dot and text "En Vivo" | None | `<span className="inline-flex h-7 items-center gap-2 rounded-full border border-success/25 bg-success/10 px-2.5 text-xs font-bold text-success"><span className="live-pulse size-2 rounded-full bg-success" /> En Vivo</span>` | None | `ceibo_ref/src/routes/index.tsx:276-281` |
| 7 | Actions | Action Button Bar | Three header action buttons: "Actualizar" (secondary), "Ver Chats" (secondary), "Entrenar Asistente" (primary) | Click handlers, icon props | 3 buttons with specific icons (`RefreshCw`, `MessageCircleMore`, `Sparkles`) and variants | Disabled state handled via standard button props | `ceibo_ref/src/routes/index.tsx:285-289` |
| 8 | KPI Cards | Divided MetricBand | 4-column metric band with responsive dividing borders, colored top indicator strip, large Sora font values, and tone colors | `metrics` array (label, value, detail, note, tone) | Single `<section>` with 4 `<article>` tiles divided by borders | Fallback tone defaults to neutral if unspecified | `ceibo_ref/src/routes/index.tsx:190-209` |
| 9 | Analytics | 30-Day Activity Area Chart | Recharts multi-series AreaChart comparing autonomous AI resolutions vs human escalation | `activity` array of `{ date, ai, human }` | `<ResponsiveContainer>` rendering two monotone `<Area>` curves with linear gradients, custom CartesianGrid, and X/Y axes | Empty chart if activity array is empty | `ceibo_ref/src/routes/index.tsx:225-265` |
| 10 | Analytics | ActivityTooltip | Custom hover tooltip rendering active date label and key-value metrics with bold numbers | Recharts tooltip `active`, `payload`, `label` | Floating card with `rounded-md border border-border bg-card px-3 py-2 shadow-panel` | Returns `null` if not active or payload empty | `ceibo_ref/src/routes/index.tsx:211-223` |
| 11 | Compliance | Multi-Tenant Security Footer | Card highlighting multi-tenant cryptographic isolation with tenant identifier `[CEI-AR-7F42A9]` | Tenant identifier code | Card with `ShieldCheck` icon, title, description, and `LockKeyhole` protection badge | Fallback text if tenant is null | `ceibo_ref/src/routes/index.tsx:295-306` |
| 12 | Mobile UI | Mobile Bottom Status Bar | Sticky/fixed bottom mobile status bar with live-pulse indicator and user icon | None | Container shown only on `<lg` (`lg:hidden`) | Hidden on desktop screens | `ceibo_ref/src/routes/index.tsx:308-311` |
| 13 | Design System | OKLCH Semantic Color System | Complete color token system with terracotta primary, forest green background/sidebar, emerald success, and custom shadows | CSS custom properties in `:root` and `@theme inline` | Color classes (`bg-primary`, `text-ceibo`, `bg-sidebar`, etc.) | Graceful browser fallback via CSS variables | `ceibo_ref/src/styles.css:73-114` |
| 14 | Typography | Dual Font Hierarchy | Manrope for body text (`--font-sans`) and Sora for display headings/metrics (`--font-display`) | Font files or Google Fonts links | Applied via `font-sans` and `font-display` utility classes | System-ui fallbacks specified in font-family | `ceibo_ref/src/styles.css:22-23`, `__root.tsx:97` |

---

## 2. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Navigation | Item without `count` | Only icon and label are rendered; badge `<span>` is omitted (`item.count ? ... : null`). |
| 2 | Navigation | Active route link | Receives `aria-current="page"` and classes `bg-sidebar-accent text-sidebar-accent-foreground` instead of default hover classes. |
| 3 | Action Buttons | `<Button>` without explicit variant | Defaults to `variant="secondary"`, rendering white card background with border (`border border-border bg-card text-foreground hover:border-primary/35 hover:bg-secondary`). Primary is ONLY applied when `variant="primary"` is explicitly passed. |
| 4 | Metric Card | `metric.tone === "ceibo"` | Top indicator strip is `bg-ceibo`, metric value is `text-ceibo`, and detail text is `text-ceibo`. |
| 5 | Metric Card | `metric.tone === "success"` | Top indicator strip is `bg-success`, detail text is `text-success`, but metric value remains default `text-foreground`. |
| 6 | Metric Card | `metric.tone === "neutral"` | Top indicator strip is `bg-foreground/20`, detail text is `text-foreground/70`, metric value is `text-foreground`. |
| 7 | Metric Band Grid | Responsive viewports | Desktop `xl`: 1 row with 4 columns (`xl:grid-cols-4 xl:divide-x xl:divide-border`). Tablet `sm`: 2x2 grid (`sm:grid-cols-2`). Mobile: 1-column stack with bottom borders between items. |
| 8 | Activity Chart Tooltip | Mouse hovering outside data area | Tooltip returns `null` if `!active || !payload?.length`, causing no ghost overlay. |
| 9 | Activity Chart Animation | Initial render | `isAnimationActive={false}` is set on both `<Area>` elements, ensuring instant, deterministic layout without hydration jumps. |
| 10 | Unused imports in reference | `ArrowDownToLine` in `index.tsx:3` | Imported from `lucide-react` but never used in JSX. Can be safely pruned. |

---

## 3. Authoritative Design Tokens & Styling

### 3.1 Exact Colors (OKLCH, Hex, RGB)

| Token Name | Reference OKLCH | Equivalent Hex | Equivalent sRGB | Semantic Role |
|------------|-----------------|----------------|-----------------|---------------|
| `--primary` / `--ceibo` | `oklch(0.555 0.163 33.5)` | `#bf442b` | `rgb(191, 68, 43)` | Ceibo terracotta / rust brand color |
| `--primary-foreground` | `oklch(0.982 0.006 145.1)` | `#f7faf7` | `rgb(247, 250, 247)` | Light contrast text on primary |
| `--ceibo-soft` | `oklch(0.94 0.025 36.5)` | `#fbe6e0` | `rgb(251, 230, 224)` | Warm terracotta tint (ENTERPRISE badge bg) |
| `--background` | `oklch(0.976 0.006 145.1)` | `#f5f8f5` | `rgb(245, 248, 245)` | Off-white canvas with faint green undertone |
| `--foreground` | `oklch(0.244 0.028 169.1)` | `#12251e` | `rgb(18, 37, 30)` | Deep forest charcoal for main text |
| `--card` / `--popover` | `oklch(1 0 0)` | `#ffffff` | `rgb(255, 255, 255)` | Pure white card surfaces |
| `--card-foreground` | `oklch(0.244 0.028 169.1)` | `#12251e` | `rgb(18, 37, 30)` | Text on cards |
| `--secondary` / `--muted` | `oklch(0.922 0.008 147.2)` | `#e2e7e2` | `rgb(226, 231, 226)` | Soft gray-green surface & muted fills |
| `--muted-foreground` | `oklch(0.494 0.025 167.3)` | `#54665f` | `rgb(84, 102, 95)` | Secondary / helper text |
| `--accent` | `oklch(0.368 0.041 166.1)` | `#29463a` | `rgb(41, 70, 58)` | Deep pine green accent surface |
| `--accent-foreground` | `oklch(0.982 0.006 145.1)` | `#f7faf7` | `rgb(247, 250, 247)` | Contrast text on accent surface |
| `--success` | `oklch(0.49 0.103 162.1)` | `#0e724e` | `rgb(14, 114, 78)` | Rich emerald green (AI resolved, live status) |
| `--success-foreground` | `oklch(0.982 0.006 145.1)` | `#f7faf7` | `rgb(247, 250, 247)` | Light text on success |
| `--border` / `--input` | `oklch(0.87 0.009 147.4)` | `#d0d6d1` | `rgb(208, 214, 209)` | Subtle boundary line |
| `--grid-line` | `oklch(0.87 0.009 147.4 / 62%)` | `#d0d6d19e` | `rgba(208, 214, 209, 0.62)` | Chart horizontal dashed lines |
| `--sidebar` | `oklch(0.244 0.028 169.1)` | `#12251e` | `rgb(18, 37, 30)` | Dark forest spruce sidebar background |
| `--sidebar-foreground` | `oklch(0.922 0.008 147.2)` | `#e2e7e2` | `rgb(226, 231, 226)` | Inactive nav text |
| `--sidebar-accent` | `oklch(0.368 0.041 166.1)` | `#29463a` | `rgb(41, 70, 58)` | Active nav item background |
| `--sidebar-accent-foreground`| `oklch(0.982 0.006 145.1)`| `#f7faf7` | `rgb(247, 250, 247)` | Active nav item text |
| `--sidebar-border` | `oklch(1 0 0 / 12%)` | `#ffffff1f` | `rgba(255, 255, 255, 0.12)` | Divider inside sidebar |
| `--shadow-action` | `0 4px 0 oklch(0.41 0.117 33.5)` | `0 4px 0 #7d2c1b` | `0 4px 0 rgb(125, 44, 27)` | 3D bevel bottom shadow on primary buttons |
| `--shadow-panel` | `0 16px 44px -34px oklch(0.244 0.028 169.1 / 42%)` | `0 16px 44px -34px #12251e6b` | Elevation shadow on cards & panels |

### 3.2 Typography & Fonts

- **Sans font (Body, navigation, tables):** `Manrope`, sans-serif
  - Weights: `400` (normal), `500` (medium), `600` (semibold), `700` (bold)
- **Display font (Logo, titles, KPI numbers, headers):** `Sora`, sans-serif
  - Weights: `500` (medium), `600` (semibold), `700` (bold)
- **Google Fonts Import URL:**
  `https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap`

### 3.3 Custom Animations & Keyframes

```css
@keyframes live-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.42;
    transform: scale(0.82);
  }
}

.live-pulse {
  animation: live-pulse 1.8s ease-in-out infinite;
}
```

---

## 4. Full DOM Hierarchy & Component Specification

Below is the complete 1:1 DOM structure, component breakdown, and exact Tailwind class mapping for the entire Dashboard view.

### 4.1 Root Layout Container

```tsx
<div id="dashboard" className="min-h-screen bg-background text-foreground">
  <Sidebar />
  <div className="lg:pl-[252px]">
    <Topbar />
    <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 xl:px-8 xl:py-8">
      {/* Dashboard Page Content */}
    </main>
  </div>
</div>
```

---

### 4.2 Sidebar Component

**Element:** `<aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col bg-sidebar text-sidebar-foreground lg:flex">`

#### A. Brand Header
```tsx
<div className="flex items-center gap-3 px-6 py-7">
  {/* BrandMark Component */}
  <div className="grid size-11 shrink-0 place-items-center rounded-md bg-primary font-display text-lg font-bold text-primary-foreground shadow-action">
    C
  </div>
  <div>
    <p className="font-display text-[17px] font-bold leading-none text-sidebar-accent-foreground">
      Ceibo AI
    </p>
    <p className="mt-1 text-[11px] font-medium text-sidebar-foreground/55">
      Ventas por WhatsApp
    </p>
  </div>
</div>
```

#### B. Primary Navigation Menu
```tsx
<nav aria-label="Navegación principal" className="space-y-1 px-3">
  {navItems.map((item) => {
    const Icon = item.icon;
    return (
      <a
        key={item.label}
        href={item.active ? "#dashboard" : `#${item.label.toLowerCase().replaceAll(" ", "-")}`}
        aria-current={item.active ? "page" : undefined}
        className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors ${
          item.active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/65 hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground"
        }`}
      >
        <Icon className="size-[18px]" strokeWidth={1.8} />
        <span>{item.label}</span>
        {item.count ? (
          <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">
            {item.count}
          </span>
        ) : null}
      </a>
    );
  })}
</nav>
```

**Navigation Item Definitions:**
1. `{ label: "Dashboard", icon: Gauge, active: true }`
2. `{ label: "Inbox", icon: Inbox, count: "24" }`
3. `{ label: "Chats", icon: MessageCircleMore }`
4. `{ label: "Base de Conocimiento", icon: BookOpen }`
5. `{ label: "Configuración", icon: Settings }`

#### C. Bottom Bot Status Panel
```tsx
<div className="mt-auto p-4">
  <div className="border-t border-sidebar-border pt-4">
    <div className="flex items-start gap-3 rounded-md bg-sidebar-accent/65 p-3.5">
      <div className="relative mt-0.5">
        <Bot className="size-5 text-sidebar-accent-foreground" strokeWidth={1.8} />
        <span className="live-pulse absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-sidebar-accent bg-success" />
      </div>
      <div>
        <p className="text-xs font-bold text-sidebar-accent-foreground">Bot WhatsApp</p>
        <p className="mt-1 text-[11px] font-semibold text-success">Operativo</p>
        <p className="mt-1 text-[11px] leading-4 text-sidebar-foreground/55">
          Atención comercial automatizada activa 24/7
        </p>
      </div>
    </div>
  </div>
</div>
```

---

### 4.3 Topbar Component

**Element:** `<header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">`  
**Inner container:** `<div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 xl:px-8">`

```tsx
{/* 1. Mobile Brand (hidden on lg) */}
<div className="flex items-center gap-2 lg:hidden">
  <BrandMark />
  <span className="hidden font-display text-sm font-bold sm:block">Ceibo AI</span>
</div>

{/* 2. Tenant Title & WhatsApp Status */}
<div className="min-w-0">
  <div className="flex items-center gap-2">
    <p className="truncate text-sm font-bold">Ceibo AI Tech Solutions</p>
    <span className="hidden rounded bg-ceibo-soft px-2 py-1 text-[10px] font-bold text-ceibo sm:inline">
      ENTERPRISE
    </span>
  </div>
  <div className="mt-0.5 hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
    <MessageCircleMore className="size-3.5 text-success" />
    <span>+54 9 11 5482-0916</span>
    <span className="size-1 rounded-full bg-border" />
    <span className="font-semibold text-success">Conectado</span>
  </div>
</div>

{/* 3. User Avatar & Menu */}
<div className="ml-auto flex items-center gap-3 border-l border-border pl-3">
  <div className="hidden text-right md:block">
    <p className="text-xs font-bold">Gonzalo Vicente</p>
    <p className="mt-0.5 text-[11px] text-muted-foreground">gonzalo@ceibo.ai</p>
  </div>
  <div className="grid size-9 place-items-center rounded-md bg-accent font-display text-xs font-bold text-accent-foreground">
    GV
  </div>
  <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
</div>
```

---

### 4.4 Dashboard Page Header & Action Buttons

**Element:** `<div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">`

```tsx
<div>
  {/* Live Status Pill */}
  <div className="mb-3 flex items-center gap-2">
    <span className="inline-flex h-7 items-center gap-2 rounded-full border border-success/25 bg-success/10 px-2.5 text-xs font-bold text-success">
      <span className="live-pulse size-2 rounded-full bg-success" /> En Vivo
    </span>
    <span className="text-xs text-muted-foreground">Actualizado hace 2 min</span>
  </div>
  {/* Page Title */}
  <h1 className="max-w-[22ch] font-display text-3xl font-bold leading-[1.08] sm:text-4xl">
    Dashboard de Rendimiento WhatsApp
  </h1>
  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
    Métricas comerciales en tiempo real para Ceibo AI Tech Solutions (ENTERPRISE)
  </p>
</div>

{/* Action Buttons */}
<div className="flex flex-wrap gap-2">
  <Button aria-label="Actualizar métricas">
    <RefreshCw className="size-4" />
    Actualizar
  </Button>
  <Button>
    <MessageCircleMore className="size-4" />
    Ver Chats
  </Button>
  <Button variant="primary">
    <Sparkles className="size-4" />
    Entrenar Asistente
  </Button>
</div>
```

---

### 4.5 MetricBand Component (KPI Cards)

**Element:** `<section aria-label="Métricas principales" className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-panel">`  
**Inner Grid:** `<div className="grid sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-border">`

Each metric card is an `<article>`:
```tsx
<article
  key={metric.label}
  className={`relative min-h-48 p-5 ${
    index < 2 ? "border-b border-border xl:border-b-0" : ""
  } ${index % 2 === 0 ? "sm:border-r sm:border-border xl:border-r-0" : ""}`}
>
  {/* Top Colored Indicator Strip */}
  <div
    className={`absolute inset-x-0 top-0 h-1 ${
      metric.tone === "ceibo"
        ? "bg-ceibo"
        : metric.tone === "success"
        ? "bg-success"
        : "bg-foreground/20"
    }`}
  />
  <p className="text-sm font-bold text-muted-foreground">{metric.label}</p>
  <p
    className={`mt-3 font-display text-[38px] font-bold leading-none ${
      metric.tone === "ceibo" ? "text-ceibo" : "text-foreground"
    }`}
  >
    {metric.value}
  </p>
  <p
    className={`mt-3 text-xs font-bold ${
      metric.tone === "success"
        ? "text-success"
        : metric.tone === "ceibo"
        ? "text-ceibo"
        : "text-foreground/70"
    }`}
  >
    {metric.detail}
  </p>
  <p className="mt-2 max-w-[27ch] text-[11px] leading-4 text-muted-foreground">
    {metric.note}
  </p>
</article>
```

#### Metrics Data Table

| Index | Label | Value | Detail | Note | Tone |
|-------|-------|-------|--------|------|------|
| 0 | Volumen de Consultas | `3.588` | `+18.4% vs. mes anterior` | `Últimos 30 días de actividad WhatsApp` | `success` |
| 1 | Horas Ahorradas | `588.6 h` | `12 min promedio ahorrado por chat` | `Equivale a ~3.7 asesores FTE de ventas liberados` | `neutral` |
| 2 | Tasa de Resolución IA | `82%` | `2.943 resueltas por IA` | `Sin intervención de asesor humano` | `success` |
| 3 | Derivadas a Humano | `645` | `18% escaladas a cierre` | `Leads calificados para asesor comercial` | `ceibo` |

---

### 4.6 ActivityChart Component (Recharts AreaChart)

**Element:** `<section className="mt-5 border border-border bg-card p-5 shadow-panel sm:p-6">`

#### A. Chart Header and Custom Legend
```tsx
<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
  <div>
    <div className="flex items-center gap-2">
      <Boxes className="size-5 text-primary" strokeWidth={1.8} />
      <h2 className="font-display text-lg font-bold">Evolución de consultas</h2>
    </div>
    <p className="mt-1 text-xs text-muted-foreground">Últimos 30 días · 12 Ago a 06 Sep</p>
  </div>
  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-muted-foreground">
    <span className="flex items-center gap-2">
      <span className="size-2.5 rounded-sm bg-success" />
      Resueltas por IA
    </span>
    <span className="flex items-center gap-2">
      <span className="size-2.5 rounded-sm bg-ceibo" />
      Derivadas a humano
    </span>
  </div>
</div>
```

#### B. Recharts AreaChart Element
```tsx
<div className="mt-5 h-[310px] w-full" aria-label="Gráfico de consultas resueltas por IA y derivadas a humano">
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={activity} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
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
```

#### C. ActivityTooltip Component
```tsx
function ActivityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
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

---

### 4.7 Multi-Tenant Security Footer

**Element:** `<footer className="mt-5 flex flex-col gap-3 border border-accent/20 bg-accent/5 p-4 sm:flex-row sm:items-center">`

```tsx
<footer className="mt-5 flex flex-col gap-3 border border-accent/20 bg-accent/5 p-4 sm:flex-row sm:items-center">
  <div className="grid size-10 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
    <ShieldCheck className="size-5" strokeWidth={1.8} />
  </div>
  <div className="min-w-0">
    <p className="text-sm font-bold">Seguridad multi-tenant activa</p>
    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
      Todas las consultas y registros están aislados criptográficamente para la empresa{" "}
      <span className="font-bold text-foreground">[CEI-AR-7F42A9]</span>.
    </p>
  </div>
  <div className="ml-auto hidden items-center gap-2 text-xs font-semibold text-success md:flex">
    <LockKeyhole className="size-4" /> Protección verificada
  </div>
</footer>
```

---

### 4.8 Mobile Bottom Status Indicator

**Element:** `<div className="mt-5 flex items-center justify-between text-[11px] text-muted-foreground lg:hidden">`

```tsx
<div className="mt-5 flex items-center justify-between text-[11px] text-muted-foreground lg:hidden">
  <span className="flex items-center gap-2 font-semibold text-success">
    <span className="live-pulse size-2 rounded-full bg-success" />
    Bot WhatsApp operativo 24/7
  </span>
  <CircleUserRound className="size-4" />
</div>
```

---

## 5. UI Component Library Specifications

### 5.1 Button Component (`@/components/ui/button.tsx`)

- **Base classes:**
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-[background-color,border-color,color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0`
- **Variants:**
  - `primary` (and `default`): `"border border-primary bg-primary text-primary-foreground shadow-action hover:bg-primary/90"`
  - `secondary` (and `outline`): `"border border-border bg-card text-foreground hover:border-primary/35 hover:bg-secondary"`
  - `destructive`: `"bg-destructive text-destructive-foreground hover:bg-destructive/90"`
  - `ghost`: `"border border-transparent bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"`
  - `link`: `"text-primary underline-offset-4 hover:underline"`
- **Sizes:**
  - `default`: `"h-10 px-3.5"`
  - `sm`: `"h-8 px-3 text-xs"`
  - `lg`: `"h-11 px-6"`
  - `icon`: `"size-10 p-0"`
  - `icon-sm`: `"size-8 p-0"`
  - `icon-lg`: `"size-11 p-0"`
- **Default Variants:** `{ variant: "secondary", size: "default" }`

### 5.2 Badge Component (`@/components/ui/badge.tsx`)

- **Base classes:**
  `inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`
- **Variants:**
  - `default`: `"border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80"`
  - `secondary`: `"border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"`
  - `destructive`: `"border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80"`
  - `outline`: `"text-foreground"`
- **Default Variant:** `default`

### 5.3 Table Component (`@/components/ui/table.tsx`)

- **Table wrapper:** `<div className="relative w-full overflow-auto">`
- **Table:** `<table className="w-full caption-bottom text-sm">`
- **TableHeader:** `<thead className="[&_tr]:border-b">`
- **TableBody:** `<tbody className="[&_tr:last-child]:border-0">`
- **TableFooter:** `<tfoot className="border-t bg-muted/50 font-medium [&>tr]:last:border-b-0">`
- **TableRow:** `<tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">`
- **TableHead:** `<th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]">`
- **TableCell:** `<td className="p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]">`
- **TableCaption:** `<caption className="mt-4 text-sm text-muted-foreground">`

### 5.4 Card Component (`@/components/ui/card.tsx`)

- **Card:** `<div className="rounded-xl border bg-card text-card-foreground shadow">`
- **CardHeader:** `<div className="flex flex-col space-y-1.5 p-6">`
- **CardTitle:** `<div className="font-semibold leading-none tracking-tight">`
- **CardDescription:** `<div className="text-sm text-muted-foreground">`
- **CardContent:** `<div className="p-6 pt-0">`
- **CardFooter:** `<div className="flex items-center p-6 pt-0">`

---

## 6. Lucide Icons Catalog

All icons used across the reference Dashboard:

| Icon Name | Usage Location | Component Props / Classes | Purpose |
|-----------|----------------|---------------------------|---------|
| `Gauge` | Sidebar Navigation | `className="size-[18px]" strokeWidth={1.8}` | Dashboard navigation icon |
| `Inbox` | Sidebar Navigation | `className="size-[18px]" strokeWidth={1.8}` | Inbox navigation icon |
| `MessageCircleMore` | Sidebar Navigation, Topbar, Header Button | Sidebar: `size-[18px] strokeWidth={1.8}`<br>Topbar: `size-3.5 text-success`<br>Header: `size-4` | WhatsApp messaging indicator |
| `BookOpen` | Sidebar Navigation | `className="size-[18px]" strokeWidth={1.8}` | Knowledge base icon |
| `Settings` | Sidebar Navigation | `className="size-[18px]" strokeWidth={1.8}` | Settings navigation icon |
| `Bot` | Sidebar Status Box | `className="size-5 text-sidebar-accent-foreground" strokeWidth={1.8}` | WhatsApp Bot status |
| `ChevronDown` | Topbar Profile | `className="hidden size-4 text-muted-foreground sm:block"` | User dropdown indicator |
| `RefreshCw` | Header Action Button | `className="size-4"` | Refresh data action |
| `Sparkles` | Header Action Button | `className="size-4"` | AI Assistant training action |
| `Boxes` | Activity Chart Header | `className="size-5 text-primary" strokeWidth={1.8}` | Consultation evolution icon |
| `ShieldCheck` | Multi-Tenant Security Footer | `className="size-5" strokeWidth={1.8}` | Cryptographic tenant security |
| `LockKeyhole` | Multi-Tenant Security Footer | `className="size-4"` | Verified protection status |
| `CircleUserRound`| Mobile Bottom Status Bar | `className="size-4"` | Mobile user profile icon |
| `ArrowDownToLine`| (Unused import) | None | Unused in `index.tsx` |

---

## 7. Direct Implementation Guide for `ceibo_ai`

To reproduce the Dashboard 1:1 in Next.js (`ceibo_ai/src/app/page.tsx` and layout):

1. **Colors in Tailwind v3 (`tailwind.config.ts` & `globals.css`):**
   - Inject the exact colors:
     - `primary`: `#bf442b` (terracotta)
     - `primary-foreground`: `#f7faf7`
     - `ceibo`: `#bf442b`
     - `ceibo-soft`: `#fbe6e0`
     - `background`: `#f5f8f5`
     - `foreground`: `#12251e`
     - `sidebar`: `#12251e`
     - `sidebar-foreground`: `#e2e7e2`
     - `sidebar-accent`: `#29463a`
     - `sidebar-accent-foreground`: `#f7faf7`
     - `sidebar-border`: `rgba(255, 255, 255, 0.12)`
     - `border`: `#d0d6d1`
     - `success`: `#0e724e`
     - `muted-foreground`: `#54665f`
     - `accent`: `#29463a`
     - `accent-foreground`: `#f7faf7`
     - `shadow-action`: `0 4px 0 #7d2c1b`
     - `shadow-panel`: `0 16px 44px -34px rgba(18, 37, 30, 0.42)`
2. **Typography:**
   - Add Google Fonts for `Manrope` (weights 400, 500, 600, 700) and `Sora` (weights 500, 600, 700) to `src/app/layout.tsx`.
   - Set `fontFamily.sans = ['Manrope', 'sans-serif']` and `fontFamily.display = ['Sora', 'sans-serif']`.
3. **Keyframe Animation:**
   - Define `@keyframes live-pulse` in `globals.css` and utility `.live-pulse`.
4. **AppShell & Navigation:**
   - Unify the layout into the 252px dark forest green sidebar (`bg-sidebar text-sidebar-foreground`) with the `BrandMark` ('C' badge), exact nav links, count badge on Inbox, and the bottom Bot WhatsApp operational card.
   - Replace the topbar with the reference topbar containing tenant name, `ENTERPRISE` badge in `bg-ceibo-soft text-ceibo`, WhatsApp number connected, and user initials pill.
5. **Dashboard Page Body:**
   - Swap the 4 standard cards for the undivided/divided `MetricBand` with the colored top indicator strips and `38px` font values.
   - Replace the Recharts chart with the exact AreaChart structure: `aiFill` (#0e724e / success at 0.28 to 0.02 opacity) and `humanFill` (#bf442b / ceibo at 0.2 to 0.01 opacity), monotone interpolation, stroked `var(--grid-line)` CartesianGrid, and custom `ActivityTooltip`.
   - Integrate the `ShieldCheck` multi-tenant security footer and mobile bottom status bar.
6. **Supabase Dynamic Data Integration:**
   - Keep dynamic data wiring from `useAuth()` and `tenantClient.getRecent30Days()`, mapping live database totals and 30-day rows into the exact reference metric band and area chart data structures.
