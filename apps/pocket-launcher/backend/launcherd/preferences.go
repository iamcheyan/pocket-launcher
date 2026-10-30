package main

import (
	"encoding/json"
	"net/http"
)

func (s *Server) preferences(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		jsonOut(w, http.StatusOK, map[string]any{"items": s.preferenceMap(), "mock": true})
	case http.MethodPut:
		var input map[string]json.RawMessage
		if err := decode(r, &input); err != nil || len(input) == 0 {
			fail(w, http.StatusBadRequest, "invalid_preferences", "preferences object required")
			return
		}
		if !s.saveSettings(input, preferenceKeys) {
			fail(w, http.StatusBadRequest, "invalid_preferences", "preferences could not be saved")
			return
		}
		jsonOut(w, http.StatusOK, map[string]any{"items": s.preferenceMap(), "mock": true})
	default:
		fail(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
	}
}

// quickCapability maps a quick setting to the capability that gates it.
var quickCapability = map[string]string{
	"wifi": "wifi", "bluetooth": "bluetooth", "battery": "battery", "storage": "storage",
}

func (s *Server) quickSettings(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPut:
		var input map[string]json.RawMessage
		if err := decode(r, &input); err != nil || len(input) == 0 {
			fail(w, http.StatusBadRequest, "invalid_settings", "settings object required")
			return
		}
		allowed := map[string]bool{"brightness": true, "volume": true, "wifi": true, "bluetooth": true, "theme": true}
		if !s.saveSettings(input, allowed) {
			fail(w, http.StatusBadRequest, "invalid_settings", "quick settings could not be saved")
			return
		}
	case http.MethodGet:
	default:
		fail(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}
	available := s.capabilityMap()
	items := map[string]any{}
	for key, value := range s.preferenceMap() {
		if capability, gated := quickCapability[key]; gated && !available[capability] {
			continue
		}
		if contains([]string{"wifi", "bluetooth", "brightness", "volume", "theme"}, key) {
			items[key] = value
		}
	}
	if available["battery"] {
		items["battery"] = 82
	}
	if available["storage"] {
		items["storage"] = 92
	}
	jsonOut(w, http.StatusOK, map[string]any{"items": items, "mock": true})
}

func (s *Server) session(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPut:
		var input map[string]any
		if err := decode(r, &input); err != nil {
			fail(w, http.StatusBadRequest, "invalid_session", "session must be an object")
			return
		}
		encoded, _ := json.Marshal(input)
		if err := s.setState("session", string(encoded)); err != nil {
			fail(w, http.StatusInternalServerError, "storage_error", "save failed")
			return
		}
	case http.MethodGet:
	default:
		fail(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}
	var session any
	_ = json.Unmarshal([]byte(s.state("session")), &session)
	jsonOut(w, http.StatusOK, map[string]any{"session": session, "mock": true})
}

func init() {
	registerRoutes(func(s *Server) {
		s.mux.HandleFunc("/api/preferences", s.preferences)
		s.mux.HandleFunc("/api/system/summary", s.systemSummary)
		s.mux.HandleFunc("/api/session", s.session)
	})
}
