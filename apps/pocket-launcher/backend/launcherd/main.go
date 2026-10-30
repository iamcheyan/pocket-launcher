package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	_ "modernc.org/sqlite"
)

const (
	defaultAddr   = "127.0.0.1:18788"
	maxBodyBytes  = 1 << 20
	shutdownGrace = 5 * time.Second
)

// Server owns the SQLite connection and the HTTP routes. launcherd is the only
// process that touches launcher state; the browser talks to it over JSON.
type Server struct {
	db     *sql.DB
	mux    *http.ServeMux
	static string
}

func main() {
	dbPath := os.Getenv("LAUNCHER_DB")
	if dbPath == "" {
		dbPath = "launcherd.sqlite"
	}
	db, err := sql.Open("sqlite", dbPath+"?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)")
	if err != nil {
		log.Fatal(err)
	}
	// Launcher state is tiny and single-process; one connection keeps the
	// foreign-key pragma and transactions unambiguous.
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)

	s := New(db)
	if dir := os.Getenv("LAUNCHER_STATIC"); dir != "" {
		s.mountStatic(dir)
	}
	addr := os.Getenv("LAUNCHER_ADDR")
	if addr == "" {
		addr = defaultAddr
	}
	server := &http.Server{Addr: addr, Handler: s, ReadHeaderTimeout: 5 * time.Second}

	// Bind before announcing: printing "listening" ahead of ListenAndServe made a
	// port conflict look like a successful start followed by an unrelated crash.
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("launcherd listening on %s (mock providers)", listener.Addr())

	go func() {
		if err := server.Serve(listener); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal(err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	ctx, cancel := context.WithTimeout(context.Background(), shutdownGrace)
	defer cancel()
	_ = server.Shutdown(ctx)
}

// New applies migrations and registers routes.
func New(db *sql.DB) *Server {
	s := &Server{db: db, mux: http.NewServeMux()}
	if err := s.migrate(context.Background()); err != nil {
		panic(err)
	}
	s.routes()
	return s
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.mux.ServeHTTP(w, r)
}

// mountStatic serves the built SPA so the browser reaches API and UI on one
// origin. Unknown non-API paths fall through to index.html for client routing.
func (s *Server) mountStatic(dir string) {
	s.static = dir
	files := http.FileServer(http.Dir(dir))
	s.mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			fail(w, http.StatusNotFound, "not_found", "route not found")
			return
		}
		candidate := filepath.Join(dir, filepath.Clean("/"+r.URL.Path))
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			files.ServeHTTP(w, r)
			return
		}
		http.ServeFile(w, r, filepath.Join(dir, "index.html"))
	})
}

// routeRegistration lets each feature file attach its own endpoints. Registrations
// run in file order at startup, so adding a feature does not edit a central table.
type routeRegistration func(s *Server)

var registeredRoutes []routeRegistration

func registerRoutes(fn routeRegistration) {
	registeredRoutes = append(registeredRoutes, fn)
}

func (s *Server) routes() {
	for _, register := range registeredRoutes {
		register(s)
	}
}

func (s *Server) health(w http.ResponseWriter, _ *http.Request) {
	jsonOut(w, http.StatusOK, map[string]string{"status": "ok", "mode": "mock"})
}

func jsonOut(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

// fail emits the single JSON error envelope shared by every endpoint.
func fail(w http.ResponseWriter, status int, code, message string) {
	jsonOut(w, status, map[string]any{"error": map[string]string{"code": code, "message": message}})
}

func decode(r *http.Request, target any) error {
	return json.NewDecoder(http.MaxBytesReader(nil, r.Body, maxBodyBytes)).Decode(target)
}

func contains(values []string, value string) bool {
	for _, candidate := range values {
		if candidate == value {
			return true
		}
	}
	return false
}

func init() {
	registerRoutes(func(s *Server) {
		s.mux.HandleFunc("/api/health", s.health)
	})
}
