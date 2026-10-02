# Technical Design: Deep Module Consolidation & Seam Simplification

## 1. Architectural Strategy
We apply John Ousterhout's principle of **Module Depth**:
- **Deep modules** hide complex invariants and mechanisms behind compact interfaces.
- **Shallow modules** introduce interface surface area without hiding significant complexity.
- **Hypothetical seams** ("one adapter") add indirection without variance; **real seams** ("two adapters") allow swappable implementations.

```mermaid
flowchart TD
    subgraph Before["Before: Shallow Layers & Artificial Splits"]
        P1["ports/ledgerTransactionsPort.ts"]
        P2["ports/entityCatalogPort.ts"]
        P3["ports/ledgerAdminPort.ts"]
        P1 & P2 & P3 --> LR1["LedgerRepository"]
        LR1 --> H1["useLedgerTransactions()"]
        LR1 --> H2["useEntityCatalog()"]
        LR1 --> H3["useLedgerAdmin()"]
        EO["entityOperations.ts"] --> EM1["EntityManager.ts"]
        OS["onboardingService.commitOnboardingConfig"] --> OR["OnboardingRepository (duplicate seam)"]
        AC["AppleCardFace.tsx (dead mockup)"]
        CC["CreditCardFace.tsx (active card)"]
    end

    subgraph After["After: Deep Modules & Unified Seams"]
        LR2["LedgerRepository (src/storage/types.ts)"]
        LR2 --> SQLite["SQLiteLedgerRepository"]
        LR2 --> Supabase["SupabaseLedgerRepository"]
        EM2["EntityManager.ts (Single Domain Authority)"]
        VOC["validateOnboardingConfig (Pure Validator)"]
        CC2["CreditCardFace.tsx (Single Canonical Card Face)"]
    end
```

## 2. File-by-File Changes
1. **`src/domain/ledger/entityOperations.ts`**:
   - Delete file.
   - Any consumers import directly from `src/domain/ledger/entityManager.ts`.
2. **`src/storage/useLedgerStore.ts`**:
   - Remove exports `useLedgerTransactions`, `useEntityCatalog`, and `useLedgerAdmin`.
   - Keep `useLedgerStore()` as the primary external store subscriber and `getRepository()` as the platform factory seam.
3. **`src/storage/ports/`**:
   - Merge `LedgerTransactionsPort`, `EntityCatalogPort`, and `LedgerAdminPort` directly into `LedgerRepository` in `src/storage/types.ts`.
   - Remove `src/storage/ports/` directory.
   - Refactor `src/storage/__tests__/portSegregation.test.ts` into `src/storage/__tests__/repositoryContract.test.ts`.
4. **`src/domain/onboarding/`**:
   - Remove `commitOnboardingConfig` and `OnboardingRepository` from `src/domain/onboarding/onboardingService.ts` and `types.ts`.
   - In `src/domain/onboarding/__tests__/onboardingService.test.ts`, test `validateOnboardingConfig` directly.
5. **`src/components/AppleCardFace.tsx`**:
   - Delete file.
   - Remove export from `src/components/index.ts`.
   - Update `src/components/__tests__/FinancialCardsAccessibility.test.tsx` to test `CreditCardFace` accessibility without AppleCardFace.
