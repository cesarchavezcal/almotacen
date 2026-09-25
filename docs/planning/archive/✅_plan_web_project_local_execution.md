# Implementation Plan: Web Project Local Execution

Configure and run the Almotacen Expo application locally on the web (`npm run web` / `npx expo start --web`) with full support for client-side SQLite storage, asset bundling, and cross-origin isolation.

---

## 1. Problem Statement & Context
When running `npm run web` in the current project, the development server encounters two primary hurdles:
1. **Metro Bundler Asset Resolution**: `expo-sqlite`'s web worker requires `wa-sqlite.wasm`, but Metro does not include `.wasm` in its default asset extensions, resulting in `Unable to resolve module ./wa-sqlite/wa-sqlite.wasm`.
2. **Static Pre-rendering vs Client SQLite**: `app.json` specifies `"web.output": "static"`, which causes Expo Router to execute Node.js SSR/SSG via `@expo/router-server/node/render.js`. In Node SSR, browser APIs (`window`, web workers) do not exist, triggering `Worker chunk not found` and `window is not defined`.
3. **Web Worker SharedArrayBuffer Requirement**: On web, `expo-sqlite`'s synchronous APIs (`openDatabaseSync`, `execSync`, `getAllSync`) utilize a dedicated Web Worker communicating via `SharedArrayBuffer` and `Atomics`. Browsers disable `SharedArrayBuffer` unless cross-origin isolation headers (`Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`) are served by the web server.
4. **Storage Fallback Crash**: In [`src/storage/database.ts`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/src/storage/database.ts), the fallback attempts `new DatabaseSync()` from `node:sqlite`, which fails in the browser bundle with `DatabaseSync is not a constructor`.

---

## 2. User Review Required
> [!IMPORTANT]
> - **Web Output Mode**: `app.json` web output will be set to `"single"` (Single Page Application / client-side rendering) instead of `"static"`. Because Almotacen is a local-first application using a client-side SQLite database, client-side rendering is the correct architectural approach.
> - **Port 8081**: The Metro development server will host the web application at `http://localhost:8081`.

---

## 3. Proposed Changes

### Configuration Layer

#### [NEW] `metro.config.js`
- Create `metro.config.js` using `getDefaultConfig(__dirname)` from `expo/metro-config`.
- Append `'wasm'` to `config.resolver.assetExts`.
- Configure `config.server.enhanceMiddleware` to attach:
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: require-corp`
  This enables `SharedArrayBuffer` in modern browsers so `expo-sqlite` web workers operate smoothly.

#### [MODIFY] `app.json`
- Update `web.output` from `"static"` to `"single"` to ensure client-side rendering for the web target.

---

### Storage Adapter Layer

#### [MODIFY] `src/storage/database.ts`
- Guard the `node:sqlite` fallback by verifying `typeof DatabaseSync === 'function'`.
- Improve error reporting in `expo-sqlite` initialization on web so any missing capabilities are surfaced with clear diagnostic messages.
- Ensure graceful handling and clear logging if a browser lacks WebAssembly or cross-origin isolation.

---

## 4. Verification Plan

### Automated Verification
1. Run static typecheck and test harness:
   ```bash
   ./init.sh
   ```
   (Verify all 27 test suites and 201 unit/behavioral tests pass with 0 TypeScript errors).

### Web Server Verification
2. Launch the web server:
   ```bash
   npx expo start --web
   ```
3. Inspect Metro compilation:
   - Verify Metro bundles `entry.js` and `node_modules/expo-sqlite/web/worker.ts` with zero bundler errors.
   - Verify `http://localhost:8081` serves the app without `DatabaseSync is not a constructor` or `Worker chunk not found` runtime errors.
4. Verify response headers in curl:
   ```bash
   curl -I http://localhost:8081
   ```
   Confirm `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` are returned.
