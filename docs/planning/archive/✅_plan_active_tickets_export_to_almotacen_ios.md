# Implementation Plan: Active Ticket Structure for `almotacen-ios`

## Goal Description
Ensure that all 14 Almotacen feature tickets (ALM-001 through ALM-014) are exported to `/Users/cesaradalbertochavezcalderon/Personal/almotacen-ios` as **active, uncompleted work items** (`status: not-started`, unchecked `[ ]` acceptance criteria, and status `ready-for-agent`), rather than archived records.

This ensures that any coding agent starting a session in `almotacen-ios` detects `ALM-001` as the active priority, reads its `SCEN-001`..`SCEN-004` contract, and immediately begins implementing the native Swift code using Red ➔ Green ➔ Refactor TDD.

---

## The Active Change Lifecycle for Swift

Instead of dumping historical changes into `archive/`, we organize the Swift development roadmap into 4 active sequential change folders:

```text
/Users/cesaradalbertochavezcalderon/Personal/almotacen-ios/
├── openspec/
│   ├── config.yaml
│   ├── specs/                                          # Living baseline specifications
│   └── changes/
│       ├── 01-dual-cashflow-budgeting/                 # ACTIVE: Priority 1 (ALM-001 to ALM-007)
│       │   ├── proposal.md
│       │   ├── spec-tests.md                           # SCEN-001 to SCEN-027
│       │   ├── tasks.md                                # All [ ] unchecked
│       │   └── tickets/
│       │       ├── 01-core-dual-ledger.md              # [ ] ready-for-agent
│       │       ├── 02-sqlite-store-seed.md             # [ ] blocked by 01
│       │       ├── 03-pos-quick-capture-modal.md       # [ ] blocked by 02
│       │       ├── 04-proactive-budgeting-screen.md    # [ ] blocked by 02
│       │       ├── 05-reactive-cashflow-trajectory.md  # [ ] blocked by 02
│       │       ├── 06-interactive-chart-scrubbing.md   # [ ] blocked by 05
│       │       └── 07-month-cycle-paging.md            # [ ] blocked by 04, 05
│       │
│       ├── 02-proactive-budgeting-decision-engine/     # QUEUED: Priority 2 (ALM-008 to ALM-011)
│       │   ├── proposal.md
│       │   ├── spec-tests.md                           # SCEN-028 to SCEN-037
│       │   ├── tasks.md                                # All [ ] unchecked
│       │   └── tickets/
│       │       ├── 01-alm-008-targets-underfunded.md
│       │       ├── 02-alm-009-auto-assign.md
│       │       ├── 03-alm-010-overspending-coverage.md
│       │       └── 04-alm-011-ui-modals.md
│       │
│       ├── 03-design-system-modernization/             # QUEUED: Priority 3 (ALM-012)
│       │   ├── proposal.md
│       │   ├── spec-tests.md
│       │   ├── tasks.md
│       │   └── tickets/
│       │
│       └── 04-category-targets-and-split-transactions/ # QUEUED: Priority 4 (ALM-013 & ALM-014)
│           ├── proposal.md
│           ├── spec-tests.md                           # SCEN-038 to SCEN-043
│           ├── tasks.md
│           └── tickets/
```

---

## Agent Harness State Synchronization

To enable seamless autonomous startup (`/autonomic work ALM-001` or `/harness`), we configure the target repository's state files:

### 1. `feature_list.json` in `almotacen-ios`
All 14 features populated with `status: "not-started"`, empty `evidence: ""`, and explicit ticket paths:

```json
{
  "features": [
    {
      "id": "ALM-001",
      "name": "Core Dual-Ledger with Credit Payment Reserve",
      "description": "Pure Swift value types and LedgerEngine: atomic cash & credit outflows, credit reserve allocation, and unfunded debt tracking (SCEN-001 to SCEN-004)",
      "dependencies": [],
      "status": "not-started",
      "evidence": "",
      "ticketPath": "openspec/changes/01-dual-cashflow-budgeting/tickets/01-core-dual-ledger.md"
    },
    {
      "id": "ALM-002",
      "name": "SQLite Local-First Store & Seed Data (GRDB.swift)",
      "description": "GRDB.swift schema migrations v1, atomic double-sided repository, reactive ValueObservation, and seed data",
      "dependencies": ["ALM-001"],
      "status": "not-started",
      "evidence": "",
      "ticketPath": "openspec/changes/01-dual-cashflow-budgeting/tickets/02-sqlite-store-seed.md"
    }
    // ... ALM-003 through ALM-014
  ]
}
```

### 2. `progress.md` in `almotacen-ios`
```markdown
# Project Progress: Almotacen (Native iOS)

## Active Objective
- **Current Milestone**: Milestone 1 — Dual Cashflow Budgeting Core
- **Active Task**: `ALM-001: Core Dual-Ledger with Credit Payment Reserve`
- **Specification Scenarios**: `SCEN-001`, `SCEN-002`, `SCEN-003`, `SCEN-004`
- **Next Step**: Implement `Account`, `Category`, `Transaction`, and `LedgerEngine.postOutflowTransaction` in Swift with XCTest.
```

---

## Verification Plan

1. **Harness Inspection**:
   Run a dry-run check against `$TARGET/feature_list.json` to confirm 14 unstarted features are present.
2. **Ticket Checkbox Audit**:
   Verify that all markdown checkboxes in `$TARGET/openspec/changes/**/tasks.md` and `$TARGET/openspec/changes/**/tickets/*.md` are `[ ]` (unchecked) and labeled `status: ready-for-agent`.
3. **Agent Startup Test**:
   Verify that reading `$TARGET/progress.md` and `$TARGET/feature_list.json` directs any agent to begin `ALM-001` immediately.
