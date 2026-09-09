# Architecture & Alignment: Canonical SDD Storage in `openspec/`

## 1. Goal Description & Verification
The user asked:
> *"So /autonomic /to-tickets and /sdd-specs are designed to save the tickets/issues in the openspec folder?"*

### Verification Against Codebase & Architecture
After verifying against:
- [`AGENTS.md` (Unified Pipeline Mapping Matrix)](file:///Users/cesaradalbertochavezcalderon/Personal/almotacen/AGENTS.md#L48-L65)
- [`.agents/skills/autonomic/SKILL.md` (Steps 3, 4, 6)](file:///Users/cesaradalbertochavezcalderon/Personal/almotacen/.agents/skills/autonomic/SKILL.md#L58-L73)
- [`.agents/skills/sdd-tasks/SKILL.md`](file:///Users/cesaradalbertochavezcalderon/Personal/almotacen/.agents/skills/to-tickets/SKILL.md)

**The answer is YES.** The entire Unified SDD Architecture is explicitly designed around `openspec/` as the single version-controlled source of truth:

```text
┌─────────────────────────┬───────────────────────────────┬───────────────────────────────────────────┐
│ SDD Canonical Phase     │ Trigger Command               │ Artifact Target Path                      │
├─────────────────────────┼───────────────────────────────┼───────────────────────────────────────────┤
│ 2. /sdd-spec            │ /to-spec, /sdd-spec           │ openspec/specs/<feature>/spec.md          │
│ 2b. Spec Test Contracts │ /spec-to-tests                │ openspec/changes/<change>/spec-tests.md   │
│ 3. /sdd-design          │ /ia, /ooux, /sdd-design       │ openspec/changes/<change>/design.md       │
│ 4. /sdd-tasks           │ /to-tickets, /sdd-tasks       │ openspec/changes/<change>/tasks.md        │
│ 5. /sdd-apply           │ /autonomic, /harness, /team   │ Reads tasks.md & runs worktree TDD        │
└─────────────────────────┴───────────────────────────────┴───────────────────────────────────────────┘
```

---

## 2. Why Did `.scratch/` Appear Initially?

The standalone `/to-tickets` skill (developed originally by Matt Pocock) contains a legacy fallback rule for environments without an issue tracker:
> *"Local files → write one file per ticket under `.scratch/<feature-slug>/issues/<NN>-<slug>.md`"*

In our repository, `AGENTS.md` unifies `/to-tickets` with **Phase 4 (`/sdd-tasks`)**:
- The tickets are codified in `openspec/changes/<change>/tasks.md`.
- Individual ticket markdown files (if broken out for parallel worktrees) belong in `openspec/changes/<change>/tickets/`.
- This ensures everything is **version-controlled**, visible across git worktrees, and never hidden in untracked `.scratch/` directories.

---

## 3. How `/autonomic` Consumes `openspec/`

When `/autonomic` runs in a worktree:
1. It reads `openspec/changes/<change>/tasks.md` (or `feature_list.json`).
2. It identifies the first uncompleted ticket (e.g. `Ticket 1: Core Dual-Ledger with Credit Payment Reserve`).
3. It loads the matching behavioral contract from `openspec/changes/<change>/spec-tests.md` and `openspec/changes/<change>/specs/`.
4. It executes the Red ➔ Green TDD cycle in that worktree.
5. It marks the ticket complete in `openspec/changes/<change>/tasks.md` and moves to the next.

---

## 4. Verification
- `openspec/changes/dual-cashflow-budgeting/tasks.md` already contains all 7 tracer-bullet tickets.
- `openspec/changes/dual-cashflow-budgeting/specs/dual-cashflow-budgeting/spec.md` contains the formal delta contracts.
