# Implementation Plan: Ticket Publishing, Worktree Setup, and `/autonomic` Handoff

## 1. Goal Description
Publish the 7 approved tracer-bullet tickets into disk-persisted issue files, wire them into the repository's SDD and feature registries, provision git worktree branches adhering to project conventions, and define the exact handoff procedure for `/autonomic` execution.

---

## 2. Where the Tickets Will Be Created

To ensure full compatibility with `/to-tickets`, OpenSpec SDD, and `/autonomic`:

1. **Individual Ticket Files (Local Agent-Grabbable Issues)**:
   - Location: `.scratch/dual-cashflow-budgeting/issues/`
   - Files:
     - `01-core-dual-ledger.md` (Blocked by: None)
     - `02-sqlite-store-seed.md` (Blocked by: 01)
     - `03-pos-quick-capture-modal.md` (Blocked by: 02)
     - `04-proactive-budgeting-screen.md` (Blocked by: 02)
     - `05-reactive-cashflow-trajectory.md` (Blocked by: 02)
     - `06-interactive-chart-scrubbing.md` (Blocked by: 05)
     - `07-month-cycle-paging.md` (Blocked by: 05)
   - Format: Standard `<local-ticket-template>` with `What to build`, `Blocked by`, `Status: ready-for-agent`, and actionable checkbox acceptance criteria.

2. **SDD Change Tasks Registry**:
   - Location: `openspec/changes/dual-cashflow-budgeting/tasks.md`
   - Role: Preserves the formal specification dependency graph and completion checkboxes.

3. **Autonomic Feature Registry**:
   - Location: `feature_list.json` & `progress.md`
   - Role: Maps tickets directly into the `/autonomic` harness state machine so automated subagents know the exact active work unit and definition of done.

---

## 3. Git Worktree Provisioning Plan

Per the repository's branch conventions (`AGENTS.md` Section 5):
- Branch format: `feature/CCH/ALM-{ticket-number}-{slug}`
- Worktree location: `../almotacen-worktrees/ALM-{ticket-number}-{slug}` (or sibling worktree directory).

### Step-by-Step Worktree Creation for Ticket 1:
```bash
# 1. Provision worktree at ../almotacen-worktrees/ALM-001-core-dual-ledger
git worktree add ../almotacen-worktrees/ALM-001-core-dual-ledger -b feature/CCH/ALM-001-core-dual-ledger

# 2. Link node_modules or copy env if necessary
cd ../almotacen-worktrees/ALM-001-core-dual-ledger
ln -s ../almotacen/node_modules ./node_modules

# 3. Verify baseline harness
./init.sh
```

---

## 4. `/autonomic` Autonomous Execution Flow

Once inside the worktree:
1. Run `/autonomic` (or `/harness`):
   - Loads the active ticket (`.scratch/dual-cashflow-budgeting/issues/01-core-dual-ledger.md`).
   - Executes Red ➔ Green ➔ Refactor TDD in `src/domain/ledger/`.
   - Runs `./init.sh` and typechecks.
   - Pre-commit verification via `.gga`.
   - Opens Pull Request and marks ticket completed.

---

## 5. Verification Plan
- Verify all 7 ticket files exist under `.scratch/dual-cashflow-budgeting/issues/` with valid Markdown headers.
- Verify `feature_list.json` contains matching IDs (`ALM-001` through `ALM-007`).
- Verify worktree can be provisioned cleanly without git index locks.
