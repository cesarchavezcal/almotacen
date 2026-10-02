# Spec-Derived Behavioral Test Contract (`spec-tests.md`)

Defines pure, implementation-free behavioral test contracts for `SCEN-060` through `SCEN-067`. These contracts originate from domain invariants and must be asserted prior to code modifications.

---

## 1. Traceability Matrix

| Scenario ID | Target Module / Seam | Contract Type | Behavior & Acceptance Contract |
|---|---|---|---|
| `SCEN-060` | `EntityManager` | Guard / Invariant | Prevents deletion of accounts or categories with active transactions or non-zero balances, and blocks protected credit payment categories. |
| `SCEN-061` | `EntityManager` | Cascade / Happy Path | Deletes an empty credit card account and automatically cascades deletion to its linked payment category if zero balance and zero transactions. |
| `SCEN-062` | `EntityManager` | Guard / Happy Path | Blocks deletion of category groups containing categories; successfully prunes empty category groups. |
| `SCEN-063` | Storage Seam & Store | Architecture / Seam | Segregates `LedgerRepository` into cohesive ports (`LedgerTransactionsPort`, `EntityCatalogPort`, `LedgerAdminPort`) without 18 shallow pass-through callbacks. |
| `SCEN-064` | Onboarding Seam | Seam / Decoupling | Commits onboarding config directly on primary repository; `useOnboardingGuard` checks status without `DatabaseAdapter` imports. |
| `SCEN-065` | `ExpenseIntake` | Domain / Calculation | Previews live overspending deficit (`remainingAvailableCents` and `isOverspent`) from raw string inputs without React mounting. |
| `SCEN-066` | `ExpenseIntake` | Domain / Memory | Resolves historical payee matches and auto-populates category and account suggestions. |
| `SCEN-067` | `ExpenseIntake` | End-to-End / Dispatch | Validates and dispatches an outflow transaction atomically, returning the recorded transaction and updated budget state. |

---

## 2. Behavioral Contract Scenarios

### `SCEN-060`: Entity Deletion Guard & Integrity Rejection
- **Context**: An account has 1 or more transactions recorded, OR an envelope category has `availableCents > 0`, OR a category is flagged `isCreditPayment: true`.
- **Action**: Caller invokes `EntityManager.planAccountDeletion({ accountId, transactionCount: 1 })` or `EntityManager.planCategoryDeletion({ category, transactionCount: 0 })`.
- **Expected Outcome**:
  - For account with transactions: Throws `EntityIntegrityError('Cannot delete account with existing transactions.')`.
  - For category with available funds: Throws `EntityIntegrityError('Cannot delete category with available funds or active transactions.')`.
  - For credit payment category: Throws `ProtectedEntityError('Credit payment categories cannot be deleted directly.')`.
  - No database mutation is planned or executed.

### `SCEN-061`: Atomic Account Deletion & Linked Payment Category Cascade
- **Context**: A credit card account exists (`accountType: 'credit'`, `creditPaymentCategoryId: 'cat-cc-card1'`). Both the account and the linked payment category have `transactionCount: 0` and `availableCents: 0`.
- **Action**: Caller invokes `EntityManager.planAccountDeletion({ account, linkedPaymentCategory, transactionCount: 0, linkedCategoryTransactionCount: 0 })`.
- **Expected Outcome**:
  - Returns `EntityMutationPlan` with `deleteAccountIds: ['card1']` and `deleteCategoryIds: ['cat-cc-card1']`.
  - Repository executes the plan in a single transaction, removing both records.

### `SCEN-062`: Category Group Deletion Guard & Atomic Group Removal
- **Context**: A category group contains 1 or more categories, OR a category group has 0 categories.
- **Action**: Caller requests group deletion.
- **Expected Outcome**:
  - When child category count > 0: Throws `EntityIntegrityError('Cannot delete category group containing categories.')`.
  - When child category count == 0: Returns plan to delete group record; repository removes record from `category_groups`.

### `SCEN-063`: Segregated Storage Port Resolution & Command Execution
- **Context**: Consumers interact with transactions (Budget tab, Quick Entry) or entity catalog (Settings tab).
- **Action**: Consumer queries `useLedgerStore()` or dedicated port hooks.
- **Expected Outcome**:
  - Calls to `postOutflow`, `createAccount`, or `factoryReset` dispatch to their respective ports.
  - Redundant 18 shallow pass-through callbacks in `useLedgerStore.ts` are eliminated.
  - Subscribed UI components re-render cleanly on state changes via `useSyncExternalStore`.

### `SCEN-064`: Onboarding Seam Consolidation & Adapter Independence
- **Context**: Fresh application startup (native or web).
- **Action**: Onboarding wizard commits `ValidatedOnboardingConfig`. `useOnboardingGuard` inspects completion state.
- **Expected Outcome**:
  - Configuration commits directly to `LedgerRepository.commitOnboardingConfig()` without instantiating `SQLiteOnboardingRepository`.
  - `useOnboardingGuard` checks onboarding state solely via `repository.isOnboardingCompleted()`.
  - `useOnboardingGuard` contains zero references, types, or imports of `DatabaseAdapter`.

### `SCEN-065`: Quick Expense Live Deficit Impact Evaluation
- **Context**: An envelope category has `availableCents: 5000` ($50.00).
- **Action**: User enters amount string `"$75.00"` for this category.
- **Expected Outcome**:
  - `ExpenseIntake.previewImpact({ category, amountText: '$75.00' })` returns:
    - `parsedCents: 7500`
    - `remainingAvailableCents: -2500`
    - `isOverspent: true`
    - `warningBadge: 'OVERSPENT'`
  - Verified in pure Node/Jest test with zero React components rendered.

### `SCEN-066`: Quick Expense Smart Payee Resolution & Auto-Fill
- **Context**: Transaction history contains payee `"Whole Foods"` assigned to category `"cat-groceries"` and account `"acc-checking"`.
- **Action**: User types `"whole foods"`.
- **Expected Outcome**:
  - `ExpenseIntake.resolvePayeeSuggestion({ transactions, payeeText: 'whole foods' })` returns `{ categoryId: 'cat-groceries', accountId: 'acc-checking' }`.
  - Returns `null` for unknown payee strings.

### `SCEN-067`: Atomic Expense Intake Submission & Ledger Dispatch
- **Context**: Valid expense intake parameters: amount `"$24.50"`, payee `"Coffee Shop"`, categoryId `"cat-coffee"`, accountId `"acc-checking"`.
- **Action**: Caller submits expense via `ExpenseIntake.submitExpense({ store, ...params })`.
- **Expected Outcome**:
  - Validates amount > 0, account exists, category exists.
  - Dispatches `postOutflow` to ledger storage atomically.
  - Returns created transaction with `amountCents: 2450` and `direction: 'outflow'`.
  - Category `availableCents` and account `balanceCents` decrease by 2450 cents.
