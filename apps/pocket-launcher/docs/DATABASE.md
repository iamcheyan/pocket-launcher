# Database

SQLite via `modernc.org/sqlite` (pure Go, no cgo). Access happens only inside `launcherd`.

## Migration

`schema_migrations(version INTEGER PRIMARY KEY)` records applied versions. Version 1 creates every table and seeds defaults in one transaction; `migrate` is idempotent and only runs the pending branch. Tests assert all six required tables and the recorded version.

## Tables

| Table | Purpose | Key columns |
|---|---|---|
| `launcher_state` | small key/value runtime state | `key`, `value` (`profile`, `session`, `capabilities`, `app_order`) |
| `pinned_apps` | pinned order | `app_id`, `position` |
| `recent_items` | apps launched through handoff | `id`, `category`, `title`, `app_id`, `accessed_at` |
| `favorites` | favourite apps | `app_id` |
| `widgets` | widget seed rows | `id`, `enabled` |
| `preferences` | themes, locale and quick-setting values | `key`, `value` (JSON-encoded scalar) |

Preference values are stored as JSON so numbers (`brightness: 70`) and booleans (`wifi: true`) keep their types across a round trip.

## Consistency rules

- Reorder validates the full, duplicate-free app list before writing `app_order`, so a partial payload cannot drop apps.
- Settings writes run inside a transaction; an unknown key rolls the whole batch back.
- `capabilities` stores only explicit mock overrides; the baseline is recomputed each read, so adding a capability later does not require a migration.
- `recent_items` rows are only written for apps that report `available:true`; unavailable handoffs never fabricate activity.
- Deleting the SQLite file resets all state; mock fixtures are code, not rows.

## Where state lives

`LAUNCHER_DB` selects the database path (default `launcherd.sqlite` in the working directory). `make dev` and the test stack use `.tmp/*.sqlite`, which is git-ignored.
