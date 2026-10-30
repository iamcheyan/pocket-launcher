## Pocket Launcher 设计 DNA 与证据边界

PJOS-LINUX 仓库不是 Launcher 实现。其 README 明确声明 BaseOS “has no menu of its own”，只负责启动安装在 SD 卡上的 NextUI、Slot、spruceOS 或自定义 frontend（`/home/tetsuya/development/PJOS-LINUX/README.md:3-6,69-71`）。init 经 `overlay/etc/inittab:1-8` 启动 `rcS` 和 `frontend-session`；实际 frontend 入口优先级见 `overlay/usr/sbin/frontend-session:115-166` 与 `docs/01-rootfs-and-init.md:133-166`。因此源仓库不存在可迁移的 Launcher 菜单、组件层级、主屏导航、焦点状态或应用图标集；本仓库不声称复制这些未提供的 UI。

### 可复用的 BaseOS 品牌与启动 UI

- **气质**：克制、精准、可靠；小屏优先，需行动时给出清楚提示（`PRODUCT.md:21-49`）。
- **字体**：Lexend Light；由 `build-rootfs.sh:201-205` 安装，绘制与 fallback 说明见 `docs/04-boot-splash.md:26-34`。
- **深色底色**：启动 splash 从 RGB `(12,15,18)` 渐变至 `(9,11,13)`；低亮 wordmark `(51,59,64)`，高亮文字 `(234,240,240)`，消息文字 `(124,138,138)`（`src/fbsplash.c:448-453,591-610`）。
- **状态卡片**：边框 `(93,104,109)`、面板 `(19,24,27)`、进度轨 `(50,59,64)`、强调色 `(185,200,200)`；胶囊圆角半高，按屏幕约束尺寸/边距（`src/fbsplash.c:478-482,599-658`）。这是 boot status pill 的视觉证据，不是旧 Launcher 卡片。
- **品牌资产**：BaseOS wordmark 在 splash 中以文本渲染；Lexend 文件是仓库唯一可确认的 UI 字体资产（`src/fbsplash.c:13-20`、`assets/boot.ttf`）。目标设备 bootlogo 由 `tools/make-bootlogo.sh` 生成。没有证据支持沿用第三方 frontend logo 或图标。
- **手柄**：BaseOS 仅为 SDL 扫描修正 `/dev/input` 时间戳（`overlay/etc/init.d/rcS:15-20`）；NextUI/minarch 自行读取 evdev（`experiments/h700-boot-speed/evidence/input-dir-time.txt:10-12,37-45`）。没有旧 Launcher 焦点导航可直接复用。

Pocket Launcher 以同一低彩度、深底、高对比文字与简洁圆角状态块延续 BaseOS 的可证实视觉语言，并自行实现统一主屏交互。实际旧 frontend UI 源码不在 PJOS-LINUX 中；若需逐组件兼容比对，必须取得相应 NextUI/Slot 等 frontend 源码与其许可/集成决策。
