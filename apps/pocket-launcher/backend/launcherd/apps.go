package main

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

func (s *Server) apps(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet, http.MethodPost:
		query := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))
		items := []App{}
		for _, app := range s.orderedApps() {
			if query == "" || strings.Contains(strings.ToLower(app.Name+" "+app.Category+" "+app.ID), query) {
				items = append(items, app)
			}
		}
		jsonOut(w, http.StatusOK, map[string]any{"items": items, "mock": true})
	case http.MethodPut:
		var input struct {
			IDs []string `json:"ids"`
		}
		if err := decode(r, &input); err != nil || len(input.IDs) != len(appRegistry) {
			fail(w, http.StatusBadRequest, "invalid_order", "app order must list every registered app")
			return
		}
		seen := map[string]bool{}
		for _, id := range input.IDs {
			if _, ok := findApp(id); !ok || seen[id] {
				fail(w, http.StatusBadRequest, "invalid_order", "app ids must be unique registered apps")
				return
			}
			seen[id] = true
		}
		encoded, _ := json.Marshal(input.IDs)
		if err := s.setState("app_order", string(encoded)); err != nil {
			fail(w, http.StatusInternalServerError, "storage_error", "could not reorder apps")
			return
		}
		jsonOut(w, http.StatusOK, map[string]any{"items": s.orderedApps(), "mock": true})
	default:
		fail(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
	}
}

var appActions = []string{"pin", "unpin", "favorite", "unfavorite", "launch"}

func (s *Server) appRoute(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) != 4 {
		fail(w, http.StatusNotFound, "not_found", "route not found")
		return
	}
	if r.Method != http.MethodPost {
		fail(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}
	id, action := parts[2], parts[3]
	if !contains(appActions, action) {
		fail(w, http.StatusNotFound, "not_found", "route not found")
		return
	}
	app, ok := findApp(id)
	if !ok {
		fail(w, http.StatusNotFound, "not_found", "app not found")
		return
	}
	switch action {
	case "pin":
		_, _ = s.db.Exec("INSERT OR IGNORE INTO pinned_apps(app_id,position) VALUES(?,(SELECT COALESCE(MAX(position),-1)+1 FROM pinned_apps))", id)
	case "unpin":
		_, _ = s.db.Exec("DELETE FROM pinned_apps WHERE app_id=?", id)
	case "favorite":
		_, _ = s.db.Exec("INSERT OR IGNORE INTO favorites(app_id) VALUES(?)", id)
	case "unfavorite":
		_, _ = s.db.Exec("DELETE FROM favorites WHERE app_id=?", id)
	case "launch":
		if app.Available {
			_, _ = s.db.Exec("INSERT INTO recent_items(id,category,title,app_id,mock,accessed_at) VALUES(?,?,?,?,1,?) ON CONFLICT(id) DO UPDATE SET accessed_at=excluded.accessed_at",
				id, app.Category, app.Name, id, time.Now().UTC().Format(time.RFC3339Nano))
		}
		// A missing target keeps its metadata and reports available=false; the
		// launcher does not pretend to have started an absent app.
		jsonOut(w, http.StatusOK, map[string]any{"app": app, "available": app.Available, "launched": app.Available, "mock": true})
		return
	}
	jsonOut(w, http.StatusOK, map[string]any{
		"app": app, "pinned": action == "pin", "favorite": action == "favorite",
		"pinnedApps": s.pinnedApps(), "items": s.orderedApps(), "mock": true,
	})
}

func init() {
	registerRoutes(func(s *Server) {
		s.mux.HandleFunc("/api/apps", s.apps)
		s.mux.HandleFunc("/api/apps/", s.appRoute)
	})
}
