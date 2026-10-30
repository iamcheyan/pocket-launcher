# Roadmap, compatibility and old launcher mapping

## Scope boundary

This repository contains only the launcher: unified home, global search, app handoff/pinning, quick settings summary, notification preview, profiles and theming. It does **not** implement Settings Center, File Manager, Media Library, System Dashboard or any media/pages owned by other Pocket apps.

| Concern | Owner |
|---|---|
| System settings, capability writes, theme storage policy | Pocket Settings |
| File browsing and file operations | Pocket Files |
| Music playback and library | Pocket Music |
| Video playback | Pocket Video |
| Book reading | Pocket Reader |
| Game library and launch | GameHub |
| App install/update | Pocket Store |

The launcher only previews content and calls `POST /api/apps/{id}/launch`.

## Navigation mapping

| Old workspace-centric navigation | Unified home surface | Notes |
|---|---|---|
| Music workspace | Continue Listening → Quick Action → Recent | no inner music pages |
| Video workspace | Continue Watching → Quick Action | no player UI |
| Book workspace | Continue Reading → Quick Action | no reader UI |
| Game workspace | Continue Playing → Quick Action | no game list UI |
| Settings workspace | Quick Settings summary + System Overview → Pocket Settings | no settings tree |
| (implicit file browsing) | Recent Files / Recent Downloads → Pocket Files | no file tree |

## Compatibility and replacement plan

`~/development/PJOS-LINUX` is unchanged by this goal. Its `main` still matches `origin/main`, and its untracked `overlay/storage/` was not read or modified. That repository is BaseOS: it has no menu of its own and hands off to an installed frontend (`README.md:3-6`, `overlay/usr/sbin/frontend-session:115-166`). Consequently:

1. Nothing here replaces a running frontend yet; the integration point must be approved separately.
2. A future integration would install this launcher as the frontend (`System/frontend` or `System/launch_frontend.sh`) or embed it in a PocketJS session, then point it at a real launcherd.
3. Before switchover, every mock provider must be replaced by a real provider behind the same JSON contract, and launcherd must be supervised as a system service.
4. Rollback stays the existing frontend selection mechanism; the launcher never writes boot configuration.

## Not yet integrated

- launcherd is not packaged as a PJOS service.
- No real capability provider: all capability values are mock overrides.
- No real app registry discovery or process launching; `launched` describes mock handoff acceptance only.
- No real media/files/notifications providers.
- Real device profiles are selected manually, not detected.

## Host toolchain and NixOS dependency delta

This project adds **zero** NixOS dependencies on HX90. Its build and test
toolchain (`go`, `node`, `chromium`, `make`) is already provided by the system
profile, and it was confirmed available both on the existing PATH and inside a
project-local `nix shell nixpkgs#go nixpkgs#nodejs nixpkgs#chromium`:

| tool | version observed |
|---|---|
| Go | 1.26.6 |
| Node.js | 24.19.0 |
| Chromium | 152.0.7977.75 |

`~/nixos-config` was therefore not modified. The goal's flock
(`/home/tetsuya/.cache/hx90-nixos-config-goals.lock`) was available and was used
read-only while checking `nixos-rebuild build --impure --flake ~/nixos-config#hx90`.
That evaluation currently fails while building the **unrelated** local
`~/development/inua` checkout (`internal/ui/appmenu.go: b.appMenuPID undefined`),
which is a pre-existing uncommitted work-in-progress outside this project. No
switch was performed, no other host was touched, and nothing from the shared
Nix configuration was committed or pushed.

## Next steps

1. Real `CapabilityProvider` (hardware probe) and a manual override UI in Pocket Settings.
2. App registry discovery via installed Pocket app manifests.
3. Real content providers for Books/Videos/Music/Games/Files with pagination and caching.
4. notificationd subscription.
5. Package launcherd + static assets in the PJOS image and add a boot handoff.
