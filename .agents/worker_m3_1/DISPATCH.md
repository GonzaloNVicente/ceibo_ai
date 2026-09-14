# Task Assignment: Worker M3 (Inner Pages & Shared Primitives Reskin)

## Identity
- Role: teamwork_preview_worker
- Working Directory: C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\worker_m3_1
- Parent Conversation ID: 9044ea2f-6e61-4947-b41c-b52da5cdf0aa

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Mandatory Reading
Read the following files before taking any action:
1. `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\ORIGINAL_REQUEST.md`
2. `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\PROJECT.md`
3. `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\explorer_inner_pages_1\report.md`
4. `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\explorer_inner_pages_1\handoff.md`
5. `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\spec_miner_components_1\report.md`
6. `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\spec_miner_components_1\handoff.md`

## Scope of Work & Exclusive File Ownership
You exclusively own and are responsible for:
- `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\src\components\ui\card.tsx`
- `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\src\components\ui\badge.tsx`
- `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\src\components\ui\input.tsx` (if needed or update)
- `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\src\components\ui\table.tsx` (if needed or update)
- `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\src\app\inbox\page.tsx`
- `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\src\app\chats\page.tsx`
- `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\src\app\documents\page.tsx`
- `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\src\app\settings\page.tsx`

Do NOT modify `src/app/page.tsx`, `AppShell`, `Sidebar`, or `Navbar`.

## Implementation Requirements

### 1. Shared UI Primitives (`src/components/ui/`):
- `card.tsx`: Update to reference classes: `rounded-lg border border-border bg-card shadow-panel text-card-foreground`. Ensure `CardHeader`, `CardTitle` (`font-display font-bold`), `CardDescription`, `CardContent`, and `CardFooter` use reference typography and spacing.
- `badge.tsx`: Update to support reference variants:
  - `default`: `bg-primary text-primary-foreground`
  - `secondary`: `bg-secondary text-secondary-foreground`
  - `success`: `bg-success/10 text-success border border-success/25`
  - `ceibo`: `bg-ceibo/10 text-ceibo border border-ceibo/25`
  - `ceibo-soft`: `bg-ceibo-soft text-ceibo border border-ceibo/20`
  - `neutral`: `bg-muted text-muted-foreground border border-border`
  - `outline`: `text-foreground border border-border`
- `input.tsx`: Ensure clean zero-dependency input primitive with `rounded-md border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20`.
- `table.tsx`: Ensure clean table primitive supporting table, header, body, row, cell with `border-border` and subtle hover state.

### 2. Inner Pages Reskin (Preserving Supabase Mock-Data):
- **`/inbox` (`src/app/inbox/page.tsx`)**:
  - Page header with `font-display` Sora title (`text-3xl sm:text-4xl font-bold leading-tight`), description.
  - Search & filter bar with reference inputs, badges, and button styling.
  - Leads table/cards using reference card styling (`border-border bg-card shadow-panel`) and reference badges (`success`, `ceibo`, `neutral`).
  - Keep 100% of Supabase wiring: `useAuth()`, `getTenantScopedClient(supabase).getLeads()`, filter memo, status update handlers.
- **`/chats` (`src/app/chats/page.tsx`)**:
  - 2-column layout: Sessions list on left, active chat on right, enclosed in reference cards (`shadow-panel border-border bg-card`).
  - Active chat header with contact name, WhatsApp phone number, and status indicator.
  - Message bubbles:
    - AI messages: `bg-card border border-border text-card-foreground` with subtle timestamp
    - User messages: `bg-sidebar text-white` (forest green #12251e)
    - Agent messages: `bg-ceibo-soft text-foreground border border-ceibo/20`
  - Composer input with reference input styling and Send button with `variant="primary"` and `shadow-action`.
  - Keep 100% of Supabase wiring: `tenantClient.getLeads()`, `tenantClient.getChatMessages(selectedSessionId)`, optimistic message sending.
- **`/documents` (`src/app/documents/page.tsx`)**:
  - Page header with Sora display title, description, and "Subir Documento" button (`variant="primary"` with `shadow-action`).
  - Upload dropzone: dashed border (`border-2 border-dashed border-border bg-card/50 hover:bg-card hover:border-primary/50 transition-colors p-8 rounded-lg text-center`).
  - Documents table/list: reference card container (`rounded-lg border border-border bg-card shadow-panel`), Lucide icons (`FileText`, `Trash2`), status badges (`success` for "Activo", `ceibo-soft` for "Procesando"), size, date, delete button.
  - Keep 100% of functional logic: document state, simulated upload with 3-second processing timeout, and delete handler.
- **`/settings` (`src/app/settings/page.tsx`)**:
  - Page header with Sora display title, description.
  - Settings tabs: `General`, `Bot IA`, `WhatsApp`, `Equipo` with reference tab styling.
  - Tab panels wrapped in reference cards (`border-border bg-card shadow-panel`).
  - Tenant badge display with `[CEI-AR-7F42A9]`.
  - Form fields with reference inputs, switches/checkboxes, and Save buttons (`variant="primary"` with `shadow-action`).
  - Keep 100% of Supabase wiring: `useAuth()` (`user`, `perfil`), simulated save delays.

### 3. Verification:
- Run `npx tsc --noEmit` and confirm exit code 0.
- Run `npm run test:e2e` and confirm all 89/89 tests pass.
- Run `npm run build` and confirm all static routes compile cleanly.
- Document commands and results in `handoff.md`.

## Required Output
Write your progress to `progress.md` and your final report to:
`C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\worker_m3_1\handoff.md`
Communicate completion back to orchestrator via `send_message`.

## 2026-09-14T01:12:43Z
You are teamwork_preview_worker for the project at C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai.
Your working directory is:
C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai\.agents\worker_m3_1

Your parent conversation ID is: 9044ea2f-6e61-4947-b41c-b52da5cdf0aa

Your task:
Reskin the shared UI primitives (card.tsx, badge.tsx, input.tsx, table.tsx) and all inner pages (src/app/inbox/page.tsx, src/app/chats/page.tsx, src/app/documents/page.tsx, src/app/settings/page.tsx) to achieve 1:1 visual unity with the ceibo_ref design system (Sora display font, OKLCH colors, shadow-panel, shadow-action, badge variants, and clean layout), while preserving 100% of the existing Supabase mock-data wiring (getLeads, getChatMessages, useAuth, optimistic messaging, document simulations).

Verify your implementation by running:
- `npx tsc --noEmit`
- `npm run test:e2e`
- `npm run build`

Write your progress to `progress.md` and complete `handoff.md` in your working directory.
When finished, send a message to your parent (9044ea2f-6e61-4947-b41c-b52da5cdf0aa) with a summary and link to your handoff report.

