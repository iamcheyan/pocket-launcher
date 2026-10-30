# Verification — pocket-launcher @ 2026-10-31

- Verdict: PASS
- Commit: `fdc91defffe8a4ae07476f2887fc17dc2cf451b0` (screenshots + fixes; this document is the following commit)
- Remote: `fdc91defffe8a4ae07476f2887fc17dc2cf451b0`
- Runtime: `LAUNCHER_DB=.tmp/probe.sqlite LAUNCHER_ADDR=127.0.0.1:18788 LAUNCHER_STATIC=apps/pocket-launcher/frontend/dist .tmp/launcherd` ; port 18788 ; backend Go (launcherd)
- Toolchain: go 1.26.0, node v22.23.3, Chrome 155.0.8059.84

## Test gate
| command | result | notes |
|---|---|---|
| `go vet ./...` | PASS | launcherd |
| `go test -count=1 ./...` | PASS | 14 tests in `launcherd`, 0 failures |
| `npm run i18n` | PASS | key parity across locales |
| `npm run typecheck` | PASS | `tsc -b` |
| `npm run build` | PASS | Vite production build |
| `npm run smoke` | PASS | real-browser interaction pass against a fresh launcherd |
| `tests/api-contract.sh` | PASS | 29/29 checks |

`make test` runs the full sequence above; the full run finished green in ~23s.

## Screenshot matrix
All captures are from this run: `launcherd` serving the production Vite build, driven by
headless Chromium (Playwright, `/usr/bin/google-chrome` 155) via `make screenshots`.

| screen | viewport | theme | file | note |
|---|---|---|---|---|
| Home (desktop) | 1280×720 | dark | `apps/pocket-launcher/docs/screenshots/home-1280x720-dark.png` | |
| Home (desktop) | 1280×720 | light | `.../home-1280x720-light.png` | |
| Continue / Activity | 1280×720 | dark | `.../continue-1280x720-dark.png` | nav "Activity" |
| Search (grouped) | 1280×720 | dark | `.../search-groups-1280x720-dark.png` | query "o" |
| Apps | 1280×720 | dark | `.../apps-1280x720-dark.png` | |
| Notifications | 1280×720 | dark | `.../notifications-1280x720-dark.png` | |
| Quick settings | 1280×720 | dark | `.../quick-settings-1280x720-dark.png` | |
| Home (handheld) | 480×320 | dark | `.../home-handheld-480x320-dark.png` | |
| Home (DAP) | 480×320 | dark | `.../home-dap-480x320-dark.png` | |
| Home (E-Ink) | 720×720 | light | `.../home-eink-720x720-light.png` | |
| Home (handheld min) | 320×240 | dark | `.../home-handheld-320x240-dark.png` | |
| Home (DAP OLED min) | 320×240 | oled | `.../home-dap-320x240-oled.png` | |
| Home (E-Ink ja) | 720×720 | dark | `.../home-eink-720x720-ja.png` | locale ja |
| Home (desktop mid) | 640×480 | dark | `.../home-desktop-640x480-dark.png` | |
| Home (desktop FHD) | 1920×1080 | dark | `.../home-desktop-1920x1080-dark.png` | |

Count: 15 screenshots, 15 unique hashes (0 duplicates). Checked with
`tools/check_shots.py`: every PNG is valid, dimensions match the requested viewport,
minimum per-image RGB stddev 13.40 (no blank/filled frames). The capture script also
asserts no horizontal overflow at 320×240, 480×320, 640×480, 720×720, 1280×720, 1920×1080.

Runtime probe (`tools/probe.mjs`) against the production server at 1280×720, 640×480 and
320×240: HTTP 200, non-empty document, no console errors, no page errors, no failed or
4xx/5xx requests, no horizontal overflow.

## Fixed
- `@import './layout-responsive.css'` sat at the end of `src/style.css`, after ~50
  statements. A CSS `@import` that is not at the top of the sheet is invalid, so Vite
  emitted `@import statements must precede all other statements` on every build, and the
  file was a duplicate of rules already inlined in `style.css`. → removed the trailing
  import and the duplicate `src/layout-responsive.css` → `apps/pocket-launcher/frontend/src/style.css`
  → build warning gone, CSS bundle byte-identical, all 15 captures and the responsive
  overflow assertions still pass (`home-handheld-320x240-dark.png`, `home-desktop-640x480-dark.png`).
- Added the missing repository-root `README.md` (run commands, port 18788, screenshot
  entry point, layout) so the repo can be operated without reading three sub-documents.

## Blocked / open questions
- None.

## Not verified here
- 掌机真机（RG34XX / PJOS-LINUX）未验证；本轮只在本机 headless Chrome 里跑真实进程。
- Gamepad/keyboard input was only exercised by the repo's smoke test, not by a physical device.
