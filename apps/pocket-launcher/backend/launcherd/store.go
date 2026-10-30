package main

import (
	"context"
	"database/sql"
)

// migrate applies schema version 1. Future versions append below the existing
// branch so installed databases upgrade in place.
func (s *Server) migrate(ctx context.Context) error {
	if _, err := s.db.ExecContext(ctx, `PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY);`); err != nil {
		return err
	}
	var version int
	if err := s.db.QueryRowContext(ctx, "SELECT COALESCE(MAX(version),0) FROM schema_migrations").Scan(&version); err != nil {
		return err
	}
	if version >= 1 {
		return nil
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for _, stmt := range []string{
		`CREATE TABLE launcher_state (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
		`CREATE TABLE pinned_apps (app_id TEXT PRIMARY KEY, position INTEGER NOT NULL)`,
		`CREATE TABLE recent_items (id TEXT PRIMARY KEY, category TEXT NOT NULL, title TEXT NOT NULL, app_id TEXT NOT NULL, mock INTEGER NOT NULL DEFAULT 1, accessed_at TEXT NOT NULL)`,
		`CREATE TABLE favorites (app_id TEXT PRIMARY KEY)`,
		`CREATE TABLE widgets (id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 1)`,
		`CREATE TABLE preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
		`INSERT INTO launcher_state(key,value) VALUES ('profile','handheld'),('session','{}'),('capabilities','{}'),('app_order','[]')`,
		`INSERT INTO preferences(key,value) VALUES ('theme','"dark"'),('locale','"en"'),('brightness','70'),('volume','50'),('wifi','true'),('bluetooth','false')`,
		`INSERT INTO widgets(id,enabled) VALUES ('wifi',1),('bluetooth',1),('battery',1),('storage',1),('notifications',1),('gamepad',1),('touch',0)`,
		`INSERT INTO schema_migrations(version) VALUES (1)`,
	} {
		if _, err := tx.ExecContext(ctx, stmt); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (s *Server) state(key string) string {
	var value string
	_ = s.db.QueryRow("SELECT value FROM launcher_state WHERE key=?", key).Scan(&value)
	return value
}

func (s *Server) setState(key, value string) error {
	_, err := s.db.Exec("INSERT INTO launcher_state(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", key, value)
	return err
}

var _ = sql.ErrNoRows
