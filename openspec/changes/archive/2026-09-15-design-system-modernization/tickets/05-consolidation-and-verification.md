# Ticket 05: Component Consolidation & Clean Barrel Exports

## Scenario Binding
- `SCEN-046`: Component Token Compliance Audit

## Description
Deprecate duplicate color tokens in `constants/Colors.ts` by proxying to `@/src/theme`. Verify all relative imports point to `@/src/theme`. Run complete test suite and linters via `./init.sh`.

## Acceptance Criteria
1. `constants/Colors.ts` proxies to `@/src/theme/colors`.
2. All imports across screens consume `@/src/theme`.
3. `./init.sh` passes with zero failures and 0 type errors.
