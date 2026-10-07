# Ticket 05: Remove Dead AppleCardFace.tsx Component

- **Change**: `deep-module-consolidation`
- **Ticket ID**: `05`
- **Bound Scenarios**: `SCEN-022`

---

## Objective
Delete `src/components/AppleCardFace.tsx`, a hardcoded mockup component with zero screen callers, and consolidate on `CreditCardFace.tsx` as the single canonical, parameterized card face.

---

## Tasks
1. Delete `src/components/AppleCardFace.tsx`.
2. Remove `AppleCardFace` export from `src/components/index.ts`.
3. Update `src/components/__tests__/FinancialCardsAccessibility.test.tsx` to assert `CreditCardFace` accessibility.
4. Run `./init.sh` to confirm 100% test pass.

---

## Verification Criteria
- [x] `AppleCardFace.tsx` deleted.
- [x] `CreditCardFace.tsx` verified as canonical card component.
- [x] `./init.sh` passes 100%.
