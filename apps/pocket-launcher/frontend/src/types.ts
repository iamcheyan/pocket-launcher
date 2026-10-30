import type {Dispatch, SetStateAction, ComponentType} from 'react';
import {
  Activity, AppWindow, Bell, BookOpen, Gamepad2, HardDrive, Home, Monitor, Music2, Play, Search,
  Settings2, SlidersHorizontal,
} from 'lucide-react';
import type {
  ActivityItem, AppItem, Capability, HomeData, NotificationItem, ProfileId, QuickSettings, SearchResults as ApiSearchResults,
} from './api';
import type {Key, Locale} from './i18n';

export type PageId = 'home' | 'search' | 'apps' | 'activity' | 'notifications' | 'quick' | 'profile';
export type SortMode = 'default' | 'name' | 'recent';

export const pageIds: readonly PageId[] = ['home', 'search', 'apps', 'activity', 'notifications', 'quick', 'profile'];
export const navIds: readonly PageId[] = pageIds.slice(0, 6);
export const navIcons = [Home, Search, AppWindow, Activity, Bell, SlidersHorizontal];
export const profileIcons = [Gamepad2, Music2, BookOpen, Monitor];

export const appIcons: Record<string, ComponentType<{ size?: number }>> = {
  reader: BookOpen, music: Music2, video: Play, gamehub: Gamepad2, files: HardDrive,
  settings: Settings2, store: AppWindow,
};

export const sectionLabels: Record<string, Key> = {
  activity: 'continue', recent: 'recent', downloads: 'downloads', pinned: 'pinned',
  collections: 'collections', actions: 'actions', system: 'system',
};

export const profileOrderFallback: Record<ProfileId, string[]> = {
  handheld: ['activity', 'downloads', 'pinned', 'recent', 'collections', 'actions', 'system'],
  dap: ['activity', 'pinned', 'collections', 'recent', 'downloads', 'actions', 'system'],
  eink: ['activity', 'collections', 'recent', 'pinned', 'downloads', 'actions', 'system'],
  desktop: ['pinned', 'activity', 'recent', 'downloads', 'collections', 'actions', 'system'],
};

export const profileLabelKeys: Record<ProfileId, Key> = {
  handheld: 'profileHandheld', dap: 'profileDap', eink: 'profileEink', desktop: 'profileDesktop',
};

export const profileDescriptionKeys: Record<ProfileId, Key> = {
  handheld: 'handheldDescription', dap: 'dapDescription', eink: 'einkDescription', desktop: 'desktopDescription',
};

export interface CardModel {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  progress: number | null;
  appId: string;
  mock: boolean;
}

/** The subset of the search payload the UI renders. */
export type SearchResults = Pick<ApiSearchResults, 'groups' | 'categories'>;

/** State and callbacks owned by main.tsx; pages read and mutate through it. */
export interface PageContext {
  t: (key: Key) => string;
  openPage: (next: PageId) => void;
  handoff: (appId: string, label: string) => void;

  home: HomeData | null;
  apps: AppItem[];
  activities: ActivityItem[];
  notifications: NotificationItem[];
  capabilities: Capability[];
  orderedSections: string[];
  visibleApps: AppItem[];
  favorites: Set<string>;
  pinned: Set<string>;
  appFilter: string;
  setAppFilter: Dispatch<SetStateAction<string>>;
  sort: SortMode;
  setSort: Dispatch<SetStateAction<SortMode>>;
  togglePin: (app: AppItem) => void;
  toggleFavorite: (app: AppItem) => void;
  moveApp: (index: number, direction: -1 | 1) => void;

  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  results: SearchResults | null;
  searching: boolean;

  selectedActivity: ActivityItem | null;
  setSelectedActivity: Dispatch<SetStateAction<ActivityItem | null>>;
  setPage: Dispatch<SetStateAction<PageId>>;

  quick: QuickSettings;
  updateQuick: (patch: Partial<QuickSettings>) => void;
  capabilityAvailable: (id: string) => boolean;
  theme: string;
  changeTheme: (value: string) => void;

  profile: ProfileId;
  changeProfile: (id: ProfileId) => void;
  locale: Locale;
  changeLocale: (value: string) => void;
  reducedMotion: boolean;
  isEink: boolean;
  changeReducedMotion: (value: boolean) => void;
}