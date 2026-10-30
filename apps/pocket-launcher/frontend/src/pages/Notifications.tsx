import {Bell, Check, ChevronRight} from 'lucide-react';
import {EmptyState} from '../components';
import type {PageContext} from '../types';

export default function Notifications(ctx: PageContext) {
  const {t, notifications, handoff} = ctx;

  return (
    <>
      <div className="page-title">
        <div><div className="eyebrow">{t('mockData')}</div><h1 tabIndex={-1}>{t('notifications')}</h1></div>
        <span className="count-chip">{notifications.length}</span>
      </div>
      {notifications.length > 0
        ? notifications.map(item => (
            <button className="notification-row" data-kb key={item.id} onClick={() => item.targetAppId && void handoff(item.targetAppId, item.title)}>
              <span className="notification-icon"><Bell size={18}/></span>
              <span><b>{item.title}</b><small>{item.body}</small></span>
              {item.mock && <span className="mini-mock">{t('mock')}</span>}
              {item.targetAppId && <ChevronRight size={16}/>}
            </button>
          ))
        : <EmptyState icon={<Check size={30}/>} title={t('notificationsEmpty')}/>}
    </>
  );
}