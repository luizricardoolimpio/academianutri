// Teste de fumaça em celular: build + preview, marca o café, abre o treino, recarrega offline.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium, webkit, devices } = require('playwright');
const PORT = 4179;
const BASE = `http://localhost:${PORT}/academianutri/`;
mkdirSync('e2e/screens', { recursive: true });

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('preview não subiu')), 20000);
  server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) { clearTimeout(t); resolve(); } });
});

async function run(name, device) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...devices[device], serviceWorkers: 'allow' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(BASE + '#/hoje');
  await page.getByRole('button', { name: 'Entendi' }).click();
  const cafe = page.getByRole('checkbox', { name: /Café da manhã/ });
  await cafe.check();
  await page.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.ready, null, { timeout: 15000 });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.screenshot({ path: `e2e/screens/${name}-hoje.png`, fullPage: false });
  // abre um treino (segunda de exemplo)
  await page.goto(BASE + '#/treino/2026-11-30');
  await page.getByRole('heading', { level: 2 }).waitFor();
  await page.screenshot({ path: `e2e/screens/${name}-treino.png` });
  for (const tab of ['Semana', 'Treinos', 'Dieta', 'Evolução']) {
    await page.getByRole('link', { name: tab, exact: true }).click();
    await page.getByRole('heading', { level: 1, name: tab }).waitFor();
  }
  await page.screenshot({ path: `e2e/screens/${name}-evolucao.png` });
  // offline: recarrega e confirma que Hoje abre e o check persiste
  await page.reload(); await page.evaluate(() => navigator.serviceWorker.ready);
  await page.goto(BASE + '#/hoje');
  await context.setOffline(true);
  await page.reload();
  try {
    await page.getByRole('checkbox', { name: /Café da manhã/ }).waitFor({ timeout: 10000 });
  } catch (e) {
    await page.screenshot({ path: `e2e/screens/${name}-offline-falha.png` });
    throw new Error(`${name}: offline sem o café. Página: ${(await page.textContent('body'))?.slice(0, 300)}`);
  }
  const checked = await page.getByRole('checkbox', { name: /Café da manhã/ }).isChecked();
  await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 5000))]);
  if (!checked) throw new Error(`${name}: check do café não persistiu offline`);
  if (errors.length) throw new Error(`${name}: erros na página: ${errors.join(' | ')}`);
  console.log(`OK ${name}`);
}

try {
  await run('android', 'Pixel 7');
  await run('iphone', 'iPhone 13');
} finally {
  server.kill('SIGKILL');
}
process.exit(0);
