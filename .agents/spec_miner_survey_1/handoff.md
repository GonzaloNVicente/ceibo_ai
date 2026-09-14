# Handoff Report: Reference Dashboard Specification Mining

**Agent:** `spec_miner_survey_1`  
**Milestone:** Dashboard Reference Spec Mining (`ceibo_ref`)  
**Target:** `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ref\src\routes\index.tsx`  
**Output Artifact:** `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\spec_miner_survey_1\report.md`  
**Date:** 2026-09-12T02:22:00Z  

---

### 1. Observation

- **Reference Entry Route:** Located at `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ref\src\routes\index.tsx` (316 lines). It is the sole route rendered by TanStack Router (`routeTree.gen.ts`).
- **Imports:**
  - Lucide icons (`ArrowDownToLine`, `Bot`, `BookOpen`, `Boxes`, `ChevronDown`, `CircleUserRound`, `Gauge`, `Inbox`, `LockKeyhole`, `MessageCircleMore`, `RefreshCw`, `Settings`, `ShieldCheck`, `Sparkles`). Note: `ArrowDownToLine` is imported on line 3 but unused.
  - Recharts primitives: `Area`, `AreaChart`, `CartesianGrid`, `ResponsiveContainer`, `Tooltip`, `XAxis`, `YAxis`.
  - Component: `import { Button } from "@/components/ui/button";`.
- **Root Layout & Shell:**
  - Root container: `<div id="dashboard" className="min-h-screen bg-background text-foreground">`
  - Fixed Sidebar (`lg:flex`, hidden below `lg`, width `252px`, `bg-sidebar text-sidebar-foreground`):
    - `BrandMark`: `<div className="grid size-11 shrink-0 place-items-center rounded-md bg-primary font-display text-lg font-bold text-primary-foreground shadow-action">C</div>`
    - Title: `<p className="font-display text-[17px] font-bold leading-none text-sidebar-accent-foreground">Ceibo AI</p>` and subtitle `Ventas por WhatsApp`
    - Navigation: 5 items (Dashboard [active], Inbox [badge "24"], Chats, Base de Conocimiento, Configuración)
    - Operational bot box at bottom: Bot icon with green `live-pulse` badge dot and text "Operativo".
  - Content offset: `<div className="lg:pl-[252px]">`
  - Sticky Topbar: `sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md` with enterprise badge (`bg-ceibo-soft text-ceibo`), WhatsApp phone `+54 9 11 5482-0916` with green dot, and user avatar `GV`.
  - Main container: `<main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 xl:px-8 xl:py-8">`
- **Dashboard Sections:**
  - Page header with live pulse status pill (`border border-success/25 bg-success/10 text-success`), title `Dashboard de Rendimiento WhatsApp`, and 3 buttons: Actualizar (secondary), Ver Chats (secondary), Entrenar Asistente (primary).
  - MetricBand: `<section aria-label="Métricas principales" className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-panel">` with `grid sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-border`. Contains 4 cards with colored top indicator strips:
    1. Volumen de Consultas: `3.588`, `+18.4% vs. mes anterior`, tone: `success`
    2. Horas Ahorradas: `588.6 h`, `12 min promedio ahorrado por chat`, tone: `neutral`
    3. Tasa de Resolución IA: `82%`, `2.943 resueltas por IA`, tone: `success`
    4. Derivadas a Humano: `645`, `18% escaladas a cierre`, tone: `ceibo`
  - ActivityChart: Section with `Boxes` icon, title `Evolución de consultas`, custom legend, and 310px height `ResponsiveContainer` wrapping `AreaChart` with two monotone areas (`ai` in emerald green `var(--success)`, `human` in terracotta `var(--ceibo)`).
  - Custom `ActivityTooltip`: Card with dark text on white panel `rounded-md border border-border bg-card px-3 py-2 shadow-panel`.
  - Multi-tenant security footer with `ShieldCheck` icon, tenant isolation description with tag `[CEI-AR-7F42A9]`, and `LockKeyhole` protection badge.
  - Mobile bottom status bar: `lg:hidden` bar with live pulse indicator and `CircleUserRound` icon.
- **Design Tokens & Global CSS:**
  - In `ceibo_ref/src/styles.css`:
    - Sans font: `Manrope`, Display font: `Sora`
    - Brand Primary: `oklch(0.555 0.163 33.5)` -> `#bf442b` (terracotta / rich crimson)
    - Brand Soft: `oklch(0.94 0.025 36.5)` -> `#fbe6e0`
    - Background: `oklch(0.976 0.006 145.1)` -> `#f5f8f5`
    - Foreground / Sidebar: `oklch(0.244 0.028 169.1)` -> `#12251e` (dark forest green)
    - Success: `oklch(0.49 0.103 162.1)` -> `#0e724e` (emerald green)
    - Border / Input: `oklch(0.87 0.009 147.4)` -> `#d0d6d1`
    - Shadow Action: `0 4px 0 #7d2c1b`
    - Shadow Panel: `0 16px 44px -34px rgba(18, 37, 30, 0.42)`
    - Animation: `live-pulse` 1.8s ease-in-out infinite

---

### 2. Logic Chain

1. The goal of this task is to extract the complete, rigorous specification of the reference Vite Dashboard in `ceibo_ref/src/routes/index.tsx` so that another agent can reproduce it 1:1 in Next.js (`ceibo_ai`).
2. Inspection of `ceibo_ref/src/routes/index.tsx` revealed that the entire dashboard, including sidebar, topbar, metric band, chart, and security footer, is contained within `index.tsx` using internal sub-components: `BrandMark`, `Sidebar`, `Topbar`, `MetricBand`, `ActivityTooltip`, `ActivityChart`, and `Dashboard`.
3. Inspection of `ceibo_ref/src/styles.css` and `package.json` revealed that the reference uses Tailwind v4 with OKLCH color definitions, Sora display font, Manrope sans font, and custom keyframes.
4. Converting the OKLCH values to Hex and RGB demonstrates that Ceibo's brand is terracotta (`#bf442b`) and deep forest green (`#12251e`), not blue/cyan.
5. All HTML containers, Tailwind classes, Recharts props, Lucide icon parameters, and responsive breakpoints were compiled into a specification report (`report.md`).
6. This specification provides all exact DOM nodes, classes, data schemas, and styling parameters needed for a 1:1 rewrite of the Next.js UI.

---

### 3. Caveats

- In `ceibo_ref`, the TanStack Router route uses static arrays for `activity` and `metrics`. In `ceibo_ai`, the Next.js page fetches live Supabase mock data via `useAuth()` and `tenantClient.getRecent30Days()`. The implementer will need to bind the live Supabase data into the reference DOM and Recharts structure.
- `ceibo_ref` uses Tailwind v4 `@theme` syntax; `ceibo_ai` uses Tailwind v3 (`tailwindcss: ^3.4.17`). The equivalent Hex and RGBA color codes provided in the specification report should be used in `ceibo_ai`'s `tailwind.config.ts` and `globals.css` to achieve identical visual rendering without version conflicts.
- No other sub-routes exist in `ceibo_ref` (only `/`). The other pages (`inbox`, `chats`, `documents`, `settings`) in `ceibo_ai` will adopt the design language (colors, fonts, sidebar, topbar, cards, and tables) extracted from the reference Dashboard and UI components.

---

### 4. Conclusion

The reference Dashboard in `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ref\src\routes\index.tsx` has been completely and rigorously mined down to every HTML element, Tailwind utility class, Recharts configuration, icon prop, and color token. The comprehensive specification report is available at `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\spec_miner_survey_1\report.md`.

---

### 5. Verification Method

To verify the accuracy of this specification:
1. Inspect the reference file directly:
   `view_file` on `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ref\src\routes\index.tsx` lines 1 to 316.
2. Cross-reference the CSS variables and fonts:
   `view_file` on `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ref\src\styles.css` lines 21 to 114.
3. Compare the DOM hierarchy and Tailwind classes in `report.md` against `index.tsx` to confirm 100% fidelity.
