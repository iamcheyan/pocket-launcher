import {mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {startStack, CHROMIUM} from './stack.mjs';

const frontendDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(frontendDir, '../docs/screenshots');
rmSync(outDir, {recursive: true, force: true});
mkdirSync(outDir, {recursive: true});

const port = Number(process.env.POCKET_LAUNCHER_PORT || 18790);
const stack = process.env.POCKET_LAUNCHER_URL ? null : await startStack({port});
const origin = process.env.POCKET_LAUNCHER_URL || stack.origin;
const browser = await chromium.launch({headless: true, executablePath: CHROMIUM});

const put = (resource, body) => fetch(`${origin}/api${resource}`, {
  method: 'PUT', headers: {'content-type': 'application/json'}, body: JSON.stringify(body),
});

const shots = [];

// Each capture starts from a reset session so the restored page cannot leak
// between screenshots, then opens the requested surface explicitly.
async function shot({name, width, height, profile = 'handheld', theme = 'dark', locale = 'en', nav, action, expectHeading}) {
  await put('/session', {page: 'home', activityId: '', reducedMotion: false, sort: 'default'});
  await put('/preferences', {theme, locale});
  await put('/profile', {id: profile});

  const context = await browser.newContext({viewport: {width, height}, deviceScaleFactor: 1});
  const tab = await context.newPage();
  await tab.goto(origin, {waitUntil: 'networkidle'});
  await tab.getByRole('heading').first().waitFor();
  if (nav) {
    await tab.getByRole('button', {name: nav, exact: true}).first().click();
  }
  if (action) await action(tab);
  if (expectHeading) {
    await tab.getByRole('heading', {name: expectHeading}).first().waitFor();
  }
  // Guard against a stale profile/theme: the shell class comes from the values
  // the page loaded, so it proves what was actually rendered.
  const shellClass = (await tab.locator('.shell').getAttribute('class')) ?? '';
  for (const expected of [`profile-${profile}`, `theme-${theme}`]) {
    if (!shellClass.includes(expected)) {
      throw new Error(`${name}: shell class "${shellClass}" is missing ${expected}`);
    }
  }
  await tab.waitForTimeout(300);

  const file = path.join(outDir, `${name}.png`);
  await tab.screenshot({path: file});
  const png = readFileSync(file);
  const pngWidth = png.readUInt32BE(16);
  const pngHeight = png.readUInt32BE(20);
  if (png.subarray(1, 4).toString('ascii') !== 'PNG' || pngWidth !== width || pngHeight !== height) {
    throw new Error(`${name}: invalid PNG header ${pngWidth}x${pngHeight}`);
  }
  shots.push({
    name, width: pngWidth, height: pngHeight, profile, theme, locale,
    hash: createHash('sha256').update(png).digest('hex').slice(0, 16),
  });
  await context.close();
}

try {
  // Default desktop-derived layout at wide geometry.
  await shot({name: 'home-1280x720-dark', width: 1280, height: 720, profile: 'desktop', theme: 'dark', expectHeading: /what would you like to do/i});
  await shot({name: 'home-1280x720-light', width: 1280, height: 720, profile: 'desktop', theme: 'light', expectHeading: /what would you like to do/i});
  await shot({name: 'continue-1280x720-dark', width: 1280, height: 720, profile: 'desktop', theme: 'dark', nav: 'Activity', expectHeading: /continue|activity/i});
  await shot({name: 'search-groups-1280x720-dark', width: 1280, height: 720, profile: 'desktop', theme: 'dark', nav: 'Search', expectHeading: /search/i, action: async tab => {
    await tab.getByRole('textbox').first().fill('o');
    await tab.locator('.result-group').first().waitFor();
  }});
  await shot({name: 'apps-1280x720-dark', width: 1280, height: 720, profile: 'desktop', theme: 'dark', nav: 'Apps', expectHeading: /all apps/i});
  await shot({name: 'notifications-1280x720-dark', width: 1280, height: 720, profile: 'desktop', theme: 'dark', nav: 'Notifications', expectHeading: /notifications/i});
  await shot({name: 'quick-settings-1280x720-dark', width: 1280, height: 720, profile: 'desktop', theme: 'dark', nav: 'Quick settings', expectHeading: /quick settings/i});

  // Device profiles and representative geometries.
  await shot({name: 'home-handheld-480x320-dark', width: 480, height: 320, profile: 'handheld', theme: 'dark', expectHeading: /what would you like to do/i});
  await shot({name: 'home-dap-480x320-dark', width: 480, height: 320, profile: 'dap', theme: 'dark', expectHeading: /what would you like to do/i});
  await shot({name: 'home-eink-720x720-light', width: 720, height: 720, profile: 'eink', theme: 'light', expectHeading: /what would you like to do/i});
  await shot({name: 'home-handheld-320x240-dark', width: 320, height: 240, profile: 'handheld', theme: 'dark', expectHeading: /what would you like to do/i});
  await shot({name: 'home-dap-320x240-oled', width: 320, height: 240, profile: 'dap', theme: 'oled', expectHeading: /what would you like to do/i});
  await shot({name: 'home-eink-720x720-ja', width: 720, height: 720, profile: 'eink', theme: 'dark', locale: 'ja', expectHeading: /次に何をしますか/});
  await shot({name: 'home-desktop-640x480-dark', width: 640, height: 480, profile: 'desktop', theme: 'dark', expectHeading: /what would you like to do/i});
  await shot({name: 'home-desktop-1920x1080-dark', width: 1920, height: 1080, profile: 'desktop', theme: 'dark', expectHeading: /what would you like to do/i});
  // Guard against horizontal overflow at every supported geometry.
  for (const [w, h] of [[320, 240], [480, 320], [640, 480], [720, 720], [1280, 720], [1920, 1080]]) {
    const context = await browser.newContext({viewport: {width: w, height: h}});
    const tab = await context.newPage();
    await tab.goto(origin, {waitUntil: 'networkidle'});
    await tab.getByRole('heading').first().waitFor();
    const overflow = await tab.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (overflow) throw new Error(`horizontal overflow at ${w}x${h}`);
    await context.close();
  }
} finally {
  await browser.close();
  if (stack) await stack.stop();
}

const uniqueHashes = new Set(shots.map(s => s.hash));
if (uniqueHashes.size < 10) throw new Error(`expected distinct profile/theme screenshots, only ${uniqueHashes.size} unique hashes`);
const files = readdirSync(outDir).filter(f => f.endsWith('.png'));
if (files.length !== shots.length) throw new Error(`unexpected screenshot count: ${files.length} vs ${shots.length}`);

const rows = shots.map(s => `| \`${s.name}.png\` | ${s.width}×${s.height} | ${s.profile} | ${s.theme} | ${s.locale} | all mock | \`${s.hash}\` |`);
writeFileSync(path.join(frontendDir, '../docs/screenshot-manifest.md'),
  `| file | dimensions | profile | theme | locale | data | sha256 |\n|---|---|---|---|---|---|---|\n${rows.join('\n')}\n`);
console.log(`captured ${shots.length} screenshots from ${origin} with ${uniqueHashes.size} distinct hashes`);
