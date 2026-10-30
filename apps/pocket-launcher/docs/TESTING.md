# Tests

`make test` runs every automated check:

```bash
make test-backend    # go vet + go test
make test-frontend   # npm ci, i18n parity, typecheck, build, browser smoke
```

## Go (`backend/launcherd`)

Integration tests drive the real `http.ServeMux` and a real SQLite database, not mocks of the storage layer.

| Test | Covers |
|---|---|
| `TestMigrationCreatesRequiredTables` | all six required tables exist; schema version recorded |
| `TestHomeContainsEverySurfaceAndMockContent` | every home surface present, activities/files/downloads populated, items marked mock |
| `TestProfilePersistsAndReordersSections` | profile persisted; eink/desktop section order differs; invalid id → 400 |
| `TestCapabilityGatingHidesWidgetsAndQuickSettings` | Wi-Fi/Bluetooth/battery removed from quick settings and echoed by `/api/capabilities`; brightness survives; unknown capability → 400 |
| `TestPinReorderAndRecentPersistence` | pin order, full-list reorder, duplicate/incomplete reorder → 400, launch marks an app recently used, unpin |
| `TestUnavailableHandoffKeepsMetadata` | unavailable app returns `available:false, launched:false` with metadata; unknown app → 404; wrong method → 405 |
| `TestSearchGroupsAcrossCategories` | Apps/Books/Videos groups present; content query narrows to one book; empty query → 400 |
| `TestPreferencesRoundTripAndValidation` | typed round trip (string/number), unknown preference and unknown quick setting → 400 |
| `TestSessionRestore` | session save/restore |
| `TestNotificationsAreMockAndCategorized` | four mock notifications across downloads/sync/system |
| `TestHealthAndSystemSummary` | health mode is mock; summary flagged mock |
| `TestJSONErrorsForUnsupportedMethods` | shared error envelope for 405 |
| `TestConcurrentReadsFinish` | regression: a home/apps read loop must not deadlock the single SQLite connection |

## Frontend

- `scripts/i18n-parity.mjs` — parses the three dictionaries and fails on any missing or extra key (100 keys each).
- `npm run typecheck` (`tsc -b`) and `npm run build` (Vite production build).
- `scripts/ui-smoke.mjs` — starts a freshly built `launcherd` on an isolated port with a fresh database, serves the production bundle, and drives real Chromium:
  - home surfaces render and data is marked mock;
  - Tab moves focus to a keyboard target;
  - `Ctrl/Cmd+K` search returns multiple groups; `Escape` returns home;
  - clicking `GameHub` shows an `Unavailable` state;
  - pin persists through `/api/home`; a full reorder persists;
  - profile switch changes section order;
  - disabling capabilities removes those quick settings;
  - a synthetic standard-mapped gamepad's D-Pad moves focus and button A opens the focused destination.

The smoke script refuses to run if the target port is already serving a launcherd instance, so it cannot silently test a stale process or an old database.

## Manual checks performed during development

Beyond the automated suite, the running app was verified with `curl` (`/api/health`, `/api/home`, `/api/search`, `/api/profile`, `/api/apps/{id}/launch`, `/api/quick-settings`, `/api/session`) and screenshots were inspected for each profile and geometry. See [SCREENSHOTS](SCREENSHOTS.md) and [PERFORMANCE](PERFORMANCE.md).

## Not covered

- No hardware-in-the-loop tests: real D-Pad/gamepad devices, e-paper refresh, or SD-card I/O were not exercised.
- No real provider tests, because no real provider exists yet.
