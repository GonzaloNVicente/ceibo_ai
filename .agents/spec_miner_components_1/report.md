# Design Tokens, UI Primitives, and Component Specification Report

**Project**: Ceibo AI (Next.js 14 App Router) vs Ceibo Reference (TanStack Start / Tailwind v4)  
**Author**: `teamwork_preview_spec_miner`  
**Date**: 2026-09-14  
**Working Directory**: `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\spec_miner_components_1`

---

## Executive Summary

This specification mining report delivers a comprehensive audit and authoritative blueprint for design tokens, UI primitives, icons, layout components, and page reskin patterns comparing the reference implementation (`ceibo_ref`) against the active codebase (`ceibo_ai`).

### Key Findings:
1. **Design Tokens & Theme Layer (M1 - 95% Parity)**:
   - `ceibo_ai/tailwind.config.ts` and `ceibo_ai/src/app/globals.css` successfully replicate the OKLCH design tokens from `ceibo_ref/src/styles.css`, including Ceibo terracotta primary (`oklch(0.555 0.163 33.5)`), forest green foreground/sidebar (`oklch(0.244 0.028 169.1)`), emerald green success (`oklch(0.49 0.103 162.1)`), 3D button shadow (`--shadow-action`), panel shadow (`--shadow-panel`), and `live-pulse` keyframe animation.
   - Typography correctly configures Next.js `next/font/google` for **Manrope** (`--font-sans`) and **Sora** (`--font-display`).
2. **App Shell, Sidebar, and Topbar (R2 - 100% Completed)**:
   - `src/components/layout/sidebar.tsx`, `navbar.tsx`, and `app-shell.tsx` already achieve visual and structural 1:1 parity with `ceibo_ref/src/routes/index.tsx`.
   - Verified components include: 44px BrandMark "C" tile with `shadow-action`, fixed 252px desktop sidebar (`bg-sidebar`), 5 navigation links with active state indicator and "24" counter badge, bot status card with `live-pulse` indicator, sticky topbar with ENTERPRISE pill and WhatsApp live status indicator, and user initials avatar tile.
3. **UI Primitives Gaps (M1/M2/M3)**:
   - `Button` (`src/components/ui/button.tsx`) is already fully compliant with `shadow-action`, `active:translate-y-px`, and default variant `secondary`.
   - `Badge` (`src/components/ui/badge.tsx`) still contains hardcoded legacy Tailwind slate/brand classes (`bg-slate-900`, `bg-brand-100`, `rounded-full`) instead of reference tokens (`rounded-md`, semantic tokens `primary`, `secondary`, `destructive`, `outline`, `success`, `ceibo`).
   - `Card` (`src/components/ui/card.tsx`) contains legacy `border-slate-200 bg-white` rather than semantic `border-border bg-card text-card-foreground shadow-panel`.
   - Missing UI primitives: `Input`, `Table`, `Tabs`, `Dialog` do not exist in `src/components/ui/` in `ceibo_ai` (inner pages currently inline raw HTML or legacy styling).
4. **Dashboard Page (M2) Ready for Visual Parity**:
   - `ceibo_ai/src/app/page.tsx` currently retains separate legacy cards (`MetricsGrid`, `AnalyticsChart`). It must be rewritten to match `ceibo_ref/src/routes/index.tsx`'s unified 4-column `MetricBand`, 310px `ActivityChart` with dual gradients and `ActivityTooltip`, and multi-tenant security verification footer.
5. **Inner Pages (M3) Reskin Path**:
   - All inner pages (`/inbox`, `/chats`, `/documents`, `/settings`, `/login`) retain operational Supabase mock data wiring, but require updating legacy slate/indigo/brand utility classes to the reference tokens (`primary`, `card`, `muted`, `accent`, `border`, `success`, `ceibo`, `font-display`).

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Design Tokens | OKLCH Color Palette | 20+ semantic colors including terracotta primary (`oklch(0.555 0.163 33.5)`), forest foreground/sidebar (`oklch(0.244 0.028 169.1)`), emerald success (`oklch(0.49 0.103 162.1)`), canvas background (`oklch(0.976 0.006 145.1)`) | CSS variable names | OKLCH colors mapped via Tailwind `color-mix` | Fallback to default hex/oklch values | `ceibo_ref/src/styles.css` & `ceibo_ai/tailwind.config.ts` |
| 2 | Typography | Dual Font System | Body text using Manrope (`--font-sans`), headers/metrics/brand using Sora (`--font-display`), with `tnum` and `ss01` tabular numbers enabled | Font class (`font-sans`, `font-display`) | Rendered typography | System sans fallback | `ceibo_ref/src/styles.css` & `ceibo_ai/src/app/layout.tsx` |
| 3 | Shadows | 3D Action & Panel Shadows | `--shadow-action: 0 4px 0 oklch(0.41 0.117 33.5)` for buttons/brandmark; `--shadow-panel: 0 16px 44px -34px oklch(0.244 0.028 169.1 / 42%)` for cards/charts | Tailwind utility `shadow-action`, `shadow-panel` | Custom box shadows | Standard Tailwind box-shadow | `ceibo_ref/src/styles.css` lines 99-100 |
| 4 | Animation | `live-pulse` Keyframe | 1.8s ease-in-out breathing animation (opacity 1 -> 0.42, scale 1 -> 0.82) for live status indicator dots | Utility `.live-pulse` | Continuous CSS keyframe animation | Respects `prefers-reduced-motion: reduce` | `ceibo_ref/src/styles.css` lines 171-178 |
| 5 | Primitive | Button (`button.tsx`) | Multi-variant button primitive with default `variant="secondary"`, `primary` (terracotta with `shadow-action`), sizes (`default`, `sm`, `lg`, `icon`, `icon-sm`, `icon-lg`), `active:translate-y-px` | `variant`, `size`, `className`, `props` | Styled `<button>` element | Defaults to secondary and default size | `ceibo_ref/src/components/ui/button.tsx` |
| 6 | Primitive | Badge (`badge.tsx`) | Small status chip with `rounded-md`, semantic variants (`default`, `secondary`, `destructive`, `outline`, `success`, `ceibo`) | `variant`, `className`, `children` | Styled `<div>` or `<span>` | Defaults to default variant | `ceibo_ref/src/components/ui/badge.tsx` |
| 7 | Primitive | Card (`card.tsx`) | Container primitive (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) with `rounded-xl border bg-card text-card-foreground shadow` | Children, className, standard HTML div props | Structured card DOM | Renders standard div | `ceibo_ref/src/components/ui/card.tsx` |
| 8 | Primitive | Input (`input.tsx`) | Accessible text input with `h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring` | `type`, `className`, standard HTML input props | Styled `<input>` element | Disabled opacity / cursor not allowed | `ceibo_ref/src/components/ui/input.tsx` |
| 9 | Primitive | Table (`table.tsx`) | Table primitive set (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`) with overflow wrapper and border-b dividers | Children, className, table props | Accessible responsive table | Empty tbody fallback | `ceibo_ref/src/components/ui/table.tsx` |
| 10 | Primitive | Tabs (`tabs.tsx`) | Tab navigation bar with active state elevation (`bg-background text-foreground shadow`) on muted track (`bg-muted p-1 text-muted-foreground`) | Tab list, triggers, content | Controlled or uncontrolled tab state | None | `ceibo_ref/src/components/ui/tabs.tsx` |
| 11 | Layout | BrandMark | 44px square terracotta box (`size-11 rounded-md bg-primary font-display text-lg font-bold text-primary-foreground shadow-action`) rendering "C" | None | Rendered logo box | None | `ceibo_ref/src/routes/index.tsx` line 95 |
| 12 | Layout | Sidebar (Fixed 252px) | Fixed desktop sidebar (`w-[252px] bg-sidebar text-sidebar-foreground`) with BrandMark, 5 nav items, active pill styling, and bottom operational bot card | Nav state / pathname | Rendered aside navigation | Mobile drawer fallback | `ceibo_ai/src/components/layout/sidebar.tsx` |
| 13 | Layout | Sticky Topbar | Responsive header with mobile hamburger/brand fallback, tenant title, ENTERPRISE badge, live WhatsApp phone indicator, and user initials badge | Auth context (`empresa`, `user`, `perfil`) | Rendered sticky header | Fallback to default tenant values | `ceibo_ai/src/components/layout/navbar.tsx` |
| 14 | Layout | AppShell Wrapper | Layout wrapper managing fixed sidebar, content offset (`lg:pl-[252px]`), sticky topbar, max-w-[1500px] main canvas, and mobile drawer | `children` | Full app layout | Renders auth-only layout on `/login` | `ceibo_ai/src/components/layout/app-shell.tsx` |
| 15 | Dashboard | Live Pulse Status Pill | Header status badge: `inline-flex h-7 items-center gap-2 rounded-full border border-success/25 bg-success/10 px-2.5 text-xs font-bold text-success` with green animated dot | None | Visual live status | None | `ceibo_ref/src/routes/index.tsx` line 277 |
| 16 | Dashboard | MetricBand | Unified single card with 4 columns, `xl:divide-x xl:divide-border`, top color strips (success, neutral, ceibo), Sora 38px font numbers | 4 metric objects `{ label, value, detail, note, tone }` | Rendered 4-metric grid | Shows 0 or placeholder if data empty | `ceibo_ref/src/routes/index.tsx` line 190 |
| 17 | Dashboard | ActivityChart | Recharts AreaChart (310px) with dual gradients (`#aiFill` emerald, `#humanFill` terracotta), dashed gridlines (`strokeDasharray="3 5"`), and ActivityTooltip | 30-day activity array | SVG area chart | Svg fallback if loading or unmounted | `ceibo_ref/src/routes/index.tsx` line 225 |
| 18 | Dashboard | Security Footer | Multi-tenant security bar with ShieldCheck icon tile in `bg-accent`, cryptographic tenant code `[CEI-AR-7F42A9]`, and LockKeyhole "Protección verificada" pill | Tenant code string | Styled footer banner | None | `ceibo_ref/src/routes/index.tsx` line 295 |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | `live-pulse` Animation | Client system with `prefers-reduced-motion: reduce` | Animation duration forced to `0.01ms` and iteration count to 1, preventing motion sickness while retaining visible static green dot. |
| 2 | `MetricBand` Responsive Layout | Mobile viewport (<640px) vs Tablet (640px-1279px) vs Desktop (>=1280px) | Single column on mobile; 2x2 grid with horizontal and vertical dividing borders on tablet; unified single row divided by `xl:divide-x xl:divide-border` on desktop. Top colored strip remains pinned on all screens. |
| 3 | `buttonVariants` Default Props | `<Button>Click me</Button>` without `variant` prop | Defaults to `variant="secondary"` (outline card style with `border-border bg-card hover:border-primary/35 hover:bg-secondary`). Primary terracotta button requires explicit `variant="primary"`. |
| 4 | `ActivityChart` Area Rendering | Recharts hydration on Next.js Server Components / SSR | Uncontrolled SSR render causes React hydration mismatch errors unless handled via dynamic import or client-side `mounted` state with SVG/skeleton fallback. |
| 5 | `AppShell` on Auth Routes | User navigates to `/login` | `AppShell` detects `pathname === '/login'` and suppresses the 252px sidebar, sticky topbar, and mobile drawer, rendering a clean centered canvas. |
| 6 | Navigation Active State | Pathname matches `/inbox` or sub-routes `/inbox/[id]` | Sidebar link matches either exact `/inbox` or starts with `/inbox/`, highlighting the item with `bg-sidebar-accent text-sidebar-accent-foreground`. |
| 7 | Zero Queries / Empty Analytics | Database returns empty array `[]` for 30 days | `calculateSummaryMetrics` safely returns zeroes; `MetricBand` displays 0 queries, 0.0 h saved, 0% AI rate; `ActivityChart` renders flat baseline without breaking. |
| 8 | Color Alpha Transparency | Opacity modifiers like `bg-primary/90`, `bg-success/10`, `border-accent/20` | Supported seamlessly via `color-mix(in oklch, var(...) calc(<alpha-value> * 100%), transparent)` in `tailwind.config.ts`. |

---

## Detailed Token & Typography Comparison

### 1. Color Token Map

| Semantic Token | OKLCH Reference Value | CSS Variable | Tailwind Utility | Visual Role |
|----------------|-----------------------|--------------|------------------|-------------|
| **Primary / Ceibo** | `oklch(0.555 0.163 33.5)` | `--primary`, `--ceibo` | `bg-primary`, `text-primary`, `bg-ceibo`, `text-ceibo` | Warm terracotta brand color; call-to-action buttons, BrandMark, active badges, human escalation lines |
| **Primary Foreground** | `oklch(0.982 0.006 145.1)` | `--primary-foreground` | `text-primary-foreground` | High-contrast light text on primary terracotta |
| **Foreground** | `oklch(0.244 0.028 169.1)` | `--foreground` | `text-foreground` | Deep forest charcoal; primary text for all headings and body |
| **Background** | `oklch(0.976 0.006 145.1)` | `--background` | `bg-background` | Very subtle warm off-white canvas |
| **Card** | `oklch(1 0 0)` | `--card` | `bg-card` | Pure white background for elevated cards, panels, and tables |
| **Card Foreground** | `oklch(0.244 0.028 169.1)` | `--card-foreground` | `text-card-foreground` | Body text on white cards |
| **Secondary / Muted** | `oklch(0.922 0.008 147.2)` | `--secondary`, `--muted` | `bg-secondary`, `bg-muted` | Soft cool grey/green tint for button hover, tab tracks, muted chips |
| **Muted Foreground** | `oklch(0.494 0.025 167.3)` | `--muted-foreground` | `text-muted-foreground` | Secondary helper text, subtitles, table headers, inactive links |
| **Accent** | `oklch(0.368 0.041 166.1)` | `--accent` | `bg-accent`, `text-accent` | Deep forest green; user initials badge, security icon container |
| **Accent Foreground** | `oklch(0.982 0.006 145.1)` | `--accent-foreground` | `text-accent-foreground` | Light text on deep forest green accents |
| **Success** | `oklch(0.49 0.103 162.1)` | `--success` | `bg-success`, `text-success` | Emerald green; WhatsApp operational indicator, AI resolution metric and chart line |
| **Ceibo Soft** | `oklch(0.94 0.025 36.5)` | `--ceibo-soft` | `bg-ceibo-soft` | Pale terracotta tint; ENTERPRISE tenant badge background |
| **Border / Input** | `oklch(0.87 0.009 147.4)` | `--border`, `--input` | `border-border`, `border-input` | Consistent subtle panel border and input perimeter |
| **Grid Line** | `oklch(0.87 0.009 147.4 / 62%)` | `--grid-line` | `stroke-[var(--grid-line)]` | Chart grid line dashed separator |
| **Sidebar** | `oklch(0.244 0.028 169.1)` | `--sidebar` | `bg-sidebar` | Deep forest green desktop sidebar background |
| **Sidebar Foreground**| `oklch(0.922 0.008 147.2)` | `--sidebar-foreground` | `text-sidebar-foreground` | Inactive nav links text (65% opacity) |
| **Sidebar Accent** | `oklch(0.368 0.041 166.1)` | `--sidebar-accent` | `bg-sidebar-accent` | Active nav link background and bot card background |
| **Sidebar Border** | `oklch(1 0 0 / 12%)` | `--sidebar-border` | `border-sidebar-border` | Thin translucent border dividing sidebar sections |

### 2. Shadows & Micro-Interactions

```css
/* Solid 3D bevel shadow for primary buttons and BrandMark */
--shadow-action: 0 4px 0 oklch(0.41 0.117 33.5);

/* Soft deep ambient elevation for floating cards and panels */
--shadow-panel: 0 16px 44px -34px oklch(0.244 0.028 169.1 / 42%);
```

- When buttons are clicked/pressed, they execute `active:translate-y-px`, giving a tactile physical push-button feedback that harmonizes with `shadow-action`.

### 3. Typography Stack

- **Font Sans (Body, Navigation, Tables)**:
  - Font: `Manrope` (Next.js font variable: `--font-sans`)
  - Features: `font-feature-settings: "tnum" 1, "ss01" 1; letter-spacing: 0;`
  - Fallback: `system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif`
- **Font Display (Headings, KPIs, Brand)**:
  - Font: `Sora` (Next.js font variable: `--font-display`, utility class: `font-display`)
  - Weight: 600 (Semibold), 700 (Bold)
  - Applications:
    - Main Dashboard Title: `font-display text-3xl font-bold leading-[1.08] sm:text-4xl`
    - MetricBand Numbers: `font-display text-[38px] font-bold leading-none`
    - BrandMark "C": `font-display text-lg font-bold`
    - Section Headings: `font-display text-lg font-bold`

---

## UI Primitives Audit & Parity Matrix

### Component Inventory Matrix

| Component | In `ceibo_ref` | In `ceibo_ai` | Current Discrepancy | Required Action for Workers |
|---|---|---|---|---|
| `Button` | `src/components/ui/button.tsx` | `src/components/ui/button.tsx` | None. Already implements `variant="primary"` (terracotta + `shadow-action`), `variant="secondary"` (default), `variant="outline"`, `variant="ghost"`, sizes `default`, `sm`, `lg`, `icon`, `icon-sm`, `icon-lg`, and `active:translate-y-px`. | **Ready to use.** No changes required. |
| `Badge` | `src/components/ui/badge.tsx` | `src/components/ui/badge.tsx` | **High discrepancy.** `ceibo_ai` uses hardcoded `slate-900`, `slate-100`, `brand-100`, and `rounded-full` instead of `rounded-md` with OKLCH tokens (`primary`, `secondary`, `destructive`, `outline`, `success`, `ceibo`). | **Refactor `badge.tsx`** to use reference tokens and `rounded-md` radius. |
| `Card` | `src/components/ui/card.tsx` | `src/components/ui/card.tsx` | **Medium discrepancy.** `ceibo_ai` uses `border-slate-200 bg-white text-slate-950 shadow-sm`, `text-slate-900`, `text-slate-500` instead of `border-border bg-card text-card-foreground shadow` / `shadow-panel`. | **Refactor `card.tsx`** to map to semantic tokens. |
| `Input` | `src/components/ui/input.tsx` | *Missing* | `ceibo_ai` has no `input.tsx`; pages use inline `<input>` with inconsistent classes. | **Create `input.tsx`** following reference implementation. |
| `Table` | `src/components/ui/table.tsx` | *Missing* | `ceibo_ai` has no `table.tsx`; `/inbox` and `/documents` use raw HTML tables. | **Create `table.tsx`** with `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`. |
| `Tabs` | `src/components/ui/tabs.tsx` | *Missing* | `/settings` and `/inbox` implement manual tab buttons with inconsistent styles. | **Create simple pure-React `tabs.tsx`** or use standard utility pattern for tabs. |
| `MetricBand` | Inlined in `index.tsx` | Replaced by legacy `metrics-grid.tsx` | `ceibo_ai` uses separate card boxes with colored circular icon backgrounds (`MessageSquare`, `Clock`, etc.) instead of the unified single 4-column card with top colored indicator strips and Sora 38px numbers. | **Create `src/components/dashboard/metric-band.tsx`** replicating reference DOM. |
| `ActivityChart` | Inlined in `index.tsx` | Split into `analytics-chart.tsx` & `chart-view.tsx` | `ceibo_ai` uses separate card with indigo line (`#6366F1`) instead of terracotta line (`var(--ceibo)`) and emerald line (`var(--success)`), with standard tooltip instead of reference `ActivityTooltip`. | **Update `ActivityChart`** to 1:1 match reference layout and color tokens. |
| `SecurityFooter` | Inlined in `index.tsx` | Inlined legacy footer in `page.tsx` | Legacy footer uses white card with link button instead of reference `border-accent/20 bg-accent/5` banner with `ShieldCheck` in `bg-accent`, `[CEI-AR-7F42A9]` code, and `LockKeyhole` protection pill. | **Update SecurityFooter** to 1:1 match reference. |

---

## Worker Blueprint: Ready-to-Use Component Implementations

To ensure Workers can quickly implement missing primitives without adding third-party Radix dependencies, here are the exact specifications:

### 1. Refactored `Badge` (`src/components/ui/badge.tsx`)

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'success' | 'ceibo' | 'warning';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
    primary: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
    outline: 'text-foreground border border-border',
    success: 'border border-success/25 bg-success/10 text-success font-semibold',
    ceibo: 'border border-ceibo/25 bg-ceibo-soft text-ceibo font-bold',
    warning: 'border border-amber-500/20 bg-amber-500/10 text-amber-700 font-medium',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
```

### 2. Refactored `Card` (`src/components/ui/card.tsx`)

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl border border-border bg-card text-card-foreground shadow-panel', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-display font-bold leading-none tracking-tight text-foreground', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';
```

### 3. New `Input` Primitive (`src/components/ui/input.tsx`)

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
```

### 4. New `Table` Primitive (`src/components/ui/table.tsx`)

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b border-border bg-secondary/30', className)} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
);
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('border-b border-border transition-colors hover:bg-secondary/50 data-[state=selected]:bg-muted', className)}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn('h-11 px-4 text-left align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider', className)}
      {...props}
    />
  )
);
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('p-4 align-middle text-sm text-foreground', className)} {...props} />
  )
);
TableCell.displayName = 'TableCell';
```

---

## Dashboard (M2) 1:1 Target Specifications

### 1. Header Section
```tsx
<div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
  <div>
    <div className="mb-3 flex items-center gap-2">
      <span className="inline-flex h-7 items-center gap-2 rounded-full border border-success/25 bg-success/10 px-2.5 text-xs font-bold text-success">
        <span className="live-pulse size-2 rounded-full bg-success" /> En Vivo
      </span>
      <span className="text-xs text-muted-foreground">Actualizado hace 2 min</span>
    </div>
    <h1 className="max-w-[22ch] font-display text-3xl font-bold leading-[1.08] sm:text-4xl text-foreground">
      Dashboard de Rendimiento WhatsApp
    </h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
      Métricas comerciales en tiempo real para Ceibo AI Tech Solutions (ENTERPRISE)
    </p>
  </div>
  <div className="flex flex-wrap gap-2">
    <Button aria-label="Actualizar métricas" onClick={loadDashboardData}>
      <RefreshCw className={`size-4 ${loadingData ? 'animate-spin' : ''}`} />
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

### 2. `MetricBand` Component
```tsx
const metrics = [
  {
    label: 'Volumen de Consultas',
    value: summary.totalConsultas.toLocaleString('es-AR'),
    detail: '+18.4% vs. mes anterior',
    note: 'Últimos 30 días de actividad WhatsApp',
    tone: 'success' as const,
  },
  {
    label: 'Horas Ahorradas',
    value: `${summary.horasAhorradas.toFixed(1)} h`,
    detail: '12 min promedio ahorrado por chat',
    note: `Equivale a ~${(summary.horasAhorradas / 160).toFixed(1)} asesores FTE de ventas liberados`,
    tone: 'neutral' as const,
  },
  {
    label: 'Tasa de Resolución IA',
    value: `${summary.tasaResolucionIA}%`,
    detail: `${summary.totalIA.toLocaleString('es-AR')} resueltas por IA`,
    note: 'Sin intervención de asesor humano',
    tone: 'success' as const,
  },
  {
    label: 'Derivadas a Humano',
    value: summary.totalHuman.toLocaleString('es-AR'),
    detail: `${100 - summary.tasaResolucionIA}% escaladas a cierre`,
    note: 'Leads calificados para asesor comercial',
    tone: 'ceibo' as const,
  },
];

export function MetricBand({ metrics }) {
  return (
    <section aria-label="Métricas principales" className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-panel">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-border">
        {metrics.map((metric, index) => (
          <article
            key={metric.label}
            className={`relative min-h-48 p-5 ${
              index < 2 ? 'border-b border-border xl:border-b-0' : ''
            } ${index % 2 === 0 ? 'sm:border-r sm:border-border xl:border-r-0' : ''}`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 ${
                metric.tone === 'ceibo'
                  ? 'bg-ceibo'
                  : metric.tone === 'success'
                  ? 'bg-success'
                  : 'bg-foreground/20'
              }`}
            />
            <p className="text-sm font-bold text-muted-foreground">{metric.label}</p>
            <p
              className={`mt-3 font-display text-[38px] font-bold leading-none ${
                metric.tone === 'ceibo' ? 'text-ceibo' : 'text-foreground'
              }`}
            >
              {metric.value}
            </p>
            <p
              className={`mt-3 text-xs font-bold ${
                metric.tone === 'success'
                  ? 'text-success'
                  : metric.tone === 'ceibo'
                  ? 'text-ceibo'
                  : 'text-foreground/70'
              }`}
            >
              {metric.detail}
            </p>
            <p className="mt-2 max-w-[27ch] text-[11px] leading-4 text-muted-foreground">{metric.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
```

### 3. `ActivityChart` Component
```tsx
function ActivityTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 shadow-panel">
      <p className="mb-1.5 text-xs font-bold">{label}</p>
      {payload.map((item: any) => (
        <p key={item.name} className="text-[11px] text-muted-foreground">
          <span className="font-bold text-foreground">{item.value}</span> {item.name}
        </p>
      ))}
    </div>
  );
}

export function ActivityChart({ data }) {
  return (
    <section className="mt-5 border border-border bg-card p-5 shadow-panel sm:p-6 rounded-lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="size-5 text-primary" strokeWidth={1.8} />
            <h2 className="font-display text-lg font-bold text-foreground">Evolución de consultas</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Últimos 30 días · Actividad WhatsApp</p>
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
      <div className="mt-5 h-[310px] w-full" aria-label="Gráfico de consultas resueltas por IA y derivadas a humano">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
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
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} interval={4} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
            <Tooltip content={<ActivityTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
            <Area isAnimationActive={false} type="monotone" dataKey="ai" name="resueltas por IA" stroke="var(--success)" strokeWidth={2.5} fill="url(#aiFill)" activeDot={{ r: 4, fill: "var(--success)", stroke: "var(--card)", strokeWidth: 2 }} />
            <Area isAnimationActive={false} type="monotone" dataKey="human" name="derivadas a humano" stroke="var(--ceibo)" strokeWidth={2.5} fill="url(#humanFill)" activeDot={{ r: 4, fill: "var(--ceibo)", stroke: "var(--card)", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
```

### 4. `SecurityFooter` Component
```tsx
<footer className="mt-5 flex flex-col gap-3 border border-accent/20 bg-accent/5 p-4 sm:flex-row sm:items-center rounded-lg">
  <div className="grid size-10 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
    <ShieldCheck className="size-5" strokeWidth={1.8} />
  </div>
  <div className="min-w-0">
    <p className="text-sm font-bold text-foreground">Seguridad multi-tenant activa</p>
    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
      Todas las consultas y registros están aislados criptográficamente para la empresa{' '}
      <span className="font-bold text-foreground">[CEI-AR-7F42A9]</span>.
    </p>
  </div>
  <div className="ml-auto hidden items-center gap-2 text-xs font-semibold text-success md:flex">
    <LockKeyhole className="size-4" /> Protección verificada
  </div>
</footer>
```

---

## Inner Pages (M3) Reskin Guide

| Route | Key Elements to Update | Recommended Semantic Class Replacement |
|---|---|---|
| `/inbox` | Search input, filter dropdown, status tabs, leads table, action button | Replace `border-slate-200 bg-white` with `Card` (`bg-card border-border shadow-panel`). Replace custom table with `Table` primitive. Tab filters use `border-b-2 border-primary text-primary font-bold`. Lead status chips use `Badge variant="success"`, `Badge variant="destructive"`. Action buttons use `Button size="sm"` (secondary outline). |
| `/chats` | Split-pane chat layout, session list, search bar, message bubbles, send input | Chat container: `border border-border rounded-xl bg-card shadow-panel`. Left session list: active session uses `bg-secondary border-l-4 border-l-primary`. User avatars use `bg-accent text-accent-foreground`. Outgoing agent messages use `bg-primary text-primary-foreground shadow-action`. Bot messages use `bg-secondary text-foreground`. Input uses `Input` with send button `Button variant="primary" size="icon"`. |
| `/documents` | Drag-and-drop upload zone, active documents table, status badges, delete action | Upload container: `Card border-2 border-dashed border-border bg-secondary/30 hover:border-primary/50`. Active files list: `Table` with `TableHead`, `TableRow hover:bg-secondary/40`. File icon uses `text-primary`. Status badges use `Badge variant="success"` ("Listo"), `Badge variant="warning"` ("Procesando"), `Badge variant="destructive"` ("Error"). |
| `/settings` | Vertical navigation tabs, tenant profile card, WhatsApp credentials form, team table | Tabs container: active tab uses `bg-secondary text-foreground font-semibold`. Form fields use `Input` with `border-input focus:ring-ring`. Save buttons use `Button variant="primary"` (`shadow-action`). Section cards use `Card` with `CardHeader`, `CardTitle font-display`. |
| `/login` | Center card, logo icon, tenant switcher buttons, email/password inputs, login submit | Card uses `Card max-w-md shadow-panel border-border bg-card`. Top brand icon uses `BrandMark` tile or `size-12 rounded-lg bg-primary font-display text-primary-foreground shadow-action`. Submit button uses `Button variant="primary" className="w-full"`. Fast tenant switch buttons use `Button variant="outline" size="sm"`. |

---

## Conclusion & Next Steps for Teamwork Workers

1. **M1 Primitives Completion**:
   - Update `src/components/ui/badge.tsx` with reference semantic tokens.
   - Update `src/components/ui/card.tsx` to remove hardcoded `slate-*` colors.
   - Add `src/components/ui/input.tsx` and `src/components/ui/table.tsx`.
2. **M2 Dashboard Visual Parity**:
   - Rewrite `src/app/page.tsx` and create `src/components/dashboard/metric-band.tsx` and `activity-chart.tsx` matching the specifications above.
3. **M3 Inner Pages Reskin**:
   - Reskin `/inbox`, `/chats`, `/documents`, `/settings`, and `/login` leveraging the unified tokens and primitives.
4. **Validation**:
   - Run `npx tsc --noEmit` and `npm run test:e2e` (all 89 tests must pass).
