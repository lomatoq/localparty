let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('C:/Users/nirrt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'test-results', 'color-knives-visual-qa');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

async function waitForHealth(base) {
  for (let i = 0; i < 150; i++) {
    try { if ((await fetch(`${base}/api/health`)).ok) return; } catch {}
    await sleep(100);
  }
  throw new Error('Temporary launcher did not become healthy');
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const log = fs.openSync(path.join(OUT, 'launcher.log'), 'w');
  const launcher = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, PARTY_PORT: String(port), PARTY_EPHEMERAL: '1', PARTY_NO_BROWSER: '1' },
    stdio: ['ignore', log, log],
  });
  let browser;
  try {
    await waitForHealth(base);
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const host = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await host.goto(`${base}/host`);

    const phones = [];
    for (let i = 0; i < 2; i++) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const phone = await context.newPage();
      await phone.goto(base);
      await phone.locator('#name').fill(`Knife ${i + 1}`);
      await phone.locator('#joinForm button[type="submit"]').click();
      await phone.locator('#home').waitFor();
      phones.push(phone);
    }

    await host.locator('.game[data-id="knives"] .start-game').click();
    for (const phone of phones) {
      await phone.locator('#gameFrame[src*="/games/knives/"]').waitFor({ state: 'attached' });
      await phone.locator('#readyButton:not([disabled])').click();
    }
    await host.locator('#gameFrame[src*="/games/knives/"]').waitFor({ state: 'attached' });
    const frame = host.frames().find(item => item.url().includes('/games/knives/'));
    await frame.waitForFunction(() => typeof state !== 'undefined' && state?.game?.status === 'playing' && window.PartyArt?.sprite('ninja-body-v1'));
    await host.waitForTimeout(500);

    const rendering = await frame.evaluate(() => ({
      players: state.players.filter(player => player.active).length,
      ninjaHeight: ninjaRenderHeight(state.players.filter(player => player.active).length),
      bodySource: (() => { const sprite = PartyArt.sprite('ninja-body-v1'); return [sprite.w, sprite.h]; })(),
      smoothing: game.getContext('2d').imageSmoothingEnabled,
    }));
    if (rendering.players !== 2 || rendering.ninjaHeight < 120) throw new Error(`Ninja is still too small: ${JSON.stringify(rendering)}`);
    if (rendering.bodySource[1] < 900 || !rendering.smoothing) throw new Error(`Ninja source/rendering lost quality: ${JSON.stringify(rendering)}`);
    await host.screenshot({ path: path.join(OUT, 'host-1440x900.png') });

    await host.setViewportSize({ width: 390, height: 844 });
    await host.waitForTimeout(250);
    const narrow = await host.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      frame: (() => { const r = document.querySelector('#gameFrame').getBoundingClientRect(); return { x: r.x, right: r.right, width: r.width }; })(),
    }));
    if (narrow.scrollWidth > narrow.width + 1 || narrow.frame.x < -1 || narrow.frame.right > narrow.width + 1) throw new Error(`Narrow host overflow: ${JSON.stringify(narrow)}`);
    await host.screenshot({ path: path.join(OUT, 'host-390x844.png') });

    const phone = phones[0];
    const controller = phone.frames().find(item => item.url().includes('/games/knives/'));
    await controller.waitForFunction(() => document.querySelector('.throw-btn'));
    const phoneLayout = await controller.evaluate(() => {
      const button = document.querySelector('.throw-btn').getBoundingClientRect();
      return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, button: { width: button.width, height: button.height, x: button.x, right: button.right } };
    });
    if (phoneLayout.scrollWidth > phoneLayout.width + 1 || phoneLayout.button.width < 44 || phoneLayout.button.height < 44 || phoneLayout.button.x < -1 || phoneLayout.button.right > phoneLayout.width + 1) {
      throw new Error(`Phone controller regression: ${JSON.stringify(phoneLayout)}`);
    }
    await phone.screenshot({ path: path.join(OUT, 'controller-390x844.png') });
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ rendering, narrow, phoneLayout }, null, 2));
    console.log(`COLOR_KNIVES_VISUAL_QA PASS ${JSON.stringify(rendering)}`);
  } finally {
    await browser?.close();
    launcher.kill();
    fs.closeSync(log);
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
