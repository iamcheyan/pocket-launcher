package main

import (
	"net/http"
	"sort"
	"strings"
)

// search groups matches by content category so the UI can render grouped
// results instead of one flat list.
func (s *Server) search(w http.ResponseWriter, r *http.Request) {
	query := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))
	if query == "" {
		fail(w, http.StatusBadRequest, "invalid_query", "search query is required")
		return
	}
	groups := map[string][]map[string]any{}
	for _, app := range s.orderedApps() {
		if strings.Contains(strings.ToLower(app.Name+" "+app.Category), query) {
			groups["Apps"] = append(groups["Apps"], map[string]any{
				"id": app.ID, "title": app.Name, "appId": app.ID, "category": "Apps",
				"available": app.Available, "kind": "app", "mock": true,
			})
		}
	}
	for _, item := range mockSearchCatalog {
		if !strings.Contains(strings.ToLower(item["title"].(string)), query) {
			continue
		}
		entry := map[string]any{}
		for key, value := range item {
			entry[key] = value
		}
		app, _ := findApp(item["appId"].(string))
		entry["available"] = app.Available
		entry["kind"] = "content"
		entry["category"] = item["kind"]
		groups[item["kind"].(string)] = append(groups[item["kind"].(string)], entry)
	}
	categories := make([]string, 0, len(groups))
	for category := range groups {
		categories = append(categories, category)
	}
	sort.Strings(categories)
	jsonOut(w, http.StatusOK, map[string]any{"groups": groups, "categories": categories, "mock": true})
}

func init() {
	registerRoutes(func(s *Server) {
		s.mux.HandleFunc("/api/search", s.search)
	})
}
