# Ticket 03: Platform Factory & Web Bootstrapping

## Metadata
- **Change**: `web-supabase-integration`
- **Bound Scenarios**: [`SCEN-008`](../spec-tests.md#scen-008-platform-specific-repository-factory)
- **Status**: Ready

---

## 1. Objective
Wire the repository factory in `useLedgerStore.ts` to conditionally return `SupabaseLedgerRepository` on Web and `SQLiteLedgerRepository` on Native, and add a clean bootstrap orchestrator hook in `app/_layout.tsx` for web initialization.

---

## 2. Acceptance Criteria
1. **Repository Factory**: `src/storage/useLedgerStore.ts` checks `Platform.OS === 'web'`.
   - On Web: returns the singleton instance of `SupabaseLedgerRepository`.
   - On Native: returns the singleton instance of `SQLiteLedgerRepository`.
2. **Dedicated Bootstrap Hook**: Implement `src/hooks/useWebBootstrap.ts` to encapsulate web initialization (anonymous auth + repository cache hydration) outside UI routing components, adhering to clean architecture.
3. **App Layout Integration**: `app/_layout.tsx` uses `useWebBootstrap()` on web to delay navigation rendering until cache is hydrated, showing the splash screen without flashing un-hydrated states.
4. **Local Execution Verification**: `npx expo start --web` launches cleanly without `expo-sqlite` worker crashes or timeout errors.
5. **Testing**: Tests in `src/storage/__tests__/platformFactory.test.ts` verify correct repository instantiation by platform.

---

## 3. Implementation Checklist
- [ ] Implement `src/hooks/useWebBootstrap.ts`.
- [ ] Update `src/storage/useLedgerStore.ts` with platform-aware factory.
- [ ] Connect `useWebBootstrap` in `app/_layout.tsx`.
- [ ] Implement unit tests for factory routing.
- [ ] Run `./init.sh` to ensure all 201+ tests and typechecks pass.
