# Implementation Plan: Native Swift & SwiftUI Migration

## Goal Description
Migrate Almotacen from Expo / React Native / TypeScript to a **100% native iOS 17+ Swift application** using **SwiftUI**, **GRDB.swift** (or SwiftData), and **XCTest**. 

Almotacen's entire design philosophy is built around Apple Wallet's tactile aesthetics: PassKit card stacks, OLED true black contrast, native haptic impulses, and interactive spring physics. Moving to pure native Swift eliminates the React Native bridge overhead, unlocks fluid `matchedGeometryEffect` animations, and provides direct access to native iOS frameworks (WidgetKit, App Clips, WatchOS, and Metal).

---

## Architectural Evaluation & Tradeoffs

> [!IMPORTANT]
> **Architectural Verdict**:
> Migrating to pure Swift is a **high-leverage decision** for an iOS-first financial tool. Because our TypeScript codebase followed strict Clean/Hexagonal architecture (pure domain functions with integer cents + SQLite repository adapters), **100% of our business logic maps 1:1 to Swift structs and pure functions**.

### Tradeoffs
| Dimension | Expo / React Native (Current) | Native Swift (Target) |
|---|---|---|
| **Platform Target** | Cross-platform (iOS, Android, Web) | iOS 17+, iPadOS, macOS, watchOS (Apple-only) |
| **Animation Performance** | JS thread / Reanimated worklets | Native 120Hz ProMotion + `matchedGeometryEffect` |
| **Haptics & Tactile Feel** | Bridge wrapper (`expo-haptics`) | Direct CoreHaptics & `.sensoryFeedback` |
| **Ecosystem Integration** | Requires custom native modules | Direct WidgetKit, Live Activities, Apple Watch, App Clips |
| **Persistence** | `expo-sqlite` with manual SQL | **GRDB.swift** (typed SQLite) or **SwiftData** |

---

## Recommended Technology Stack

1. **Language & Minimum Target**: Swift 5.10 / Swift 6, **iOS 17.0+**.
2. **UI Framework**: **SwiftUI** with `@Observable` (Observation framework).
3. **Database & Storage**: **GRDB.swift**
   - *Why not SwiftData?* GRDB allows reusing our exact SQLite schema, triggers, and migrations (v1–v3) with raw SQLite performance, strict integer cents, and rock-solid thread safety.
4. **Testing**: **XCTest** (porting all 128 tests across `SCEN-001` to `SCEN-043`).
5. **Project Organization**: Multi-package architecture using Swift Package Manager (SPM):
   - `AlmotacenCore` (Pure Domain Models & Calculations — zero dependencies)
   - `AlmotacenStorage` (GRDB SQLite Repository & Migrations)
   - `AlmotacenUI` (SwiftUI Design System & Card Components)
   - `AlmotacenApp` (App Entry Point & Navigation)

---

## Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Presentation ["AlmotacenUI (SwiftUI)"]
        A[DashboardView] --> E[BudgetViewModel]
        B[BudgetView] --> E
        C[QuickExpenseSheet] --> F[ExpenseViewModel]
        D[CategoryTargetModal] --> E
    end

    subgraph State ["Observation Layer"]
        E -->|@Observable| G[LedgerStore]
        F -->|@Observable| G
    end

    subgraph Storage ["AlmotacenStorage (GRDB)"]
        G -->|ValueObservation| H[SQLiteLedgerRepository]
        H -->|Schema v3| I[(SQLite DB)]
    end

    subgraph Domain ["AlmotacenCore (Pure Swift)"]
        H --> J[LedgerEngine]
        H --> K[TargetsEngine]
        H --> L[AutoAssignEngine]
        H --> M[OverspendingCoverageEngine]
    end
```

---

## Proposed Migration Phases

### Phase 1: `AlmotacenCore` (Pure Domain Logic in Swift)
Translate all domain contracts and calculations to pure Swift with zero external dependencies:
- **Value Types**:
  ```swift
  public enum AccountType: String, Codable, Sendable {
      case checking, savings, credit, cash
  }
  public enum TargetType: String, Codable, Sendable {
      case neededForSpending = "NEEDED_FOR_SPENDING"
      case monthlySetAside   = "MONTHLY_SET_ASIDE"
  }
  public struct Category: Identifiable, Sendable {
      public let id: String
      public let groupId: String
      public var name: String
      public var targetCents: Int64
      public var targetType: TargetType
      public var targetDueDay: Int?
      public var assignedCents: Int64
      public var availableCents: Int64
      public var isCreditPayment: Bool
      public var unfundedDebtCents: Int64
  }
  ```
- **Pure Functions**:
  - `LedgerEngine.postOutflowTransaction(...)`
  - `TargetsEngine.calculateCategoryUnderfunded(...)`
  - `AutoAssignEngine.calculateAllocations(...)`
  - `OverspendingCoverageEngine.coverOverspending(...)`
  - `RolloverEngine.performMonthRollover(...)`
- **Verification**: Port existing unit test suites (`targets.test.ts`, `autoAssign.test.ts`, etc.) into `AlmotacenCoreTests` with XCTest.

---

### Phase 2: `AlmotacenStorage` (GRDB SQLite Engine)
- Setup database migrations matching Schema v1, v2, and v3:
  - `accounts`, `category_groups`, `categories`, `transactions`, `transaction_splits`, `metadata`.
- Implement `SQLiteLedgerRepository` using GRDB's `DatabaseQueue` or `DatabasePool`.
- Setup `ValueObservation.tracking(...)` to provide reactive, real-time updates to SwiftUI views.
- **Verification**: Port `ledgerRepository.test.ts` into XCTest integration tests with in-memory SQLite.

---

### Phase 3: `AlmotacenUI` (SwiftUI Design System)
Take [`docs/product-design/design/DESIGN-swiftui.md`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/docs/product-design/design/DESIGN-swiftui.md) and implement production components:
- `Color.wallet*` (Canvas true black `#000000`, Surface `#1C1C1E`, Accent `#0A84FF`).
- `Font.wallet*` (SF Pro Display & SF Pro Text with monospaced digits).
- `AppleCardFace`: Brushed titanium gradient + ultraThinMaterial overlay + chip.
- `CreditCardFace`: Dynamic issuer styling.
- `EnvelopePassFace`: Perforated cutout notches, progress bar, target chip, and quick allocate actions.
- `CardStack`: Interactive vertical accordion with `matchedGeometryEffect`.

---

### Phase 4: App Screens & Navigation
- **Dashboard (`DashboardView`)**: Reactive Net Cash Flow hero, burn rate trajectory chart, and recent transaction list.
- **Budget (`BudgetView`)**: PassKit card stack, Ready to Assign banner, auto-assign payday trigger, and category target sheet.
- **Point of Sale Quick Expense (`QuickExpenseSheet`)**: Sub-3-second numeric keypad, smart payee memory, and multi-envelope split line items.
- **Modals**:
  - `CategoryTargetSheet`
  - `AutoAssignSheet`
  - `CoverOverspendingSheet`

---

## Verification Plan

### Automated Tests
```bash
swift test --package-path Packages/AlmotacenCore
swift test --package-path Packages/AlmotacenStorage
```
- 100% parity verification across all 43 specification scenarios (`SCEN-001` to `SCEN-043`).

### Manual Verification on iOS Simulator
1. Launch app on iPhone 16 Pro simulator (iOS 18 / iOS 17).
2. Verify OLED true black canvas (`#000000`).
3. Tap envelope card to test 120Hz spring expand/collapse animation via `matchedGeometryEffect`.
4. Perform Point of Sale split transaction and verify instant CoreHaptics impulse.
