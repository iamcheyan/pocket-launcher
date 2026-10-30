package main

import "net/http"

// Content surfaces: Continue activities and the notification preview. Both are
// mock providers, so the launcher never claims real playback or real alerts.

func (s *Server) activities(w http.ResponseWriter, _ *http.Request) {
	jsonOut(w, http.StatusOK, map[string]any{"items": mockActivities, "mock": true})
}

func (s *Server) notifications(w http.ResponseWriter, _ *http.Request) {
	jsonOut(w, http.StatusOK, map[string]any{"items": mockNotifications, "mock": true})
}

func init() {
	registerRoutes(func(s *Server) {
		s.mux.HandleFunc("/api/activities", s.activities)
		s.mux.HandleFunc("/api/notifications", s.notifications)
	})
}
