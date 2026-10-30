# API

All endpoints are JSON. Errors use one envelope:

```json
{"error": {"code": "invalid_profile", "message": "profile id must be handheld, dap, eink or desktop"}}
```

`400` invalid input, `404` unknown route/app, `405` wrong method, `500` storage failure. Every successful payload includes `mock: true`.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | `{status:"ok",mode:"mock"}` |
| GET | `/api/home` | profile, capabilities, activities, recentFiles, recentDownloads, pinnedApps, collections, quickActions, notifications, systemSummary, widgets |
| GET | `/api/capabilities` | `{items:[{id,available,source}]}` |
| PUT | `/api/capabilities` | mock overrides, e.g. `{"wifi":false}`; unknown id or non-boolean → 400 |
| GET | `/api/profile` | `{id,manual,mock}` |
| PUT | `/api/profile` | `{"id":"handheld\|dap\|eink\|desktop"}` |
| GET/POST | `/api/apps?q=` | registry list/search |
| PUT | `/api/apps` | `{"ids":[...]}` must list all registered apps exactly once |
| POST | `/api/apps/{id}/pin` | pin; appends position |
| POST | `/api/apps/{id}/unpin` | unpin |
| POST | `/api/apps/{id}/favorite` | favourite |
| POST | `/api/apps/{id}/unfavorite` | remove favourite |
| POST | `/api/apps/{id}/launch` | handoff; `{app,available,launched,mock}` |
| GET | `/api/activities` | Continue surfaces |
| GET | `/api/search?q=` | grouped results; empty `q` → 400 |
| GET | `/api/notifications` | download/sync/update/storage mock notifications |
| GET | `/api/quick-settings` | capability-filtered settings |
| PUT | `/api/quick-settings` | only `brightness,volume,wifi,bluetooth,theme` |
| GET | `/api/system/summary` | short mock summary |
| GET/PUT | `/api/preferences` | `theme,locale,brightness,volume,wifi,bluetooth` |
| GET/PUT | `/api/session` | `{session}` restore/save |

## Semantics that matter

- **Unavailable handoff.** `gamehub` and `store` are registered but unavailable. Launch returns `available:false, launched:false` plus metadata; it does not 404 and does not record activity.
- **`launched` is mock.** It means the registry accepted the handoff. No external process is spawned.
- **Capability filtering.** `quick-settings` omits a key when its capability is unavailable; `home.widgets` drops `system` when notifications, battery and storage are all unavailable.
- **Search groups.** `Apps` is derived from the registry; `Books`/`Videos`/`Music`/`Games`/`Files`/`Settings` come from mock content. `categories` is sorted.

## Examples

```bash
curl -s localhost:18788/api/health
curl -s localhost:18788/api/home | jq '.widgets, .activities[0]'
curl -s 'localhost:18788/api/search?q=quiet' | jq '.categories'
curl -s -X PUT localhost:18788/api/profile -d '{"id":"eink"}'
curl -s -X POST localhost:18788/api/apps/gamehub/launch | jq
```
