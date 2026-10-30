// Launcher client: the PJOS home surface over launcherd's /api/apps,
// /api/activities and /api/notifications contract.
import { createPortClient } from "./client-kit";
import type { AppConfig, Metric, Section, SettingRow } from "./model";

const sections: Section[] = [
  {
    id: "continue", title: "CONTINUE", jp: "続き", items: [
      { id: "reader", title: "Reader", subtitle: "Chapter 4 · 12 min left", meta: "2 min ago", badge: "APP", progress: 0.62, body: "The survey log resumes at the outer belt.", lines: [{ label: "category", value: "reading" }, { label: "state", value: "running" }, { label: "mock", value: "yes" }] },
      { id: "music", title: "Music", subtitle: "Night Drive · 04:12", meta: "1 h ago", badge: "APP", progress: 0.31, body: "Playback paused in the queue.", lines: [{ label: "category", value: "audio" }, { label: "state", value: "paused" }, { label: "mock", value: "yes" }] },
      { id: "files", title: "Files", subtitle: "Documents / draft.md", meta: "3 h ago", badge: "APP", body: "Recent file from the internal volume." },
    ],
  },
  {
    id: "pinned", title: "PINNED", jp: "固定", items: [
      { id: "gamehub", title: "GameHub", subtitle: "12 games · 3 platforms", meta: "pinned", badge: "PIN", body: "Library and launcher for the game collection." },
      { id: "settings", title: "Settings", subtitle: "Display · Network", meta: "pinned", badge: "PIN", body: "System settings, mock providers labelled." },
      { id: "video", title: "Video", subtitle: "Bilibili archive · 8 offline", meta: "pinned", badge: "PIN", body: "Offline video archive and queue." },
    ],
  },
];

const metrics: Metric[] = [
  { label: "APPS", value: "24" },
  { label: "UNREAD", value: "3" },
  { label: "PROFILE", value: "handheld" },
];

const settings: SettingRow[] = [
  { id: "theme", label: "Theme", jp: "テーマ", value: "DARK", options: ["DARK", "LIGHT", "EINK"] },
  { id: "locale", label: "Locale", jp: "言語", value: "JA", options: ["JA", "EN", "ZH"] },
  { id: "motion", label: "Reduced motion", jp: "動きを減らす", value: "OFF", options: ["OFF", "ON"] },
];

export const APP: AppConfig = {
  title: "LAUNCHER",
  jp: "ホーム",
  kind: "detail",
  page: "LAUNCHER",
  tabs: ["ホーム", "アプリ", "設定"],
  actions: ["OPEN", "PIN", "FAV"],
  settingsTitle: "SHELL",
  settingsJp: "シェル設定",
  deviceGap: "launcherd bridge missing.",
  sourceNote: "/api/home · /api/apps",
};

export const client = createPortClient({
  resource: "launcher.apps",
  fixture: { sections, metrics, settings },
  endpoints: {
    list: "/api/apps",
    get: (id) => `/api/apps/${encodeURIComponent(id)}`,
    action: (name) => `/api/apps/action/${encodeURIComponent(name)}`,
  },
  act(name, payload, bundle) {
    const item = bundle.sections.flatMap((section) => section.items).find((entry) => entry.id === payload?.id);
    if (!item) return { ok: false, message: "no app selected" };
    if (name === "OPEN") { item.state = "launched"; return { ok: true, message: `${item.title} launched · mock` }; }
    if (name === "PIN") { item.badge = "PIN"; return { ok: true, message: `${item.title} pinned` }; }
    if (name === "FAV") { item.badge = "FAV"; return { ok: true, message: `${item.title} favourited` }; }
    return { ok: false, message: `${name} unavailable` };
  },
});
