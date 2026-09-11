# Proposal: Proactive Budgeting Decision Engine

## Intent
Transform `almotacen` from a reactive cashflow tracker into an active zero-based decision engine. Users can configure targets per category, see real-time underfunded deficits, trigger an automatic payday allocation wizard, and roll with the punches by covering overspending directly from funded envelopes.

## Scope

### In Scope
- Dual category target types: `NEEDED_FOR_SPENDING` (rollover-aware) and `MONTHLY_SET_ASIDE` (fixed commitment).
- Real-time Underfunded calculation engine across envelopes and groups.
- Deterministic Auto-Assign Payday Prioritization Wizard (funds overspent categories first, then immediate obligations, fixed commitments by due day, and variable expenses).
- "Roll with the Punches" overspending coverage workflow (1-tap movement of funds between categories).
- SQLite Schema version 2 migration with backward compatibility.

### Out of Scope
- Automatic bank syncing (Plaid/Teller) — manual point-of-sale logging remains active.
- Multi-currency conversion (USD integer cents only).

## Capabilities

### New Capabilities
- `proactive-budgeting`: Full behavioral specification for Target types, Underfunded calculation, Auto-Assign payday allocation, and Overspending resolution.

### Modified Capabilities
- None

## Approach
- Add `target_type` and `target_due_day` to `categories` schema.
- Implement pure domain calculators (`targets.ts`, `autoAssign.ts`, `overspendingCoverage.ts`) with 100% test coverage.
- Extend `ledgerRepository.ts` and `useLedgerStore.ts` with atomic balance transfers and auto-assign mutations.
- Build bottom-sheet UI modals (`AutoAssignModal.tsx`, `CoverOverspendingModal.tsx`) with container-presentational decoupling.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/ledger/types.ts` | Modified | TargetType and Category extensions |
| `src/domain/ledger/targets.ts` | New | Underfunded calculation logic |
| `src/domain/ledger/autoAssign.ts` | New | Payday prioritization engine |
| `src/domain/ledger/overspendingCoverage.ts` | New | Envelope rebalancing engine |
| `src/storage/schema.ts` | Modified | Version 2 migration & category table upgrade |
| `src/storage/ledgerRepository.ts` | Modified | Persistence for targets and transfers |
| `src/storage/useLedgerStore.ts` | Modified | Store actions for Auto-Assign & Coverage |
| `src/components/AutoAssignModal.tsx` | New | Payday wizard bottom sheet |
| `src/components/CoverOverspendingModal.tsx` | New | Overspending coverage drawer |
| `app/(tabs)/budget.tsx` | Modified | Auto-assign CTA and trigger bindings |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Overallocating beyond Ready to Assign | Low | Strict invariant: total auto-assigned $\le$ readyToAssignCents |
| SQLite Schema Migration failure | Low | Schema version check with fallback alter statements |

## Rollback Plan
Revert commit on branch `feature/CCH/ALM-proactive-budgeting-decision-engine`.

## Success Criteria
- [ ] 100% tests pass via `./init.sh` with 0 type errors.
- [ ] Auto-assign cleanly exhausts or reduces `readyToAssignCents` without ever causing negative unassigned cash.
- [ ] Overspent categories can be covered in 1 tap from envelopes with surplus available balance.
