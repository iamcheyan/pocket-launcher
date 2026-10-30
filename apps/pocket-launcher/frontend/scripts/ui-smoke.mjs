import {chromium} from 'playwright';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {startStack, CHROMIUM} from './stack.mjs';

const frontendDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const port = Number(process.env.POCKET_LAUNCHER_PORT || 18790);
const stack = process.env.POCKET_LAUNCHER_URL ? null : await startStack({port});
const origin = process.env.POCKET_LAUNCHER_URL || stack.origin;
const browser = await chromium.launch({headless: true, executablePath: CHROMIUM});
const failures = [];

const api = async (path, init) => (await fetch(`${origin}/api${path}`, init)).json();
const put = (path, body) => api(path, {method: 'PUT', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)});

try {
  // Deterministic starting state: home page, dark theme, handheld profile.
  await put('/session', {page: 'home', activityId: '', reducedMotion: false, sort: 'default'});
  await put('/preferences', {theme: 'dark', locale: 'en'});
  await put('/profile', {id: 'handheld'});

  const context = await browser.newContext({viewport: {width: 480, height: 320}});
  // Deterministic standard-mapped gamepad so D-Pad/activate paths are testable.
  await context.addInitScript(() => {
    const pad = {
      index: 0, id: 'launcher-smoke-pad', connected: true, mapping: 'standard',
      buttons: Array.from({length: 17}, () => ({pressed: false, touched: false, value: 0})),
      axes: [0, 0, 0, 0], timestamp: 0, handles: [], hapticActuators: [], vibrationActuator: null,
    };
    globalThis.__launcherPad = pad;
    navigator.getGamepads = () => [pad];
  });
  const page = await context.newPage();
  page.on('pageerror', error => failures.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  });

  await page.goto(origin, {waitUntil: 'networkidle'});
  await page.getByRole('heading').first().waitFor();
  const homeText = await page.locator('body').innerText();
  for (const surface of ['Continue', 'Downloads', 'Recent files', 'Quick settings', 'System overview']) {
    if (!homeText.includes(surface)) failures.push(`home missing surface: ${surface}`);
  }
  if (!homeText.includes('Mock')) failures.push('home does not mark mock data');

  // Keyboard: Tab reaches an interactive control.
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-kb') !== null);
  if (!focused) failures.push('Tab did not move focus to a keyboard target');

  // Global search returns grouped results for a content query.
  await page.keyboard.press('Control+k');
  await page.getByRole('textbox').first().fill('o');
  await page.locator('.result-group').first().waitFor();
  const groups = await page.locator('.result-group').count();
  if (groups < 2) failures.push(`expected grouped search results, got ${groups}`);

  // Escape returns to home.
  await page.keyboard.press('Escape');
  await page.getByRole('heading', {name: /what would you like to do/i}).waitFor();

  // App handoff for an unavailable app stays visible and marked unavailable.
  await page.getByRole('button', {name: 'Apps', exact: true}).click();
  const gamehub = page.locator('.app-tile', {hasText: 'GameHub'}).locator('.app-open');
  await gamehub.waitFor();
  await gamehub.click();
  await page.waitForTimeout(400);
  const unavailable = await page.getByText(/^Unavailable$/i).count();
  if (unavailable === 0) failures.push('unavailable handoff produced no visible state');

  // Pin + reorder persist through the real API.
  const before = await api('/home');
  await api('/apps/reader/pin', {method: 'POST'});
  const afterPin = await api('/home');
  if (afterPin.pinnedApps.length !== before.pinnedApps.length + 1) failures.push('pin was not persisted');
  const order = ['settings', 'reader', 'music', 'video', 'files', 'gamehub', 'store'];
  const reordered = await api('/apps', {method: 'PUT', headers: {'content-type': 'application/json'}, body: JSON.stringify({ids: order})});
  if (reordered.items.map(item => item.id).join(',') !== order.join(',')) failures.push('reorder was not persisted');

  // Profile switch changes section order.
  await put('/profile', {id: 'eink'});
  const eink = await api('/home');
  if (eink.widgets[1] !== 'collections') failures.push(`eink order wrong: ${eink.widgets}`);

  // Capability gating removes quick settings.
  await put('/capabilities', {wifi: false, bluetooth: false, battery: false});
  const quick = await api('/quick-settings');
  for (const hidden of ['wifi', 'bluetooth', 'battery']) {
    if (hidden in quick.items) failures.push(`quick setting ${hidden} survived capability removal`);
  }
  if (!('brightness' in quick.items)) failures.push('brightness disappeared unexpectedly');

  // Gamepad D-Pad moves focus; A activates the focused control.
  await page.goto(origin, {waitUntil: 'networkidle'});
  await page.getByRole('heading').first().waitFor();
  await page.keyboard.press('Tab');
  const beforePad = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  const press = async (index, pressed) => page.evaluate(([i, value]) => {
    const pad = globalThis.__launcherPad;
    if (pad) pad.buttons[i].pressed = value;
  }, [index, pressed]);
  await press(13, true);
  await page.waitForTimeout(120);
  await press(13, false);
  await page.waitForTimeout(120);
  const afterPad = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  if (!beforePad || beforePad === afterPad) failures.push(`D-Pad did not move focus (${beforePad} -> ${afterPad})`);

  await press(0, true);
  await page.waitForTimeout(120);
  await press(0, false);
  await page.waitForTimeout(200);
  const headingAfterActivate = await page.getByRole('heading').first().innerText();
  if (headingAfterActivate === 'What would you like to do?') failures.push('gamepad activate did not open the focused destination');

  await context.close();
  if (failures.length) throw new Error(failures.join('\n'));
  console.log(`UI smoke passed at ${origin}`);
} finally {
  await browser.close();
  if (stack) await stack.stop();
}
