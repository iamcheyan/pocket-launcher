import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {chromium} from 'playwright';
import {startStack, buildBackend, CHROMIUM} from './stack.mjs';

const frontendDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const port = Number(process.env.POCKET_LAUNCHER_PORT || 18790);

// Measure backend cold readiness (process spawn -> /api/health 200) and API
// latency separately from frontend paint, then report all three.
const external = process.env.POCKET_LAUNCHER_URL;
let stack = null;
let backendReady = 0;
if (external) {
  const started = performance.now();
  await fetch(`${external}/api/health`);
  backendReady = performance.now() - started;
} else {
  // Build first so compilation is not counted as launcherd readiness.
  const binary = buildBackend();
  const started = performance.now();
  stack = await startStack({port, binary});
  backendReady = performance.now() - started;
}
const origin = external || stack.origin;

const apiLatency = [];
for (let i = 0; i < 10; i += 1) {
  const started = performance.now();
  const res = await fetch(`${origin}/api/home`);
  if (!res.ok) throw new Error(`/api/home returned ${res.status}`);
  await res.json();
  apiLatency.push(performance.now() - started);
}

const browser = await chromium.launch({headless: true, executablePath: CHROMIUM});
const runs = [];
try {
  for (let i = 0; i < 5; i += 1) {
    const context = await browser.newContext({viewport: {width: 1280, height: 720}});
    const tab = await context.newPage();
    const navigationStart = performance.now();
    await tab.goto(origin, {waitUntil: 'load'});
    await tab.getByRole('heading').first().waitFor();
    const shellReady = performance.now() - navigationStart;
    // Paint metrics are only complete after the first frames; read them once the
    // page has settled so FCP/LCP are real numbers rather than zero.
    const paints = await tab.evaluate(() => new Promise(resolve => {
      const result = {fcp: 0, lcp: 0};
      const readPaints = () => {
        for (const entry of performance.getEntriesByType('paint')) {
          if (entry.name === 'first-contentful-paint') result.fcp = entry.startTime;
        }
      };
      readPaints();
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) result.lcp = entry.startTime;
        }).observe({type: 'largest-contentful-paint', buffered: true});
      } catch {
        // LCP may be unsupported; it stays 0 instead of a fabricated value.
      }
      requestAnimationFrame(() => requestAnimationFrame(() => {
        readPaints();
        setTimeout(() => resolve(result), 250);
      }));
    }));
    const searchStart = performance.now();
    await tab.keyboard.press('Control+k');
    await tab.getByRole('textbox').first().fill('o');
    await tab.locator('.result-group').first().waitFor();
    const searchMs = performance.now() - searchStart;
    runs.push({shellReady, fcp: paints.fcp, lcp: paints.lcp, searchMs});
    await context.close();
  }
} finally {
  await browser.close();
  if (stack) await stack.stop();
}

const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const round = n => Math.round(n);
const summary = {
  measuredAt: new Date().toISOString(),
  environment: 'HX90 workstation, headless Chromium 152, production Vite build served by launcherd, mock providers',
  backendColdReadyMs: round(backendReady),
  apiHomeMedianMs: round(median(apiLatency)),
  frontendShellMedianMs: round(median(runs.map(r => r.shellReady))),
  fcpMedianMs: round(median(runs.map(r => r.fcp))),
  lcpMedianMs: round(median(runs.map(r => r.lcp))),
  searchMedianMs: round(median(runs.map(r => r.searchMs))),
  runs: runs.map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, round(v)]))),
  shellUnder1s: median(runs.map(r => r.shellReady)) < 1000,
  notes: 'Cold ready is backend process spawn to /api/health; shell is navigation to first heading; search is keypress to first grouped result. This is a workstation measurement, not a device measurement.',
};
writeFileSync(path.join(frontendDir, '../docs/perf-results.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({...summary, runs: undefined}, null, 2));
