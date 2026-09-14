# Plan — teamwork_preview_orchestrator_2

## Objective
Rewrite the Next.js UI in `ceibo_ai` to achieve 1:1 visual parity with `ceibo_ref` (Vite reference project), covering:
1. AppShell, Sidebar, Navbar
2. Dashboard (`src/app/page.tsx`)
3. Inner Pages (`inbox`, `chats`, `documents`, `settings`)
4. Supabase mock-data wiring retention
5. Clean typecheck via `npx tsc --noEmit` and build

## Phases

### Phase 0: Survey & Spec Mining
- Dispatch spec miner 1: Analyze `ceibo_ref/src/routes/index.tsx` and related components for exact DOM, Tailwind classes, Lucide icons, Recharts setup, cards, tables, headers.
- Dispatch spec miner 2: Analyze `ceibo_ref` navigation/sidebar/layout structure, routing, styles, and inner page templates.
- Dispatch explorer: Survey current `ceibo_ai` layout, components, pages, and mock data wiring to map existing vs reference differences.

### Phase 1: Milestone M1 — App Shell & Navigation
- Explorer -> Worker -> Reviewer -> Challenger -> Auditor
- Rewrite `src/components/layout/sidebar.tsx`, `navbar.tsx`, `app-shell.tsx` (or consolidate) to match reference navigation.

### Phase 2: Milestone M2 — Dashboard 1:1 Parity
- Explorer -> Worker -> Reviewer -> Challenger -> Auditor
- Rewrite `src/app/page.tsx` to 1:1 match `ceibo_ref/src/routes/index.tsx` DOM, Tailwind classes, charts, tables, cards, while wiring Supabase mock data.

### Phase 3: Milestone M3 — Inner Pages Parity
- Explorer -> Worker -> Reviewer -> Challenger -> Auditor
- Rewrite `/inbox`, `/chats`, `/documents`, `/settings` to follow the exact same visual design system and component structure.

### Phase 4: Final Verification & Typecheck
- Full build and `npx tsc --noEmit` verification.
- Reviewer, Challenger, Forensic Auditor checks.
- Compile completion handoff for Sentinel.
