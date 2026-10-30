# Pocket Launcher

PJOS 统一主屏。PocketJS 前端（TypeScript + React + Vite）→ 单一 Go 服务 `launcherd` → SQLite 状态。主屏只做**内容预览与 app handoff**，不重做 Reader/Music/Video/GameHub/Files/Settings/Store 的内部页面。

## 状态（重要）

- 所有内容、app、通知、quick settings 数值均来自**确定性 mock providers**，界面和 API 响应都带 `mock: true`。launcherd 不探测真实硬件、不伪造已安装服务或真实播放进度。
- profile 是手动选择的 mock profile（`handheld`/`dap`/`eink`/`desktop`），不是硬件检测结果。
- 尚未集成进 PJOS-LINUX；旧 launcher 未被替换。见 [ROADMAP](docs/ROADMAP.md)。

## 运行

```bash
make build          # 构建前端 + 后端
make test           # Go 测试 + i18n parity + typecheck + 构建 + 浏览器 smoke
make dev            # launcherd(:18788) + Vite dev server
```

单独运行生产形态（launcherd 同时托管构建后的 SPA）：

```bash
cd apps/pocket-launcher/frontend && npm ci && npm run build
cd ../backend/launcherd && \
  LAUNCHER_DB=/tmp/launcher.sqlite LAUNCHER_ADDR=127.0.0.1:18788 \
  LAUNCHER_STATIC=$PWD/../../frontend/dist go run .
```

`GET /api/health` 应返回 `{"status":"ok","mode":"mock"}`。

## 目录

```
apps/pocket-launcher/
├── frontend/            # PocketJS UI（React + TypeScript + Vite）
│   ├── src/             # main.tsx / api.ts / i18n.ts / style.css
│   └── scripts/         # i18n parity, browser smoke, screenshots, perf
├── backend/launcherd/   # Go API、SQLite 迁移、mock providers
├── docs/                # 架构、API、DB、设计 DNA、截图
└── Makefile (repo root)
```

## 文档

- [架构](docs/ARCHITECTURE.md)
- [主屏信息架构](docs/HOME_SCREEN.md)
- [搜索](docs/SEARCH.md)
- [数据库](docs/DATABASE.md)
- [API](docs/API.md)
- [测试](docs/TESTING.md)
- [性能](docs/PERFORMANCE.md)
- [设计 DNA 与证据](docs/design-dna.md)
- [截图](docs/SCREENSHOTS.md)
- [路线图与旧 Launcher 映射](docs/ROADMAP.md)

## 设计来源与限制

设计 DNA 证据见 [design-dna.md](docs/design-dna.md)。`~/development/PJOS-LINUX` 是 BaseOS，**不包含** Launcher 主屏 UI；可复用的只有其启动 splash 的品牌基调、Lexend 字体（已随本仓库打包）与状态胶囊视觉。因此本项目的界面是基于这些可证实元素的新实现，不是对旧主屏组件的逐像素复制。
