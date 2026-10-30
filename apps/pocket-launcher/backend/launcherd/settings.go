package main

import (
	"encoding/json"
)

func (s *Server) preferenceMap() map[string]any {
	rows, err := s.db.Query("SELECT key,value FROM preferences ORDER BY key")
	if err != nil {
		return map[string]any{}
	}
	defer rows.Close()
	out := map[string]any{}
	for rows.Next() {
		var key, value string
		_ = rows.Scan(&key, &value)
		var decoded any
		if err := json.Unmarshal([]byte(value), &decoded); err != nil {
			decoded = value
		}
		out[key] = decoded
	}
	return out
}

var preferenceKeys = map[string]bool{
	"theme": true, "locale": true, "brightness": true, "volume": true, "wifi": true, "bluetooth": true,
}

// saveSettings validates and persists a JSON object in one transaction.
func (s *Server) saveSettings(input map[string]json.RawMessage, allowed map[string]bool) bool {
	tx, err := s.db.Begin()
	if err != nil {
		return false
	}
	for key, raw := range input {
		var value any
		if !allowed[key] || json.Unmarshal(raw, &value) != nil {
			tx.Rollback()
			return false
		}
		encoded, _ := json.Marshal(value)
		if _, err := tx.Exec("INSERT INTO preferences(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", key, string(encoded)); err != nil {
			tx.Rollback()
			return false
		}
	}
	return tx.Commit() == nil
}

func init() {
	registerRoutes(func(s *Server) {
		s.mux.HandleFunc("/api/quick-settings", s.quickSettings)
	})
}
