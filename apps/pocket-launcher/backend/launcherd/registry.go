package main

import (
	"encoding/json"
	"sort"
)

// App is one entry in the launcher app registry. Available reports whether the
// target application is installed; unavailable apps keep their metadata so the
// UI can show an unavailable state instead of dropping the entry.
type App struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Category     string `json:"category"`
	Available    bool   `json:"available"`
	Mock         bool   `json:"mock"`
	Favorite     bool   `json:"favorite"`
	RecentlyUsed bool   `json:"recentlyUsed"`
}

var appRegistry = []App{
	{ID: "reader", Name: "Pocket Reader", Category: "Apps", Available: true, Mock: true},
	{ID: "music", Name: "Pocket Music", Category: "Apps", Available: true, Mock: true},
	{ID: "video", Name: "Pocket Video", Category: "Apps", Available: true, Mock: true},
	{ID: "gamehub", Name: "GameHub", Category: "Apps", Available: false, Mock: true},
	{ID: "files", Name: "Pocket Files", Category: "Apps", Available: true, Mock: true},
	{ID: "settings", Name: "Pocket Settings", Category: "Apps", Available: true, Mock: true},
	{ID: "store", Name: "Pocket Store", Category: "Apps", Available: false, Mock: true},
}

var capabilityIDs = []string{"wifi", "bluetooth", "battery", "touch", "storage", "notifications", "gamepad"}

var profileIDs = []string{"handheld", "dap", "eink", "desktop"}

func findApp(id string) (App, bool) {
	for _, app := range appRegistry {
		if app.ID == id {
			return app, true
		}
	}
	return App{}, false
}

// The registry owns app state shared by home, search and the app surface:
// ordering, pinning and recently-used tracking.
func (s *Server) appOrder() []string {
	var ids []string
	_ = json.Unmarshal([]byte(s.state("app_order")), &ids)
	if len(ids) != len(appRegistry) {
		ids = ids[:0]
		for _, app := range appRegistry {
			ids = append(ids, app.ID)
		}
	}
	return ids
}

// favoriteSet and recentSet load ids in one query each. Querying per app while a
// result cursor is open deadlocks the single-connection SQLite pool, so callers
// must never nest a query inside rows.Next.
func (s *Server) favoriteSet() map[string]bool {
	out := map[string]bool{}
	rows, err := s.db.Query("SELECT app_id FROM favorites")
	if err != nil {
		return out
	}
	defer rows.Close()
	for rows.Next() {
		var id string
		if rows.Scan(&id) == nil {
			out[id] = true
		}
	}
	return out
}

func (s *Server) recentSet() map[string]bool {
	out := map[string]bool{}
	rows, err := s.db.Query("SELECT DISTINCT app_id FROM recent_items")
	if err != nil {
		return out
	}
	defer rows.Close()
	for rows.Next() {
		var id string
		if rows.Scan(&id) == nil {
			out[id] = true
		}
	}
	return out
}

func (s *Server) orderedApps() []App {
	position := map[string]int{}
	for index, id := range s.appOrder() {
		position[id] = index
	}
	favorites := s.favoriteSet()
	recent := s.recentSet()
	out := make([]App, 0, len(appRegistry))
	for _, app := range appRegistry {
		entry := app
		entry.Favorite = favorites[app.ID]
		entry.RecentlyUsed = recent[app.ID]
		out = append(out, entry)
	}
	sort.SliceStable(out, func(i, j int) bool {
		return position[out[i].ID] < position[out[j].ID]
	})
	return out
}

func (s *Server) pinnedApps() []App {
	rows, err := s.db.Query("SELECT app_id FROM pinned_apps ORDER BY position")
	if err != nil {
		return []App{}
	}
	var ids []string
	for rows.Next() {
		var id string
		if rows.Scan(&id) == nil {
			ids = append(ids, id)
		}
	}
	rows.Close()
	favorites := s.favoriteSet()
	out := make([]App, 0, len(ids))
	for _, id := range ids {
		if app, ok := findApp(id); ok {
			app.Favorite = favorites[id]
			out = append(out, app)
		}
	}
	return out
}
