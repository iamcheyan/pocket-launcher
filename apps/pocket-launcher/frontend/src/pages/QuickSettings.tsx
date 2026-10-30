import {Battery, Bluetooth, Check, ChevronRight, Moon, Monitor, Settings2, Sun, Volume2, Wifi} from 'lucide-react';
import type {Key} from '../i18n';
import {MockBadge} from '../components';
import type {PageContext} from '../types';

export default function QuickSettings(ctx: PageContext) {
  const {
    t, quick, updateQuick, capabilityAvailable, theme, changeTheme, handoff,
  } = ctx;

  return (
    <>
      <div className="page-title">
        <div><div className="eyebrow">{t('quickHint')}</div><h1 tabIndex={-1}>{t('quick')}</h1></div>
        <MockBadge label={t('mock')}/>
      </div>
      <div className="quick-grid">
        {capabilityAvailable('wifi') && (
          <div className="quick-control">
            <div className="quick-head"><span><Wifi size={17}/></span><b>{t('wifi')}</b>
              <button className={`toggle ${quick.wifi ? 'on' : ''}`} role="switch" aria-checked={quick.wifi} aria-label={t('wifi')} data-kb onClick={() => void updateQuick({ wifi: !quick.wifi })}><i/></button>
            </div>
            <small>{quick.wifi ? t('on') : t('off')}</small>
          </div>
        )}
        {capabilityAvailable('bluetooth') && (
          <div className="quick-control">
            <div className="quick-head"><span><Bluetooth size={17}/></span><b>{t('bluetooth')}</b>
              <button className={`toggle ${quick.bluetooth ? 'on' : ''}`} role="switch" aria-checked={quick.bluetooth} aria-label={t('bluetooth')} data-kb onClick={() => void updateQuick({ bluetooth: !quick.bluetooth })}><i/></button>
            </div>
            <small>{quick.bluetooth ? t('on') : t('off')}</small>
          </div>
        )}
        {capabilityAvailable('battery') && (
          <div className="quick-control status-control">
            <div className="quick-head"><span><Battery size={17}/></span><b>{t('battery')}</b></div>
            <small>{t('systemReady')} · {t('mock')}</small>
          </div>
        )}
        <div className="quick-control">
          <div className="quick-head"><span><Sun size={17}/></span><b>{t('brightness')}</b><span className="value-chip">{quick.brightness}%</span></div>
          <input type="range" min="0" max="100" value={quick.brightness} aria-label={t('brightness')} onChange={event => void updateQuick({ brightness: Number(event.target.value) })}/>
        </div>
        <div className="quick-control">
          <div className="quick-head"><span><Volume2 size={17}/></span><b>{t('volume')}</b><span className="value-chip">{quick.volume}%</span></div>
          <input type="range" min="0" max="100" value={quick.volume} aria-label={t('volume')} onChange={event => void updateQuick({ volume: Number(event.target.value) })}/>
        </div>
      </div>
      <div className="theme-block">
        <h2>{t('theme')}</h2>
        <div className="theme-choices">
          {(['light', 'dark', 'oled', 'system'] as const).map((mode, index) => {
            const Icon = [Sun, Moon, Monitor, Monitor][index];
            const label: Key = mode === 'system' ? 'systemTheme' : mode;
            return (
              <button className={theme === mode ? 'selected' : ''} key={mode} data-kb onClick={() => void changeTheme(mode)}>
                <Icon size={17}/>{t(label)}{theme === mode && <Check size={14}/>}
              </button>
            );
          })}
        </div>
      </div>
      <button className="settings-link" data-kb onClick={() => void handoff('settings', t('details'))}>
        <Settings2 size={16}/>{t('details')}<ChevronRight size={15}/>
      </button>
    </>
  );
}