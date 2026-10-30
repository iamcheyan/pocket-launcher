import {ChevronRight, Search, SlidersHorizontal, UserRound} from 'lucide-react';
import type {ActivityItem, CollectionItem} from '../api';
import {capabilityKeys} from '../i18n';
import {AppIcon, ContentCard, MockBadge} from '../components';
import {sectionLabels} from '../types';
import type {CardModel, PageContext} from '../types';

function cardFromActivity(item: ActivityItem): CardModel {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    category: item.category,
    progress: item.progress,
    appId: item.appId,
    mock: item.mock,
  };
}

function cardFromCollection(item: CollectionItem): CardModel {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    category: 'collection',
    progress: null,
    appId: '',
    mock: item.mock,
  };
}

export default function Home(ctx: PageContext) {
  const {
    t, openPage, handoff, activities, home, capabilities, setSelectedActivity, setPage, orderedSections,
  } = ctx;

  const renderSystemSection = () => (
    <section className="home-section" key="system">
      <div className="section-heading"><h2>{t('system')}</h2><MockBadge label={t('mock')}/></div>
      <div className="system-panel">
        <div>
          <strong>{t('systemReady')}</strong>
          <p>{t('systemSummaryDetail')}</p>
        </div>
        <div className="capability-list">
          {capabilities.filter(cap => cap.available).map(cap => (
            <span className="capability-chip" key={cap.id}>
              {t(capabilityKeys[cap.id] ?? 'capabilities')}<em> · {cap.source}</em>
            </span>
          ))}
        </div>
      </div>
    </section>
  );

  const renderActionsSection = () => {
    const actions = home?.quickActions ?? [];
    if (actions.length === 0) return null;
    return (
      <section className="home-section" key="actions">
        <div className="section-heading"><h2>{t('actions')}</h2></div>
        <div className="action-row">
          {actions.map(app => (
            <button className="action-card" data-kb key={app.id} onClick={() => void handoff(app.id, app.name)}>
              <span className="action-icon"><AppIcon id={app.id} size={19}/></span>
              <b>{app.name}</b>
              <small>{app.available ? (app.mock ? t('mock') : t('open')) : t('unavailable')}</small>
            </button>
          ))}
        </div>
      </section>
    );
  };

  const renderContentSection = (id: string) => {
    let cards: CardModel[] = [];
    if (id === 'activity') cards = activities.map(cardFromActivity);
    else if (id === 'recent') cards = (home?.recentFiles ?? []).map(cardFromActivity);
    else if (id === 'downloads') cards = (home?.recentDownloads ?? []).map(cardFromActivity);
    else if (id === 'pinned') cards = (home?.pinnedApps ?? []).map(app => ({
      id: app.id, title: app.name, subtitle: app.mock ? t('mock') : t('open'), category: app.category,
      progress: null, appId: app.id, mock: app.mock,
    }));
    else if (id === 'collections') cards = (home?.collections ?? []).map(cardFromCollection);
    if (cards.length === 0) return null;
    const open = (card: CardModel) => {
      const sourceActivity = activities.find(item => item.id === card.id);
      if (id === 'activity' && sourceActivity) { setSelectedActivity(sourceActivity); setPage('activity'); return; }
      if (card.appId) void handoff(card.appId, card.title);
    };
    return (
      <section className="home-section" key={id}>
        <div className="section-heading">
          <h2>{t(sectionLabels[id])}</h2>
          {(id === 'activity' || id === 'pinned') && (
            <button className="text-button" data-kb onClick={() => openPage(id === 'activity' ? 'activity' : 'apps')}>
              {t('viewAll')} <ChevronRight size={14}/>
            </button>
          )}
        </div>
        <div className={`card-row ${id === 'pinned' ? 'pinned-row' : ''}`}>
          {cards.slice(0, 5).map(card => (
            <ContentCard card={card} key={card.id} mockLabel={t('mock')} onOpen={() => open(card)}/>
          ))}
        </div>
      </section>
    );
  };

  const renderSection = (id: string) => {
    if (id === 'system') return renderSystemSection();
    if (id === 'actions') return renderActionsSection();
    return renderContentSection(id);
  };

  return (
    <>
      <div className="hero">
        <div className="hero-copy">
          <div className="eyebrow">{t('greeting')} <span>· {t('theDay')}</span></div>
          <h1 tabIndex={-1}>{t('prompt')}</h1>
          <p>{t('systemReady')}</p>
        </div>
        <button className="search-launch" data-kb onClick={() => openPage('search')}>
          <Search size={18}/><span>{t('searchHint')}</span><kbd>⌘ K</kbd>
        </button>
      </div>
      {orderedSections.map(renderSection)}
      <div className="preference-strip">
        <button data-kb onClick={() => openPage('quick')}><SlidersHorizontal size={16}/>{t('quick')}</button>
        <button data-kb onClick={() => openPage('profile')}><UserRound size={16}/>{t('profile')}</button>
      </div>
    </>
  );
}