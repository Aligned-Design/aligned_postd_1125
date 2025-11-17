import fs from 'fs';
import path from 'path';
import playwright from 'playwright';

const OUT_DIR = path.resolve(process.cwd(), 'code', 'e2e', 'artifacts');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE = process.env.VITE_APP_URL || process.env.CLIENT_URL || 'http://localhost:8080';
const PAGES = [
  { name: 'landing', url: `${BASE}/` },
  { name: 'onboarding', url: `${BASE}/onboarding` },
  { name: 'creative-studio', url: `${BASE}/creative-studio` },
  { name: 'library', url: `${BASE}/library` },
];

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const results = [];

  for (const p of PAGES) {
    const page = await browser.newPage();
    const logs = [];
    page.on('console', (msg) => {
      try {
        logs.push(`${msg.type()}: ${msg.text()}`);
      } catch (e) {
        logs.push(`console: (unserializable)`);
      }
    });
    page.on('pageerror', (err) => {
      logs.push(`pageerror: ${err?.stack || err?.message || String(err)}`);
    });

    const filename = `${p.name}.png`;
    const logname = `${p.name}.log`;
    let status = 'ok';
    try {
      const resp = await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
      if (resp && !resp.ok()) {
        logs.push(`http: status ${resp.status()} ${resp.statusText()}`);
        status = `http-${resp.status()}`;
      }
      await page.screenshot({ path: path.join(OUT_DIR, filename), fullPage: true });
    } catch (err) {
      logs.push(`visit-error: ${err?.message || String(err)}`);
      status = 'error';
    }

    fs.writeFileSync(path.join(OUT_DIR, logname), logs.join('\n') + '\n');
    results.push({ page: p.url, screenshot: filename, log: logname, status });
    await page.close();
  }

  await browser.close();
  const summary = { base: BASE, results };
  fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log('E2E smoke finished. Artifacts in', OUT_DIR);
  console.log(JSON.stringify(summary, null, 2));
})();
