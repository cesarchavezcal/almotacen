# Implementation Plan: Synchronize Product Core to `almotacen-ios`

## Goal Description
Sync the complete, framework-neutral product core from this repository into the newly initialized native iOS repository at `/Users/cesaradalbertochavezcalderon/Personal/almotacen-ios`.

The target repository already has `almotacen-ios.xcodeproj`, `almotacen-iosTests`, and boilerplate agent governance files. This plan transfers:
1. All **OpenSpec specifications**, behavioral test scenarios (`SCEN-001` through `SCEN-043`), change proposals, and atomic tickets (`openspec/`).
2. Complete **Outside-In Product Documentation** (`docs/product-description/`).
3. Complete **Information Architecture, Domain Models & SwiftUI Design System Specs** (`docs/product-design/`, including `DESIGN-swiftui.md`).
4. Updates the native harness script (`init.sh`) in the target repo to run `xcodebuild test` for Xcode testing.

---

## Target Verification Check

> [!IMPORTANT]
> **Target Repository Inspected**:
> - Path: `/Users/cesaradalbertochavezcalderon/Personal/almotacen-ios`
> - Current State: Clean Xcode scaffold with `.xcodeproj`, `almotacen-iosTests`, and agent-boilerplate templates.
> - `openspec/specs` and `docs/product-description` are currently empty placeholders waiting for this sync.

---

## Proposed Sync Operations

### 1. Product Core Transfer
Copy all framework-neutral product knowledge from this workspace to `/Users/cesaradalbertochavezcalderon/Personal/almotacen-ios`:

```bash
TARGET="/Users/cesaradalbertochavezcalderon/Personal/almotacen-ios"

# Sync OpenSpec (specs, changes, archive, config)
cp -R openspec/specs/ "$TARGET/openspec/specs/"
cp -R openspec/changes/ "$TARGET/openspec/changes/"
cp openspec/config.yaml "$TARGET/openspec/config.yaml"

# Sync Product Design (y = f(x), IA, OOUX, DESIGN.md, DESIGN-swiftui.md)
cp -R docs/product-design/ "$TARGET/docs/product-design/"

# Sync Product Description (State charts, interaction phases, interrupt checklists)
cp -R docs/product-description/ "$TARGET/docs/product-description/"

# Sync Historical & Active Architecture Plans
mkdir -p "$TARGET/docs/planning/archive"
cp docs/planning/plan_swift_native_migration.md "$TARGET/docs/planning/"
cp docs/planning/✅_*.md "$TARGET/docs/planning/archive/"
```

---

### 2. Configure Native Swift Harness (`init.sh`)
Update `$TARGET/init.sh` to execute the Xcode test suite against the iOS Simulator:

```bash
#!/bin/bash
set -e

echo "=== Harness Initialization: almotacen-ios ==="
echo "=== Running Xcode Unit & Behavioral Tests ==="

xcodebuild test \
  -project almotacen-ios.xcodeproj \
  -scheme almotacen-ios \
  -destination 'platform=iOS Simulator,name=iPhone 16 Pro' \
  -quiet

echo "=== Verification Complete ==="
```

---

### 3. Context & Feature State
Update `$TARGET/CONTEXT.md` with Almotacen's product vision, architecture, and integer-cents invariant, and sync `feature_list.json` with all 13 completed milestones + active ALM-014 ticket.

---

## Verification Plan

### Automated Verification
1. Verify file existence and scenario count:
   - Check that all `SCEN-001` through `SCEN-043` contracts exist under `$TARGET/openspec/`.
   - Check that `DESIGN-swiftui.md` exists under `$TARGET/docs/product-design/design/`.
2. Verify harness execution:
   - Run `$TARGET/init.sh` to verify `xcodebuild` successfully runs the boilerplate test target on the booted iOS simulator.

### Manual Verification
- Confirm that the new repository opens cleanly in Xcode with all documentation visible in Project Navigator.
