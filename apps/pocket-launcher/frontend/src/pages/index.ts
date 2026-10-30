import type {ComponentType} from 'react';
import type {PageContext, PageId} from '../types';
import Home from './Home';
import Search from './Search';
import Apps from './Apps';
import Activity from './Activity';
import Notifications from './Notifications';
import QuickSettings from './QuickSettings';
import Profile from './Profile';

export const pages: Partial<Record<PageId, ComponentType<PageContext>>> = {
  home: Home,
  search: Search,
  apps: Apps,
  activity: Activity,
  notifications: Notifications,
  quick: QuickSettings,
  profile: Profile,
};