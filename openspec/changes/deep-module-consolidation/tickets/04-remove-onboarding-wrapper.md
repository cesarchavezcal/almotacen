# Ticket 04: Remove Onboarding Service Wrapper & Legacy Port

- **Change**: `deep-module-consolidation`
- **Ticket ID**: `04`
- **Bound Scenarios**: `SCEN-021`

---

## Objective
Remove pass-through function `commitOnboardingConfig` and legacy port `OnboardingRepository` from `src/domain/onboarding/`, leaving `validateOnboardingConfig` as the deep domain validator and `LedgerRepository.commitOnboardingConfig` as the persistence seam.

---

## Tasks
1. Remove `commitOnboardingConfig` function from `src/domain/onboarding/onboardingService.ts`.
2. Remove `OnboardingRepository` interface from `src/domain/onboarding/types.ts`.
3. Update `src/domain/onboarding/__tests__/onboardingService.test.ts` to test `validateOnboardingConfig` assertions directly.
4. Run `./init.sh` to confirm zero regression.

---

## Verification Criteria
- [ ] Pass-through wrapper and duplicate port interface removed.
- [ ] `./init.sh` passes 100%.
