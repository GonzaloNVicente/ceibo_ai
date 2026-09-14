# Handoff Report: App Shell, Layout, Navigation & Design System Specification

**Agent**: `spec_miner_survey_2` (Layout Reference Spec Miner)  
**Milestone**: Survey / Exploration  
**Working Directory**: `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\spec_miner_survey_2`  
**Recipient**: `parent` (`b42b3b6f-2ebe-437d-843c-6e3ebc949dd8`)  
**Deliverable**: Detailed specification report in `report.md`  

---

## 1. Observation

1. **Reference Codebase Structure**:
   - `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ref\src\styles.css` (lines 1-183) defines Tailwind v4 CSS variables with OKLCH values, Google Fonts (`Manrope` and `Sora`), `--radius: 0.5rem`, custom utilities `@utility font-display` and `@utility live-pulse`, and keyframes `live-pulse`.
   - `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ref\src\routes\__root.tsx` (lines 75-106) establishes the HTML shell, loading Google Fonts via `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap">`.
   - `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ref\src\routes\index.tsx` (lines 1-316) contains the complete AppShell, Sidebar, Topbar, BrandMark, MetricBand, and ActivityChart implementations. There are no other page routes in `ceibo_ref` (only `src/routes/index.tsx` and `src/routes/__root.tsx`).
   - `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ref\src\components\ui\button.tsx` (lines 1-45) configures `cva` button variants where the default variant is `secondary` (card-styled button with border) and `primary` / `default` utilizes `border border-primary bg-primary text-primary-foreground shadow-action`.

2. **Sidebar Specifications Directly Quoted**:
   - Element: `<aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col bg-sidebar text-sidebar-foreground lg:flex">` (`index.tsx:105`)
   - BrandMark: `<div className="grid size-11 shrink-0 place-items-center rounded-md bg-primary font-display text-lg font-bold text-primary-foreground shadow-action">C</div>` (`index.tsx:97-99`)
   - Brand Title: `<p className="font-display text-[17px] font-bold leading-none text-sidebar-accent-foreground">Ceibo AI</p>` (`index.tsx:109`)
   - Brand Subtitle: `<p className="mt-1 text-[11px] font-medium text-sidebar-foreground/55">Ventas por WhatsApp</p>` (`index.tsx:110`)
   - Nav Items:
     - Dashboard (`Gauge`), active by default: `bg-sidebar-accent text-sidebar-accent-foreground` (`index.tsx:57, 124`)
     - Inbox (`Inbox`), count: "24": `<span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">24</span>` (`index.tsx:58, 131`)
     - Chats (`MessageCircleMore`) (`index.tsx:59`)
     - Base de Conocimiento (`BookOpen`) (`index.tsx:60`)
     - Configuración (`Settings`) (`index.tsx:61`)
   - Bottom Bot Status Card:
     - Container: `<div className="mt-auto p-4"><div className="border-t border-sidebar-border pt-4"><div className="flex items-start gap-3 rounded-md bg-sidebar-accent/65 p-3.5">` (`index.tsx:138-140`)
     - Pulse Indicator: `<span className="live-pulse absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-sidebar-accent bg-success" />` (`index.tsx:143`)
     - Text: `"Bot WhatsApp"`, `"Operativo"`, `"Atención comercial automatizada activa 24/7"` (`index.tsx:146-148`).

3. **Topbar / Navbar Specifications Directly Quoted**:
   - Element: `<header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">` (`index.tsx:159`)
   - Container: `<div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 xl:px-8">` (`index.tsx:160`)
   - Mobile Brand: `<div className="flex items-center gap-2 lg:hidden"><BrandMark /><span className="hidden font-display text-sm font-bold sm:block">Ceibo AI</span></div>` (`index.tsx:161-164`)
   - Tenant Info: `<p className="truncate text-sm font-bold">Ceibo AI Tech Solutions</p>` and `<span className="hidden rounded bg-ceibo-soft px-2 py-1 text-[10px] font-bold text-ceibo sm:inline">ENTERPRISE</span>` (`index.tsx:167-168`)
   - WhatsApp Meta: `<MessageCircleMore className="size-3.5 text-success" /><span>+54 9 11 5482-0916</span><span className="size-1 rounded-full bg-border" /><span className="font-semibold text-success">Conectado</span>` (`index.tsx:171-174`)
   - User Profile: `<div className="ml-auto flex items-center gap-3 border-l border-border pl-3">` with `<p className="text-xs font-bold">Gonzalo Vicente</p>`, `<p className="mt-0.5 text-[11px] text-muted-foreground">gonzalo@ceibo.ai</p>`, `<div className="grid size-9 place-items-center rounded-md bg-accent font-display text-xs font-bold text-accent-foreground">GV</div>`, and `<ChevronDown className="hidden size-4 text-muted-foreground sm:block" />` (`index.tsx:177-184`).

4. **App Shell Wrapper**:
   - Shell Container: `<div id="dashboard" className="min-h-screen bg-background text-foreground">` (`index.tsx:269`)
   - Content Column: `<div className="lg:pl-[252px]">` (`index.tsx:271`)
   - Main Content Area: `<main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 xl:px-8 xl:py-8">` (`index.tsx:273`)

5. **Color Values Computed from OKLCH via Script**:
   - `--primary / --ceibo`: `oklch(0.555 0.163 33.5)` -> `#bf442b` (deep Ceibo flower terracotta red)
   - `--ceibo-soft`: `oklch(0.94 0.025 36.5)` -> `#fbe6e0` (pale soft peach)
   - `--sidebar`: `oklch(0.244 0.028 169.1)` -> `#12251e` (dark forest pine)
   - `--sidebar-accent`: `oklch(0.368 0.041 166.1)` -> `#29463a` (medium forest pine)
   - `--background`: `oklch(0.976 0.006 145.1)` -> `#f5f8f5` (warm cream off-white)
   - `--foreground`: `oklch(0.244 0.028 169.1)` -> `#12251e`
   - `--border`: `oklch(0.87 0.009 147.4)` -> `#d0d6d1`
   - `--success`: `oklch(0.49 0.103 162.1)` -> `#0e724e` (emerald green)
   - `--shadow-action`: `0 4px 0 oklch(0.41 0.117 33.5)` -> `0 4px 0 #7d2c1b`

---

## 2. Logic Chain

1. **From Observation 1**: The reference repository is a TanStack Start/Vite app running Tailwind CSS v4 with OKLCH theme variables. The fonts loaded are Manrope (sans) and Sora (display).
2. **From Observation 2 & 4**: The AppShell relies on a fixed sidebar geometry (`w-[252px]`) positioned with `fixed inset-y-0 left-0 lg:flex`, offset on desktop with `lg:pl-[252px]`. The content container uses `max-w-[1500px] px-4 py-6 sm:px-6 xl:px-8 xl:py-8`. This differs fundamentally from `ceibo_ai`'s current layout which uses a flex-row with `w-64` and `max-w-7xl`.
3. **From Observation 3 & 5**: The color tokens are not generic Tailwind slate/blue/cyan; they represent a branded palette with Argentine Ceibo brick red (`#bf442b`), dark pine forest green (`#12251e` / `#29463a`), and emerald green (`#0e724e`).
4. **From Observation 1 & 2**: There is only one page route in `ceibo_ref` (`src/routes/index.tsx`), but its navigation items define 5 distinct destinations (`Dashboard`, `Inbox`, `Chats`, `Base de Conocimiento`, `Configuración`), which directly correlate to the existing pages in `ceibo_ai` (`/`, `/inbox`, `/chats`, `/documents`, `/settings`).
5. **Conclusion from Chain**: To achieve an exact 1:1 visual match in `ceibo_ai`, we must replace Google Fonts with Manrope/Sora, map the exact OKLCH/hex color tokens into `globals.css` and `tailwind.config.ts`, rebuild `sidebar.tsx` with the 252px dark pine fixed layout and bot operational status card, update `navbar.tsx` with the sticky blurred topbar and tenant/user structure, and update `app-shell.tsx` with `lg:pl-[252px]` and `max-w-[1500px]`.

---

## 3. Caveats

- In `ceibo_ref`, the mobile navigation relies on hiding the sidebar and showing a mobile BrandMark in the header, plus a mobile bottom status bar. In `ceibo_ai`, mobile users will still require navigation to the other pages (`/inbox`, `/chats`, etc.); preserving a mobile slide-out drawer triggered from a hamburger button in the Topbar while retaining the exact reference styling is recommended.
- `ceibo_ref` uses TanStack Router and anchor hashes (`#dashboard`, `#inbox`, etc.) because it is a single-route prototype. `ceibo_ai` has real Next.js multi-page routes, so Next.js `<Link>` components should be used with `usePathname()`.
- No source code files in `ceibo_ref` or `ceibo_ai` were modified during this investigation.

---

## 4. Conclusion

A comprehensive, rigorous layout and design system specification has been mined and documented in `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\spec_miner_survey_2\report.md`. It provides the exact DOM hierarchies, Tailwind utility classes, CSS custom properties, and icon names required to achieve 1:1 visual fidelity with `ceibo_ref`.

---

## 5. Verification Method

To verify the observations and specifications independently:
1. Check `ceibo_ref/src/styles.css` lines 21-114 to confirm all `:root` and theme variables.
2. Check `ceibo_ref/src/routes/index.tsx` lines 95-187 to confirm the exact DOM elements and classes for `BrandMark`, `Sidebar`, and `Topbar`.
3. Check `ceibo_ref/src/components/ui/button.tsx` to confirm button variants and shadow-action styling.
4. Run `node C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\spec_miner_survey_2\convert-colors.mjs` to verify OKLCH-to-sRGB color conversions.
5. Invalidate if `ceibo_ref` is modified or if new layout wrappers are discovered outside `src/routes`.
