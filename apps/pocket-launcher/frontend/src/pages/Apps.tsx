import {ArrowDown, ArrowUp, Pin, Search, Star, X} from 'lucide-react';
import {AppIcon, MockBadge} from '../components';
import type {PageContext} from '../types';

export default function Apps(ctx: PageContext) {
  const {
    t, apps, visibleApps, appFilter, setAppFilter, sort, setSort, pinned, favorites,
    handoff, togglePin, toggleFavorite, moveApp,
  } = ctx;

  return (
    <>
      <div className="page-title">
        <div><div className="eyebrow">{t('apps')}</div><h1 tabIndex={-1}>{t('allApps')}</h1></div>
        <MockBadge label={t('mock')}/>
      </div>
      <div className="toolbar">
        <div className="search-box compact">
          <Search size={18}/>
          <input className="search-input" value={appFilter} onChange={event => setAppFilter(event.target.value)} placeholder={t('searchHint')} aria-label={t('search')}/>
          {appFilter && <button className="icon-button" data-kb aria-label={t('close')} onClick={() => setAppFilter('')}><X size={17}/></button>}
        </div>
        <label className="sort-control">
          <span>{t('sort')}</span>
          <select value={sort} onChange={event => {
            const value = event.target.value;
            setSort(value === 'name' || value === 'recent' ? value : 'default');
          }}>
            <option value="default">{t('sortDefault')}</option>
            <option value="name">{t('sortName')}</option>
            <option value="recent">{t('sortRecent')}</option>
          </select>
        </label>
      </div>
      <div className="app-grid">
        {visibleApps.map(app => {
          const position = apps.findIndex(item => item.id === app.id);
          const isPinned = pinned.has(app.id);
          return (
            <div className="app-tile" key={app.id}>
              <button className="app-open" data-kb onClick={() => void handoff(app.id, app.name)}>
                <span className="app-icon"><AppIcon id={app.id} size={23}/></span>
                <b>{app.name}</b>
                <small>{app.available ? (app.mock ? t('mock') : t('open')) : t('unavailable')}</small>
              </button>
              <div className="app-buttons">
                <button className={`pin-button ${isPinned ? 'active' : ''}`} data-kb aria-label={isPinned ? t('unpin') : t('pin')} onClick={() => void togglePin(app)}>
                  <Pin size={15} fill={isPinned ? 'currentColor' : 'none'}/>
                </button>
                <button className={`pin-button ${favorites.has(app.id) ? 'active' : ''}`} data-kb aria-label={favorites.has(app.id) ? t('unfavorite') : t('favorite')} onClick={() => void toggleFavorite(app)}>
                  <Star size={15} fill={favorites.has(app.id) ? 'currentColor' : 'none'}/>
                </button>
              </div>
              {sort === 'default' && (
                <div className="reorder">
                  <button data-kb aria-label={t('moveUp')} disabled={position <= 0} onClick={() => void moveApp(position, -1)}><ArrowUp size={13}/></button>
                  <button data-kb aria-label={t('moveDown')} disabled={position < 0 || position >= apps.length - 1} onClick={() => void moveApp(position, 1)}><ArrowDown size={13}/></button>
                </div>
              )}
            </div>
          );
        })}
        {visibleApps.length === 0 && <p className="muted">{t('noResults')}</p>}
      </div>
    </>
  );
}