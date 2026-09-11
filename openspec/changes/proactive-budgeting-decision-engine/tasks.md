# Tasks: Proactive Budgeting Decision Engine

Tracks implementation of the 4 tracer-bullet tickets for the Proactive Budgeting Decision Engine.

---

### [x] 1. Ticket ALM-008: Dual Category Targets & Underfunded Deficit Engine
- **Spec Scenario**: `SCEN-028`, `SCEN-029`, `SCEN-030`
- **Dependencies**: None
- [x] Migrate SQLite schema to version 2 (`target_type`, `target_due_day`).
- [x] Update `src/domain/ledger/types.ts`.
- [x] TDD: Implement `src/domain/ledger/targets.ts` & `targets.test.ts`.
- [x] Update `src/storage/schema.ts` & `ledgerRepository.ts`.

### [ ] 2. Ticket ALM-009: Auto-Assign Payday Prioritization Engine
- **Spec Scenario**: `SCEN-031`, `SCEN-032`, `SCEN-033`
- **Dependencies**: ALM-008
- [ ] TDD: Implement `src/domain/ledger/autoAssign.ts` & `autoAssign.test.ts`.
- [ ] Implement multi-tier priority queue (overspent -> immediate -> commitments -> variable).
- [ ] Enforce non-negative Ready to Assign exhaustion invariant.

### [ ] 3. Ticket ALM-010: Interactive Overspending Coverage ("Roll with the Punches")
- **Spec Scenario**: `SCEN-034`, `SCEN-035`
- **Dependencies**: ALM-008
- [ ] TDD: Implement `src/domain/ledger/overspendingCoverage.ts` & `overspendingCoverage.test.ts`.
- [ ] Add `rebalanceCategoryFunds` to `ledgerRepository.ts`.
- [ ] Support both cash overspending and credit card debt reserve transfers.

### [ ] 4. Ticket ALM-011: UI Bottom Sheets & Budget Tab Integration
- **Spec Scenario**: E2E User Flow
- **Dependencies**: ALM-009, ALM-010
- [ ] Build `src/components/AutoAssignModal.tsx`.
- [ ] Build `src/components/CoverOverspendingModal.tsx`.
- [ ] Integrate tactile triggers into `app/(tabs)/budget.tsx`.
- [ ] Verify `./init.sh` and native iOS Simulator flow.
