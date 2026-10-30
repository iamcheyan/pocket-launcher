export const en = {
  home: 'Home', search: 'Search', apps: 'Apps', activity: 'Activity', notifications: 'Notifications', quick: 'Quick settings',
  greeting: 'Good evening', prompt: 'What would you like to do?', theDay: 'Today',
  continue: 'Continue', recent: 'Recent files', downloads: 'Downloads', pinned: 'Pinned apps', collections: 'Collections',
  actions: 'Quick actions', system: 'System overview', profile: 'Profile',
  viewAll: 'View all', noResults: 'No results', searchHint: 'Search apps and your library…',
  mock: 'Mock', unavailable: 'Unavailable', open: 'Open', pin: 'Pin', unpin: 'Unpin', favorite: 'Favorite', unfavorite: 'Remove favorite',
  notificationsEmpty: 'You’re all caught up', theme: 'Theme', light: 'Light', dark: 'Dark', oled: 'OLED', systemTheme: 'System',
  brightness: 'Brightness', volume: 'Volume', wifi: 'Wi-Fi', bluetooth: 'Bluetooth', battery: 'Battery',
  details: 'Open in app', selectProfile: 'Choose a profile', quickHint: 'Available controls', source: 'Source',
  systemReady: 'Ready', systemSummaryDetail: 'Mock providers reported in · no device telemetry', fallback: 'Could not reach launcherd', retry: 'Retry', back: 'Back', menu: 'Navigation',
  allApps: 'All apps', sort: 'Sort', sortDefault: 'Default order', sortName: 'Name', sortRecent: 'Recently used',
  recentlyUsed: 'Recently used', device: 'Device', appearance: 'Appearance', language: 'Language',
  profileHandheld: 'Handheld', profileDap: 'Music player', profileEink: 'E-Ink reader', profileDesktop: 'Desktop',
  handheldDescription: 'D-pad · compact controls', dapDescription: 'Music first · compact navigation',
  einkDescription: 'High contrast · reduced motion', desktopDescription: 'Wide layout · productivity first',
  reduceMotion: 'Reduce motion', reduceMotionDescription: 'Minimize transitions and animated effects',
  on: 'On', off: 'Off', mockProfile: 'Mock profile', moveUp: 'Move up', moveDown: 'Move down',
  reading: 'Reading', watching: 'Watching', listening: 'Listening', playing: 'Playing',
  catApps: 'Apps', catBooks: 'Books', catMusic: 'Music', catVideos: 'Videos', catGames: 'Games', catFiles: 'Files', catSettings: 'Settings',
  capTouch: 'Touch', capStorage: 'Storage', capGamepad: 'Gamepad',
  capabilities: 'Capabilities', noCapability: 'Not present', mockData: 'Mock data',
  handoffUnavailable: 'Handoff unavailable', handoffOpened: 'Opening', mockLibrary: 'Mock Library',
  loading: 'Loading', pinFailed: 'Could not update pin', reorderFailed: 'Could not reorder apps',
  preferenceFailed: 'Could not save preference', profileFailed: 'Could not save profile', searchEmpty: 'Type to search apps and content',
  close: 'Close', favoriteFailed: 'Could not update favorite',
} as const;

export type Key = keyof typeof en;
export type Locale = 'en' | 'zh-CN' | 'ja';

const zhCN: Record<Key, string> = {
  home: '主页', search: '搜索', apps: '应用', activity: '活动', notifications: '通知', quick: '快捷设置',
  greeting: '晚上好', prompt: '接下来想做什么？', theDay: '今天',
  continue: '继续', recent: '最近文件', downloads: '下载', pinned: '固定应用', collections: '收藏集',
  actions: '快捷操作', system: '系统概览', profile: '设备配置',
  viewAll: '查看全部', noResults: '没有结果', searchHint: '搜索应用和内容…',
  mock: '模拟', unavailable: '不可用', open: '打开', pin: '固定', unpin: '取消固定', favorite: '收藏', unfavorite: '取消收藏',
  notificationsEmpty: '没有新通知', theme: '主题', light: '浅色', dark: '深色', oled: 'OLED', systemTheme: '跟随系统',
  brightness: '亮度', volume: '音量', wifi: '无线网络', bluetooth: '蓝牙', battery: '电池',
  details: '在应用中打开', selectProfile: '选择设备配置', quickHint: '可用控制', source: '来源',
  systemReady: '就绪', systemSummaryDetail: '模拟提供方已就绪 · 未采集设备遥测', fallback: '无法连接 launcherd', retry: '重试', back: '返回', menu: '导航',
  allApps: '所有应用', sort: '排序', sortDefault: '默认顺序', sortName: '名称', sortRecent: '最近使用',
  recentlyUsed: '最近使用', device: '设备', appearance: '外观', language: '语言',
  profileHandheld: '掌机', profileDap: '音乐播放器', profileEink: '墨水屏阅读器', profileDesktop: '桌面',
  handheldDescription: '方向键 · 紧凑控制', dapDescription: '音乐优先 · 紧凑导航',
  einkDescription: '高对比度 · 减少动画', desktopDescription: '宽屏布局 · 效率优先',
  reduceMotion: '减少动画', reduceMotionDescription: '尽量减少过渡和动画效果',
  on: '开启', off: '关闭', mockProfile: '模拟配置文件', moveUp: '上移', moveDown: '下移',
  reading: '阅读中', watching: '观看中', listening: '收听中', playing: '游戏中',
  catApps: '应用', catBooks: '图书', catMusic: '音乐', catVideos: '视频', catGames: '游戏', catFiles: '文件', catSettings: '设置',
  capTouch: '触控', capStorage: '存储', capGamepad: '手柄',
  capabilities: '设备能力', noCapability: '未检测到', mockData: '模拟数据',
  handoffUnavailable: '无法启动', handoffOpened: '正在打开', mockLibrary: '模拟内容库',
  loading: '加载中', pinFailed: '无法更新固定状态', reorderFailed: '无法调整应用顺序',
  preferenceFailed: '无法保存偏好设置', profileFailed: '无法保存设备配置', searchEmpty: '输入以搜索应用和内容',
  close: '关闭', favoriteFailed: '无法更新收藏状态',
};

const ja: Record<Key, string> = {
  home: 'ホーム', search: '検索', apps: 'アプリ', activity: 'アクティビティ', notifications: '通知', quick: 'クイック設定',
  greeting: 'こんばんは', prompt: '次に何をしますか？', theDay: '今日',
  continue: '続きから', recent: '最近のファイル', downloads: 'ダウンロード', pinned: 'ピン留めアプリ', collections: 'コレクション',
  actions: 'クイックアクション', system: 'システム概要', profile: 'プロファイル',
  viewAll: 'すべて表示', noResults: '結果がありません', searchHint: 'アプリやライブラリを検索…',
  mock: 'モック', unavailable: '利用不可', open: '開く', pin: 'ピン留め', unpin: '解除', favorite: 'お気に入り', unfavorite: 'お気に入り解除',
  notificationsEmpty: '新しい通知はありません', theme: 'テーマ', light: 'ライト', dark: 'ダーク', oled: 'OLED', systemTheme: 'システム',
  brightness: '明るさ', volume: '音量', wifi: 'Wi-Fi', bluetooth: 'Bluetooth', battery: 'バッテリー',
  details: 'アプリで開く', selectProfile: 'プロファイルを選択', quickHint: '利用可能な操作', source: 'ソース',
  systemReady: '準備完了', systemSummaryDetail: 'モック提供元が応答済み · デバイス計測なし', fallback: 'launcherd に接続できません', retry: '再試行', back: '戻る', menu: 'ナビゲーション',
  allApps: 'すべてのアプリ', sort: '並べ替え', sortDefault: '既定の順序', sortName: '名前', sortRecent: '最近使用',
  recentlyUsed: '最近使用', device: 'デバイス', appearance: '外観', language: '言語',
  profileHandheld: '携帯ゲーム機', profileDap: '音楽プレーヤー', profileEink: '電子ペーパー', profileDesktop: 'デスクトップ',
  handheldDescription: '方向キー · コンパクト操作', dapDescription: '音楽優先 · コンパクトナビ',
  einkDescription: '高コントラスト · 動きを抑える', desktopDescription: 'ワイド表示 · 作業優先',
  reduceMotion: '動きを減らす', reduceMotionDescription: '画面遷移とアニメーションを抑えます',
  on: 'オン', off: 'オフ', mockProfile: 'モックプロファイル', moveUp: '上へ移動', moveDown: '下へ移動',
  reading: '読書中', watching: '視聴中', listening: '再生中', playing: 'プレイ中',
  catApps: 'アプリ', catBooks: '本', catMusic: '音楽', catVideos: 'ビデオ', catGames: 'ゲーム', catFiles: 'ファイル', catSettings: '設定',
  capTouch: 'タッチ', capStorage: 'ストレージ', capGamepad: 'ゲームパッド',
  capabilities: 'デバイス機能', noCapability: '未検出', mockData: 'モックデータ',
  handoffUnavailable: '起動できません', handoffOpened: '開いています', mockLibrary: 'モックライブラリ',
  loading: '読み込み中', pinFailed: 'ピン留めを更新できません', reorderFailed: 'アプリを並べ替えできません',
  preferenceFailed: '設定を保存できません', profileFailed: 'プロファイルを保存できません', searchEmpty: 'アプリやコンテンツを検索',
  close: '閉じる', favoriteFailed: 'お気に入りを更新できません',
};

const dictionaries: Record<Locale, Record<Key, string>> = { en, 'zh-CN': zhCN, ja };

export function translate(locale: Locale, key: Key): string {
  return dictionaries[locale][key];
}

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'zh-CN' || value === 'ja';
}

export const activityVerbs: Record<string, Key> = {
  Books: 'reading', Music: 'listening', Videos: 'watching', Games: 'playing',
};

export const categoryKeys: Record<string, Key> = {
  Apps: 'catApps', Books: 'catBooks', Music: 'catMusic', Videos: 'catVideos', Games: 'catGames',
  Files: 'catFiles', Settings: 'catSettings', Downloads: 'downloads',
};

export const capabilityKeys: Record<string, Key> = {
  wifi: 'wifi', bluetooth: 'bluetooth', battery: 'battery', touch: 'capTouch',
  storage: 'capStorage', gamepad: 'capGamepad', notifications: 'notifications',
};
