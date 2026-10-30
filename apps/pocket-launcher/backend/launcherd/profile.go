package main

import "net/http"

func (s *Server) systemSummary(w http.ResponseWriter, _ *http.Request) {
	jsonOut(w, http.StatusOK, map[string]any{
		"profile":      s.state("profile"),
		"status":       "Mock system ready",
		"message":      "All mock providers reported in. No real device telemetry is collected.",
		"capabilities": s.capabilityMap(),
		"mock":         true,
	})
}

func init() {
	registerRoutes(func(s *Server) {
		s.mux.HandleFunc("/api/profile", s.profile)
	})
}
