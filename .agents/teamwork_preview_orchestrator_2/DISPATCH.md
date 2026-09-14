## 2026-09-12T02:14:40Z

Completely rewrite our Next.js UI structure (the main AppShell/Sidebar and the Dashboard page) to be a 1:1 visual clone of the reference Vite project located in C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ref.

Working directory: C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai
Integrity mode: development

## Requirements

### R1. Analyze the Reference UI
Read ../ceibo_ref/src/routes/index.tsx to understand the exact DOM structure, Tailwind classes, Lucide icons, and Recharts setup used by the target design.

### R2. Rewrite the App Shell / Sidebar
Rewrite our src/components/layout/sidebar.tsx, navbar.tsx, and app-shell.tsx (or consolidate them if needed) to perfectly match the navigation layout from the reference project. Drop any existing UI structure that contradicts the reference.

### R3. Rewrite the Dashboard and ALL Inner Pages
Rewrite src/app/page.tsx (Dashboard) and ALL other pages (inbox, chats, documents, settings) to perfectly mirror the reference project's design language, card layouts, table styles, and spacing. Keep our Supabase mock-data wiring, but ensure the entire application looks like a unified UI system derived from the reference repo.

## Acceptance Criteria

### Visual Parity
- [ ] The Next.js dashboard DOM structure (HTML elements and Tailwind classes) perfectly matches the reference Vite project.
- [ ] Navigation sidebars/topbars match the exact styling, icons, and layout of the reference.
- [ ] The application successfully compiles and typechecks via npx tsc --noEmit.
