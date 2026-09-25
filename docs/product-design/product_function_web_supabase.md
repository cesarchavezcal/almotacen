# Product Function: Web Supabase Integration (Phase 1)

## Executive Summary
This document scopes Phase 1 of Almotacen's hybrid local-first architecture. It defines the mathematical transformation $y = f(x)$ that connects web clients directly to Supabase Postgres while preserving the existing domain and UI contracts.

---

## 1. Input Situation ($x$)
- **Developer/User on Web**: Tries to run or use Almotacen in a web browser.
- **Current Friction**:
  - `expo-sqlite` on web relies on `wa-sqlite.wasm`, Origin Private File System (OPFS), and `SharedArrayBuffer` with Web Workers.
  - Requires fragile HTTP cross-origin isolation headers (`COOP`/`COEP`).
  - Web Worker startup timing induces `Sync operation timeout` during synchronous React rendering passes.
  - No remote persistence, cloud backup, or multi-device synchronization.

---

## 2. Output Situation ($y$)
- **Zero-Friction Web Execution**:
  - The web application boots cleanly without OPFS/WASM worker timeouts or header dependency crashes.
  - Instantaneous, 60fps synchronous UI rendering via in-memory cached ledger state.
  - Ledger data persists remotely in a dedicated, secure Supabase Postgres schema with Row Level Security (RLS).
  - Web users are provisioned an anonymous session automatically on first load with zero onboarding friction.
  - Mobile native app remains 100% offline-first using embedded SQLite, untouched until Phase 2 sync.

---

## 3. Minimal Function Transformation ($f(x) \to y$)
$$y = f(x)$$

Where $f(x)$ comprises:
1. **Cloud Schema (`supabase/migrations/`)**: A clean Postgres DDL migration matching Almotacen's SQLite schema version 2 (`metadata`, `accounts`, `category_groups`, `categories`, `transactions`), with `user_id uuid references auth.users(id)` and RLS policies isolating user records.
2. **Supabase Client (`src/storage/supabase/client.ts`)**: Initializes `@supabase/supabase-js` using environment variables (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) with anonymous session bootstrapping (`signInAnonymously()`).
3. **Optimistic Cached Repository (`src/storage/supabase/supabaseLedgerRepository.ts`)**: Implements `LedgerRepository`. Hydrates an in-memory `BudgetState` cache from Supabase on launch to feed `useSyncExternalStore` synchronously, and sends mutations asynchronously to Supabase with optimistic local state updates and rollback on failure.
4. **Platform Repository Seam (`src/storage/useLedgerStore.ts`)**: Repository factory routes to `SupabaseLedgerRepository` on Web and `SQLiteLedgerRepository` on Native.

---

## 4. 10x Scope Stripping (Eliminating Speculative Fluff)
- ❌ **NO Custom Sync Engine in Phase 1**: Mobile continues writing to local SQLite; bidirectional sync is deferred to Phase 2.
- ❌ **NO Upfront Email/Password Authentication UI**: Uses Supabase anonymous auth on web launch. No login/signup modal forms needed in Phase 1.
- ❌ **NO Local Docker Requirement**: Connects directly to remote cloud Supabase instance via `.env.local`.
- ❌ **NO UI Hook Refactoring**: `useLedgerStore`, `useCashflow`, and UI components retain their exact synchronous hook interfaces.
