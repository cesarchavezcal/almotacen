# Ticket 01: Compiler Baseline, Local Tooling & DX

- **Change**: `web-supabase-hardening`
- **Ticket ID**: `01`
- **Bound Scenarios**: `SCEN-009`

---

## Objective
Restore compiler stability and test execution health across the repository by reverting `typescript` to `~6.0.3` (Expo SDK 57 compatible baseline), authoring `.env.example`, generating `supabase/config.toml` with anonymous auth enabled, and adding Supabase development scripts to `package.json`.

---

## Tasks
1. Edit `package.json` to change `"typescript": "~7.0.2"` to `"typescript": "~6.0.3"`.
2. Run `npm install --legacy-peer-deps` to re-sync dependencies.
3. Verify `./init.sh` executes with 0 TypeScript compiler errors and 100% test suite pass rate.
4. Create `.env.example`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
5. Author `supabase/config.toml`:
   ```toml
   project_id = "almotacen"

   [auth.anonymous_users]
   enabled = true

   [api]
   port = 54321

   [db]
   port = 54322
   ```
6. Add `supabase:start`, `supabase:stop`, `supabase:reset` scripts to `package.json`.

---

## Verification Criteria
- [x] `./init.sh` passes completely with 0 errors.
- [x] `.env.example` and `supabase/config.toml` exist in the repository.
