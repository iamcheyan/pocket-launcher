import {Check} from 'lucide-react';
import {capabilityKeys} from '../i18n';
import {MockBadge} from '../components';
import {profileDescriptionKeys, profileIcons, profileLabelKeys} from '../types';
import type {PageContext} from '../types';
import {profileIds} from '../api';

export default function Profile(ctx: PageContext) {
  const {
    t, profile, changeProfile, locale, changeLocale, theme, changeTheme, reducedMotion,
    isEink, changeReducedMotion, capabilities,
  } = ctx;

  return (
    <>
      <div className="page-title">
        <div><div className="eyebrow">{t('device')}</div><h1 tabIndex={-1}>{t('selectProfile')}</h1></div>
        <MockBadge label={t('mock')}/>
      </div>
      <div className="profile-grid">
        {profileIds.map((id, index) => {
          const Icon = profileIcons[index];
          return (
            <button className={`profile-card ${profile === id ? 'selected' : ''}`} key={id} data-kb onClick={() => void changeProfile(id)}>
              <span className="profile-icon"><Icon size={22}/></span>
              <span><b>{t(profileLabelKeys[id])}</b><small>{t(profileDescriptionKeys[id])}</small></span>
              {profile === id && <Check size={17}/>}
            </button>
          );
        })}
      </div>
      <div className="settings-group">
        <label>{t('language')}
          <select value={locale} onChange={event => void changeLocale(event.target.value)}>
            <option value="en">English</option>
            <option value="zh-CN">简体中文</option>
            <option value="ja">日本語</option>
          </select>
        </label>
        <label>{t('appearance')}
          <select value={theme} onChange={event => void changeTheme(event.target.value)}>
            <option value="light">{t('light')}</option>
            <option value="dark">{t('dark')}</option>
            <option value="oled">{t('oled')}</option>
            <option value="system">{t('systemTheme')}</option>
          </select>
        </label>
      </div>
      <label className="motion-toggle">
        <span><b>{t('reduceMotion')}</b><small>{t('reduceMotionDescription')}</small></span>
        <input type="checkbox" checked={reducedMotion} disabled={isEink} onChange={event => changeReducedMotion(event.target.checked)}/>
      </label>
      <div className="capability-list profile-capabilities">
        {capabilities.map(cap => (
          <span className={`capability-chip ${cap.available ? '' : 'inactive'}`} key={cap.id}>
            {t(capabilityKeys[cap.id] ?? 'capabilities')} · {cap.available ? `${t('source')} ${cap.source}` : t('noCapability')}
          </span>
        ))}
      </div>
    </>
  );
}