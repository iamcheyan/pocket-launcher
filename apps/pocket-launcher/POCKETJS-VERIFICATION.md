# POCKETJS VERIFICATION — pocket-launcher

Round: PocketJS refactor. Device acceptance is a later pass.

## Shape

- Pocket app: `apps/pocket-launcher/pocket/`
- Frozen React reference: `apps/pocket-launcher/frontend/` (design reference; not extended).
- TSX files in the port: **6** (`main.tsx`, `app.tsx`, `ui.tsx`, three screens).
- Native tree only: `View`/`Text` from `@pocketjs/framework/solid/components`; no DOM, iframe, texture screenshot, or `dangerouslySetInnerHTML`.

## Manifest

- id: `dev.pocket-launcher.pocket`
- entry: `src/main.tsx`
- output: `pocket-launcher`
- viewport: `360×240 @2x` → physical `720×480`
- capabilities: `text.glyphs.baked`, `input.buttons`
- target: `rocknix-h700-kms`

## Admission / compile

```sh
cd apps/pocket-launcher/pocket
./setup-sdk.sh
SDK=${POCKETJS_SDK:-$HOME/development/.pocketjs-star-drift-sdk}
bun "$SDK/tools/pocket.ts" check \
  --runtime-config "$POCKET_VERIFY/pjs/profiles/pocket.runtime-config.ts" \
  --target rocknix-h700-kms --manifest pocket.json
bun "$SDK/tools/pocket.ts" compile \
  --runtime-config "$POCKET_VERIFY/pjs/profiles/pocket.runtime-config.ts" \
  --target rocknix-h700-kms --manifest pocket.json --output out.pocket
```

Admission: `sha256:ee2c79b83ececced57317c44d3884c9421c780281c44889c6d08467b7ca8b729`; TypeScript passes for the app module graph. Package: `out.pocket`, sha256 `d15b360e0167cc5d739e074aec9b075c644b034d97cfb56a980a4f3f9198b306`.

## Frames

Rendered with the SDK wasm core at `renderScaled(2)` (720×480), not a browser:

```sh
cd "$POCKET_VERIFY"
bun tools/render-pocket.ts \
  --dir repos/pocket-launcher/apps/pocket-launcher/pocket \
  --script repos/pocket-launcher/apps/pocket-launcher/pocket/frames.json \
  --out repos/pocket-launcher/docs/pocket
```

| file | state | sha256 (first 16) |
|---|---|---|
| `docs/pocket/screen-home.png` | home | `f8c29dffc8e16df5` |
| `docs/pocket/screen-home-focus.png` | home-focus | `db63407e8ac27198` |
| `docs/pocket/screen-detail.png` | detail | `b587fe16ea35d446` |
| `docs/pocket/screen-detail-action.png` | detail-action | `bc6a6951a8a40c41` |
| `docs/pocket/screen-settings.png` | settings | `b2b7adf988e029ec` |
| `docs/pocket/screen-settings-toggled.png` | settings-toggled | `07516c10525065f4` |

All six files have distinct bytes; the renderer rejects duplicate frames. The
tape is: move focus, open the item, run the first detail action, switch to
settings, move a row, toggle it.

Screens: Home (continue/pinned), item detail, shell settings. Interactions: D-pad grid focus, CIRCLE open, detail OPEN/PIN/FAV, L/R tabs, B back.

## Adapter

- **fixture** — this port runs from JSON baked into the package and labels the
  header `fixture`. `client.ts` also contains the `http` and `bridge` adapters
  behind the same `list()/get()/action()` surface.
- `http` uses `@pocketjs/framework/net-api`; valid only in the host dev profile.
- `bridge` uses `host.__pvc(JSON.stringify(request))`; the runtime forwards to
  the Go daemon on `127.0.0.1:<port>` with a hard timeout.
- Device gap: launcherd bridge (app launch, pin, notifications). The shell still runs from baked mock data.
- Daemon contract: /api/home, /api/apps, /api/notifications; mock providers unchanged.

## Not done / open questions

- Device run, saves/annotations and the bridge itself are out of this round.
- Real media/audio, OAuth, emulator, engine and system writes stay unimplemented
  where the original product already marked them mock or unavailable.
- Long lists use the six-item fixture surface; paging/virtual lists are a
  follow-up once the bridge provides paginated data.
