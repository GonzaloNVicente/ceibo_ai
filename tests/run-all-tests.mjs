#!/usr/bin/env node
/**
 * Unified E2E Test Suite Runner for Ceibo AI
 * 
 * Executes all 4-tier requirement test suites across:
 * - Auth & Multi-Tenancy
 * - Dashboard KPI Metrics
 * - 30-Day Chat Analytics Chart Data
 * - Navigation & Shell Routes
 * - Multi-Tenant Data Isolation & Security
 * 
 * Provides structured ANSI output, per-suite summaries, and standard POSIX exit codes.
 */

import { authSuite } from './e2e/test-auth-multitenancy.mjs';
import { metricsSuite } from './e2e/test-dashboard-metrics.mjs';
import { chartSuite } from './e2e/test-chart-data.mjs';
import { navSuite } from './e2e/test-navigation-routes.mjs';
import { isolationSuite } from './e2e/test-tenant-isolation.mjs';
import { adversarialSuite } from './e2e/test-adversarial-multitenancy.mjs';

async function main() {
  const suites = [
    authSuite,
    metricsSuite,
    chartSuite,
    navSuite,
    isolationSuite,
    adversarialSuite,
  ];

  console.log(`\x1b[1m\x1b[35m`);
  console.log(`╔════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║                   CEIBO AI - FULL E2E TEST RUNNER                      ║`);
  console.log(`║            B2B SaaS WhatsApp Sales Assistant Platform SMB              ║`);
  console.log(`╚════════════════════════════════════════════════════════════════════════╝`);
  console.log(`\x1b[0m`);
  console.log(`Start time: ${new Date().toISOString()}`);
  console.log(`Total suites scheduled: ${suites.length}\n`);

  const globalStart = Date.now();
  const results = [];

  for (const s of suites) {
    const res = await s.run();
    results.push(res);
  }

  const globalDuration = Date.now() - globalStart;
  const totalTests = results.reduce((acc, r) => acc + r.total, 0);
  const totalPassed = results.reduce((acc, r) => acc + r.passed, 0);
  const totalFailed = results.reduce((acc, r) => acc + r.failed, 0);

  console.log(`\n\x1b[1m\x1b[36m======================================================================\x1b[0m`);
  console.log(`\x1b[1m\x1b[36m                     EXECUTIVE TEST REPORT                            \x1b[0m`);
  console.log(`\x1b[1m\x1b[36m======================================================================\x1b[0m\n`);

  console.log(`┌───────────────────────────────────────────────────┬────────┬────────┬────────┐`);
  console.log(`│ Suite Name                                        │ Total  │ Passed │ Status │`);
  console.log(`├───────────────────────────────────────────────────┼────────┼────────┼────────┤`);

  for (const r of results) {
    const name = r.suiteName.padEnd(49, ' ').slice(0, 49);
    const total = String(r.total).padStart(6, ' ');
    const passed = String(r.passed).padStart(6, ' ');
    const status = r.failed === 0 ? '\x1b[32m  PASS  \x1b[0m' : '\x1b[31m  FAIL  \x1b[0m';
    console.log(`│ ${name} │ ${total} │ ${passed} │ ${status} │`);
  }

  console.log(`└───────────────────────────────────────────────────┴────────┴────────┴────────┘\n`);

  console.log(`\x1b[1mOverall Execution Summary:\x1b[0m`);
  console.log(`  Total Suites:   ${suites.length}`);
  console.log(`  Total Tests:    ${totalTests}`);
  console.log(`  Passed Tests:   \x1b[32m${totalPassed}\x1b[0m`);
  console.log(`  Failed Tests:   \x1b[${totalFailed > 0 ? '31' : '32'}m${totalFailed}\x1b[0m`);
  console.log(`  Total Duration: ${globalDuration}ms\n`);

  if (totalFailed === 0) {
    console.log(`\x1b[1m\x1b[32m✔ ALL CEIBO AI E2E TESTS PASSED SUCCESSFULLY (100% SUCCESS RATE)\x1b[0m\n`);
    process.exit(0);
  } else {
    console.log(`\x1b[1m\x1b[31m✘ TEST SUITE FAILED WITH ${totalFailed} FAILED TESTS\x1b[0m\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\x1b[31mFatal unhandled error in test runner:\x1b[0m', err);
  process.exit(1);
});
