import {spawn, execFileSync} from 'node:child_process';
import {mkdirSync, rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const frontendDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repoRoot = path.resolve(frontendDir, '../../..');
const backendDir = path.join(frontendDir, '../backend/launcherd');
const tmpDir = path.join(repoRoot, '.tmp');

export const CHROMIUM = process.env.POCKET_LAUNCHER_CHROMIUM || '/run/current-system/sw/bin/chromium';

function waitFor(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch {
        // service not up yet
      }
      if (Date.now() > deadline) return reject(new Error(`timeout waiting for ${url}`));
      setTimeout(tick, 100);
    };
    tick();
  });
}

// Build once, then spawn the binary directly: `go run` wraps the server in a
// build step and its signal handling makes shutdown timings unrealistic.

async function assertPortFree(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`, {signal: AbortSignal.timeout(500)});
    await res.body?.cancel();
    throw new Error(`port ${port} is already serving a launcherd instance; refusing to reuse it`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('refusing')) throw error;
    // Connection refused/timeout means the port is free, which is what we want.
  }
}
export function buildBackend() {
  mkdirSync(tmpDir, {recursive: true});
  const binary = path.join(tmpDir, 'launcherd');
  execFileSync('go', ['build', '-o', binary, '.'], {cwd: backendDir, stdio: 'inherit'});
  return binary;
}

// Starts launcherd serving both /api and the production SPA build on one origin.
export async function startStack({port = 18790, fresh = true, binary: prebuilt} = {}) {
  await assertPortFree(port);
  mkdirSync(tmpDir, {recursive: true});
  const binary = prebuilt ?? buildBackend();
  const db = path.join(tmpDir, `launcherd-${port}.sqlite`);
  if (fresh) {
    rmSync(db, {force: true});
    rmSync(`${db}-wal`, {force: true});
    rmSync(`${db}-shm`, {force: true});
  }
  const backend = spawn(binary, [], {
    cwd: backendDir,
    env: {
      ...process.env,
      LAUNCHER_DB: db,
      LAUNCHER_ADDR: `127.0.0.1:${port}`,
      LAUNCHER_STATIC: path.join(frontendDir, 'dist'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  backend.stdout.on('data', chunk => { log += chunk; });
  backend.stderr.on('data', chunk => { log += chunk; });
  const exited = new Promise(resolve => backend.once('exit', resolve));
  const origin = `http://127.0.0.1:${port}`;
  try {
    await waitFor(`${origin}/api/health`);
  } catch (error) {
    backend.kill('SIGKILL');
    throw new Error(`${error.message}\n${log}`);
  }
  return {
    origin,
    logs: () => log,
    stop: async () => {
      if (backend.exitCode !== null) return;
      backend.kill('SIGTERM');
      const timeout = new Promise(resolve => setTimeout(resolve, 5000));
      await Promise.race([exited, timeout]);
      if (backend.exitCode === null) backend.kill('SIGKILL');
    },
  };
}
