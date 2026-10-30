# Screenshots

All captures come from the running Pocket Launcher: launcherd serving the production Vite build, driven by headless Chromium (Playwright, system Chromium 152). Every screen is mock-data-only; no hardware was measured.

Reproduce:

```bash
make build
make screenshots   # writes docs/screenshots/*.png + docs/screenshot-manifest.md
```

The script resets session, preferences and profile through the API before each capture, opens the surface by its exact navigation label, waits for the expected heading, then verifies the PNG signature and dimensions read from the file header. It fails if fewer than 10 captures are pixel-distinct, which catches a stuck page or a theme/profile that did not apply.

## Captures

| # | Surface | File | Size | Profile | Theme | Locale |
|---|---|---|---|---|---|---|
| 1 | Home (desktop) | `home-1280x720-dark.png` | 1280×720 | desktop | dark | en |
| 2 | Home (light) | `home-1280x720-light.png` | 1280×720 | desktop | light | en |
| 3 | Continue activity | `continue-1280x720-dark.png` | 1280×720 | desktop | dark | en |
| 4 | Search grouped | `search-groups-1280x720-dark.png` | 1280×720 | desktop | dark | en |
| 5 | Apps | `apps-1280x720-dark.png` | 1280×720 | desktop | dark | en |
| 6 | Notifications | `notifications-1280x720-dark.png` | 1280×720 | desktop | dark | en |
| 7 | Quick settings | `quick-settings-1280x720-dark.png` | 1280×720 | desktop | dark | en |
| 8 | Handheld home | `home-handheld-480x320-dark.png` | 480×320 | handheld | dark | en |
| 9 | DAP home | `home-dap-480x320-dark.png` | 480×320 | dap | dark | en |
| 10 | E-Ink home | `home-eink-720x720-light.png` | 720×720 | eink | light | en |
| 11 | Handheld minimum | `home-handheld-320x240-dark.png` | 320×240 | handheld | dark | en |
| 12 | DAP OLED minimum | `home-dap-320x240-oled.png` | 320×240 | dap | oled | en |
| 13 | E-Ink Japanese | `home-eink-720x720-ja.png` | 720×720 | eink | dark | ja |

Representative resolutions covered: 320×240, 480×320, 720×720, 1280×720.

The generated manifest with per-file SHA-256 prefixes is [`screenshot-manifest.md`](screenshot-manifest.md).

## What the images show

- Profile changes section order: handheld starts with Continue, DAP promotes Pinned/Collections, E-Ink promotes Collections, desktop starts with Pinned. Visible in captures 8–13 versus 1.
- At 320×240 and 480×320 the first screen still shows Continue cards; the greeting is compressed rather than pushing content below the fold.
- Every content card carries a `Mock` marker; `GameHub`/`Pocket Store` show `Unavailable`.
- Dark, Light and OLED themes are separate captures with distinct pixel hashes.

## Limits

- These are workstation screenshots, not device captures. E-Ink rendering on real e-paper hardware (ghosting, refresh behavior) was not tested.
- Font is the bundled Lexend loaded from the app; no device font metrics were verified.
