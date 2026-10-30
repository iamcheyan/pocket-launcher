import {AppWindow, ChevronRight} from 'lucide-react';
import {appIcons} from './types';
import type {CardModel} from './types';

export function AppIcon({id, size = 20}: { id: string; size?: number }) {
  const Icon = appIcons[id] ?? AppWindow;
  return <Icon size={size} />;
}

export function MockBadge({label}: { label: string }) {
  return <span className="mock-badge"><span/> {label}</span>;
}

export function EmptyState({icon, title, action}: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return <div className="empty-state">{icon}<h2>{title}</h2>{action}</div>;
}

export function ContentCard({card, mockLabel, onOpen}: { card: CardModel; mockLabel: string; onOpen: () => void }) {
  return (
    <button className="content-card" data-kb onClick={onOpen} aria-label={card.title}>
      <div className={`cover cover-${card.category.toLowerCase() || 'item'}`}>
        <span>{card.title.slice(0, 1)}</span>
        {card.progress !== null && <i style={{width: `${Math.max(0, Math.min(100, card.progress))}%`}}/>}
      </div>
      <div className="card-meta">
        <strong>{card.title}</strong>
        <small>{card.subtitle || (card.mock ? mockLabel : '')}</small>
      </div>
      <ChevronRight size={15}/>
    </button>
  );
}