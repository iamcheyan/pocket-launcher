package main

import (
	"encoding/json"
	"net/http"
)

// capabilityMap merges mock overrides over the deterministic mock baseline.
// An unavailable capability removes the matching widget or quick setting; the
// launcher never assumes a device has Wi-Fi, Bluetooth, a battery or storage UI.
func (s *Server) capabilityMap() map[string]bool {
	available := map[string]bool{}
	for _, id := range capabilityIDs {
		available[id] = id != "touch"
	}
	var overrides map[string]bool
	if err := json.Unmarshal([]byte(s.state("capabilities")), &overrides); err == nil {
		for id, value := range overrides {
			if contains(capabilityIDs, id) {
				available[id] = value
			}
		}
	}
	return available
}

func (s *Server) capabilities(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPut:
		var input map[string]json.RawMessage
		if err := decode(r, &input); err != nil || len(input) == 0 {
			fail(w, http.StatusBadRequest, "invalid_capabilities", "capability overrides required")
			return
		}
		overrides := map[string]bool{}
		for id, raw := range input {
			if !contains(capabilityIDs, id) {
				fail(w, http.StatusBadRequest, "invalid_capabilities", "unknown capability")
				return
			}
			var value bool
			if err := json.Unmarshal(raw, &value); err != nil {
				fail(w, http.StatusBadRequest, "invalid_capabilities", "capability value must be boolean")
				return
			}
			overrides[id] = value
		}
		encoded, _ := json.Marshal(overrides)
		if err := s.setState("capabilities", string(encoded)); err != nil {
			fail(w, http.StatusInternalServerError, "storage_error", "could not save capabilities")
			return
		}
	case http.MethodGet:
	default:
		fail(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}
	available := s.capabilityMap()
	items := make([]map[string]any, 0, len(capabilityIDs))
	for _, id := range capabilityIDs {
		items = append(items, map[string]any{"id": id, "available": available[id], "source": "mock"})
	}
	jsonOut(w, http.StatusOK, map[string]any{"items": items, "mock": true})
}

func (s *Server) profile(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		jsonOut(w, http.StatusOK, map[string]any{"id": s.state("profile"), "manual": true, "mock": true})
	case http.MethodPut:
		var input struct {
			ID string `json:"id"`
		}
		if err := decode(r, &input); err != nil || !contains(profileIDs, input.ID) {
			fail(w, http.StatusBadRequest, "invalid_profile", "profile id must be handheld, dap, eink or desktop")
			return
		}
		if err := s.setState("profile", input.ID); err != nil {
			fail(w, http.StatusInternalServerError, "storage_error", "could not save profile")
			return
		}
		jsonOut(w, http.StatusOK, map[string]any{"id": input.ID, "manual": true, "mock": true})
	default:
		fail(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
	}
}

func init() {
	registerRoutes(func(s *Server) {
		s.mux.HandleFunc("/api/home", s.home)
		s.mux.HandleFunc("/api/capabilities", s.capabilities)
	})
}

// profileSections defines each profile's home surface order. Profiles change
// ordering and density, not just the label shown in the UI.
func profileSections(profile string) []string {
	switch profile {
	case "dap":
		return []string{"activity", "pinned", "collections", "recent", "downloads", "actions", "system"}
	case "eink":
		return []string{"activity", "collections", "recent", "pinned", "downloads", "actions", "system"}
	case "desktop":
		return []string{"pinned", "activity", "recent", "downloads", "collections", "actions", "system"}
	default:
		return []string{"activity", "downloads", "pinned", "recent", "collections", "actions", "system"}
	}
}

func (s *Server) home(w http.ResponseWriter, _ *http.Request) {
	profile := s.state("profile")
	available := s.capabilityMap()
	sections := []string{}
	for _, section := range profileSections(profile) {
		if section == "system" && !available["notifications"] && !available["battery"] && !available["storage"] {
			continue
		}
		sections = append(sections, section)
	}
	jsonOut(w, http.StatusOK, map[string]any{
		"profile":         map[string]any{"id": profile, "manual": true, "mock": true},
		"capabilities":    available,
		"activities":      mockActivities,
		"recentFiles":     mockRecentFiles,
		"recentDownloads": mockRecentDownloads,
		"pinnedApps":      s.pinnedApps(),
		"collections":     mockCollections,
		"quickActions":    s.orderedApps(),
		"notifications":   mockNotifications,
		"systemSummary":   map[string]any{"status": "Mock system ready", "message": "All mock providers reported in. No real device telemetry is collected.", "mock": true},
		"widgets":         sections,
		"mock":            true,
	})
}
