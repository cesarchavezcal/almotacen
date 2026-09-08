# Project Context (`CONTEXT.md`)

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
├── app/                    # Expo Router file-based navigation (tabs, layouts, modals)
│   ├── (tabs)/             # Main tab navigator (Dashboard/Cashflow, Budget, Accounts)
│   ├── _layout.tsx         # Root app layout & providers
│   └── modal.tsx           # Quick transaction entry modal
├── assets/                 # App icons, splash screens, and images
├── components/             # Reusable UI components (Themed, Parallax, Forms)
├── constants/              # App themes, colors, and static configuration
├── .agents/                # Local agent skills and specialized workflows
├── .atl/                   # Skill registry index (.atl/skill-registry.md)
├── .gga                    # Gentleman Guardian Angel AI code review configuration
├── .github/                # GitHub workflows, issue templates, and PR template
├── AGENTS.md               # Primary operational rules, SDD pipeline, & coding standards
├── CLAUDE.md               # Claude Code configuration pointer
├── CONTEXT.md              # Project domain definition & tech stack
├── MEMORY.md               # Durable memory & architectural decision records
├── SKILLS.md               # High-level skill catalog and dynamic discovery guide
├── openspec/               # Spec-Driven Development (specs/, changes/, config.yaml)
├── scripts/                # Dynamic stack setup and skill installation scripts
└── docs/
    ├── planning/           # Implementation plans and walkthroughs
    └── product-design/     # Product specs (/product-function, /ia, /ooux)
```

---

## 4. Key Conventions & Design System

- **Styling**: React Native StyleSheet with unified theme tokens (`constants/Colors.ts`).
- **Components**: Functional components with strict TypeScript prop contracts and accessibility labels.
- **Architecture**: Modular separation between domain financial logic (ledgers, allocation calculations), state/data hooks, and UI presentational components.
- **Local-First & Offline**: Optimistic UI updates for quick expense logging with background sync.
