# Comprehensive Specification Report: App Shell, Layout, Navigation & Design System

**Target Reference**: `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ref`  
**Miner Archetype**: `spec_miner_survey_2` (Layout Reference Spec Miner)  
**Date**: 2026-09-12  
**Status**: Authoritative & Verified  

---

## 1. Executive Summary & Specification Scope

This document provides the exhaustive specification for replicating the App Shell, Layout, Navigation, and Design System of the reference application (`ceibo_ref`) into the target Next.js application (`ceibo_ai`).

Every DOM element, Tailwind CSS class, Lucide icon, typography setting, responsive breakpoint, and color token has been directly mined from the reference source code:
- `ceibo_ref/src/styles.css` (Tailwind v4 theme definitions, OKLCH color palette, keyframe animations, typography utilities)
- `ceibo_ref/src/routes/__root.tsx` (Root shell, Google Fonts font loading, metadata)
- `ceibo_ref/src/routes/index.tsx` (App Shell DOM, Sidebar, Topbar, BrandMark, MetricBand, ActivityChart, Security Footer)
- `ceibo_ref/src/components/ui/button.tsx` (Button variants, shadows, hover/active interactions)
- `ceibo_ref/src/routes/README.md` & `package.json` (Route conventions, dependency inventory)

---

## 2. Design System & Tokens Specification

The reference project defines a distinct, high-contrast, premium industrial aesthetic centered on the Argentine Ceibo flower (deep terracotta/brick red) combined with dark forest pine green (`oklch(0.244 0.028 169.1)`), warm off-white cream background (`oklch(0.976 0.006 145.1)`), and emerald green for operational status.

### 2.1 Typography

| Token | Family / Rule | Google Font / Source | Usage |
|---|---|---|---|
| `--font-sans` | `"Manrope", sans-serif` | `weights: 400, 500, 600, 700` | Body text, labels, general UI |
| `--font-display` | `"Sora", sans-serif` | `weights: 500, 600, 700` | Brand logo "C", brand titles, metric numbers, section headings, avatar initials |
| Font Features | `font-feature-settings: "tnum" 1, "ss01" 1;` | CSS base layer on `body` | Tabular figures for numbers and alternate glyphs |
| Letter Spacing | `letter-spacing: 0;` | CSS base layer on `body` | Tight, crisp typography |
| Tap Highlight | `-webkit-tap-highlight-color: transparent;` | CSS base layer on `button, a` | Clean mobile touch interactions |

**Next.js Implementation (`src/app/layout.tsx`)**:
```tsx
import { Manrope, Sora } from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});

const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  fallback: ['ui-sans-serif', 'sans-serif'],
});
```

---

### 2.2 Color Palette (Light Mode - Primary Target)

All colors in `ceibo_ref` are specified natively in `oklch`. Below is the exact definition alongside computed 24-bit sRGB hex and RGB equivalents:

| Semantic Token | OKLCH Value | Computed Hex | RGB | Semantic Role & UI Placement |
|---|---|---|---|---|
| `--primary` / `--ceibo` | `oklch(0.555 0.163 33.5)` | `#bf442b` | `rgb(191, 68, 43)` | Ceibo terracotta red; Brand logo tile, primary CTA button, active counters, indicator bands |
| `--primary-foreground` | `oklch(0.982 0.006 145.1)` | `#f7faf7` | `rgb(247, 250, 247)` | Crisp off-white text on primary background |
| `--ceibo-soft` | `oklch(0.94 0.025 36.5)` | `#fbe6e0` | `rgb(251, 230, 224)` | Light peach/terracotta badge background ("ENTERPRISE" pill) |
| `--sidebar` | `oklch(0.244 0.028 169.1)` | `#12251e` | `rgb(18, 37, 30)` | Deep forest pine dark background for the fixed sidebar |
| `--sidebar-foreground` | `oklch(0.922 0.008 147.2)` | `#e2e7e2` | `rgb(226, 231, 226)` | Muted sage text for inactive sidebar nav items |
| `--sidebar-accent` | `oklch(0.368 0.041 166.1)` | `#29463a` | `rgb(41, 70, 58)` | Active nav item background, bot status box background, avatar tile |
| `--sidebar-accent-foreground` | `oklch(0.982 0.006 145.1)` | `#f7faf7` | `rgb(247, 250, 247)` | Active nav item text, brand name text, bot status title |
| `--sidebar-border` | `oklch(1 0 0 / 12%)` | `rgba(255,255,255,0.12)` | - | Divider border above bot status box |
| `--background` | `oklch(0.976 0.006 145.1)` | `#f5f8f5` | `rgb(245, 248, 245)` | Page canvas background (subtle warm sage cream) |
| `--foreground` | `oklch(0.244 0.028 169.1)` | `#12251e` | `rgb(18, 37, 30)` | Main body and heading text (deep forest charcoal) |
| `--card` / `--popover` | `oklch(1 0 0)` | `#ffffff` | `rgb(255, 255, 255)` | Pure white card surfaces, buttons, tooltips |
| `--card-foreground` | `oklch(0.244 0.028 169.1)` | `#12251e` | `rgb(18, 37, 30)` | Card text |
| `--secondary` / `--muted` | `oklch(0.922 0.008 147.2)` | `#e2e7e2` | `rgb(226, 231, 226)` | Hover background for secondary buttons, subtle pill backgrounds |
| `--muted-foreground` | `oklch(0.494 0.025 167.3)` | `#54665f` | `rgb(84, 102, 95)` | Subtitle text, table captions, chart axis tick labels |
| `--accent` | `oklch(0.368 0.041 166.1)` | `#29463a` | `rgb(41, 70, 58)` | Security footer accent background, avatar background |
| `--accent-foreground` | `oklch(0.982 0.006 145.1)` | `#f7faf7` | `rgb(247, 250, 247)` | Text on accent background |
| `--border` / `--input` | `oklch(0.87 0.009 147.4)` | `#d0d6d1` | `rgb(208, 214, 209)` | Topbar border, card borders, grid dividing lines |
| `--ring` | `oklch(0.555 0.163 33.5)` | `#bf442b` | `rgb(191, 68, 43)` | Focus ring |
| `--success` | `oklch(0.49 0.103 162.1)` | `#0e724e` | `rgb(14, 114, 78)` | Operational status indicator, live status badge, WhatsApp connected indicator |
| `--success-foreground` | `oklch(0.982 0.006 145.1)` | `#f7faf7` | `rgb(247, 250, 247)` | Text on success background |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `#e7000b` | `rgb(231, 0, 11)` | Error / destructive actions |
| `--grid-line` | `oklch(0.87 0.009 147.4 / 62%)` | `rgba(208,214,209,0.62)` | - | Chart cartesian horizontal grid lines |

---

### 2.3 Dark Mode Tokens (Full Reference)

| Token | OKLCH Value | Computed Hex |
|---|---|---|
| `--background` | `oklch(0.129 0.042 264.695)` | `#020618` |
| `--foreground` | `oklch(0.984 0.003 247.858)` | `#f8fafc` |
| `--card` / `--popover` | `oklch(0.208 0.042 265.755)` | `#0f172b` |
| `--primary` | `oklch(0.929 0.013 255.508)` | `#e2e8f0` |
| `--secondary` / `--muted` | `oklch(0.279 0.041 260.031)` | `#1d293d` |
| `--muted-foreground` | `oklch(0.704 0.04 256.788)` | `#90a1b9` |
| `--accent` | `oklch(0.279 0.041 260.031)` | `#1d293d` |
| `--destructive` | `oklch(0.704 0.191 22.216)` | `#ff6467` |
| `--border` | `oklch(1 0 0 / 10%)` | `rgba(255, 255, 255, 0.1)` |
| `--input` | `oklch(1 0 0 / 15%)` | `rgba(255, 255, 255, 0.15)` |
| `--ring` | `oklch(0.551 0.027 264.364)` | `#6a7282` |
| `--sidebar` | `oklch(0.208 0.042 265.755)` | `#0f172b` |
| `--sidebar-foreground` | `oklch(0.984 0.003 247.858)` | `#f8fafc` |
| `--sidebar-primary` | `oklch(0.488 0.243 264.376)` | `#1447e6` |
| `--sidebar-accent` | `oklch(0.279 0.041 260.031)` | `#1d293d` |
| `--sidebar-border` | `oklch(1 0 0 / 10%)` | `rgba(255, 255, 255, 0.1)` |

---

### 2.4 Shadows & Border Radii

- **Shadows**:
  - `--shadow-action`: `0 4px 0 oklch(0.41 0.117 33.5)` (computed: `0 4px 0 #7d2c1b`). This creates the signature hard retro drop-shadow under the BrandMark and primary action buttons.
  - `--shadow-panel`: `0 16px 44px -34px oklch(0.244 0.028 169.1 / 42%)` (soft deep ambient elevation on cards and metric bands).
- **Border Radii**:
  - `--radius`: `0.5rem` (8px base)
  - `rounded-sm`: 4px
  - `rounded-md`: 6px
  - `rounded-lg`: 8px
  - `rounded-xl`: 12px
  - `rounded-2xl`: 16px

---

### 2.5 Keyframe Animations & Utilities

```css
@utility font-display {
  font-family: var(--font-display);
}

@utility live-pulse {
  animation: live-pulse 1.8s ease-in-out infinite;
}

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

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

---

## 3. Layout Architecture & App Shell Specification

### 3.1 Outer Layout Hierarchy

```
<div id="dashboard" class="min-h-screen bg-background text-foreground">
  ├── <Sidebar />                          [Fixed aside: w-[252px], hidden on mobile, flex on lg:]
  └── <div class="lg:pl-[252px]">          [Main column offset by 252px on desktop]
        ├── <Topbar />                     [Sticky header: min-h-16, backdrop-blur-md, border-b]
        └── <main class="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 xl:px-8 xl:py-8">
              ├── [Page Content / Children]
              └── [Mobile Bottom Bar: hidden on desktop, flex on < lg]
```

### 3.2 Responsive Breakpoints Contract

- **Mobile (< 1024px / `< lg`)**:
  - Desktop sidebar is hidden (`hidden lg:flex`).
  - Topbar reveals mobile brand mark: `<BrandMark />` + `"Ceibo AI"` text (`lg:hidden`).
  - Main content padding: `px-4 py-6`.
  - Mobile bottom indicator shows: `<span class="live-pulse ..."></span> Bot WhatsApp operativo 24/7` + `<CircleUserRound />`.
- **Desktop (>= 1024px / `lg:`)**:
  - Desktop sidebar is visible (`fixed inset-y-0 left-0 z-30 w-[252px] flex flex-col`).
  - Content offset: `lg:pl-[252px]`.
  - Topbar hides mobile brand mark (`lg:hidden`).
  - Container padding: `sm:px-6 xl:px-8 xl:py-8`, constrained to `max-w-[1500px]`.

---

## 4. Component Specification: Sidebar

### 4.1 Root Element & Geometry
- **Tag**: `<aside>`
- **Classes**: `fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col bg-sidebar text-sidebar-foreground lg:flex`
- **Computed Dimensions**: Exact width of `252px`, fixed height `100vh`, pinned to `top: 0, left: 0, bottom: 0`.

### 4.2 Brand Header Section
- **DOM Hierarchy**:
  ```html
  <div class="flex items-center gap-3 px-6 py-7">
    <!-- BrandMark -->
    <div class="grid size-11 shrink-0 place-items-center rounded-md bg-primary font-display text-lg font-bold text-primary-foreground shadow-action">
      C
    </div>
    <!-- Brand Typography -->
    <div>
      <p class="font-display text-[17px] font-bold leading-none text-sidebar-accent-foreground">
        Ceibo AI
      </p>
      <p class="mt-1 text-[11px] font-medium text-sidebar-foreground/55">
        Ventas por WhatsApp
      </p>
    </div>
  </div>
  ```
- **Key Details**:
  - Brand logo tile is `size-11` (44px x 44px) with `rounded-md` (6px radius).
  - Letter "C" is in `font-display` (`Sora`), `text-lg font-bold`, with hard drop-shadow `shadow-action`.
  - Title is `font-display text-[17px] font-bold leading-none text-sidebar-accent-foreground`.
  - Subtitle has opacity: `text-[11px] font-medium text-sidebar-foreground/55`.
  - Padding is `px-6 py-7` (24px horizontal, 28px vertical). **No bottom border line.**

### 4.3 Navigation Section
- **DOM Hierarchy**:
  ```html
  <nav aria-label="Navegación principal" class="space-y-1 px-3">
    <!-- Navigation Links -->
  </nav>
  ```
- **Navigation Items Array**:
  | Item Label | Lucide Icon | Stroke Width | Target Route | Dynamic Badge |
  |---|---|---|---|---|
  | `Dashboard` | `Gauge` | `1.8` | `/` | None |
  | `Inbox` | `Inbox` | `1.8` | `/inbox` | `count: "24"` (badge) |
  | `Chats` | `MessageCircleMore` | `1.8` | `/chats` | None |
  | `Base de Conocimiento` | `BookOpen` | `1.8` | `/documents` | None |
  | `Configuración` | `Settings` | `1.8` | `/settings` | None |

- **Link State Styling**:
  - **Base Container**: `flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors`
  - **Active State (`aria-current="page"`)**:
    - `bg-sidebar-accent text-sidebar-accent-foreground`
    - (Visual: `#29463a` background with `#f7faf7` text).
  - **Inactive State**:
    - `text-sidebar-foreground/65 hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground`
    - (Visual: 65% opacity sage text, hover tinted `#29463a` at 55% opacity).
  - **Icon Element**:
    - `<Icon className="size-[18px]" strokeWidth={1.8} />`
  - **Label Element**:
    - `<span>{item.label}</span>`
  - **Badge Element (when present, e.g. Inbox count)**:
    - `<span class="ml-auto rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">{item.count}</span>`
    - (Visual: rounded-full pill with primary brick red `#bf442b` and off-white text).

### 4.4 Bot WhatsApp Operational Status Card (Sidebar Footer)
- **DOM Hierarchy**:
  ```html
  <div class="mt-auto p-4">
    <div class="border-t border-sidebar-border pt-4">
      <div class="flex items-start gap-3 rounded-md bg-sidebar-accent/65 p-3.5">
        <div class="relative mt-0.5">
          <Bot class="size-5 text-sidebar-accent-foreground" strokeWidth={1.8} />
          <span class="live-pulse absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-sidebar-accent bg-success"></span>
        </div>
        <div>
          <p class="text-xs font-bold text-sidebar-accent-foreground">Bot WhatsApp</p>
          <p class="mt-1 text-[11px] font-semibold text-success">Operativo</p>
          <p class="mt-1 text-[11px] leading-4 text-sidebar-foreground/55">
            Atención comercial automatizada activa 24/7
          </p>
        </div>
      </div>
    </div>
  </div>
  ```
- **Key Details**:
  - Fixed to bottom via `mt-auto`.
  - Divider is `border-t border-sidebar-border pt-4` where `border-sidebar-border` is white at 12% opacity.
  - Background is `bg-sidebar-accent/65` (pine green at 65% opacity).
  - Bot icon is `size-5` (20px) with `strokeWidth={1.8}`.
  - Live pulse indicator is `size-2.5` (10px), rounded-full, background `bg-success` (`#0e724e`), border `border-2 border-sidebar-accent`, positioned `-right-1 -top-1` with `live-pulse` infinite animation.
  - State text "Operativo" is `text-[11px] font-semibold text-success`.

---

## 5. Component Specification: Topbar / Navbar

### 5.1 Root Element & Geometry
- **Tag**: `<header>`
- **Classes**: `sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md`
- **Inner Container**: `div.flex.min-h-16.items-center.gap-3.px-4.sm:px-6.xl:px-8` (height: 64px min-height, sticky positioned with backdrop blur).

### 5.2 Mobile Brand (Visible on `< lg` only)
- **DOM Hierarchy**:
  ```html
  <div class="flex items-center gap-2 lg:hidden">
    <!-- BrandMark -->
    <div class="grid size-11 shrink-0 place-items-center rounded-md bg-primary font-display text-lg font-bold text-primary-foreground shadow-action">
      C
    </div>
    <span class="hidden font-display text-sm font-bold sm:block">Ceibo AI</span>
  </div>
  ```

### 5.3 Tenant Identity & WhatsApp Channel Status
- **DOM Hierarchy**:
  ```html
  <div class="min-w-0">
    <div class="flex items-center gap-2">
      <p class="truncate text-sm font-bold">{tenantName}</p>
      <span class="hidden rounded bg-ceibo-soft px-2 py-1 text-[10px] font-bold text-ceibo sm:inline">
        ENTERPRISE
      </span>
    </div>
    <div class="mt-0.5 hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
      <MessageCircleMore class="size-3.5 text-success" />
      <span>+54 9 11 5482-0916</span>
      <span class="size-1 rounded-full bg-border"></span>
      <span class="font-semibold text-success">Conectado</span>
    </div>
  </div>
  ```
- **Key Details**:
  - Tenant name is `truncate text-sm font-bold` (e.g., "Ceibo AI Tech Solutions").
  - Plan badge is `rounded bg-ceibo-soft px-2 py-1 text-[10px] font-bold text-ceibo sm:inline` (soft terracotta background with brick red text).
  - WhatsApp metadata line has `MessageCircleMore` icon (`size-3.5 text-success`), channel phone number, `size-1 rounded-full bg-border` separator dot, and `"Conectado"` in `font-semibold text-success`.

### 5.4 User Profile & Action Menu (Right Side)
- **DOM Hierarchy**:
  ```html
  <div class="ml-auto flex items-center gap-3 border-l border-border pl-3">
    <div class="hidden text-right md:block">
      <p class="text-xs font-bold">{userName}</p>
      <p class="mt-0.5 text-[11px] text-muted-foreground">{userEmail}</p>
    </div>
    <div class="grid size-9 place-items-center rounded-md bg-accent font-display text-xs font-bold text-accent-foreground">
      {userInitials}
    </div>
    <ChevronDown class="hidden size-4 text-muted-foreground sm:block" />
  </div>
  ```
- **Key Details**:
  - Separated from left section by `border-l border-border pl-3`.
  - User details (name and email) shown on `md:block` and right-aligned.
  - Avatar tile is `size-9` (36px x 36px) with `rounded-md`, background `bg-accent` (`#29463a`), text `text-accent-foreground` (`#f7faf7`), `font-display text-xs font-bold` with uppercase initials (e.g., "GV" or "SR").
  - `ChevronDown` is `size-4 text-muted-foreground`.

---

## 6. Button Component Specification (`components/ui/button.tsx`)

The Button component defines the primary interaction language of Ceibo AI:

```tsx
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-[background-color,border-color,color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border border-primary bg-primary text-primary-foreground shadow-action hover:bg-primary/90",
        primary: "border border-primary bg-primary text-primary-foreground shadow-action hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-card text-foreground hover:border-primary/35 hover:bg-secondary",
        secondary: "border border-border bg-card text-foreground hover:border-primary/35 hover:bg-secondary",
        ghost: "border border-transparent bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-3.5",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6",
        icon: "size-10 p-0",
        "icon-sm": "size-8 p-0",
        "icon-lg": "size-11 p-0",
      },
    },
    defaultVariants: { variant: "secondary", size: "default" },
  },
);
```

**Crucial Visual Insight**:
1. Default variant is `secondary` (`border border-border bg-card text-foreground hover:border-primary/35 hover:bg-secondary`). Standard action buttons (like "Actualizar" and "Ver Chats") render as clean white card buttons with borders.
2. The primary CTA button uses `variant="primary"` (or `default`), giving it the bold terracotta red background and signature `shadow-action` (`0 4px 0 oklch(0.41 0.117 33.5)`).
3. Active click effect: `active:translate-y-px` gives buttons tactile physical feedback.

---

## 7. Discovered Features & Edge Cases

### 7.1 Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Layout | Fixed Desktop Sidebar | 252px wide dark pine navigation sidebar fixed on desktop | Viewport >= 1024px (`lg:`) | DOM `<aside>` element with fixed styling | Hidden when viewport < 1024px | `ceibo_ref/src/routes/index.tsx:103-155` |
| 2 | Layout | Responsive Content Offset | Main content padded left by 252px on desktop to accommodate fixed sidebar | Viewport >= 1024px | `lg:pl-[252px]` class on container | No offset on mobile / tablet | `ceibo_ref/src/routes/index.tsx:271` |
| 3 | Layout | Sticky Topbar | Header pinned to top with 95% opacity and backdrop blur | Scroll position | DOM `<header>` with `sticky top-0 z-20` | Content scrolls smoothly beneath | `ceibo_ref/src/routes/index.tsx:157-187` |
| 4 | Layout | Mobile Brand Fallback | Topbar renders BrandMark tile on `< lg` screens | Viewport < 1024px | `<div class="lg:hidden">` containing BrandMark | Hidden on desktop `lg:` | `ceibo_ref/src/routes/index.tsx:161-164` |
| 5 | Navigation | Active Nav Link State | Dark pine accent background with high-contrast text | `item.active === true` or matching pathname | `bg-sidebar-accent text-sidebar-accent-foreground` | Inactive links render muted with hover state | `ceibo_ref/src/routes/index.tsx:122-126` |
| 6 | Navigation | Unread Counter Badge | Primary red pill badge for items with counts | `item.count: string` (e.g., "24") | `span.rounded-full.bg-primary` with count text | Null / omitted when no count | `ceibo_ref/src/routes/index.tsx:130-132` |
| 7 | Layout | WhatsApp Bot Status Box | Live operational heartbeat widget at bottom of sidebar | Real-time connection status | Status card with pulsing green dot | Falls back to static indicator if animation disabled | `ceibo_ref/src/routes/index.tsx:138-152` |
| 8 | Layout | Mobile Status Bar | Compact operational bar at bottom of mobile view | Viewport < 1024px | `div.lg:hidden` with bot status and user icon | Hidden on desktop `lg:` | `ceibo_ref/src/routes/index.tsx:308-311` |
| 9 | Branding | BrandMark Component | 44x44px rounded primary tile with bold "C" and retro shadow | None | `div.size-11.bg-primary.shadow-action` | Rigid dimensions prevent deformation | `ceibo_ref/src/routes/index.tsx:95-100` |
| 10 | Branding | Enterprise Plan Pill | Soft terracotta rounded badge displaying ENTERPRISE | Tenant plan string | `span.bg-ceibo-soft.text-ceibo` | Hidden on xs mobile (`sm:inline`) | `ceibo_ref/src/routes/index.tsx:168` |
| 11 | Typography | Google Fonts Pair | Manrope (sans) + Sora (display) loaded with tabular numbers | Google Fonts CDN / Next Font | CSS variables `--font-sans` & `--font-display` | System font fallbacks | `ceibo_ref/src/routes/__root.tsx:97` |
| 12 | Design System | OKLCH Theme Architecture | Full color space defined via CSS custom properties in OKLCH | Theme variables | Utility classes `bg-sidebar`, `text-primary`, etc. | Fallback hex values available | `ceibo_ref/src/styles.css:21-149` |
| 13 | Design System | Hard Action Drop Shadow | Retro 4px solid drop shadow for buttons and tiles | `shadow-action` | `box-shadow: 0 4px 0 oklch(0.41 0.117 33.5)` | None | `ceibo_ref/src/styles.css:99` |
| 14 | Design System | Live Pulse Animation | 1.8s ease-in-out pulsating keyframe for green indicators | `live-pulse` class | CSS animation with scale and opacity pulse | Respects prefers-reduced-motion | `ceibo_ref/src/styles.css:171-178` |
| 15 | Components | CVA Button Variants | Standardized button component with secondary as default | Variant & size props | Styled HTML button | Defaults to secondary (card style) | `ceibo_ref/src/components/ui/button.tsx` |

### 7.2 Edge Cases & Observed Behavior

| # | Feature | Input / Condition | Observed Behavior |
|---|---|---|---|
| 1 | Sidebar Visibility | Viewport width = 1023px | Sidebar is completely hidden (`hidden lg:flex`). Layout takes full width with `px-4`. |
| 2 | Sidebar Visibility | Viewport width = 1024px | Sidebar becomes visible (`fixed inset-y-0 left-0 w-[252px]`). Main content offset `lg:pl-[252px]` activates. |
| 3 | Topbar Brand | Viewport width = 1024px | Mobile BrandMark in Topbar disappears cleanly; desktop sidebar handles branding. |
| 4 | Long Tenant Name | Long company name (e.g. > 40 chars) | Container has `truncate text-sm font-bold min-w-0`, preventing layout blowout. |
| 5 | Mobile WhatsApp Meta | Viewport width < 640px (`sm:`) | Phone number and connection status hidden (`sm:flex`), preserving room for tenant name and user profile. |
| 6 | User Info on Header | Viewport width < 768px (`md:`) | User name and email hidden (`md:block`), avatar initials tile (`size-9`) remains visible. |
| 7 | Motion Sensitivity | `prefers-reduced-motion: reduce` | `live-pulse` and all animations forced to `animation-duration: 0.01ms !important` via CSS media query. |
| 8 | Nav Item with No Badge | Item without `count` property | Count pill conditionally omitted without leaving empty space or broken layout. |
| 9 | Long Page Scroll | Document scroll height > 2000px | Topbar sticks to top with blur (`sticky top-0 backdrop-blur-md`), sidebar remains locked in place (`fixed inset-y-0`). |
| 10 | Button Active State | Pointer down / click on button | Translates down by 1px (`active:translate-y-px`) for mechanical press feel. |

---

## 8. Concrete Mapping to `ceibo_ai` Next.js Architecture

To achieve a 1:1 visual match with `ceibo_ref`, the following file transformations are specified:

### 8.1 Font Setup (`src/app/layout.tsx`)
- Replace `Inter` and `Space_Grotesk` with `Manrope` and `Sora`:
  - `Manrope`: variable `--font-sans`
  - `Sora`: variable `--font-display`
- Add `h-full bg-background text-foreground` to `<html>` and `<body>`.

### 8.2 Tailwind Configuration (`tailwind.config.ts`)
- Extend colors to include:
  - `sidebar`: `var(--sidebar)`
  - `sidebar-foreground`: `var(--sidebar-foreground)`
  - `sidebar-accent`: `var(--sidebar-accent)`
  - `sidebar-accent-foreground`: `var(--sidebar-accent-foreground)`
  - `sidebar-border`: `var(--sidebar-border)`
  - `ceibo`: `var(--ceibo)`
  - `ceibo-soft`: `var(--ceibo-soft)`
  - `success`: `var(--success)`
  - `success-foreground`: `var(--success-foreground)`
  - `grid-line`: `var(--grid-line)`
- Extend boxShadow:
  - `action`: `var(--shadow-action)`
  - `panel`: `var(--shadow-panel)`
- Extend animation / keyframes:
  - `live-pulse`: `live-pulse 1.8s ease-in-out infinite`

### 8.3 Global Styles (`src/app/globals.css`)
- Inject the exact `:root` OKLCH variables (or fallback hex variables) from `ceibo_ref/src/styles.css`.
- Add `@keyframes live-pulse` and the reduced-motion media query.
- Set body font feature settings: `font-feature-settings: "tnum" 1, "ss01" 1;`.

### 8.4 Sidebar Component (`src/components/layout/sidebar.tsx`)
- Rebuild to match `ceibo_ref/src/routes/index.tsx:103-155`:
  - Fixed aside `w-[252px] bg-sidebar text-sidebar-foreground`.
  - Brand header with 44px "C" BrandMark tile and Sora typography.
  - Nav items:
    - `/` -> "Dashboard" (Icon: `Gauge`)
    - `/inbox` -> "Inbox" (Icon: `Inbox`, badge count "24" or dynamic `pendientesCount`)
    - `/chats` -> "Chats" (Icon: `MessageCircleMore`)
    - `/documents` -> "Base de Conocimiento" (Icon: `BookOpen`)
    - `/settings` -> "Configuración" (Icon: `Settings`)
  - Bottom bot status card with pulsing green dot.
  - Active detection using Next.js `usePathname()`.

### 8.5 Navbar Component (`src/components/layout/navbar.tsx`)
- Rebuild to match `ceibo_ref/src/routes/index.tsx:157-187`:
  - Sticky topbar with `border-b border-border bg-background/95 backdrop-blur-md`.
  - Mobile BrandMark tile for `< lg`.
  - Tenant title + ENTERPRISE soft peach pill.
  - WhatsApp phone number + "Conectado" emerald badge.
  - User initials tile (`GV` or from `useAuth()`) + user name/email.
  - Keep mobile hamburger toggle or slide-out menu integration cleanly on `< lg`.

### 8.6 App Shell Component (`src/components/layout/app-shell.tsx`)
- Coordinate layout:
  - Outer wrapper `min-h-screen bg-background text-foreground`.
  - Fixed desktop `<Sidebar />`.
  - Content container `lg:pl-[252px] flex flex-col min-w-0`.
  - Top `<Navbar />`.
  - `<main class="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 xl:px-8 xl:py-8 flex-1">`.
  - Mobile drawer for `< lg` reusing the exact Sidebar styling.
