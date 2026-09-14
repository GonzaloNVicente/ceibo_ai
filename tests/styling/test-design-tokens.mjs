#!/usr/bin/env node
/**
 * Test Suite: Ceibo AI UI Design System Tokens
 * 
 * Verifies Requirements R1 & R2 from ORIGINAL_REQUEST.md and PROJECT.md:
 * - tailwind.config.ts: color palette (neonCyan, deepBlue, brand emerald scale),
 *   font families (sans, display), border radius, and defaultTheme integration.
 * - globals.css: :root and .dark CSS variables, body base layer font-sans.
 * - layout.tsx: next/font/google loaders for Inter and Space_Grotesk.
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createSuite } from '../helpers/test-harness.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

export const stylingSuite = createSuite('Design System & Styling Tokens (R1 & R2)');

// Paths to authoritative files
const tailwindConfigPath = path.join(projectRoot, 'tailwind.config.ts');
const globalsCssPath = path.join(projectRoot, 'src/app/globals.css');
const layoutPath = path.join(projectRoot, 'src/app/layout.tsx');

// Read files
const tailwindConfigContent = fs.readFileSync(tailwindConfigPath, 'utf8');
const globalsCssContent = fs.readFileSync(globalsCssPath, 'utf8');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');

// -----------------------------------------------------------------------------
// Suite Tests
// -----------------------------------------------------------------------------

// 1. tailwind.config.ts checks
stylingSuite.test('Tailwind Config: imports defaultTheme from tailwindcss/defaultTheme', () => {
  assert.match(
    tailwindConfigContent,
    /import\s+defaultTheme\s+from\s+['"]tailwindcss\/defaultTheme['"]/,
    'tailwind.config.ts must import defaultTheme'
  );
});

stylingSuite.test('Tailwind Config: registers Ceibo accent colors neonCyan (#00e5ff) & deepBlue (#0044ff)', () => {
  assert.match(
    tailwindConfigContent,
    /neonCyan:\s*['"]#00e5ff['"]/i,
    'neonCyan must be mapped to #00e5ff'
  );
  assert.match(
    tailwindConfigContent,
    /deepBlue:\s*['"]#0044ff['"]/i,
    'deepBlue must be mapped to #0044ff'
  );
});

stylingSuite.test('Tailwind Config: registers complete 10-shade Emerald brand scale (50..900)', () => {
  const expectedShades = {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  };

  for (const [shade, hex] of Object.entries(expectedShades)) {
    const regex = new RegExp(`${shade}:\\s*['"]${hex}['"]`, 'i');
    assert.match(
      tailwindConfigContent,
      regex,
      `brand scale must contain shade ${shade} with value ${hex}`
    );
  }
});

stylingSuite.test('Tailwind Config: maps all semantic CSS variable tokens in colors', () => {
  const semanticTokens = [
    'border',
    'input',
    'ring',
    'background',
    'foreground',
    'primary',
    'secondary',
    'destructive',
    'muted',
    'accent',
    'popover',
    'card',
  ];

  for (const token of semanticTokens) {
    assert.ok(
      tailwindConfigContent.includes(`${token}:`),
      `tailwind.config.ts must define semantic token '${token}'`
    );
  }
});

stylingSuite.test('Tailwind Config: extends fontFamily with sans and display stacks', () => {
  assert.match(
    tailwindConfigContent,
    /sans:\s*\[\s*['"]var\(--font-sans\)['"],\s*['"]var\(--font-inter\)['"],\s*\.\.\.defaultTheme\.fontFamily\.sans\s*\]/,
    'fontFamily.sans must include var(--font-sans), var(--font-inter), and defaultTheme.fontFamily.sans'
  );

  assert.match(
    tailwindConfigContent,
    /display:\s*\[\s*['"]var\(--font-display\)['"],\s*['"]Space Grotesk['"],\s*\.\.\.defaultTheme\.fontFamily\.sans\s*\]/,
    'fontFamily.display must include var(--font-display), Space Grotesk, and defaultTheme.fontFamily.sans'
  );
});

stylingSuite.test('Tailwind Config: extends borderRadius with lg, md, sm using var(--radius)', () => {
  assert.match(
    tailwindConfigContent,
    /lg:\s*['"]var\(--radius\)['"]/,
    'borderRadius.lg must map to var(--radius)'
  );
  assert.match(
    tailwindConfigContent,
    /md:\s*['"]calc\(var\(--radius\)\s*-\s*2px\)['"]/,
    'borderRadius.md must map to calc(var(--radius) - 2px)'
  );
  assert.match(
    tailwindConfigContent,
    /sm:\s*['"]calc\(var\(--radius\)\s*-\s*4px\)['"]/,
    'borderRadius.sm must map to calc(var(--radius) - 4px)'
  );
});

// 2. globals.css checks
stylingSuite.test('globals.css: :root defines exact Ceibo UI design tokens', () => {
  const expectedRootVars = [
    ['--background', '210 40% 98%'],
    ['--foreground', '222.2 84% 4.9%'],
    ['--card', '0 0% 100%'],
    ['--card-foreground', '222.2 84% 4.9%'],
    ['--popover', '0 0% 100%'],
    ['--popover-foreground', '222.2 84% 4.9%'],
    ['--primary', '158 64% 52%'],
    ['--primary-foreground', '210 40% 98%'],
    ['--secondary', '210 40% 96.1%'],
    ['--secondary-foreground', '222.2 47.4% 11.2%'],
    ['--muted', '210 40% 96.1%'],
    ['--muted-foreground', '215.4 16.3% 46.9%'],
    ['--accent', '186 100% 50%'],
    ['--accent-foreground', '222.2 47.4% 11.2%'],
    ['--destructive', '0 84.2% 60.2%'],
    ['--destructive-foreground', '210 40% 98%'],
    ['--border', '214.3 31.8% 91.4%'],
    ['--input', '214.3 31.8% 91.4%'],
    ['--ring', '158 64% 52%'],
    ['--radius', '0.5rem'],
  ];

  for (const [name, val] of expectedRootVars) {
    const escapedVal = val.replace(/\./g, '\\.').replace(/%/g, '%');
    const regex = new RegExp(`${name}:\\s*${escapedVal};`);
    assert.match(
      globalsCssContent,
      regex,
      `:root must define ${name}: ${val};`
    );
  }
});

stylingSuite.test('globals.css: .dark defines reference Command Center tokens', () => {
  const expectedDarkVars = [
    ['--background', '0 0% 4%'],
    ['--foreground', '0 0% 93%'],
    ['--card', '0 0% 7%'],
    ['--card-foreground', '0 0% 93%'],
    ['--popover', '0 0% 7%'],
    ['--popover-foreground', '0 0% 93%'],
    ['--primary', '186 100% 50%'],
    ['--primary-foreground', '0 0% 4%'],
    ['--secondary', '224 100% 50%'],
    ['--secondary-foreground', '0 0% 98%'],
    ['--muted', '0 0% 12%'],
    ['--muted-foreground', '0 0% 53%'],
    ['--accent', '186 100% 50%'],
    ['--accent-foreground', '0 0% 4%'],
    ['--destructive', '0 62.8% 30.6%'],
    ['--destructive-foreground', '0 0% 98%'],
    ['--border', '0 0% 20%'],
    ['--input', '0 0% 20%'],
    ['--ring', '186 100% 50%'],
  ];

  for (const [name, val] of expectedDarkVars) {
    const escapedVal = val.replace(/\./g, '\\.').replace(/%/g, '%');
    const regex = new RegExp(`${name}:\\s*${escapedVal};`);
    assert.match(
      globalsCssContent,
      regex,
      `.dark must define ${name}: ${val};`
    );
  }
});

stylingSuite.test('globals.css: body applies font-sans in @layer base', () => {
  assert.match(
    globalsCssContent,
    /body\s*\{\s*@apply[^;]*font-sans[^;]*;\s*\}/,
    'globals.css body rule must include font-sans'
  );
});

// 3. layout.tsx checks
stylingSuite.test('layout.tsx: imports Inter and Space_Grotesk from next/font/google', () => {
  assert.match(
    layoutContent,
    /import\s*\{[^}]*Inter[^}]*\}\s*from\s*['"]next\/font\/google['"]/,
    'layout.tsx must import Inter from next/font/google'
  );
  assert.match(
    layoutContent,
    /import\s*\{[^}]*Space_Grotesk[^}]*\}\s*from\s*['"]next\/font\/google['"]/,
    'layout.tsx must import Space_Grotesk from next/font/google'
  );
});

stylingSuite.test('layout.tsx: configures Inter with variable --font-sans and display swap', () => {
  assert.match(
    layoutContent,
    /variable:\s*['"]--font-sans['"]/,
    'Inter must configure variable: --font-sans'
  );
  assert.match(
    layoutContent,
    /display:\s*['"]swap['"]/,
    'Inter must configure display: swap'
  );
});

stylingSuite.test('layout.tsx: configures Space_Grotesk with variable --font-display and display swap', () => {
  assert.match(
    layoutContent,
    /variable:\s*['"]--font-display['"]/,
    'Space_Grotesk must configure variable: --font-display'
  );
  assert.match(
    layoutContent,
    /display:\s*['"]swap['"]/,
    'Space_Grotesk must configure display: swap'
  );
});

stylingSuite.test('layout.tsx: html element injects both font variables into className', () => {
  assert.match(
    layoutContent,
    /<html[^>]*className=\{`[^`]*\$\{inter\.variable\}[^`]*\$\{spaceGrotesk\.variable\}[^`]*`\}/,
    'html tag must apply both inter.variable and spaceGrotesk.variable'
  );
});

// Self-executable when invoked directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  stylingSuite.run().then(res => {
    if (res.failed > 0) {
      process.exit(1);
    }
  });
}
