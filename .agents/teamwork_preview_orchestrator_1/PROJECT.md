# Project: Ceibo AI UI Design System Integration

## Architecture
- Dual-layer styling integration:
  - Layer 1: Semantic CSS variables in `src/app/globals.css` (`:root` and `.dark`) for primary, secondary, accent, background, foreground, border, ring, etc.
  - Layer 2: Extended Tailwind tokens in `tailwind.config.ts` for `neonCyan`, `deepBlue`, `brand`, `fontFamily.sans`, `fontFamily.display`, and `borderRadius`.
  - Font loading: `src/app/layout.tsx` using `next/font/google` for `Inter` (`--font-sans`) and `Space_Grotesk` (`--font-display`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Reference Token Extraction | Extract colors, typography, and layout from Ceibo ecosystem | M1 | Survey (spec_miner) |
| 2 | Tailwind Color Configuration | Inject neonCyan, deepBlue, brand emerald into tailwind.config.ts | M2 | Survey (spec_miner/explorer_1) |
| 3 | Tailwind Typography Configuration | Configure sans (Inter) and display (Space Grotesk) in tailwind.config.ts | M2 | Survey (spec_miner/explorer_1) |
| 4 | CSS Variables Theming | Configure :root and .dark variables in globals.css (primary, accent, background, card, border, ring, radius) | M2 | Survey (spec_miner/explorer_1) |
| 5 | Next.js Font Loading | Integrate Inter & Space_Grotesk in layout.tsx with zero-CLS swap & CSS variables | M2 | Survey (explorer_2) |
| 6 | Preservation of Existing UI Classes | Ensure slate-*, emerald-*, brand-* across Dashboard & Shell map cleanly | M2 | Survey (explorer_1) |
| 7 | Zero Layout Breakage | Dashboard & Inbox maintain grid/flex dimensions and responsiveness | M3 | ORIGINAL_REQUEST.md AC3 |
| 8 | TypeScript Typecheck Validation | npx tsc --noEmit passes cleanly with zero errors | M3 | ORIGINAL_REQUEST.md AC2 |
| 9 | Existing E2E Test Suite Pass | 89/89 tests in node tests/run-all-tests.mjs pass | M3 | Regression Guard |
| 10 | Styling & Visual Verification | Automated token assertion & HTTP verification of Dashboard & Inbox | M3 | ORIGINAL_REQUEST.md AC1 & AC3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Survey & Token Mining | Extract complete design token spec and mapping plan | none | DONE |
| 2 | Styling Integration | Implement tailwind.config.ts, globals.css, and layout.tsx | M1 | DONE |
| 3 | Verification & Forensic Audit | Typecheck, test suites, styling assertions, visual checks, and audit | M2 | DONE |

## Interface Contracts
### Design Tokens ↔ tailwind.config.ts & globals.css
- `tailwind.config.ts`:
  - `colors.neonCyan`: `#00e5ff`
  - `colors.deepBlue`: `#0044ff`
  - `colors.brand`: Emerald scale 50..900 (`#ecfdf5` .. `#064e3b`)
  - `fontFamily.sans`: `['var(--font-sans)', 'var(--font-inter)', ...defaultTheme.fontFamily.sans]`
  - `fontFamily.display`: `['var(--font-display)', 'Space Grotesk', ...defaultTheme.fontFamily.sans]`
- `globals.css`:
  - `:root`: `--primary: 158 64% 52%`, `--accent: 186 100% 50%`, `--background: 210 40% 98%`, `--card: 0 0% 100%`, `--border: 214.3 31.8% 91.4%`, `--radius: 0.5rem`
  - `.dark`: `--primary: 186 100% 50%`, `--secondary: 224 100% 50%`, `--background: 0 0% 4%`, `--card: 0 0% 7%`, `--border: 0 0% 20%`
  - `body`: `@apply bg-slate-50 text-slate-900 antialiased selection:bg-brand-500 selection:text-white font-sans;`
- `layout.tsx`:
  - Load `Inter` with `variable: '--font-sans'`
  - Load `Space_Grotesk` with `variable: '--font-display'`
  - Pass variables to `<html className={`${inter.variable} ${spaceGrotesk.variable} ...`}>`

## Code Layout
- Target configuration files:
  - `tailwind.config.ts`
  - `src/app/globals.css`
  - `src/app/layout.tsx`
- Verification test files:
  - `tests/styling/test-design-tokens.mjs`
  - `tests/run-all-tests.mjs`
