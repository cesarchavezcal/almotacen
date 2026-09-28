# Architecture & Technical Design: Web Supabase Integration (Phase 1)

## 1. Architectural Overview
This design implements a clean Hexagonal / Repository Seam architecture, allowing Almotacen to operate seamlessly across both Web and Mobile platforms without coupling UI or domain code to a specific database technology.

```mermaid
flowchart TD
    subgraph UI["UI & Store Layer"]
        SCREENS["Screens (Budget, Accounts, Cashflow, Settings)"]
        HOOK["useLedgerStore (useSyncExternalStore)"]
        SCREENS --> HOOK
    end

    subgraph Seam["Domain Seam"]
        REPO["interface LedgerRepository"]
        HOOK --> REPO
    end

    subgraph Web["Web Platform (Platform.OS === 'web')"]
        SUPA_REPO["SupabaseLedgerRepository"]
        CACHE["In-Memory BudgetState Cache"]
        CLIENT["Supabase Client (Anonymous Auth)"]
        POSTGRES["Remote Supabase Postgres (RLS)"]

        REPO -.-> SUPA_REPO
        SUPA_REPO --> CACHE
        SUPA_REPO --> CLIENT
        CLIENT --> POSTGRES
    end

    subgraph Native["Mobile Native (Platform.OS !== 'web')"]
        SQLITE_REPO["SQLiteLedgerRepository"]
        LOCAL_DB["Embedded expo-sqlite (almotacen.db)"]

        REPO -.-> SQLITE_REPO
        SQLITE_REPO --> LOCAL_DB
    end
```

---

## 2. Postgres Schema & Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    users ||--o{ metadata : owns
    users ||--o{ accounts : owns
    users ||--o{ category_groups : owns
    users ||--o{ categories : owns
    users ||--o{ transactions : owns

    category_groups ||--o{ categories : contains
    accounts ||--o{ transactions : logs
    categories ||--o{ transactions : assigns

    metadata {
        uuid id PK
        uuid user_id FK
        text key
        text value
        timestamptz updated_at
    }

    accounts {
        text id PK
        uuid user_id FK
        text name
        text account_type
        bigint balance_cents
        timestamptz created_at
        timestamptz updated_at
    }

    category_groups {
        text id PK
        uuid user_id FK
        text name
        integer sort_order
        timestamptz created_at
    }

    categories {
        text id PK
        uuid user_id FK
        text group_id FK
        text name
        bigint assigned_cents
        bigint activity_cents
        bigint available_cents
        bigint target_cents
        text target_type
        integer target_due_day
        bigint unfunded_debt_cents
        integer is_credit_payment
        text credit_account_id
        integer sort_order
    }

    transactions {
        text id PK
        uuid user_id FK
        text account_id FK
        text category_id FK
        bigint amount_cents
        text payee
        text notes
        text transaction_type
        text transfer_account_id
        timestamptz occurred_at
        timestamptz created_at
    }
```

---

## 3. Row Level Security (RLS) Policy Specifications
Every table in the Supabase schema enables RLS by default:
```sql
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read own accounts"
ON accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert own accounts"
ON accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update own accounts"
ON accounts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete own accounts"
ON accounts FOR DELETE
USING (auth.uid() = user_id);
```
*(Identical policies applied to `metadata`, `category_groups`, `categories`, and `transactions`)*.

---

## 4. `SupabaseLedgerRepository` Component Architecture
- **In-Memory Cache**: Maintains private `_state: BudgetState` and `_groups: CategoryGroup[]`.
- **Synchronous Getter Contract**:
  - `getBudgetState(): BudgetState => this._state`
  - `getCategoryGroups(): CategoryGroup[] => this._groups`
- **Optimistic Mutation Flow**:
  1. Capture current snapshot `const previousState = this._state;`.
  2. Compute next state synchronously using existing pure domain functions (`postOutflowTransaction`, `calculateDepositoryInflowOnCreation`, `allocateEnvelope`).
  3. Mutate local cache and notify external store listeners (`notifyListeners()`).
  4. Dispatch asynchronous Postgres query via `@supabase/supabase-js`.
  5. If query rejects, revert cache to `previousState`, notify listeners, and log/emit error.
