# Task Assignment: Worker M2 (Dashboard 1:1 Parity)

## Identity
- Role: teamwork_preview_worker
- Working Directory: C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\worker_m2_1
- Parent Conversation ID: 9044ea2f-6e61-4947-b41c-b52da5cdf0aa

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Mandatory Reading
Read the following files before taking any action:
1. `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\ORIGINAL_REQUEST.md`
2. `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\PROJECT.md`
3. `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\spec_miner_dashboard_1\report.md`
4. `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\spec_miner_dashboard_1\handoff.md`
5. `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ref\src\routes\index.tsx`

## Scope of Work & Exclusive File Ownership
You exclusively own and are responsible for:
- `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\src\app\page.tsx`
- `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\src\components\dashboard\*` (if you modify or refactor existing dashboard subcomponents)

Do NOT modify AppShell, Sidebar, or Navbar.

## Implementation Requirements
1. **Visual Parity**:
   Rewrite `src/app/page.tsx` so that its rendered DOM hierarchy, Tailwind classes, typography, spacing, and styling are a 1:1 clone of `ceibo_ref/src/routes/index.tsx`.
   - **Header**:
     - `flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between`
     - Live pill: `<span className="inline-flex h-7 items-center gap-2 rounded-full border border-success/25 bg-success/10 px-2.5 text-xs font-bold text-success"><span className="live-pulse size-2 rounded-full bg-success" /> En Vivo</span>`
     - Relative timestamp: `Actualizado hace 2 min` (or current dynamic timestamp)
     - `h1.max-w-[22ch].font-display.text-3xl.font-bold.leading-[1.08].sm:text-4xl`: "Dashboard de Rendimiento WhatsApp"
     - Subtitle: "Monitoreo en tiempo real de consultas, derivaciones y ahorro operativo generado por Ceibo."
     - 3 Action buttons:
       - Actualizar (`RefreshCw` icon, `variant="outline"`, re-fetches data or triggers refresh)
       - Ver Chats (`MessageCircleMore` icon, `variant="outline"`, `<Link href="/chats">`)
       - Entrenar Asistente (`Sparkles` icon, `variant="primary"` with `shadow-action`, `<Link href="/documents">`)
   - **MetricBand**:
     - Single unified container: `<section aria-label="Métricas principales" className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-panel">`
     - Grid layout: `<div className="grid sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-border">`
     - 4 KPI articles with `relative p-5 sm:p-6` and top accent strips (`absolute inset-x-0 top-0 h-1`):
       1. Volumen de Consultas (strip: `bg-muted-foreground/35`, value: `totalConsultas.toLocaleString()`, subtitle: `+18.4% vs mes anterior`, note: `99.2% mensajes respondidos en <3s`)
       2. Horas Ahorradas (strip: `bg-success`, value: `${horasAhorradas} h`, subtitle: `Equivale a ${salesRepEquivalent} representantes`, note: `Cálculo basado en 12 min por consulta resuelta`)
       3. Tasa de Resolución IA (strip: `bg-success`, value: `${tasaResolucionIA}%`, subtitle: `Meta mensual: 80.0% superada`, note: `Sin intervención humana requerida`)
       4. Derivadas a Humano (strip: `bg-ceibo`, value: `totalHuman.toLocaleString()`, subtitle: `${(100 - tasaResolucionIA)}% del volumen total`, note: `Casos complejos, cotizaciones y reclamos`)
     - Value typography: `font-display text-3xl font-bold tracking-tight sm:text-[38px] sm:leading-none`
   - **ActivityChart**:
     - Card container: `<section className="mt-5 border border-border bg-card p-5 shadow-panel sm:p-6">`
     - Header with `Boxes` icon (`size-5 text-primary` strokeWidth 1.8), title "Evolución de consultas", subtitle "Comparativa diaria de resolución automática vs derivación", and legend squares (`bg-success` Resueltas por IA, `bg-ceibo` Derivadas a humano).
     - 310px height `ResponsiveContainer` rendering `AreaChart` with data mapped from Supabase 30-day rows.
     - Dual linear gradients (`#aiFill` with `var(--success)` and `#humanFill` with `var(--ceibo)`).
     - Custom `ActivityTooltip` matching reference card styling.
     - Non-animated monotone areas (`isAnimationActive={false}`, `strokeWidth={2}`).
     - SSR Hydration guard (`isMounted` state) so Recharts renders cleanly without hydration mismatch.
   - **Security Footer**:
     - `footer.mt-5.flex.flex-col.gap-3.border.border-accent/20.bg-accent/5.p-4.sm:flex-row.sm:items-center.sm:justify-between`
     - `ShieldCheck` icon, tenant isolation notice with tenant code (e.g. `[CEI-AR-7F42A9]` or dynamic tenant code), and `LockKeyhole` protection pill.
2. **Supabase Mock-Data Wiring**:
   - Retain full integration with `useAuth()` and `createTenantScopedClient(supabase).getRecent30Days()`.
   - Calculate summary metrics via `calculateSummaryMetrics(rows)`:
     - `horasAhorradas = Math.round((totalIA * 0.2) * 10) / 10`
     - `tasaResolucionIA = Math.round((totalIA / totalConsultas) * 100)`
     - `salesRepEquivalent = (horasAhorradas / 160).toFixed(1)`
   - Map 30-day rows into `{ date, ai: r.resueltas_ia, human: r.derivadas_humano }`.
3. **Verification**:
   - Run `npx tsc --noEmit` and confirm exit code 0 (clean compile).
   - Run `npm run test:e2e` and confirm all 89/89 tests pass.
   - Document verification commands and full outputs in `handoff.md`.

## Required Output
Write your progress to `progress.md` and your final report to:
`C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\worker_m2_1\handoff.md`
Communicate completion back to orchestrator via `send_message`.
