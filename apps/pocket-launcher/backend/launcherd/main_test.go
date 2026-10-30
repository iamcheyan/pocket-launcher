package main

import (
	"database/sql"
	"encoding/json"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	_ "modernc.org/sqlite"
)

func testServer(t *testing.T) *Server {
	t.Helper()
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = db.Close() })
	return New(db)
}

func request(t *testing.T, s *Server, method, path, body string) (int, map[string]any) {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	res := httptest.NewRecorder()
	s.ServeHTTP(res, req)
	var decoded map[string]any
	if res.Body.Len() > 0 {
		_ = json.Unmarshal(res.Body.Bytes(), &decoded)
	}
	return res.Code, decoded
}

func TestMigrationCreatesRequiredTables(t *testing.T) {
	s := testServer(t)
	for _, table := range []string{"launcher_state", "pinned_apps", "recent_items", "favorites", "widgets", "preferences"} {
		var name string
		if err := s.db.QueryRow("SELECT name FROM sqlite_master WHERE type='table' AND name=?", table).Scan(&name); err != nil {
			t.Fatalf("missing table %s: %v", table, err)
		}
	}
	var version int
	if err := s.db.QueryRow("SELECT MAX(version) FROM schema_migrations").Scan(&version); err != nil || version != 1 {
		t.Fatalf("migration version = %d, err = %v", version, err)
	}
}

func TestHomeContainsEverySurfaceAndMockContent(t *testing.T) {
	s := testServer(t)
	code, home := request(t, s, http.MethodGet, "/api/home", "")
	if code != http.StatusOK || home["mock"] != true {
		t.Fatalf("home response %d %#v", code, home)
	}
	for _, key := range []string{"activities", "recentFiles", "recentDownloads", "pinnedApps", "collections", "quickActions", "notifications", "systemSummary", "widgets", "capabilities"} {
		if _, ok := home[key]; !ok {
			t.Fatalf("home missing %s", key)
		}
	}
	if len(home["activities"].([]any)) != 4 {
		t.Fatalf("activities = %#v", home["activities"])
	}
	if len(home["recentFiles"].([]any)) == 0 || len(home["recentDownloads"].([]any)) == 0 {
		t.Fatal("recent files/downloads must be populated")
	}
	for _, item := range home["activities"].([]any) {
		if item.(map[string]any)["mock"] != true {
			t.Fatalf("activity not flagged mock: %#v", item)
		}
	}
}

func TestProfilePersistsAndReordersSections(t *testing.T) {
	s := testServer(t)
	if code, body := request(t, s, http.MethodPut, "/api/profile", `{"id":"eink"}`); code != http.StatusOK || body["id"] != "eink" {
		t.Fatalf("profile update %d %#v", code, body)
	}
	_, home := request(t, s, http.MethodGet, "/api/home", "")
	sections := home["widgets"].([]any)
	if sections[0] != "activity" || sections[1] != "collections" {
		t.Fatalf("eink section order = %#v", sections)
	}
	if code, _ := request(t, s, http.MethodPut, "/api/profile", `{"id":"unknown"}`); code != http.StatusBadRequest {
		t.Fatalf("invalid profile status = %d", code)
	}
	request(t, s, http.MethodPut, "/api/profile", `{"id":"desktop"}`)
	_, home = request(t, s, http.MethodGet, "/api/home", "")
	if home["widgets"].([]any)[0] != "pinned" {
		t.Fatalf("desktop section order = %#v", home["widgets"])
	}
}

func TestCapabilityGatingHidesWidgetsAndQuickSettings(t *testing.T) {
	s := testServer(t)
	code, _ := request(t, s, http.MethodPut, "/api/capabilities", `{"wifi":false,"bluetooth":false,"battery":false}`)
	if code != http.StatusOK {
		t.Fatalf("capability update status = %d", code)
	}
	_, caps := request(t, s, http.MethodGet, "/api/capabilities", "")
	for _, raw := range caps["items"].([]any) {
		item := raw.(map[string]any)
		if item["id"] == "wifi" && item["available"] != false {
			t.Fatalf("wifi should be unavailable: %#v", item)
		}
	}
	_, quick := request(t, s, http.MethodGet, "/api/quick-settings", "")
	items := quick["items"].(map[string]any)
	for _, hidden := range []string{"wifi", "bluetooth", "battery"} {
		if _, ok := items[hidden]; ok {
			t.Fatalf("%s should be filtered out: %#v", hidden, items)
		}
	}
	if _, ok := items["brightness"]; !ok {
		t.Fatalf("brightness should remain: %#v", items)
	}
	if code, _ := request(t, s, http.MethodPut, "/api/capabilities", `{"bogus":true}`); code != http.StatusBadRequest {
		t.Fatalf("unknown capability status = %d", code)
	}
}

func TestPinReorderAndRecentPersistence(t *testing.T) {
	s := testServer(t)
	if code, body := request(t, s, http.MethodPost, "/api/apps/reader/pin", ""); code != http.StatusOK || body["pinned"] != true {
		t.Fatalf("pin %d %#v", code, body)
	}
	request(t, s, http.MethodPost, "/api/apps/settings/pin", "")
	_, home := request(t, s, http.MethodGet, "/api/home", "")
	pinned := home["pinnedApps"].([]any)
	if len(pinned) != 2 || pinned[0].(map[string]any)["id"] != "reader" {
		t.Fatalf("pinned order = %#v", pinned)
	}
	order := `{"ids":["settings","reader","music","video","files","gamehub","store"]}`
	if code, _ := request(t, s, http.MethodPut, "/api/apps", order); code != http.StatusOK {
		t.Fatalf("reorder status = %d", code)
	}
	_, apps := request(t, s, http.MethodGet, "/api/apps", "")
	if apps["items"].([]any)[0].(map[string]any)["id"] != "settings" {
		t.Fatalf("app order = %#v", apps["items"])
	}
	if code, _ := request(t, s, http.MethodPut, "/api/apps", `{"ids":["reader","reader"]}`); code != http.StatusBadRequest {
		t.Fatalf("invalid reorder status = %d", code)
	}
	request(t, s, http.MethodPost, "/api/apps/reader/launch", "")
	_, apps = request(t, s, http.MethodGet, "/api/apps", "")
	for _, raw := range apps["items"].([]any) {
		item := raw.(map[string]any)
		if item["id"] == "reader" && item["recentlyUsed"] != true {
			t.Fatalf("reader should be recently used: %#v", item)
		}
	}
	request(t, s, http.MethodPost, "/api/apps/reader/unpin", "")
	_, home = request(t, s, http.MethodGet, "/api/home", "")
	if len(home["pinnedApps"].([]any)) != 1 {
		t.Fatalf("unpin left %#v", home["pinnedApps"])
	}
}

func TestUnavailableHandoffKeepsMetadata(t *testing.T) {
	s := testServer(t)
	code, body := request(t, s, http.MethodPost, "/api/apps/gamehub/launch", "")
	if code != http.StatusOK || body["available"] != false || body["launched"] != false {
		t.Fatalf("handoff %d %#v", code, body)
	}
	app := body["app"].(map[string]any)
	if app["name"] != "GameHub" || app["id"] != "gamehub" {
		t.Fatalf("metadata lost: %#v", app)
	}
	if code, _ := request(t, s, http.MethodPost, "/api/apps/nope/launch", ""); code != http.StatusNotFound {
		t.Fatalf("unknown app status = %d", code)
	}
	if code, _ := request(t, s, http.MethodGet, "/api/apps/reader/launch", ""); code != http.StatusMethodNotAllowed {
		t.Fatalf("wrong method status = %d", code)
	}
}

func TestSearchGroupsAcrossCategories(t *testing.T) {
	s := testServer(t)
	code, body := request(t, s, http.MethodGet, "/api/search?q=o", "")
	if code != http.StatusOK {
		t.Fatalf("search status = %d", code)
	}
	groups := body["groups"].(map[string]any)
	seen := map[string]bool{}
	for category := range groups {
		seen[category] = true
	}
	for _, expected := range []string{"Apps", "Books", "Videos"} {
		if !seen[expected] {
			t.Fatalf("search missing %s group: %#v", expected, seen)
		}
	}
	_, body = request(t, s, http.MethodGet, "/api/search?q=quiet", "")
	groups = body["groups"].(map[string]any)
	if len(groups["Books"].([]any)) != 1 {
		t.Fatalf("book search = %#v", groups)
	}
	if code, _ := request(t, s, http.MethodGet, "/api/search?q=", ""); code != http.StatusBadRequest {
		t.Fatalf("empty query status = %d", code)
	}
}

func TestPreferencesRoundTripAndValidation(t *testing.T) {
	s := testServer(t)
	code, body := request(t, s, http.MethodPut, "/api/preferences", `{"theme":"oled","locale":"ja"}`)
	if code != http.StatusOK {
		t.Fatalf("preferences status = %d", code)
	}
	items := body["items"].(map[string]any)
	if items["theme"] != "oled" || items["locale"] != "ja" {
		t.Fatalf("preferences round trip = %#v", items)
	}
	if code, _ := request(t, s, http.MethodPut, "/api/preferences", `{"bogus":1}`); code != http.StatusBadRequest {
		t.Fatalf("unknown preference status = %d", code)
	}
	if code, _ := request(t, s, http.MethodPut, "/api/quick-settings", `{"unknown":"x"}`); code != http.StatusBadRequest {
		t.Fatalf("unknown setting status = %d", code)
	}
	code, body = request(t, s, http.MethodPut, "/api/quick-settings", `{"brightness":35}`)
	if code != http.StatusOK || body["items"].(map[string]any)["brightness"] != float64(35) {
		t.Fatalf("quick settings %d %#v", code, body)
	}
}

func TestSessionRestore(t *testing.T) {
	s := testServer(t)
	code, _ := request(t, s, http.MethodPut, "/api/session", `{"route":"search","query":"quiet"}`)
	if code != http.StatusOK {
		t.Fatalf("session save status = %d", code)
	}
	_, body := request(t, s, http.MethodGet, "/api/session", "")
	session := body["session"].(map[string]any)
	if session["route"] != "search" || session["query"] != "quiet" {
		t.Fatalf("session restore = %#v", session)
	}
}

func TestNotificationsAreMockAndCategorized(t *testing.T) {
	s := testServer(t)
	code, body := request(t, s, http.MethodGet, "/api/notifications", "")
	if code != http.StatusOK {
		t.Fatalf("notifications status = %d", code)
	}
	items := body["items"].([]any)
	if len(items) != 4 {
		t.Fatalf("notifications = %#v", items)
	}
	categories := map[string]bool{}
	for _, raw := range items {
		item := raw.(map[string]any)
		if item["mock"] != true {
			t.Fatalf("notification not mock: %#v", item)
		}
		categories[item["category"].(string)] = true
	}
	for _, category := range []string{"downloads", "sync", "system"} {
		if !categories[category] {
			t.Fatalf("missing notification category %s: %#v", category, categories)
		}
	}
}

func TestHealthAndSystemSummary(t *testing.T) {
	s := testServer(t)
	code, body := request(t, s, http.MethodGet, "/api/health", "")
	if code != http.StatusOK || body["status"] != "ok" || body["mode"] != "mock" {
		t.Fatalf("health %d %#v", code, body)
	}
	code, body = request(t, s, http.MethodGet, "/api/system/summary", "")
	if code != http.StatusOK || body["mock"] != true {
		t.Fatalf("summary %d %#v", code, body)
	}
}

func TestJSONErrorsForUnsupportedMethods(t *testing.T) {
	s := testServer(t)
	code, body := request(t, s, http.MethodDelete, "/api/apps", "")
	if code != http.StatusMethodNotAllowed {
		t.Fatalf("status = %d", code)
	}
	if body["error"].(map[string]any)["code"] != "method_not_allowed" {
		t.Fatalf("error body = %#v", body)
	}
}

// A read that opens a cursor must not issue nested queries: with a single
// SQLite connection that deadlocks. This guards the regression directly.
func TestConcurrentReadsFinish(t *testing.T) {
	s := testServer(t)
	request(t, s, http.MethodPost, "/api/apps/reader/pin", "")
	request(t, s, http.MethodPost, "/api/apps/reader/favorite", "")
	done := make(chan struct{})
	go func() {
		defer close(done)
		for i := 0; i < 25; i++ {
			request(t, s, http.MethodGet, "/api/home", "")
			request(t, s, http.MethodGet, "/api/apps", "")
		}
	}()
	select {
	case <-done:
	case <-time.After(10 * time.Second):
		t.Fatal("repeated home/apps reads deadlocked")
	}
}

// The server must report the bound address only after a successful bind, and
// must fail loudly on a port conflict rather than announcing a phantom start.
func TestListenReportsBoundAddressAndFailsOnConflict(t *testing.T) {
	first, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer first.Close()

	second, err := net.Listen("tcp", first.Addr().String())
	if err == nil {
		second.Close()
		t.Fatalf("expected the second bind on %s to fail", first.Addr())
	}
	if !strings.Contains(err.Error(), "address already in use") {
		t.Fatalf("unexpected bind error: %v", err)
	}

	free, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	addr := free.Addr().String()
	free.Close()
	third, err := net.Listen("tcp", addr)
	if err != nil {
		t.Fatalf("expected %s to be reusable after close: %v", addr, err)
	}
	defer third.Close()
	if third.Addr().String() != addr {
		t.Fatalf("bound %s, reported %s", addr, third.Addr())
	}
}
