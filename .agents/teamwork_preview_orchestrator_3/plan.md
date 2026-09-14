# Execution Plan — teamwork_preview_orchestrator_3

## Objective
Implement 1:1 visual parity with `ceibo_ref` for the Dashboard (`src/app/page.tsx`) and all inner pages (`inbox`, `chats`, `documents`, `settings`), preserving Supabase mock data wiring and achieving clean `npx tsc --noEmit` and test/audit pass.

## Phases

### Phase 0: Reference Survey & Analysis
- Dispatch Explorer 1: Inspect `ceibo_ref/src/routes/index.tsx` and all related dashboard components, styles, Recharts config, and DOM structure. Compare with `ceibo_ai/src/app/page.tsx`.
- Dispatch Explorer 2: Inspect `ceibo_ref` routes/components for inner pages (inbox, chats, documents, settings, etc.) to extract card layouts, table styles, badge styles, and spacing. Compare with `ceibo_ai/src/app/(inbox|chats|documents|settings)`.
- Output: Comprehensive blueprint reports for Dashboard and Inner Pages.

### Phase 1: Milestone M2 — Dashboard 1:1 Parity
- Dispatch Worker: Rewrite `src/app/page.tsx` (and any subcomponents needed) to match `ceibo_ref/src/routes/index.tsx` exactly, preserving Supabase data wiring.
- Worker runs `npx tsc --noEmit` and tests.
- Dispatch Reviewers & Challengers & Auditor for M2.

### Phase 2: Milestone M3 — Inner Pages Reskin
- Dispatch Worker(s): Update `inbox`, `chats`, `documents`, and `settings` pages to mirror reference design system (cards, badges, buttons, tables, typography).
- Verify typecheck `npx tsc --noEmit`.
- Review and audit M3.

### Phase 3: Milestone M4 — Final Verification & Adversarial Audit
- Full typecheck and test verification.
- Reviewer, Challenger, and Forensic Auditor checks.
- Gate approval and report completion to Sentinel.
