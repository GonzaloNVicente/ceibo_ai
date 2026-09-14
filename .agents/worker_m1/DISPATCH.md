# Dispatch Assignment: worker_m1

## Milestone M1: Tokens, Layout & App Shell 1:1 Parity

### Objective
Implement the design tokens, fonts, button primitives, fixed 252px sidebar, sticky topbar, and app-shell wrapper in `ceibo_ai` to perfectly mirror `ceibo_ref`.

### Target Files Owned Exclusively
- `src/app/globals.css`
- `tailwind.config.ts`
- `src/app/layout.tsx`
- `src/components/ui/button.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/navbar.tsx`
- `src/components/layout/app-shell.tsx`

### Authoritative Specification Sources to Read First
- `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\ORIGINAL_REQUEST.md`
- `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\PROJECT.md`
- `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\spec_miner_survey_2\report.md`
- `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\explorer_survey_3\report.md`
- Reference code: `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ref\src\styles.css`, `ceibo_ref/src/routes/index.tsx`, `ceibo_ref/src/components/ui/button.tsx`

### Verification Required
1. Run `npx tsc --noEmit` to ensure 0 TypeScript errors.
2. Run `npm run test:e2e` to ensure all 89 tests continue to pass.
3. Report results in `handoff.md`.

## 2026-09-12T02:21:32Z

You are Layout & App Shell Worker (worker_m1).
Working directory: C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\worker_m1

OBJECTIVE:
Implement Milestone M1: Tokens, Layout & App Shell 1:1 Parity in C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai:
1. Update `src/app/globals.css` with reference OKLCH variables (--background, --foreground, --card, --primary, --accent, --border, --sidebar, --sidebar-foreground, --sidebar-accent, --success, --ceibo, --ceibo-soft, --shadow-action, --shadow-panel), keyframes (`live-pulse`), and font utilities (`font-display`).
2. Update `tailwind.config.ts` to expose the new color variables, shadows, display font, and animations, while maintaining backwards-compatible keys if needed by existing tests.
3. Update `src/app/layout.tsx` to configure `Manrope` (sans) and `Sora` (display) Google Fonts with CSS variables `--font-sans` and `--font-display`.
4. Update `src/components/ui/button.tsx` to support the reference button variants and styling (secondary default, primary terracotta with `shadow-action`, etc.).
5. Rewrite `src/components/layout/sidebar.tsx` to match the exact 252px desktop sidebar (`w-[252px] bg-sidebar text-sidebar-foreground lg:flex`), BrandMark "C" tile with `shadow-action`, title "Ceibo AI", subtitle "Ventas por WhatsApp", 5 nav items (Gauge, Inbox with "24" badge, MessageCircleMore, BookOpen, Settings) with active/hover states, and bottom Bot WhatsApp status card with pulsating green live-pulse dot.
6. Rewrite `src/components/layout/navbar.tsx` to match the sticky topbar: mobile brand fallback, tenant title with "ENTERPRISE" pill in `bg-ceibo-soft text-ceibo`, WhatsApp channel indicator with green dot, and user avatar pill with `useAuth()` tenant/user wiring.
7. Rewrite `src/components/layout/app-shell.tsx` to wrap children with the 252px offset (`lg:pl-[252px]`), sticky topbar, and responsive `<main>` container (`max-w-[1500px] px-4 py-6 sm:px-6 xl:px-8 xl:py-8`).
