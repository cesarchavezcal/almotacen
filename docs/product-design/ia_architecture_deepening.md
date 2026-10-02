# Information Architecture: Architecture Deepening (`ia_architecture_deepening.md`)

Structural and contextual information architecture for deepened codebase modules and seams.

---

## 1. System Module Hierarchy & Seam Boundaries

```text
src/
├── domain/                                # Core Domain Business Rules (Zero I/O, Pure)
│   ├── ledger/
│   │   ├── entityManager.ts               # [DEEPENED] Unified entity lifecycle & integrity engine
│   │   ├── ledgerEngine.ts                # Pure transaction mutation math
│   │   ├── autoAssign.ts                  # Auto-assign payday allocation
│   │   ├── overspendingCoverage.ts        # Interactive overspending rebalancing
│   │   ├── rollover.ts                    # Month rollover calculations
│   │   └── expenseIntake.ts               # [NEW/DEEPENED] POS expense parsing & deficit preview
│   └── onboarding/
│       ├── onboardingService.ts           # Onboarding validation & archetype resolution
│       └── archetypes.ts                  # Starter budget templates
├── storage/                               # Storage Ports & Adapters (Pluggable Seam)
│   ├── ports/                             # [DEEPENED] Segregated storage interfaces
│   │   ├── ledgerTransactionsPort.ts      # Transaction posting & budget queries
│   │   ├── entityCatalogPort.ts           # Account, category, and group management
│   │   └── ledgerAdminPort.ts             # Diagnostics, resets, and onboarding commit
│   ├── ledgerRepository.ts                # SQLite adapter (native)
│   ├── supabase/
│   │   └── supabaseLedgerRepository.ts    # Supabase adapter (web)
│   ├── database.ts                        # Native SQLite driver factory
│   └── useLedgerStore.ts                  # React sync external store adapter
└── hooks/                                 # UI Adapters (React Integration)
    ├── useExpenseIntake.ts                # [NEW/DEEPENED] Lightweight hook for quick POS capture
    ├── useOnboardingGuard.ts              # [CLEANED] Decoupled onboarding status checker
    └── useSettings.ts                     # Presentational settings action handlers
```

---

## 2. Information Flow Across Seams

```mermaid
flowchart TD
    subgraph UI["React UI Layer (app/ & components/)"]
        MODAL["QuickEntryModal (app/modal.tsx)"]
        SETTINGS["SettingsScreens (app/settings/*)"]
        ONBOARDING["OnboardingWizard (app/onboarding.tsx)"]
    end

    subgraph Adapters["Hooks & Store Layer (src/hooks/ & src/storage/)"]
        H_INTAKE["useExpenseIntake()"]
        H_GUARD["useOnboardingGuard()"]
        STORE["useLedgerStore()"]
    end

    subgraph Domain["Deep Domain Modules (src/domain/ledger/)"]
        INTAKE["ExpenseIntake (Parsing, Preview, Auto-fill)"]
        ENT_MGR["EntityManager (Integrity Guards, Cascades)"]
        ENGINE["LedgerEngine (Balance & Envelope Math)"]
    end

    subgraph StoragePorts["Storage Seam (src/storage/ports/)"]
        PORT_TX["LedgerTransactionsPort"]
        PORT_CAT["EntityCatalogPort"]
        PORT_ADM["LedgerAdminPort"]
    end

    subgraph Drivers["Storage Adapters"]
        SQLITE["SQLiteLedgerRepository (Native)"]
        SUPABASE["SupabaseLedgerRepository (Web)"]
    end

    MODAL --> H_INTAKE
    H_INTAKE --> INTAKE
    INTAKE --> PORT_TX

    SETTINGS --> STORE
    STORE --> ENT_MGR
    ENT_MGR --> PORT_CAT

    ONBOARDING --> PORT_ADM
    H_GUARD --> PORT_ADM

    PORT_TX --> SQLITE
    PORT_TX --> SUPABASE
    PORT_CAT --> SQLITE
    PORT_CAT --> SUPABASE
    PORT_ADM --> SQLITE
    PORT_ADM --> SUPABASE
```
