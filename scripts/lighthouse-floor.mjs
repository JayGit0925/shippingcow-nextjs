// PRD C-1: enforce Lighthouse mobile performance >= 0.90 on every money page.
// Usage:
//   npm run build && npm run perf:floor              # spawns `next start`
//   BASE_URL=https://preview.example npm run perf:floor  # audits a live URL
// CHROME_PATH is passed to lighthouse; defaults to the preinstalled Chromium
// when unset. Lighthouse's default emulation is mobile — no preset needed.
import { spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { MONEY_PAGES, PERF_FLOOR, evaluateFloor } from './lighthouse-floor-lib.mjs';

const DEFAULT_CHROME = '/opt/pw-browsers/chromium';
const chromePath =
  process.env.CHROME_PATH || (existsSync(DEFAULT_CHROME) ? DEFAULT_CHROME : undefined);
if (!chromePath) {
  console.error('CHROME_PATH is not set and no default Chromium found.');
  process.exit(1);
}

const externalBase = process.env.BASE_URL;
const base = externalBase || 'http://localhost:3000';

async function waitForServer(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server at ${url} did not become ready`);
}

function auditPage(page) {
  const out = execFileSync(
    'npx',
    [
      'lighthouse',
      `${base}${page}`,
      '--only-categories=performance',
      '--output=json',
      '--output-path=stdout',
      '--quiet',
      '--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage',
    ],
    {
      env: { ...process.env, CHROME_PATH: chromePath },
      maxBuffer: 64 * 1024 * 1024,
      encoding: 'utf8',
    },
  );
  const report = JSON.parse(out);
  return report.categories?.performance?.score ?? null;
}

let server;
if (!externalBase) {
  server = spawn('npx', ['next', 'start'], { stdio: 'ignore' });
}

try {
  await waitForServer(base);
  const results = [];
  for (const page of MONEY_PAGES) {
    let score = null;
    try {
      score = auditPage(page);
    } catch (err) {
      console.error(`lighthouse failed on ${page}: ${err.message}`);
    }
    results.push({ page, score });
    console.log(
      `${page.padEnd(24)} ${score === null ? 'ERROR' : score.toFixed(2)}`,
    );
  }
  const { pass, failures } = evaluateFloor(results);
  if (!pass) {
    console.error(
      `\nPerf floor FAILED (< ${PERF_FLOOR}): ${failures
        .map((f) => `${f.page}=${f.score ?? 'error'}`)
        .join(', ')}`,
    );
    process.exit(1);
  }
  console.log(`\nPerf floor PASSED: all ${results.length} money pages >= ${PERF_FLOOR}`);
} finally {
  if (server) server.kill('SIGTERM');
}
