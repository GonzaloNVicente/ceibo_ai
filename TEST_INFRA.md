# TEST_INFRA.md — Ceibo AI E2E Test Infrastructure & Architecture

## 1. Overview & Test Philosophy

This document details the requirement-driven, opaque-box End-to-End (E2E) testing framework for **Ceibo AI**, a B2B SaaS WhatsApp Sales Assistant management platform for SMBs.

The test suite is structured around a **4-Tier Testing Methodology** designed to ensure complete behavioral coverage, adversarial resilience, multi-tenant security, and real-world B2B SMB workflow fidelity without depending on brittle DOM selectors or opaque mocking facades.

### Core Testing Principles
1. **Opaque-Box Requirement-Driven**: Tests are designed directly from `ORIGINAL_REQUEST.md` (R1: Auth & Multi-Tenancy, R2: Main Dashboard Page, R3: Design & Styling) and `PROJECT.md` interface contracts.
2. **Authoritative Expected Output Derivation**: Every test assertion is derived from formal mathematical formulas, database constraints, and documented contract behavior—never reverse-engineered to fit a bug.
3. **Zero-Dependency Native Execution**: All tests are written as standalone ES Modules (`.mjs`) leveraging Node.js native runtime assertion capabilities (`node:assert/strict`). They execute instantly without requiring complex browser emulators, heavy webdriver daemons, or cloud databases.
4. **Strict Multi-Tenant Isolation Verification**: Multi-tenancy is treated as a first-class security boundary. Tests rigorously verify that discriminator column filters (`empresa_id`) and Row Level Security policies prevent cross-tenant data leakage under all conditions.

---

## 2. The 4-Tier Testing Architecture

- **Tier 1 (Core Feature Coverage, 27 tests)**: Auth login, profile fetching, metric formulas, chart series, navigation routes.
- **Tier 2 (Boundary & Corner Cases, 25 tests)**: Empty chat_analytics, zero inquiries, negative counters, invalid passwords, expired tokens.
- **Tier 3 (Cross-Feature Combinations, 10 tests)**: Tenant A vs B isolation, date range filtering + tenant scoping, session switching.
- **Tier 4 (Real-World Application Scenarios, 5 tests)**: SMB daily morning review, adversarial penetration attempt, session re-authentication.

**Total tests**: 67 tests across 5 standalone suites.

---

## 3. Test Runner
```bash
node tests/run-all-tests.mjs
```
Expected result: 67 passed, 0 failed, exit code 0.
