package main

// All fixtures are deterministic and explicitly mock. Nothing here probes real
// hardware, network services, storage or installed application processes.

var mockActivities = []map[string]any{
	{"id": "act-read-1", "category": "Books", "title": "The Quiet Device", "appId": "reader", "progress": 62, "subtitle": "Chapter 7 of 12", "mock": true},
	{"id": "act-watch-1", "category": "Videos", "title": "Tides of the North", "appId": "video", "progress": 28, "subtitle": "00:18:40 / 01:05:12", "mock": true},
	{"id": "act-listen-1", "category": "Music", "title": "Midnight Transit", "appId": "music", "progress": 45, "subtitle": "Track 5 of 11", "mock": true},
	{"id": "act-play-1", "category": "Games", "title": "Lantern Corp", "appId": "gamehub", "progress": 12, "subtitle": "Save 3", "mock": true},
}

var mockRecentFiles = []map[string]any{
	{"id": "file-1", "category": "Files", "title": "Travel Plans.pdf", "appId": "files", "subtitle": "Documents", "mock": true},
	{"id": "file-2", "category": "Files", "title": "budget-2026.xlsx", "appId": "files", "subtitle": "Spreadsheets", "mock": true},
	{"id": "file-3", "category": "Files", "title": "notes.md", "appId": "files", "subtitle": "Notes", "mock": true},
}

var mockRecentDownloads = []map[string]any{
	{"id": "dl-1", "category": "Downloads", "title": "Firmware 2.4.1", "appId": "settings", "subtitle": "System", "mock": true},
	{"id": "dl-2", "category": "Downloads", "title": "Atlas Map Pack", "appId": "gamehub", "subtitle": "GameHub", "mock": true},
}

var mockCollections = []map[string]any{
	{"id": "col-library", "title": "Mock Library", "subtitle": "12 items", "mock": true},
	{"id": "col-recent", "title": "Added This Week", "subtitle": "5 items", "mock": true},
}

var mockNotifications = []map[string]any{
	{"id": "download-ready", "title": "Download complete", "body": "Mock book is ready to read", "category": "downloads", "target": map[string]any{"appId": "reader"}, "mock": true},
	{"id": "sync-ready", "title": "Sync complete", "body": "Your mock library is up to date", "category": "sync", "mock": true},
	{"id": "update-available", "title": "Update available", "body": "Pocket Store has 1 mock update", "category": "system", "target": map[string]any{"appId": "store"}, "mock": true},
	{"id": "storage-alert", "title": "Storage almost full", "body": "Mock system reports 92% used", "category": "system", "mock": true},
}

// mockSearchCatalog covers Books, Videos, Music, Games, Files and Settings so
// global search can group every requested category.
var mockSearchCatalog = []map[string]any{
	{"id": "book-1", "kind": "Books", "title": "The Quiet Device", "appId": "reader", "mock": true},
	{"id": "book-2", "kind": "Books", "title": "Solaris Revisited", "appId": "reader", "mock": true},
	{"id": "video-1", "kind": "Videos", "title": "Tides of the North", "appId": "video", "mock": true},
	{"id": "video-2", "kind": "Videos", "title": "City Lights", "appId": "video", "mock": true},
	{"id": "music-1", "kind": "Music", "title": "Midnight Transit", "appId": "music", "mock": true},
	{"id": "music-2", "kind": "Music", "title": "Harbor Songs", "appId": "music", "mock": true},
	{"id": "game-1", "kind": "Games", "title": "Lantern Corp", "appId": "gamehub", "mock": true},
	{"id": "game-2", "kind": "Games", "title": "Pixel Drift", "appId": "gamehub", "mock": true},
	{"id": "file-1", "kind": "Files", "title": "Travel Plans.pdf", "appId": "files", "mock": true},
	{"id": "file-2", "kind": "Files", "title": "budget-2026.xlsx", "appId": "files", "mock": true},
	{"id": "setting-1", "kind": "Settings", "title": "Wi-Fi", "appId": "settings", "mock": true},
	{"id": "setting-2", "kind": "Settings", "title": "Display", "appId": "settings", "mock": true},
	{"id": "setting-3", "kind": "Settings", "title": "Storage", "appId": "settings", "mock": true},
}
