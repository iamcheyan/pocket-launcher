/**
 * Canonical JSON boundary for launcherd. Every external payload enters through
 * these parsers; the UI consumes named domain types only.
 */
export type ProfileId = 'handheld' | 'dap' | 'eink' | 'desktop';
export const profileIds: readonly ProfileId[] = ['handheld', 'dap', 'eink', 'desktop'];

export interface AppItem {
  id: string;
  name: string;
  category: string;
  available: boolean;
  mock: boolean;
  favorite: boolean;
  recentlyUsed: boolean;
}

export interface Capability {
  id: string;
  available: boolean;
  source: string;
}

export interface ActivityItem {
  id: string;
  category: string;
  title: string;
  appId: string;
  subtitle: string;
  progress: number | null;
  mock: boolean;
  accessedAt: string;
}

export interface CollectionItem {
  id: string;
  title: string;
  subtitle: string;
  mock: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: string;
  mock: boolean;
  targetAppId: string | null;
}

export interface SystemSummary {
  status: string;
  message: string;
  mock: boolean;
}

export interface HomeData {
  profile: ProfileId;
  manual: boolean;
  mock: boolean;
  capabilities: Record<string, boolean>;
  activities: ActivityItem[];
  recentFiles: ActivityItem[];
  recentDownloads: ActivityItem[];
  pinnedApps: AppItem[];
  collections: CollectionItem[];
  quickActions: AppItem[];
  notifications: NotificationItem[];
  systemSummary: SystemSummary;
  widgets: string[];
}

export interface SearchItem {
  kind: string;
  title: string;
  appId: string;
  category: string;
  available: boolean;
  mock: boolean;
}

export interface SearchResults {
  groups: Record<string, SearchItem[]>;
  categories: string[];
  mock: boolean;
}

export interface LaunchResult {
  app: AppItem | null;
  available: boolean;
  launched: boolean;
  mock: boolean;
}

export interface Preferences {
  theme: string;
  locale: string;
  brightness: number;
  volume: number;
  wifi: boolean;
  bluetooth: boolean;
  reducedMotion: boolean;
}

export interface QuickSettings {
  brightness: number;
  volume: number;
  wifi: boolean;
  bluetooth: boolean;
  theme: string;
}

export interface SessionState {
  page: string;
  activityId: string;
  reducedMotion: boolean;
  sort: string;
}

export type Json = Record<string, unknown>;

/** Canonical object guard for this package's network boundary. */
export function isJsonObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function num(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return fallback;
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function profile(value: unknown, fallback: ProfileId = 'handheld'): ProfileId {
  return profileIds.find(id => id === value) ?? fallback;
}

function parseApp(value: unknown): AppItem | null {
  if (!isJsonObject(value) || typeof value.id !== 'string' || typeof value.name !== 'string') return null;
  return {
    id: value.id,
    name: value.name,
    category: str(value.category),
    available: bool(value.available),
    mock: bool(value.mock, true),
    favorite: bool(value.favorite),
    recentlyUsed: bool(value.recentlyUsed),
  };
}

function parseActivity(value: unknown): ActivityItem | null {
  if (!isJsonObject(value) || typeof value.id !== 'string') return null;
  return {
    id: value.id,
    category: str(value.category),
    title: str(value.title ?? value.name, value.id),
    appId: str(value.appId),
    subtitle: str(value.subtitle),
    progress: typeof value.progress === 'number' && Number.isFinite(value.progress) ? value.progress : null,
    mock: bool(value.mock, true),
    accessedAt: str(value.accessedAt),
  };
}

function parseCollection(value: unknown): CollectionItem | null {
  if (!isJsonObject(value) || typeof value.id !== 'string') return null;
  return {
    id: value.id,
    title: str(value.title, value.id),
    subtitle: str(value.subtitle),
    mock: bool(value.mock, true),
  };
}

function parseNotification(value: unknown): NotificationItem | null {
  if (!isJsonObject(value) || typeof value.id !== 'string') return null;
  const target = isJsonObject(value.target) ? str(value.target.appId ?? value.target.id) : '';
  return {
    id: value.id,
    title: str(value.title, value.id),
    body: str(value.body),
    category: str(value.category),
    mock: bool(value.mock, true),
    targetAppId: target || null,
  };
}

function parseSearchItem(value: unknown): SearchItem | null {
  if (!isJsonObject(value) || typeof value.title !== 'string') return null;
  return {
    kind: str(value.kind, 'Apps'),
    title: value.title,
    appId: str(value.appId),
    category: str(value.category, 'Apps'),
    available: value.available !== false,
    mock: bool(value.mock, true),
  };
}

function parseCapability(value: unknown): Capability | null {
  if (!isJsonObject(value) || typeof value.id !== 'string') return null;
  return { id: value.id, available: bool(value.available), source: str(value.source, 'mock') };
}

function parseHome(value: unknown): HomeData {
  const v = isJsonObject(value) ? value : {};
  const profileObj = isJsonObject(v.profile) ? v.profile : {};
  const capabilities: Record<string, boolean> = {};
  if (isJsonObject(v.capabilities)) {
    for (const [key, flag] of Object.entries(v.capabilities)) capabilities[key] = bool(flag);
  }
  const summary = isJsonObject(v.systemSummary) ? v.systemSummary : {};
  const widgets = arr(v.widgets).filter((x): x is string => typeof x === 'string');
  return {
    profile: profile(profileObj.id),
    manual: bool(profileObj.manual),
    mock: bool(v.mock, true),
    capabilities,
    activities: arr(v.activities).map(parseActivity).filter((x): x is ActivityItem => x !== null),
    recentFiles: arr(v.recentFiles).map(parseActivity).filter((x): x is ActivityItem => x !== null),
    recentDownloads: arr(v.recentDownloads).map(parseActivity).filter((x): x is ActivityItem => x !== null),
    pinnedApps: arr(v.pinnedApps).map(parseApp).filter((x): x is AppItem => x !== null),
    collections: arr(v.collections).map(parseCollection).filter((x): x is CollectionItem => x !== null),
    quickActions: arr(v.quickActions).map(parseApp).filter((x): x is AppItem => x !== null),
    notifications: arr(v.notifications).map(parseNotification).filter((x): x is NotificationItem => x !== null),
    systemSummary: {
      status: str(summary.status, 'Ready'),
      message: str(summary.message),
      mock: bool(summary.mock, true),
    },
    widgets,
  };
}

function parseApps(value: unknown): AppItem[] {
  const v = isJsonObject(value) ? value : {};
  return arr(v.items).map(parseApp).filter((x): x is AppItem => x !== null);
}

function parseCapabilities(value: unknown): Capability[] {
  const v = isJsonObject(value) ? value : {};
  return arr(v.items).map(parseCapability).filter((x): x is Capability => x !== null);
}

function parseNotifications(value: unknown): NotificationItem[] {
  const v = isJsonObject(value) ? value : {};
  return arr(v.items).map(parseNotification).filter((x): x is NotificationItem => x !== null);
}

function parseActivities(value: unknown): ActivityItem[] {
  const v = isJsonObject(value) ? value : {};
  return arr(v.items).map(parseActivity).filter((x): x is ActivityItem => x !== null);
}

function parseSearch(value: unknown): SearchResults {
  const v = isJsonObject(value) ? value : {};
  const groups: Record<string, SearchItem[]> = {};
  if (isJsonObject(v.groups)) {
    for (const [group, items] of Object.entries(v.groups)) {
      groups[group] = arr(items).map(parseSearchItem).filter((x): x is SearchItem => x !== null);
    }
  }
  const categories = arr(v.categories).filter((x): x is string => typeof x === 'string');
  return { groups, categories: categories.length > 0 ? categories : Object.keys(groups).sort(), mock: bool(v.mock, true) };
}

function parsePreferenceItems(value: unknown): Json {
  return isJsonObject(value) && isJsonObject(value.items) ? value.items : {};
}

function parsePreferences(value: unknown): Preferences {
  const items = parsePreferenceItems(value);
  return {
    theme: str(items.theme, 'dark'),
    locale: str(items.locale, 'en'),
    brightness: num(items.brightness, 70),
    volume: num(items.volume, 50),
    wifi: bool(items.wifi),
    bluetooth: bool(items.bluetooth),
    reducedMotion: bool(items.reducedMotion),
  };
}

function parseQuickSettings(value: unknown): QuickSettings {
  const items = parsePreferenceItems(value);
  return {
    brightness: num(items.brightness, 70),
    volume: num(items.volume, 50),
    wifi: bool(items.wifi),
    bluetooth: bool(items.bluetooth),
    theme: str(items.theme, 'dark'),
  };
}

function parseSession(value: unknown): SessionState {
  const v = isJsonObject(value) ? value : {};
  const session = isJsonObject(v.session) ? v.session : {};
  return {
    page: str(session.page, 'home'),
    activityId: str(session.activityId),
    reducedMotion: bool(session.reducedMotion),
    sort: str(session.sort, 'default'),
  };
}

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
  }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const error = isJsonObject(payload) && isJsonObject(payload.error) ? payload.error : {};
    throw new ApiError(response.status, str(error.code, 'http_error'), str(error.message, response.statusText));
  }
  return payload;
}

export async function fetchHome(): Promise<HomeData> {
  return parseHome(await request('/home'));
}

export async function fetchApps(): Promise<AppItem[]> {
  return parseApps(await request('/apps'));
}

export async function fetchCapabilities(): Promise<Capability[]> {
  return parseCapabilities(await request('/capabilities'));
}

export async function fetchActivities(): Promise<ActivityItem[]> {
  return parseActivities(await request('/activities'));
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  return parseNotifications(await request('/notifications'));
}

export async function fetchSearch(query: string): Promise<SearchResults> {
  return parseSearch(await request(`/search?q=${encodeURIComponent(query)}`));
}

export async function fetchPreferences(): Promise<Preferences> {
  return parsePreferences(await request('/preferences'));
}

export async function fetchQuickSettings(): Promise<QuickSettings> {
  return parseQuickSettings(await request('/quick-settings'));
}

export async function fetchProfile(): Promise<ProfileId> {
  const payload = await request('/profile');
  return profile(isJsonObject(payload) ? payload.id : undefined);
}

export async function fetchSession(): Promise<SessionState> {
  return parseSession(await request('/session'));
}

export async function saveProfile(id: ProfileId): Promise<ProfileId> {
  const payload = await request('/profile', { method: 'PUT', body: JSON.stringify({ id, manual: true }) });
  return profile(isJsonObject(payload) ? payload.id : undefined, id);
}

export async function savePreferences(patch: Partial<Preferences>): Promise<Preferences> {
  return parsePreferences(await request('/preferences', { method: 'PUT', body: JSON.stringify(patch) }));
}

export async function saveQuickSettings(patch: Partial<QuickSettings>): Promise<QuickSettings> {
  return parseQuickSettings(await request('/quick-settings', { method: 'PUT', body: JSON.stringify(patch) }));
}

export async function saveSession(session: SessionState): Promise<void> {
  await request('/session', { method: 'PUT', body: JSON.stringify(session) });
}

export async function pinApp(id: string, pinned: boolean): Promise<void> {
  await request(`/apps/${encodeURIComponent(id)}/${pinned ? 'pin' : 'unpin'}`, { method: 'POST', body: '{}' });
}

export async function favoriteApp(id: string, favorite: boolean): Promise<void> {
  await request(`/apps/${encodeURIComponent(id)}/${favorite ? 'favorite' : 'unfavorite'}`, { method: 'POST', body: '{}' });
}

export async function launchApp(id: string): Promise<LaunchResult> {
  const payload = await request(`/apps/${encodeURIComponent(id)}/launch`, { method: 'POST', body: '{}' });
  const v = isJsonObject(payload) ? payload : {};
  return {
    app: parseApp(v.app),
    available: bool(v.available),
    launched: bool(v.launched),
    mock: bool(v.mock, true),
  };
}

export async function reorderApps(ids: string[]): Promise<AppItem[]> {
  return parseApps(await request('/apps', { method: 'PUT', body: JSON.stringify({ ids }) }));
}
