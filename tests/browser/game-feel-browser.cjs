let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('C:/Users/nirrt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'test-results', 'game-feel');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const freePort = () => new Promise((resolve, reject) => { const server = net.createServer(); server.unref(); server.on('error', reject); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)); }); });
async function health(base) { for (let i = 0; i < 150; i++) { try { if ((await fetch(`${base}/api/health`)).ok) return; } catch {} await sleep(100); } throw Error('launcher health timeout'); }

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const port = await freePort(), base = `http://127.0.0.1:${port}`, log = fs.openSync(path.join(OUT, 'launcher.log'), 'w');
  const launcher = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PARTY_PORT: String(port), PARTY_EPHEMERAL: '1', PARTY_NO_BROWSER: '1' }, stdio: ['ignore', log, log] });
  let browser;
  try {
    await health(base); browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${base}/host`);
    await page.evaluate(() => new Promise((resolve, reject) => {
      const ws = window.__feelQa = new WebSocket(`ws://${location.host}/lobby`), timer = setTimeout(() => reject(Error('host socket timeout')), 5000);
      ws.onopen = () => ws.send(JSON.stringify({ type: 'host', key: PARTY_HOST_KEY }));
      ws.onmessage = event => { const message = JSON.parse(event.data); if (message.type === 'host-ok') { clearTimeout(timer); resolve(); } };
    }));
    await page.evaluate(() => __feelQa.send(JSON.stringify({ type: 'bots-set', count: 2 })));
    await page.waitForTimeout(100);
    await page.evaluate(() => __feelQa.send(JSON.stringify({ type: 'launch', id: 'push' })));
    await page.locator('#gameFrame[src*="/games/push/"]').waitFor({ state: 'attached' });
    let frame = page.frames().find(item => item.url().includes('/games/push/'));
    await frame.waitForFunction(() => window.LocalPartyFeel);
    const standard = await frame.evaluate(() => {
      const before = { width: innerWidth, scrollWidth: document.documentElement.scrollWidth };
      const first = LocalPartyFeel.emit('explosion', { id: 'qa-1', x: .5, y: .45, intensity: 1 });
      const duplicate = LocalPartyFeel.emit('explosion', { id: 'qa-1', x: .5, y: .45, intensity: 1 });
      let unknown = false; try { LocalPartyFeel.emit('guess'); } catch (error) { unknown = error instanceof TypeError; }
      const layer = document.querySelector('.lp-feel-layer').getBoundingClientRect();
      return { before, after: { scrollWidth: document.documentElement.scrollWidth }, first, duplicate, unknown, layer: { x: layer.x, y: layer.y, right: layer.right, bottom: layer.bottom }, particles: document.querySelectorAll('.lp-feel-burst>i').length };
    });
    if (standard.before.scrollWidth > standard.before.width + 1 || standard.after.scrollWidth > standard.before.width + 1 || standard.layer.x !== 0 || standard.layer.y !== 0 || standard.layer.right !== standard.before.width || standard.layer.bottom > 844) throw Error(`feel overlay overflow: ${JSON.stringify(standard)}`);
    if (!standard.unknown || !standard.duplicate.suppressed || standard.particles < 4 || standard.particles > 11) throw Error(`feel contract failed: ${JSON.stringify(standard)}`);
    await page.screenshot({ path: path.join(OUT, 'mobile-explosion-390x844.png') });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await Promise.all([
      frame.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      frame.evaluate(() => location.reload())
    ]);
    await frame.waitForFunction(() => window.LocalPartyFeel);
    const reduced = await frame.evaluate(() => { const result = LocalPartyFeel.emit('hit', { id: 'reduced-1', intensity: 1 }); return { result, children: document.querySelectorAll('.lp-feel-layer>*').length, reduced: LocalPartyFeel.reduced(), scrollWidth: document.documentElement.scrollWidth, width: innerWidth }; });
    if (!reduced.reduced || !reduced.result.suppressed || reduced.children !== 0 || reduced.scrollWidth > reduced.width + 1) throw Error(`reduced motion failed: ${JSON.stringify(reduced)}`);
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ standard, reduced }, null, 2));
    console.log('GAME_FEEL_BROWSER PASS');
  } finally { await browser?.close(); launcher.kill(); fs.closeSync(log); }
})().catch(error => { console.error(error); process.exitCode = 1; });
