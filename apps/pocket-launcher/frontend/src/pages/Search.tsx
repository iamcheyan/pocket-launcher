import {ChevronRight, Search, Sparkles, X} from 'lucide-react';
import {categoryKeys} from '../i18n';
import {AppIcon, EmptyState} from '../components';
import type {PageContext} from '../types';

export default function SearchPage(ctx: PageContext) {
  const {t, query, setQuery, results, searching, handoff} = ctx;

  return (
    <>
      <div className="page-title"><div><div className="eyebrow">Pocket Launcher</div><h1 tabIndex={-1}>{t('search')}</h1></div></div>
      <div className="search-box">
        <Search size={19}/>
        <input className="search-input" autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder={t('searchHint')} aria-label={t('search')}/>
        {query && <button className="icon-button" data-kb aria-label={t('close')} onClick={() => setQuery('')}><X size={17}/></button>}
        <kbd>ESC</kbd>
      </div>
      {!query.trim()
        ? <div className="search-suggest"><Sparkles size={17}/>{t('searchEmpty')}</div>
        : searching && !results
          ? <div className="empty-state"><span className="spinner"/><p>{t('loading')}</p></div>
          : !results || results.categories.length === 0
            ? <EmptyState icon={<Search size={30}/>} title={t('noResults')}/>
            : <div className="search-groups">
                {results.categories.map(category => {
                  const group = results.groups[category] ?? [];
                  if (group.length === 0) return null;
                  return (
                    <section className="result-group" key={category}>
                      <h2>{categoryKeys[category] ? t(categoryKeys[category]) : category}</h2>
                      {group.map(item => (
                        <div className="result-row" key={`${category}-${item.title}-${item.appId}`} data-kb role="button" tabIndex={0}
                             onClick={() => void handoff(item.appId, item.title)}
                             onKeyDown={event => {
                               if (event.key === 'Enter' || event.key === ' ') {
                                 event.preventDefault();
                                 void handoff(item.appId, item.title);
                               }
                             }}>
                          <span className="result-icon"><AppIcon id={item.appId} size={18}/></span>
                          <span>
                            <b>{item.title}</b>
                            <small>{item.available ? (categoryKeys[item.category] ? t(categoryKeys[item.category]) : item.category) : t('unavailable')}</small>
                          </span>
                          {item.mock && <span className="mini-mock">{t('mock')}</span>}
                          <ChevronRight size={16}/>
                        </div>
                      ))}
                    </section>
                  );
                })}
              </div>}
    </>
  );
}