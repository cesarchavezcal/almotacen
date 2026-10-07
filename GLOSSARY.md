# Project Glossary & Context (`GLOSSARY.md`)

This file holds the project's domain definition, architecture overview, and technology stack.

---

## 1. Project Overview

- **Project Name**: `almotacen`
- **Domain / Description**: A reactive cash flow manager and proactive zero-based budgeting tool combining the best of Monarch Money (tracking where your money went) and YNAB (deciding where your money will go).
- **Target Audience / Mental Model**: Individuals and households seeking financial clarity and intentionality. Dual mental model: (1) Reactive cash flow tracking and transaction awareness, and (2) Proactive zero-based envelope budgeting where every currency unit is given a job.

---

## 2. Technology Stack

- **Frontend / Mobile**: Expo SDK 57 (Expo Router, React Native 0.86, React 19, TypeScript)
- **Backend / Database**: Supabase (PostgreSQL, Row-Level Security, Realtime, Edge Functions)
- **Local Storage / Caching**: Expo SQLite / OP-SQLite for offline-first reactive cash logging
- **Testing Framework**: Vitest / Jest (`jest-expo`, `@testing-library/react-native`)
- **Deployment & Distribution**: EAS (Expo Application Services) for iOS and Android native binaries; Vercel / Cloudflare for Web & PWA

---

## 3. Key Architecture & File Layout

```text
.
├── app/                    # Expo Router file-based navigation (routes/containers)
│   ├── (tabs)/             # Tab navigator: index (/), budget, accounts, settings
│   ├── _layout.tsx         # Root app layout & providers
│   ├── onboarding.tsx      # Onboarding flow route
│   └── modal.tsx           # Quick transaction entry modal route
├── assets/                 # App icons, splash screens, and images
├── src/                    # PRIMARY APPLICATION SOURCE ROOT
│   ├── domain/             # Pure financial business rules & models
│   │   ├── ledger/         # Core ledgerEngine, currency, rollover, targets, auto-assign
│   │   ├── cashflow/       # Reactive cashflow trajectories & scrubbing math
│   │   └── onboarding/     # Onboarding validation rules & archetypes
│   ├── storage/            # Local SQLite & remote Supabase persistence engines
│   │   ├── types.ts        # ⚡ Single source of truth for repository & entity contracts
│   │   ├── database.ts     # Platform database adapter (expo-sqlite / node:sqlite)
│   │   ├── schema.ts       # SQLite DDL migrations & default seed data
│   │   ├── ledgerRepository.ts # Atomic SQLite double-sided ledger repository
│   │   ├── supabase/       # Supabase Postgres client, DDL, and auth repository
│   │   └── useLedgerStore.ts   # Unified storage hook & event emitter
│   ├── hooks/              # State & data orchestration hooks
│   │   ├── useCashflow.ts  # Reactive burn trajectory & chart state
│   │   ├── useSmartPayeeMemory.ts # Auto-categorization memory
│   │   └── useOnboardingWizard.ts # 4-step wizard coordinator
│   ├── screens/            # Full-screen container layouts
│   │   ├── DashboardScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/         # In-app Design System & domain UI modules
│   │   ├── Button.tsx, Card.tsx, Input.tsx, Modal.tsx # Primitives
│   │   ├── budget/         # Budget table, envelope rows, coverage modals
│   │   ├── cashflow/       # ReactiveBurnChart & trajectory visuals
│   │   ├── onboarding/     # OnboardingWizardView & step cards
│   │   └── settings/       # Entity CRUD modals & reset alerts
│   └── theme/              # Active design tokens (colors, spacing, typography, shadows)
├── components/             # [DEPRECATED] Boilerplate Expo starter templates (do not use)
├── constants/              # Static fallback constants
├── .agents/                # Local agent skills and specialized workflows
├── .atl/                   # Skill registry index (.atl/skill-registry.md)
├── .gga                    # Gentleman Guardian Angel AI code review configuration
├── .github/                # GitHub workflows, issue templates, and PR template
├── AGENTS.md               # Primary operational rules, SDD pipeline, & coding standards
├── CLAUDE.md               # Claude Code configuration pointer
├── GLOSSARY.md             # Project domain definition, ubiquitous glossary & tech stack
├── MEMORY.md               # Durable memory & architectural decision records
├── SKILLS.md               # High-level skill catalog and dynamic discovery guide
├── openspec/               # Spec-Driven Development (specs/, changes/, config.yaml)
├── scripts/                # Dynamic stack setup and skill installation scripts
└── docs/
    ├── planning/           # Active engineering plans (completed moved to archive/)
    ├── product-design/     # Product specs (/product-function, /ia, /ooux)
    └── product-description/# Outside-in UX state charts & verification matrices
```

---

## 4. Route-to-Component Navigation Map

| Route | Container / Screen | Primary Hook | Underlying Domain / Storage |
|---|---|---|---|
| `app/(tabs)/index.tsx` (`/`) | `DashboardScreen.tsx` & `ReactiveBurnChart` | `useCashflow` | `src/domain/cashflow/` & `useLedgerStore` |
| `app/(tabs)/budget.tsx` (`/budget`) | `BudgetTableView.tsx` | `useLedgerStore` | `src/domain/ledger/ledgerEngine.ts` |
| `app/(tabs)/accounts.tsx` (`/accounts`) | Account list & cards | `useLedgerStore` | `src/storage/types.ts` (`Account`) |
| `app/(tabs)/settings.tsx` (`/settings`) | `SettingsScreen.tsx` | `useLedgerStore` | `src/storage/` (Entity CRUD & Diagnostics) |
| `app/onboarding.tsx` (`/onboarding`) | `OnboardingScreen.tsx` & `OnboardingWizardView.tsx` | `useOnboardingWizard` | `src/domain/onboarding/` |
| `app/modal.tsx` (`/modal`) | `QuickExpenseModal.tsx` | `useExpenseIntake` | `src/domain/ledger/expenseIntake.ts` |

---

## 5. Key Conventions & Design System

- **Storage Contracts**: Always check [`src/storage/types.ts`](src/storage/types.ts) for method signatures and return shapes before reading repository implementations.
- **Styling**: React Native StyleSheet with unified theme tokens from [`src/theme/`](src/theme/) (`colors.ts`, `spacing.ts`, `typography.ts`, `radius.ts`, `shadows.ts`). Do NOT use legacy `constants/Colors.ts`.
- **Components**: Use components in [`src/components/`](src/components/). The root `components/` directory contains legacy starter code.
- **Architecture**: Modular separation between domain financial logic (ledgers, allocation calculations), state/data hooks, and UI presentational components.
- **Local-First & Offline**: Optimistic UI updates for quick expense logging with background sync.
