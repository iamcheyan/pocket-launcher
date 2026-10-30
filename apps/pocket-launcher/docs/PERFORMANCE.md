# Performance

Measured on the HX90 workstation (Linux 6.12, x64), headless Chromium 152, production Vite build served by `launcherd` with mock providers. These are **workstation numbers, not device numbers**.

Reproduce: `make build && make perf` (writes [`perf-results.json`](perf-results.json)).

## Results

| Metric | Median | How it is measured |
|---|---|---|
| Backend cold ready | **133 ms** | process spawn → first successful `GET /api/health` |
| `GET /api/home` | **2 ms** | 10 sequential requests, parsed JSON |
| Frontend shell | **125 ms** | navigation → first page heading visible |
| FCP | **108 ms** | `first-contentful-paint` paint entry |
| LCP | **108 ms** | largest-contentful-paint observer |
| Search interaction | **198 ms** | keypress → first grouped result rendered |

Shell first paint is comfortably inside the <1 s goal. The 198 ms search figure is dominated by the deliberate 120 ms input debounce plus one round trip; the API itself answers in ~2 ms.

## What this does not prove

- No RG34XX/RG35XX/RG40XX, M21/HiBy DAP or Leaf3C/Boox hardware was measured. SD-card I/O, GPU initialization and e-paper refresh are unmeasured.
- The frontend bundle is 265 kB JS (82.6 kB gzip) plus a 78 kB bundled font; on a slow card the first load will be materially slower than these numbers.
- `launcherd` backend readiness here excludes service supervision, image mount and any real provider initialization, which do not exist yet.

## Design choices supporting the budget

- One server process serves both API and static SPA, so there is no second connection or origin.
- The launcher renders from a single `/api/home` payload; mock content arrives in that response rather than after a second round trip.
- The font is bundled locally, so boot does not wait on a font CDN (and works offline).
- Handheld layouts compress the hero instead of scrolling content away, so the first screen shows Continue items at 320×240.
