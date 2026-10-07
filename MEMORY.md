# Agent Durable Memory (`MEMORY.md`)

This file records durable learnings, architectural decision records (ADRs), user preferences, and persistent project state across turns and agent sessions.

---

## 1. Architectural Decision Records (ADRs)

| Date | ADR Title | Decision & Rationale | Status |
|---|---|---|---|
| 2026-09-08 | ADR-001: Mobile-First Expo Stack & Dual Financial Model | Adopt Expo SDK with Expo Router and Supabase Postgres. Mobile-first ergonomics enable low-friction transaction capture at point-of-sale, while Expo Web/PWA serves desktop budget planning. Unifies reactive cash tracking (Monarch) with zero-based budgeting (YNAB). | Accepted |
| 2026-10-01 | ADR-002: Deepened Domain Seams, Port Segregation & Atomic Entity Manager | Segregate 25-method monolithic `LedgerRepository` into focused domain ports (`LedgerTransactionsPort`, `EntityCatalogPort`, `LedgerAdminPort`). Encapsulate entity mutation planning and integrity constraints inside deep `EntityManager` domain module, eliminating duplicated 9-step query dance across SQLite and Supabase repositories. Consolidate point-of-sale currency parsing, live deficit impact calculation, and smart payee matching into `ExpenseIntake` module, reducing modal presentational footprint by 75%. Absorb orphaned `SQLiteOnboardingRepository` directly into `SQLiteLedgerRepository` and decouple `useOnboardingGuard` from `DatabaseAdapter`. | Superseded by ADR-003 |
| 2026-10-05 | ADR-003: Deep Module Consolidation & Shallow Seam Simplification | Collapse speculative sub-ports (`LedgerTransactionsPort`, `EntityCatalogPort`, `LedgerAdminPort`) and dead hook pass-throughs back into the unified `LedgerRepository` interface ([`src/storage/types.ts`](src/storage/types.ts)). Eliminate orphaned pass-through modules (`entityOperations`, `AppleCardFace` mockup, and redundant `OnboardingRepository` wrapper), applying the Deletion Test to reduce indirection without increasing caller complexity. | Accepted |


---

## 2. User Preferences & Standing Rules

- **Communication Style**: ADHD-optimised output style (`/i-have-adhd`). Lead with next action, number multi-step tasks, suppress tangents, and make progress visible.
- **Pipeline Governance**: Always run `/product-function` -> `/grill-with-docs` -> `/to-spec` -> `/information-architecture` -> `/ooux` -> `/to-tickets` -> `/implement`.
- **Git Commit Standard**: Verify local git configuration matches `cesarchavezcal` before committing.

---

## 3. Persistent Knowledge Log

- 2026-09-08: Initial project setup bootstrapped from `cesarchavezcal/agent-boilerplate`.
- Stack: Expo SDK 57 (Expo Router, React Native 0.86, TypeScript, React 19).
- Primary Domain: Dual reactive cash flow manager (where money went) and proactive envelope budgeting (where money will go).
