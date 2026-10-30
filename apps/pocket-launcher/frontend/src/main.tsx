import {StrictMode, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {attachGamepad} from './gamepad';
import {Bell, ChevronRight, CircleHelp, Command, RefreshCw, UserRound} from 'lucide-react';
import './style.css';
import {isLocale, translate} from './i18n';
import type {Key, Locale} from './i18n';
import {
  favoriteApp, fetchActivities, fetchApps, fetchCapabilities, fetchHome, fetchNotifications,
  fetchPreferences, fetchProfile, fetchQuickSettings, fetchSearch, fetchSession, launchApp, pinApp,
  reorderApps, savePreferences, saveProfile, saveQuickSettings, saveSession,
} from './api';
import type {
  ActivityItem, AppItem, Capability, HomeData, NotificationItem, Preferences, ProfileId, QuickSettings,
  SearchItem, SessionState,
} from './api';
import {EmptyState, MockBadge} from './components';
import {navIcons, navIds, pageIds, profileLabelKeys, profileOrderFallback, sectionLabels} from './types';
import type {PageContext, PageId, SortMode} from './types';
import {pages} from './pages';

const emptyPreferences: Preferences = {
  theme: 'dark', locale: 'en', brightness: 70, volume: 50, wifi: true, bluetooth: false, reducedMotion: false,
};

export default function App() {
  const [locale, setLocale] = useState<Locale>('en');
  const [page, setPage] = useState<PageId>('home');
  const [home, setHome] = useState<HomeData | null>(null);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [preferences, setPreferences] = useState<Preferences>(emptyPreferences);
  const [quick, setQuick] = useState<QuickSettings>({theme: 'dark', brightness: 70, volume: 50, wifi: true, bluetooth: false});
  const [profile, setProfile] = useState<ProfileId>('handheld');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ groups: Record<string, SearchItem[]>; categories: string[] } | null>(null);
  const [searching, setSearching] = useState(false);
  const [appFilter, setAppFilter] = useState('');
  const [sort, setSort] = useState<SortMode>('default');
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const rootRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const t = useCallback((key: Key) => translate(locale, key), [locale]);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2400);
  }, []);

  const openPage = useCallback((next: PageId) => {
    setPage(next);
    if (next !== 'search' && next !== 'apps') setQuery('');
    rootRef.current?.scrollTo({top: 0});
    window.requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>('.page-content h1')?.focus());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const [homeData, appList, activityList, notificationList, capabilityList, prefData, quickData, profileData, session] = await Promise.all([
        fetchHome(), fetchApps(), fetchActivities(), fetchNotifications(), fetchCapabilities(),
        fetchPreferences(), fetchQuickSettings(), fetchProfile(), fetchSession(),
      ]);
      setHome(homeData);
      setApps(appList);
      setActivities(activityList);
      setNotifications(notificationList);
      setCapabilities(capabilityList);
      setPreferences(prefData);
      setQuick(quickData);
      setProfile(profileData);
      setFavorites(new Set(appList.filter(app => app.favorite).map(app => app.id)));
      setPinned(new Set(homeData.pinnedApps.map(app => app.id)));
      if (isLocale(prefData.locale)) setLocale(prefData.locale);
      setSort(session.sort === 'name' || session.sort === 'recent' ? session.sort : 'default');
      const restoredActivity = session.activityId
        ? activityList.find(item => item.id === session.activityId) ?? null
        : null;
      setSelectedActivity(restoredActivity);
      const restoredPage = pageIds.find(id => id === session.page) ?? 'home';
      setPage(restoredPage === 'activity' && !restoredActivity ? 'home' : restoredPage);
      setSessionReady(true);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!sessionReady) return;
    const timer = window.setTimeout(() => {
      const session: SessionState = {
        page, activityId: selectedActivity?.id ?? '', reducedMotion: preferences.reducedMotion, sort,
      };
      void saveSession(session).catch(() => undefined);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [page, selectedActivity, preferences.reducedMotion, sort, sessionReady]);

  useEffect(() => {
    if (!query.trim()) { setResults(null); setSearching(false); return; }
    let live = true;
    setSearching(true);
    const timer = window.setTimeout(() => {
      fetchSearch(query)
        .then(data => { if (live) setResults(data); })
        .catch(() => { if (live) setResults({groups: {}, categories: []}); })
        .finally(() => { if (live) setSearching(false); });
    }, 120);
    return () => { live = false; window.clearTimeout(timer); };
  }, [query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT';
      if (event.key === 'Escape') {
        if (selectedActivity) { setSelectedActivity(null); return; }
        if (page !== 'home') { setPage('home'); return; }
        if (typing) setQuery('');
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPage('search');
        window.requestAnimationFrame(() => rootRef.current?.querySelector<HTMLInputElement>('.search-input')?.focus());
        return;
      }
      if (typing) return;
      const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight';
      const backward = event.key === 'ArrowUp' || event.key === 'ArrowLeft';
      if (!forward && !backward) return;
      const nodes = rootRef.current?.querySelectorAll<HTMLElement>('[data-kb]');
      if (!nodes || nodes.length === 0) return;
      const visible = Array.from(nodes).filter(node => !node.hasAttribute('disabled') && node.offsetParent !== null);
      if (visible.length === 0) return;
      event.preventDefault();
      const index = target ? visible.indexOf(target) : -1;
      const next = visible[Math.min(Math.max(index + (forward ? 1 : -1), 0), visible.length - 1)];
      next?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [page, selectedActivity]);

  // Gamepad input shares the same focus list as the keyboard. Directions move,
  // A/Start activates the focused control, B goes back one level.
  useEffect(() => {
    const moveFocus = (delta: number) => {
      const nodes = rootRef.current?.querySelectorAll<HTMLElement>('[data-kb]');
      if (!nodes || nodes.length === 0) return;
      const visible = Array.from(nodes).filter(node => !node.hasAttribute('disabled') && node.offsetParent !== null);
      if (visible.length === 0) return;
      const index = visible.indexOf(document.activeElement as HTMLElement);
      const next = visible[Math.min(Math.max(index + delta, 0), visible.length - 1)];
      next?.focus();
    };
    return attachGamepad({
      onCommand: command => {
        if (command === 'next') { moveFocus(1); return; }
        if (command === 'previous') { moveFocus(-1); return; }
        if (command === 'activate') {
          const active = document.activeElement;
          if (active instanceof HTMLElement && active.dataset.kb !== undefined) {
            active.click();
            // Move focus to the destination heading so D-Pad travel continues
            // from the new page instead of the old navigation item.
            window.requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>('.page-content h1')?.focus());
          } else {
            moveFocus(1);
          }
          return;
        }
        if (selectedActivity) { setSelectedActivity(null); return; }
        if (page !== 'home') setPage('home');
      },
    });
  }, [page, selectedActivity]);

  const capabilityAvailable = useCallback(
    (id: string) => capabilities.some(cap => cap.id === id && cap.available),
    [capabilities],
  );

  const changeLocale = async (value: string) => {
    if (!isLocale(value)) return;
    setLocale(value);
    setPreferences(current => ({...current, locale: value}));
    try { await savePreferences({locale: value}); }
    catch { notify(t('preferenceFailed')); }
  };

  const changeTheme = async (value: string) => {
    if (value !== 'light' && value !== 'dark' && value !== 'oled' && value !== 'system') return;
    setPreferences(current => ({...current, theme: value}));
    setQuick(current => ({...current, theme: value}));
    try { await savePreferences({theme: value}); }
    catch { notify(t('preferenceFailed')); }
  };

  const changeReducedMotion = (value: boolean) => {
    setPreferences(current => ({...current, reducedMotion: value}));
  };

  const changeProfile = async (id: ProfileId) => {
    setProfile(id);
    try {
      setProfile(await saveProfile(id));
      setHome(await fetchHome());
      notify(translate(locale, profileLabelKeys[id]));
    } catch {
      notify(t('profileFailed'));
    }
  };

  const updateQuick = async (patch: Partial<QuickSettings>) => {
    const previous = quick;
    setQuick(current => ({...current, ...patch}));
    try { setQuick(await saveQuickSettings(patch)); }
    catch { setQuick(previous); notify(t('preferenceFailed')); }
  };

  const handoff = async (appId: string, label: string) => {
    if (!appId) return;
    try {
      const result = await launchApp(appId);
      notify(result.available ? `${t('handoffOpened')} ${label}` : `${label} · ${t('handoffUnavailable')}`);
    } catch {
      notify(t('fallback'));
    }
  };

  const togglePin = async (app: AppItem) => {
    const shouldPin = !pinned.has(app.id);
    const next = new Set(pinned);
    if (shouldPin) next.add(app.id); else next.delete(app.id);
    setPinned(next);
    try {
      await pinApp(app.id, shouldPin);
      const updated = await fetchHome();
      setHome(updated);
      setPinned(new Set(updated.pinnedApps.map(item => item.id)));
    } catch {
      setPinned(pinned);
      notify(t('pinFailed'));
    }
  };

  const toggleFavorite = async (app: AppItem) => {
    const adding = !favorites.has(app.id);
    const next = new Set(favorites);
    if (adding) next.add(app.id); else next.delete(app.id);
    setFavorites(next);
    setApps(list => list.map(item => item.id === app.id ? {...item, favorite: adding} : item));
    try { await favoriteApp(app.id, adding); }
    catch { notify(t('favoriteFailed')); }
  };

  const moveApp = async (index: number, direction: -1 | 1) => {
    const ordered = [...apps];
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    setApps(ordered);
    try {
      setApps(await reorderApps(ordered.map(app => app.id)));
    } catch {
      setApps(apps);
      notify(t('reorderFailed'));
    }
  };

  const orderedSections = useMemo(() => {
    const backend = home?.widgets.filter(id => id in sectionLabels) ?? [];
    return backend.length > 0 ? backend : profileOrderFallback[profile];
  }, [home, profile]);

  const visibleApps = useMemo(() => {
    const needle = appFilter.trim().toLowerCase();
    const filtered = apps.filter(app => !needle || `${app.name} ${app.category}`.toLowerCase().includes(needle));
    if (sort === 'name') return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'recent') return [...filtered].sort((a, b) => Number(b.recentlyUsed) - Number(a.recentlyUsed));
    return filtered;
  }, [apps, appFilter, sort]);

  const theme = preferences.theme;
  const isEink = profile === 'eink';
  const reducedMotion = preferences.reducedMotion || isEink;

  const ctx: PageContext = {
    t, openPage, handoff,
    home, apps, activities, notifications, capabilities,
    orderedSections, visibleApps, favorites, pinned, appFilter, setAppFilter, sort, setSort,
    togglePin, toggleFavorite, moveApp,
    query, setQuery, results, searching,
    selectedActivity, setSelectedActivity, setPage,
    quick, updateQuick, capabilityAvailable, theme, changeTheme,
    profile, changeProfile, locale, changeLocale, reducedMotion, isEink, changeReducedMotion,
  };

  const Page = pages[page] ?? pages.home;

  return (
    <div ref={rootRef} className={`shell theme-${theme} profile-${profile} ${isEink ? 'eink' : ''} ${reducedMotion ? 'reduced-motion' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Command size={17}/></div>
          <span>Pocket<span className="brand-light">Launcher</span></span>
        </div>
        <div className="nav-label">{t('menu')}</div>
        <nav>
          {navIds.map((id, index) => {
            const Icon = navIcons[index];
            return (
              <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} data-kb aria-current={page === id ? 'page' : undefined} onClick={() => openPage(id)}>
                <Icon size={18}/><span>{t(id as Key)}</span>
                {id === 'notifications' && notifications.length > 0 && <i className="nav-count">{notifications.length}</i>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <button className="profile-switch" data-kb onClick={() => openPage('profile')}>
            <span className="avatar"><UserRound size={16}/></span>
            <span><b>{t(profileLabelKeys[profile])}</b><small>{t('mockProfile')}</small></span>
            <ChevronRight size={15}/>
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-brand" data-kb aria-label={t('home')} onClick={() => openPage('home')}><Command size={17}/></button>
          <div className="breadcrumbs"><span>Pocket</span><ChevronRight size={13}/><b>{t(page as Key)}</b></div>
          <div className="top-actions">
            <MockBadge label={t('mock')}/>
            <button className="icon-button" data-kb aria-label={t('notifications')} onClick={() => openPage('notifications')}>
              <Bell size={18}/>{notifications.length > 0 && <i/>}
            </button>
            <button className="avatar small-avatar" data-kb aria-label={t('profile')} onClick={() => openPage('profile')}><UserRound size={16}/></button>
          </div>
        </header>

        {loading && <div className="loading-line"/>}

        {failed && !loading
          ? <EmptyState
              icon={<CircleHelp size={30}/>}
              title={t('fallback')}
              action={<button className="primary-button" data-kb onClick={() => void load()}><RefreshCw size={15}/>{t('retry')}</button>}
            />
          : <div className="page-content">
            {Page && <Page {...ctx}/>}
          </div>}

        {toast && <div className="toast" role="status">{toast}</div>}

        <div className="bottom-nav">
          {navIds.map((id, index) => {
            const Icon = navIcons[index];
            return (
              <button className={page === id ? 'active' : ''} key={id} data-kb aria-label={t(id as Key)} onClick={() => openPage(id)}>
                <Icon size={18}/><small>{t(id as Key)}</small>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App/>
  </StrictMode>,
);
