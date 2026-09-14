# Original User Request

## 2026-09-12T00:38:44Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: [none — teamwork routes from the description]

Extract the UI design system (colors, typography, global config) from a reference GitHub repository (`https://github.com/GonzaloNVicente/ceibo-command-center.git`) and apply it to our existing Next.js web application as global styling adjustments.

Working directory: C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai
Integrity mode: development

## Requirements

### R1. Extract Design Tokens
Clone or inspect `https://github.com/GonzaloNVicente/ceibo-command-center.git` to extract its core design tokens: exact primary/secondary hex colors, font families, and global layout styling (e.g., standard border-radius, shadows).

### R2. Apply Global Styling to Tailwind
Update our project's `tailwind.config.ts` and `globals.css` to inject these exact colors and fonts. Do not rewrite our existing React component structures; only map the new Tailwind configuration to our existing UI classes where necessary to ensure the new color palette and typography propagate correctly.

## Acceptance Criteria

### Styling Verification
- [ ] The `tailwind.config.ts` in our project perfectly mirrors the core color palette and font configuration of the reference repository.
- [ ] The application successfully typechecks and compiles without errors via `npx tsc --noEmit`.
- [ ] A visual inspection confirms that the Dashboard and Inbox screens now reflect the new color scheme and typography without breaking their existing layout structure.

## 2026-09-12T02:12:50Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: [none — teamwork routes from the description]

Completely rewrite our Next.js UI structure (the main AppShell/Sidebar and the Dashboard page) to be a 1:1 visual clone of the reference Vite project located in `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ref`.

Working directory: C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai
Integrity mode: development

## Requirements

### R1. Analyze the Reference UI
Read `../ceibo_ref/src/routes/index.tsx` to understand the exact DOM structure, Tailwind classes, Lucide icons, and Recharts setup used by the target design.

### R2. Rewrite the App Shell / Sidebar
Rewrite our `src/components/layout/sidebar.tsx`, `navbar.tsx`, and `app-shell.tsx` (or consolidate them if needed) to perfectly match the navigation layout from the reference project. Drop any existing UI structure that contradicts the reference.

### R3. Rewrite the Dashboard and ALL Inner Pages
Rewrite `src/app/page.tsx` (Dashboard) and ALL other pages (`inbox`, `chats`, `documents`, `settings`) to perfectly mirror the reference project's design language, card layouts, table styles, and spacing. Keep our Supabase mock-data wiring, but ensure the entire application looks like a unified UI system derived from the reference repo.

## Acceptance Criteria

### Visual Parity
- [ ] The Next.js dashboard DOM structure (HTML elements and Tailwind classes) perfectly matches the reference Vite project.
- [ ] Navigation sidebars/topbars match the exact styling, icons, and layout of the reference.
- [ ] The application successfully compiles and typechecks via `npx tsc --noEmit`.

## 2026-09-14T00:50:58Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: [none — teamwork routes from the description]

Completely rewrite our Next.js UI structure (the main AppShell/Sidebar and the Dashboard page) to be a 1:1 visual clone of the reference Vite project located in `C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ref`.

Working directory: C:\Users\Admin\.gemini\antigravity\scratch\ceibo_ai
Integrity mode: development

## Requirements

### R1. Analyze the Reference UI
Read `../ceibo_ref/src/routes/index.tsx` to understand the exact DOM structure, Tailwind classes, Lucide icons, and Recharts setup used by the target design.

### R2. (COMPLETED) App Shell / Sidebar
The navigation layout (AppShell, Sidebar, Navbar) was successfully rewritten in the previous session. You do not need to rewrite the main navigation wrappers.

### R3. Rewrite the Dashboard and ALL Inner Pages
Rewrite `src/app/page.tsx` (Dashboard) and ALL other pages (`inbox`, `chats`, `documents`, `settings`) to perfectly mirror the reference project's design language, card layouts, table styles, and spacing. Keep our Supabase mock-data wiring, but ensure the entire application looks like a unified UI system derived from the reference repo.

## Acceptance Criteria

### Visual Parity
- [ ] The Next.js dashboard DOM structure (HTML elements and Tailwind classes) perfectly matches the reference Vite project.
- [ ] Navigation sidebars/topbars match the exact styling, icons, and layout of the reference.
- [ ] The application successfully compiles and typechecks via `npx tsc --noEmit`.


