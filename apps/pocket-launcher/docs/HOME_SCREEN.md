# Home screen

One unified home answers “what should I do next?”. It contains no settings tree, no file tree and no media library pages.

## Surfaces

| Surface | Source | Handoff target |
|---|---|---|
| Continue Reading / Watching / Listening / Playing | `GET /api/home` → `activities` | owning app via `appId` |
| Recent Files | `recentFiles` | `files` |
| Recent Downloads | `recentDownloads` | owning app (`settings`, `gamehub`) |
| Pinned Apps | `pinnedApps` | pinned app |
| Collections | `collections` | `reader`/library app |
| Quick Actions | `quickActions` | app launch |
| Quick Settings summary | `GET /api/quick-settings` | Pocket Settings |
| System Overview | `systemSummary` | Pocket Settings |
| Notifications | `GET /api/notifications` | target app, if any |
| Global search | `GET /api/search?q=` | content/app |

Section order comes from `widgets`, which `launcherd` resolves from the active profile. Continue cards open a local detail preview; the play control then hands off to the owning app. Content cards hand off directly. Every handoff uses `appId`, never the content id.

## Removed workspace navigation

The old workspace-centric model (separate Music / Video / Book / Game / Settings workspaces) is gone. Its content reappears as cross-cutting surfaces:

| Old workspace | New home surface |
|---|---|
| Music | Continue Listening, Recent music, Quick Action → Pocket Music |
| Video | Continue Watching, Recent videos, Quick Action → Pocket Video |
| Book | Continue Reading, Recent books, Quick Action → Pocket Reader |
| Game | Continue Playing, Recent games, Quick Action → GameHub |
| Settings | Quick Settings summary + System Overview linking to Pocket Settings |
| Files | Recent Files, Recent Downloads → Pocket Files |

## Empty and unavailable states

- A missing app keeps its card and shows `unavailable`; the launcher does not hide or fabricate it.
- If `launcherd` is unreachable the UI shows a retry state, not stale success.
- Any content or notification originating from fixtures carries a visible `Mock` badge.
