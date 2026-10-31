# DEVICE VERIFICATION — pocket-launcher

Status: **DEVICE-PASS** for the captured states. Local host verification is in
`apps/pocket-launcher/POCKETJS-VERIFICATION.md`.

## Device

- Anbernic RG34XX, Base OS 1.5.2 (h700), kernel 4.9.170 aarch64.
- Access: Debian host -> HX90 -> USB ADB.
- Display: `/dev/fb0`, 720x480 visible page, 32 bpp.
- Runtime: `/mnt/sdcard/System/pocketjs/bin/pocket-linux-kms` (existing boot runtime, not rebuilt or replaced).
- Package: `pocket-launcher` sha256 `d15b360e0167cc5d739e074aec9b075c644b034d97cfb56a980a4f3f9198b306`.
- Deployed to `/storage/pjs/pocket-launcher/app.pocket` only.

## Procedure

1. Recorded boot launcher pid `16152` and `boot.pocket`
   sha256 `6ed41612bce1723d1eda64b5a0ee9333a105ed498b7085c03267539cf6c1b32d`.
2. Paused the launcher supervisor, stopped the launcher, and started the
   package with the same runtime and `/dev/fb0`.
3. Created a virtual keyboard with `/dev/uinput` and drove the native view
   tree through a FIFO (`uinputd-c`); no host browser and no HTML.
4. Captured `/dev/fb0` with `dd` -> base64 -> PIL.
5. Killed the package, restored the launcher, and read the pid
   `17096` and boot hash back.

Result: launcher pid changed, boot package sha256 stayed
`6ed41612bce1723d1eda64b5a0ee9333a105ed498b7085c03267539cf6c1b32d`. No write to `/storage/System`, `/storage/pocketjs`,
`/storage/baseos.conf` or `/storage/content`.

## Frames

The images are the device framebuffer. The UI was rasterized by the PocketJS
native renderer on the RG34XX, not by host Chrome.

| file | sha256 (first 16) |
|---|---|
| `docs/device/device-launcher-detail-action.png` | `822ab212336e3d1a` |
| `docs/device/device-launcher-detail.png` | `32b500687267ad4d` |
| `docs/device/device-launcher-fb-after.png` | `d59130e3329b8496` |
| `docs/device/device-launcher-fb-before.png` | `d59130e3329b8496` |
| `docs/device/device-launcher-home-focus.png` | `c214508cf7eca297` |
| `docs/device/device-launcher-home.png` | `afe808ee77123329` |
| `docs/device/device-launcher-settings-toggled.png` | `e51b267aea079221` |
| `docs/device/device-launcher-settings.png` | `929e38fb67fc0ec2` |

`device-launcher-fb-before.png` and `device-launcher-fb-after.png` are the boot
launcher before and after; they are byte-identical here, which is the intended
restore evidence.

Captured states: 6 states: home, focus, detail, detail action, settings, settings toggle.
