# Agent Durable Memory (`MEMORY.md`)

This file records durable learnings, architectural decision records (ADRs), user preferences, and persistent project state across turns and agent sessions.

---

## 1. Architectural Decision Records (ADRs)

| Date | ADR Title | Decision & Rationale | Status |
|---|---|---|---|
| 2026-09-08 | ADR-001: Mobile-First Expo Stack & Dual Financial Model | Adopt Expo SDK with Expo Router and Supabase Postgres. Mobile-first ergonomics enable low-friction transaction capture at point-of-sale, while Expo Web/PWA serves desktop budget planning. Unifies reactive cash tracking (Monarch) with zero-based budgeting (YNAB). | Accepted |

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
