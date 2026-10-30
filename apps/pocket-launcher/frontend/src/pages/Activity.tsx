import {Activity as ActivityIcon, Play} from 'lucide-react';
import {activityVerbs} from '../i18n';
import {EmptyState, MockBadge} from '../components';
import type {PageContext} from '../types';

export default function Activity(ctx: PageContext) {
  const {t, activities, selectedActivity, setSelectedActivity, setPage, handoff} = ctx;

  return (
    <>
      <div className="page-title">
        <div><div className="eyebrow">{t('continue')}</div><h1 tabIndex={-1}>{selectedActivity ? selectedActivity.title : t('activity')}</h1></div>
        <MockBadge label={t('mock')}/>
      </div>
      {selectedActivity && <button className="back-button" data-kb onClick={() => setSelectedActivity(null)}>← {t('back')}</button>}
      <div className="activity-list">
        {(selectedActivity ? [selectedActivity] : activities).map(item => (
          <article className="activity-detail" key={item.id}>
            <div className="activity-art">
              <span>{item.title.slice(0, 1)}</span>
              {item.progress !== null && <i style={{width: `${item.progress}%`}}/>}
            </div>
            <div className="activity-info">
              <div className="eyebrow">{t(activityVerbs[item.category] ?? 'continue')}</div>
              <h2>{item.title}</h2>
              <p>{item.subtitle || (item.mock ? t('mock') : '')}</p>
              {item.progress !== null && (
                <>
                  <div className="progress-track"><i style={{width: `${item.progress}%`}}/></div>
                  <small>{item.progress}%</small>
                </>
              )}
              <div className="detail-actions">
                <button className="primary-button" data-kb onClick={() => void handoff(item.appId, item.title)}>
                  <Play size={15}/>{t('open')}
                </button>
                <button className="ghost-button" data-kb onClick={() => {
                  setSelectedActivity(item);
                  setPage('activity');
                }}>{t('details')}</button>
              </div>
            </div>
          </article>
        ))}
        {activities.length === 0 && <EmptyState icon={<ActivityIcon size={30}/>} title={t('noResults')}/>}
      </div>
    </>
  );
}