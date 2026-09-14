# Project: Ceibo AI - 1:1 Reference UI Visual Clone

## Architecture
- Next.js 14 App Router application (`ceibo_ai`) rewritten to achieve 1:1 visual parity with Vite reference project (`ceibo_ref`).
- Global theme layer: Tailwind CSS v3 with OKLCH CSS variables, Sora display font, Manrope sans font, custom action/panel shadows, and live-pulse keyframes.
- Layout layer: Fixed 252px desktop sidebar (`bg-sidebar`), sticky topbar with tenant badge and user profile, responsive content wrapper.
- Dashboard layer: 1:1 clone of `ceibo_ref/src/routes/index.tsx` featuring header status pill and action buttons, unified 4-metric KPI band with color indicator strips, 310px Recharts AreaChart with dual gradients and custom tooltip, and multi-tenant security verification footer.
- Data flow: Retains Supabase mock-data clients (`TenantAnalyticsClient`, `useAuth()`) mapped to reference visual components.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Design Tokens & Global CSS | OKLCH color variables (terracotta #bf442b, forest green #12251e, emerald #0e724e, canvas #f5f8f5), Sora & Manrope fonts, shadows, live-pulse keyframes | M1 | Survey |
| 2 | Button Primitives | Reference button variants (primary with shadow-action, secondary, etc.) in `src/components/ui/button.tsx` | M1 | Survey |
| 3 | Fixed 252px Sidebar | Desktop sidebar with BrandMark ("C" box + shadow-action), title, 5 navigation links (Gauge, Inbox with badge "24", Chats, BookOpen, Settings), and bottom bot status card with live-pulse dot | M1 | Survey |
| 4 | Sticky Topbar | Mobile brand fallback, tenant title, ENTERPRISE badge (bg-ceibo-soft text-ceibo), WhatsApp status (+54 9 11 5482-0916 · Conectado), and user avatar tile | M1 | Survey |
| 5 | App Shell Layout Wrapper | Fixed sidebar + content offset (`lg:pl-[252px]`) + sticky topbar + main canvas container (`max-w-[1500px]`) | M1 | Survey |
| 6 | Dashboard Page Header | Title "Dashboard de Rendimiento WhatsApp", live pulse status pill "En Vivo", action buttons: Actualizar, Ver Chats, Entrenar Asistente | M2 | Survey |
| 7 | MetricBand Unified KPI Card | Single card with 4 columns divided by `xl:divide-x xl:divide-border`, top colored indicator strips (success, neutral, ceibo), Sora 38px numbers, wired to Supabase summary metrics | M2 | Survey |
| 8 | ActivityChart (Recharts AreaChart) | Boxes icon, title "Evolución de consultas", AreaChart with dual linear gradients (#aiFill emerald, #humanFill terracotta), custom ActivityTooltip, wired to Supabase 30-day data | M2 | Survey |
| 9 | Multi-Tenant Security Footer | ShieldCheck icon, tenant code [CEI-AR-7F42A9], LockKeyhole verified protection pill, responsive layout | M2 | Survey |
| 10 | Inbox Page Reskin | Inbox page styled with reference design system (cards, badges, buttons, typography) preserving Supabase lead queries & assignment | M3 | Survey |
| 11 | Chats Page Reskin | Real-time chat interface styled with reference design system preserving session selection & message sending | M3 | Survey |
| 12 | Documents Page Reskin | Knowledge base page styled with reference design system preserving drag & drop, upload simulation, and delete | M3 | Survey |
| 13 | Settings & Login Reskin | Settings tabs and Login page styled with reference design system preserving multi-tenant credentials & switchers | M3 | Survey |
| 14 | E2E Typecheck & Visual Verification | Clean `npx tsc --noEmit` and passing `npm run test:e2e` suite (89/89 tests) | M4 | Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Tokens, Layout & App Shell | `globals.css`, `tailwind.config.ts`, `layout.tsx`, `button.tsx`, `sidebar.tsx`, `navbar.tsx`, `app-shell.tsx` | None | IN_PROGRESS |
| 2 | M2: Dashboard 1:1 Parity | `src/app/page.tsx`, `src/components/dashboard/*` | M1 | PLANNED |
| 3 | M3: Inner Pages Reskin | `src/app/inbox/*`, `src/app/chats/*`, `src/app/documents/*`, `src/app/settings/*`, `src/app/login/*` | M1 | PLANNED |
| 4 | M4: E2E Verification & Audit | Full codebase, `npx tsc --noEmit`, `npm run test:e2e`, reviewer, challenger, auditor | M1, M2, M3 | PLANNED |

## Interface Contracts
### Layout ↔ Pages
- `AppShell` provides the fixed 252px desktop sidebar, sticky topbar with tenant/user context from `useAuth()`, and `<main>` content container.
- Nav items in sidebar link to:
  - `/` -> Dashboard (`Gauge` icon)
  - `/inbox` -> Inbox (`Inbox` icon, badge "24")
  - `/chats` -> Chats (`MessageCircleMore` icon)
  - `/documents` -> Base de Conocimiento (`BookOpen` icon)
  - `/settings` -> Configuración (`Settings` icon)

### Dashboard ↔ Supabase Client
- `tenantClient.getRecent30Days()` returns rows containing `{ date, total, ai_resolved, human_escalated }`.
- `calculateSummaryMetrics(rows)` returns `{ totalQueries, hoursSaved, aiResolutionRate, humanEscalated }`.
- `MetricBand` displays:
  - Volumen de Consultas: `totalQueries.toLocaleString()`
  - Horas Ahorradas: `${hoursSaved} h`
  - Tasa de Resolución IA: `${aiResolutionRate}%`
  - Derivadas a Humano: `humanEscalated.toLocaleString()`
- `ActivityChart` maps `rows` to Recharts `AreaChart` with keys `ai` (ai_resolved) and `human` (human_escalated).

## Code Layout
- `src/app/globals.css`: Global styles, OKLCH variables, live-pulse keyframes
- `tailwind.config.ts`: Tailwind v3 theme extensions mapping reference colors and tokens
- `src/app/layout.tsx`: Root layout with font configuration and AuthProvider
- `src/components/ui/button.tsx`: Button component supporting reference variants
- `src/components/layout/sidebar.tsx`: Reference 252px fixed sidebar with BrandMark and Bot card
- `src/components/layout/navbar.tsx`: Reference sticky topbar with tenant badge and user avatar
- `src/components/layout/app-shell.tsx`: Consolidated layout wrapper
- `src/app/page.tsx`: 1:1 reference Dashboard with MetricBand, ActivityChart, and Security Footer
