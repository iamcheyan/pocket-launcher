# Pocket Launcher

PJOS unified home screen: a PocketJS frontend (TypeScript + React + Vite) served by a
single Go daemon (`launcherd`) backed by SQLite. Content, apps, notifications and quick
settings come from deterministic mock providers and are marked `mock: true`.

## Run

```bash
make build      # build frontend (npm ci + vite build) and backend
make test       # Go tests, i18n parity, typecheck, production build, browser smoke, API contract
make dev        # launcherd on 127.0.0.1:18788 + Vite dev server
```

Production form (launcherd serves the built SPA and the API on one origin):

```bash
cd apps/pocket-launcher/frontend && npm ci && npm run build
cd ../backend/launcherd && \
  LAUNCHER_DB=/tmp/launcher.sqlite LAUNCHER_ADDR=127.0.0.1:18788 \
  LAUNCHER_STATIC=$PWD/../../frontend/dist go run .
```

Health: `GET /api/health` → `{"status":"ok","mode":"mock"}`. Port: `18788`.

Screenshots: `make screenshots` (headless Chromium via Playwright; set
`POCKET_LAUNCHER_CHROMIUM=/usr/bin/google-chrome` on hosts without a Nix store).
Output: `apps/pocket-launcher/docs/screenshots/` + `screenshot-manifest.md`.

## Layout

- `apps/pocket-launcher/frontend/` — React UI, screenshot/perf/smoke scripts
- `apps/pocket-launcher/backend/launcherd/` — Go API, SQLite, mock providers
- `apps/pocket-launcher/docs/` — architecture, API, DB, design, screenshots
- `apps/pocket-launcher/tests/` — API contract script

See `apps/pocket-launcher/README.md`, `docs/SCREENSHOTS.md` and `VERIFICATION.md`.
