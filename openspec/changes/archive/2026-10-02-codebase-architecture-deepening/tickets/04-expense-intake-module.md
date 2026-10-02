# Ticket 04: Encapsulated Point-of-Sale Expense Intake Module

- **Change**: `codebase-architecture-deepening`
- **Ticket ID**: `04`
- **Bound Scenarios**: `SCEN-065`, `SCEN-066`, `SCEN-067`

---

## Objective

Extract a deep `ExpenseIntake` domain module and `useExpenseIntake` hook to encapsulate currency string parsing, live deficit impact calculation, and smart payee auto-selection. Reduce `app/modal.tsx` from 601 lines to a lean presentational container (< 150 lines).

---

## Tasks

1. Author `src/domain/ledger/expenseIntake.ts`:
   - Implement `parseCurrencyInput(raw: string): number`.
   - Implement `previewExpenseImpact(category: Category | undefined, amountCents: number): ExpenseImpactPreview`.
     - Calculates `remainingAvailableCents` and `isOverspent`.
     - Identifies overspending classification (`'cash'` vs `'credit_debt'`).
   - Implement `resolvePayeeSuggestion(transactions: Transaction[], payeeInput: string): PayeeSuggestion | null`.
   - Implement `validateAndBuildOutflow(params): PostOutflowParams`.
2. Author unit test suite `src/domain/ledger/expenseIntake.test.ts`:
   - Assert `SCEN-065`: Live overspending preview returns accurate deficit and warning flags without UI rendering.
   - Assert `SCEN-066`: Payee suggestion auto-populates category and account for known payees.
   - Assert `SCEN-067`: Formats and builds valid outflow parameters.
3. Author `src/hooks/useExpenseIntake.ts`:
   - Manages raw inputs (`amount`, `payee`, `selectedCategoryId`, `selectedAccountId`).
   - Provides live computed `preview` and `payeeSuggestions`.
   - Dispatches transaction to `postOutflow` on `submit()`.
4. Refactor `app/modal.tsx`:
   - Replace manual math, currency parsing, and payee logic with `useExpenseIntake()`.
   - Simplify JSX and eliminate redundant prop passing.
   - File length reduces to < 150 lines.

---

## Verification Criteria

- [ ] `expenseIntake.test.ts` passes all unit tests for `SCEN-065`, `SCEN-066`, and `SCEN-067`.
- [ ] `app/modal.tsx` shrinks to < 150 lines with zero domain math inside the component.
- [ ] Quick expense capture in simulator/web logs outflows with accurate overspending banners.
