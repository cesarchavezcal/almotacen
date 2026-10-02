# Object-Oriented UX & Domain Model: Architecture Deepening (`ooux_architecture_deepening.md`)

Defines domain object boundaries, core content, metadata, operations, and relationships across the deepened architecture.

---

## 1. Object Matrix

### Object 1: `EntityMutationPlan`
Represents an atomic, pre-validated plan for mutating structural entities (accounts, category groups, categories) without leaking query orchestration to storage adapters.
- **Core Content**:
  - `action`: `'create_account' | 'update_account' | 'delete_account' | 'delete_group' | 'delete_category'`
  - `targetEntityId`: Unique identifier of the primary subject entity.
- **Metadata**:
  - `cascadedCategoryIdsToDelete`: Array of linked categories (e.g. `cat-cc-<id>`) that must be pruned atomically.
  - `readyToAssignAdjustmentCents`: Integer cents to credit/debit Ready to Assign (e.g. from starting balance).
  - `validationErrors`: Array of violated invariant messages if invalid.
- **Operations / Methods**:
  - `EntityManager.planAccountCreation(input)`
  - `EntityManager.planAccountDeletion(account, linkedPaymentCategory, txCount, paymentTxCount)`
  - `EntityManager.planCategoryGroupDeletion(groupId, childCategoryCount)`
  - `EntityManager.planCategoryDeletion(category, txCount)`
- **Relationships**:
  - Affects `Account`, `CategoryGroup`, `Category`, and `BudgetState.readyToAssignCents`.

---

### Object 2: `ExpenseIntakeDraft`
Encapsulates in-flight state and computed impact for quick point-of-sale transaction entry.
- **Core Content**:
  - `amountText`: Raw string input (e.g. `"$45.50"`).
  - `payeeText`: Raw or selected payee name.
  - `selectedAccountId`: Active payment method ID.
  - `selectedCategoryId`: Target budget envelope ID.
- **Metadata**:
  - `parsedCents`: Integer cents parsed from currency string.
  - `remainingAvailableCents`: Projected envelope balance after expense.
  - `isOverspent`: Boolean flag indicating whether expense exceeds envelope balance.
  - `suggestedCategory`: Auto-matched category from smart payee memory.
  - `suggestedAccount`: Auto-matched account from smart payee memory.
- **Operations / Methods**:
  - `ExpenseIntake.evaluateDraft(draft, budgetState, pastTransactions)`
  - `ExpenseIntake.submitDraft(draft, transactionPort)`
- **Relationships**:
  - References `Account`, `Category`, and posts a `Transaction` to `LedgerTransactionsPort`.

---

### Object 3: `StoragePortCluster`
Segregated ports satisfying the repository seam.
- **Core Content**:
  - `LedgerTransactionsPort`: Outflows, inflows, envelope allocations, transfers, month rollovers.
  - `EntityCatalogPort`: Account, category group, and category lifecycle queries and mutations.
  - `LedgerAdminPort`: Diagnostics, factory resets, demo data seeding, and onboarding configuration commit.
- **Relationships**:
  - Implemented by `SQLiteLedgerRepository` (native) and `SupabaseLedgerRepository` (web).
  - Consumed by `useLedgerStore`, `useExpenseIntake`, and `useOnboardingGuard`.
