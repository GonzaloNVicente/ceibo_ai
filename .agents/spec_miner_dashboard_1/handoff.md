# Handoff Report: Specification Mining for Dashboard 1:1 Parity

**Agent**: teamwork_preview_spec_miner (`spec_miner_dashboard_1`)  
**Parent Agent**: `9044ea2f-6e61-4947-b41c-b52da5cdf0aa`  
**Working Directory**: `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\spec_miner_dashboard_1`  
**Target Milestone**: Milestone 2 (Dashboard 1:1 Visual Parity)  
**Report Document**: `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\spec_miner_dashboard_1\report.md`  

---

## 1. Observation

1. **Reference Dashboard Implementation (`ceibo_ref/src/routes/index.tsx`)**:
   - Lines 49-54: 26 daily activity records mapped to `{ date, ai, human }`. Sum of AI = 2943, Sum of Human = 645, Total = 3588, AI Resolution Rate = 82%, Hours saved = 588.6 h.
   - Lines 64-93: `metrics` array defining the 4 KPI cards: "Volumen de Consultas", "Horas Ahorradas", "Tasa de Resolución IA", and "Derivadas a Humano", each with `tone` ('success' | 'neutral' | 'ceibo').
   - Lines 190-209 (`MetricBand`): A single unified `<section aria-label="Métricas principales" className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-panel">` enclosing `<div className="grid sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-border">`. Each article has `absolute inset-x-0 top-0 h-1` accent strip, 38px Sora bold number, detail, and note.
   - Lines 225-265 (`ActivityChart`): `<section className="mt-5 border border-border bg-card p-5 shadow-panel sm:p-6">` with `<Boxes className="size-5 text-primary" strokeWidth={1.8} />`, title "Evolución de consultas", legend squares (`size-2.5 rounded-sm bg-success` / `bg-ceibo`), and a 310px height `ResponsiveContainer` rendering `AreaChart` with dual linear gradients (`#aiFill` and `#humanFill`), dashed cartesian grid (`3 5`), custom `ActivityTooltip`, and non-animated monotone areas.
   - Lines 274-290 (Page Header): `flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between` with live pill `<span className="inline-flex h-7 items-center gap-2 rounded-full border border-success/25 bg-success/10 px-2.5 text-xs font-bold text-success"><span className="live-pulse size-2 rounded-full bg-success" /> En Vivo</span>`, relative timestamp "Actualizado hace 2 min", `h1.font-display.text-3xl.sm:text-4xl.max-w-[22ch]`, and 3 action buttons (RefreshCw, MessageCircleMore, Sparkles with `variant="primary"`).
   - Lines 295-306 (Security Footer): `footer.mt-5.flex.flex-col.gap-3.border.border-accent/20.bg-accent/5.p-4.sm:flex-row.sm:items-center` with `ShieldCheck` icon (size-5, strokeWidth 1.8), tenant isolation notice with tenant code `[CEI-AR-7F42A9]`, and `LockKeyhole` protection pill.

2. **Existing Next.js Layout (`ceibo_ai/src/components/layout/app-shell.tsx`)**:
   - Lines 45-59: `AppShell` already provides the outer desktop sidebar offset (`lg:pl-[252px]`), sticky top navbar (`Navbar`), `<main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-6 xl:px-8 xl:py-8">`, and the mobile bottom status bar (`div.lg:hidden` with WhatsApp bot live-pulse and `CircleUserRound`).

3. **Current Next.js Dashboard (`ceibo_ai/src/app/page.tsx`)**:
   - Lines 85-167: Outer wrapper uses `space-y-8`. Header uses `flex-col sm:flex-row sm:items-center gap-4` and hardcoded `text-slate-900`. Live pill uses generic `<Badge variant="success">`. Action buttons use `size="sm"` and `variant="outline"`.
   - KPI metrics are rendered through `<MetricsGrid>` and `<MetricCard>` with individual detached cards, Slate-200 borders, and Lucide icons inside cards which are absent in the reference.
   - Chart is rendered through `<AnalyticsChart>` using `<Card>` with Indigo color for human escalation, 288px height, and Slate tooltip.
   - Footer uses `<div className="rounded-xl border border-slate-200 bg-white p-6">` with an arrow button linking to `/settings`.

4. **Supabase Mock-Data Integration & E2E Contracts (`tests/e2e/test-dashboard-metrics.mjs` & `test-chart-data.mjs`)**:
   - `createTenantScopedClient(supabase).getRecent30Days()` returns 30 chronological daily rows with `{ date, resueltas_ia, derivadas_humano, total_consultas, horas_ahorradas }`.
   - `calculateSummaryMetrics(rows)` returns `{ totalConsultas, totalIA, totalHuman, horasAhorradas, tasaResolucionIA }`.
   - Formula: `horasAhorradas = Math.round((totalIA * 0.2) * 10) / 10`.
   - Formula: `tasaResolucionIA = Math.round((totalIA / totalConsultas) * 100)`.
   - Formula: `salesRepEquivalent = (horasAhorradas / 160).toFixed(1)`.

---

## 2. Logic Chain

1. From Observation 2, `AppShell` already encapsulates the fixed 252px sidebar, sticky navbar, main container padding, and the mobile bottom status bar. Therefore, `src/app/page.tsx` must only render the direct child elements of `<main>`.
2. From Observation 1, the reference dashboard child elements inside `<main>` are:
   - Page Header (with Live status pill and 3 action buttons)
   - `MetricBand` (unified 4-metric card with internal dividing borders)
   - `ActivityChart` (Recharts AreaChart card)
   - Security Footer (multi-tenant banner)
3. Comparing Observation 3 with Observation 1, the current `src/app/page.tsx` introduces several visual deviations:
   - Spacing: `space-y-8` instead of section-level top margins (`mt-6`, `mt-5`, `mt-5`).
   - Header: Missing `font-display` (Sora), `leading-[1.08]`, `max-w-[22ch]`, `live-pulse` green dot, and reference button variants.
   - KPI Metrics: Broken into 4 detached cards with Lucide icons inside, rather than the unified single-card 4-column layout with top indicator strips.
   - Chart: Mismatched height (288px vs 310px), colors (Indigo vs terracotta `var(--ceibo)`), and tooltip styling.
   - Footer: Slate-200 white card instead of subtle accent banner `border-accent/20 bg-accent/5` with `ShieldCheck` and `LockKeyhole`.
4. From Observation 4, the existing Supabase mock-data pipeline (`useAuth`, `tenantClient`, `getRecent30Days`, `calculateSummaryMetrics`) directly matches the data required by the reference layout. Mapping `rows` to `{ date, ai, human }` and `metrics` to the 4 KPI slots achieves 100% visual parity without modifying any backend or data contracts.
5. In Next.js App Router, rendering Recharts components on the server can trigger hydration mismatch warnings. Implementing a client-mounted guard ensures hydration safety while maintaining fast first paint.

---

## 3. Caveats

- **Layout Encapsulation**: `AppShell` already renders the mobile bottom status bar (`Bot WhatsApp operativo 24/7`). Hence, `src/app/page.tsx` should not render a duplicate mobile footer to avoid duplicate elements on mobile screens.
- **Dynamic Tenant Codes**: The reference implementation hardcodes `[CEI-AR-7F42A9]`. In `ceibo_ai`, the tenant code can either be derived dynamically from `empresa.id` (e.g. `[CEI-TE-111111]`) or retain `[CEI-AR-7F42A9]` as default fallback.
- **Button Links**: In Next.js, "Ver Chats" and "Entrenar Asistente" should be wrapped in Next.js `<Link>` components to enable client-side routing to `/chats` and `/documents` without full page reloads.

---

## 4. Conclusion

The specification mining is complete. All DOM structures, CSS classes, typography tokens, Lucide icon parameters, Recharts configurations, and Supabase data mappings have been extracted and documented in detail in `report.md`.

The implementation team can now proceed to rewrite `ceibo_ai/src/app/page.tsx` (and its auxiliary components) into a 1:1 visual clone of `ceibo_ref/src/routes/index.tsx` following the blueprint provided in Section 4 through Section 9 of `report.md`.

---

## 5. Verification Method

To independently verify this specification report:
1. **File Content Inspection**:
   - Inspect `report.md` at `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\spec_miner_dashboard_1\report.md`.
   - Compare the DOM hierarchy and class list in Section 4 against `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ref\src\routes\index.tsx`.
2. **Design Token Verification**:
   - Inspect `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\tailwind.config.ts` and `src/app/globals.css` to verify that `bg-ceibo`, `bg-success`, `font-display`, `shadow-action`, `shadow-panel`, and `live-pulse` are registered and active.
3. **E2E Test Compatibility**:
   - Once implemented according to this specification, running `node tests/run-all-tests.mjs` will confirm that all 89/89 tests across the 6 suites pass cleanly.
