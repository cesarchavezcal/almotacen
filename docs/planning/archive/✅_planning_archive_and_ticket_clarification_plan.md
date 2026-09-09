# Architecture & Planning: Ticket vs Implementation Plan Disambiguation

## 1. Goal Description & Verification
The user noted:
> *"I see that you created the tickets in two places, docs/planning and openspec/changes/dual-cashflow-budgeting/tickets"*

### Verification & Technical Reality
I inspected both directories to verify the claim:

1. **[`openspec/changes/dual-cashflow-budgeting/tickets/`](file:///Users/cesaradalbertochavezcalderon/Personal/almotacen/openspec/changes/dual-cashflow-budgeting/tickets/)**:
   - Contains the **executable tracer-bullet tickets** (`01-core-dual-ledger.md` through `07-month-cycle-paging.md`).
   - These are the standalone, agent-grabbable markdown issues formatted with acceptance criteria and blocker tags for `/autonomic` worktrees.

2. **[`docs/planning/`](file:///Users/cesaradalbertochavezcalderon/Personal/almotacen/docs/planning/)**:
   - Contains **architectural design documents** produced when `/plan` was triggered (e.g. `✅_user_journey_and_task_breakdown_plan.md`, `✅_core_product_architecture_plan.md`).
   - `✅_user_journey_and_task_breakdown_plan.md` contains an earlier high-level roadmap (`TASK-001`..`TASK-020`) drafted before the deep grilling session broke the work down into the 7 vertical tracer-bullet slices.

---

## 2. Proposed Cleanup (Per `AGENTS.md` Section 4)
Per [`AGENTS.md` Section 4](file:///Users/cesaradalbertochavezcalderon/Personal/almotacen/AGENTS.md#L107-L108):
> *"When completed/fully implemented, prefix with `✅_` and move to `docs/planning/archive/` (e.g. `docs/planning/archive/✅_my_plan.md`)."*

To eliminate any visual confusion between active planning and archived planning passes:
- Move all completed `✅_*.md` plans from `docs/planning/` into `docs/planning/archive/`.
- Keep `docs/planning/` clean for active, in-progress planning passes only.
- Leave `openspec/changes/dual-cashflow-budgeting/tickets/` as the sole, authoritative home for the 7 execution tickets.

---

## 3. Verification Plan
- Verify `openspec/changes/dual-cashflow-budgeting/tickets/` remains untouched with all 7 ticket files.
- Verify `docs/planning/archive/` holds the historical planning records.
