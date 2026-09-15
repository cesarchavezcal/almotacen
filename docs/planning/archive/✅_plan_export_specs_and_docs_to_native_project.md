# Implementation Plan: Export Specs, Active Tickets & Migration Handoff to `almotacen-ios`

## 1. Goal Description
Export all framework-neutral OpenSpec specifications, behavioral test contracts (`SCEN-001` through `SCEN-043`), product design documentation, active uncompleted tickets (`ALM-001` through `ALM-014`), and an in-depth **Migration Handoff Document** to the native Swift repository at `/Users/cesaradalbertochavezcalderon/Personal/almotacen-ios`.

The incoming AI agent in `almotacen-ios` will receive a complete, self-contained, turnkey blueprint of everything engineered and proven in the TypeScript/Expo reference implementation—allowing it to start implementing `ALM-001` in Swift test-first immediately without ambiguity.

---

## 2. Deliverables Breakdown

### Deliverable A: Comprehensive Migration Handoff Document (`docs/planning/MIGRATION_HANDOFF.md` & `session-handoff.md`)
A master engineering reference document written specifically for an incoming Swift coding agent, covering:
1. **Project Vision & Scope**:
   - Zero-based envelope budgeting + forward-looking cashflow trajectory + Apple Wallet physical card design.
   - Local-first architecture: pure on-device SQLite database, zero external sync dependencies for MVP (no Apple Wallet API, no Plaid, no cloud dependencies).
2. **Mathematical Invariants & Domain Rules**:
   - **Integer Cents Only**: Strict `Int64` representations for all currency; zero floating-point arithmetic.
   - **Envelope Double-Entry Ledger**: Ready to Assign = Inflows - Allocated Envelopes.
   - **Credit Card Liability Model**: Outflows on credit debit category balances and simultaneously transfer money into the Credit Card Payment Reserve. Overspending on credit produces explicitly tracked unfunded debt.
   - **Target Calculations**: Math formulas for `needed_for_spending`, `monthly_savings_builder`, `savings_balance`, and `debt_paydown`.
   - **Cycle Rollover**: Positive category balances carry forward; cash overspending reduces next month's Ready to Assign; credit overspending converts to account debt.
3. **Database Architecture & Evolutions**:
   - Schema v1: `accounts`, `categories`, `category_groups`, `transactions`.
   - Schema v2: monthly rollover records and cycle metadata.
   - Schema v3: `transaction_splits`, target configurations (`target_type`, `target_amount_cents`, `target_due_date`, `target_cadence`).
   - SQLite engine recommendation: `GRDB.swift` using migrations, record structs, and reactive `ValueObservation`.
4. **SwiftUI Design System Assets**:
   - Pointer to `docs/product-design/design/DESIGN-swiftui.md` containing pre-built, production-ready SwiftUI code for `AppleCardFace`, `CreditCardFace`, `EnvelopePassFace`, `CardStack`, and tokens.
5. **Agent Startup Instructions**:
   - Step 1: Read `progress.md` and active ticket `ALM-001`.
   - Step 2: Bind `SCEN-001`..`SCEN-004` to unit tests in `almotacen-iosTests`.
   - Step 3: Implement Swift models and engine via TDD Red ➔ Green ➔ Refactor.
   - Step 4: Verify via `./init.sh` (`xcodebuild test`).

### Deliverable B: Framework-Neutral Specifications & Design Assets
- `openspec/specs/`:
  - `01-dual-cashflow-budgeting.md` (Ledger, accounts, categories, transactions, cashflow trajectory)
  - `02-proactive-budgeting-decision-engine.md` (Targets, auto-assign, overspending coverage)
  - `03-design-system-modernization.md` (Card pass system, motion tokens)
  - `04-category-targets-and-split-transactions.md` (Split transactions, target configuration UI)
- `docs/product-design/`:
  - `product_function.md` ($y = f(x)$ formal scoping function)
  - `ooux.md` (Object-Oriented UX model: Account, Category, Transaction, Target, Cycle)
  - `ia.md` (Information architecture & view navigation)
  - `design/DESIGN-swiftui.md` (Native SwiftUI components & tokens)
- `docs/product-description/`:
  - Outside-in behavioral state charts, 5-family interrupt checklists, bug triage guides.

### Deliverable C: Active, Uncompleted Tickets (`openspec/changes/`)
All tickets exported as **active, unstarted work** with unchecked `[ ]` acceptance criteria and `status: ready-for-agent`:
- `01-dual-cashflow-budgeting/` (Active Priority 1: ALM-001 through ALM-007)
- `02-proactive-budgeting-decision-engine/` (Queued Priority 2: ALM-008 through ALM-011)
- `03-design-system-modernization/` (Queued Priority 3: ALM-012)
- `04-category-targets-and-split-transactions/` (Queued Priority 4: ALM-013 & ALM-014)

### Deliverable D: Harness State & CI Configuration
- `feature_list.json`: 14 features populated with `status: "not-started"`.
- `progress.md`: Initialized pointing to `ALM-001`.
- `init.sh`: Configured to run `xcodebuild test -project almotacen-ios.xcodeproj -scheme almotacen-ios -destination 'platform=iOS Simulator,name=iPhone 16'`.
- `AGENTS.md` / `CONTEXT.md`: Tailored for native Swift / SwiftUI / GRDB / XCTest.

---

## 3. Step-by-Step Execution Plan

```text
Step 1: Write MIGRATION_HANDOFF.md in almotacen-ios (Domain rules, math, SQLite schema, engines)
Step 2: Mirror MIGRATION_HANDOFF.md summary into session-handoff.md and CONTEXT.md
Step 3: Copy openspec/specs/ (baseline specifications) into almotacen-ios
Step 4: Copy docs/product-design/ and docs/product-description/ into almotacen-ios
Step 5: Generate active changes 01..04 in openspec/changes/ with [ ] checkboxes and status: ready-for-agent
Step 6: Initialize feature_list.json (14 not-started items) and progress.md (active ALM-001)
Step 7: Configure init.sh for xcodebuild test execution
Step 8: Verification & sanity check across file structure and harness state
```

---

## 4. Verification Criteria
- [ ] `docs/planning/MIGRATION_HANDOFF.md` exists in `almotacen-ios` with complete mathematical invariants, schema v1–v3, and Swift architecture guidance.
- [ ] No historical tickets are placed in `archive/` in `almotacen-ios`; all 14 are in `openspec/changes/` with `[ ]` checkboxes.
- [ ] `feature_list.json` in `almotacen-ios` lists 14 features with `status: "not-started"`.
- [ ] `progress.md` points directly to `ALM-001` as the active priority.
- [ ] `init.sh` is executable and set up for iOS simulator testing.
