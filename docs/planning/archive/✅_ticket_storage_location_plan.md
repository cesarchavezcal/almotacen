# Architecture & Planning: Ticket Placement in `openspec/` vs `.scratch/`

## 1. Goal Description
The user questioned why tickets were targeted for `.scratch/` rather than `openspec/` or `docs/`. This document compares the storage strategies, explains the architectural tradeoffs, and defines the optimal placement under `openspec/changes/dual-cashflow-budgeting/tickets/` for worktree and `/autonomic` compatibility.

---

## 2. Comparison of Storage Locations

| Location | Purpose in Repository | Tradeoff Analysis | Verdict |
|---|---|---|---|
| **`.scratch/`** | Default scratchpad used by Matt Pocock's `/to-tickets` skill. | Typically gitignored or untracked. If a new git worktree is spawned, `.scratch/` is **not copied**, causing the new worktree to lose its ticket files immediately. | ❌ Flawed for Worktrees |
| **`docs/`** | Architecture, design rationale, and user journeys (`docs/product-design/`, `docs/planning/`). | Storing atomic task/execution tickets here pollutes human-facing product documentation with ephemeral agent task tickets. Violates `AGENTS.md` Section 4. | ❌ Wrong Domain |
| **`openspec/changes/<change>/tickets/`** | Testable contracts, change lifecycles, executable tasks, and atomic work units. | **Fully version-controlled**, automatically available in every branched worktree, and perfectly co-located with `tasks.md`, `spec-tests.md`, and `design.md`. | ✅ Optimal Location |

---

## 3. Revised Ticket Location & Structure

All 7 tracer-bullet tickets will be created in:
```text
openspec/changes/dual-cashflow-budgeting/tickets/
├── 01-core-dual-ledger.md
├── 02-sqlite-store-seed.md
├── 03-pos-quick-capture-modal.md
├── 04-proactive-budgeting-screen.md
├── 05-reactive-cashflow-trajectory.md
├── 06-interactive-chart-scrubbing.md
└── 07-month-cycle-paging.md
```

Each ticket maintains the standardized `<local-ticket-template>`:
- **What to build**: End-to-end behavior description.
- **Blocked by**: Dependency pointers to other tickets.
- **Status**: `ready-for-agent`.
- **Acceptance criteria**: Testable checkboxes.

---

## 4. Git Worktree & `/autonomic` Compatibility
Because `openspec/` is tracked by git:
1. When you run `git worktree add ../almotacen-worktrees/ALM-001-core-dual-ledger -b feature/CCH/ALM-001-core-dual-ledger`, all ticket files in `openspec/changes/dual-cashflow-budgeting/tickets/` are immediately present inside the worktree without manual copying.
2. The `/autonomic` orchestrator and `/harness` agent can read `openspec/changes/dual-cashflow-budgeting/tickets/01-core-dual-ledger.md` directly.
