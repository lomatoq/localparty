/* Real launcher + two isolated phone contexts. All network traffic must stay local. */
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'test-results', 'alpha-browser');
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
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error('Temporary launcher did not become healthy');
}

async function main() {
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
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PARTY_TEST_BROWSER || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
    });
    const errors = [];
    const external = [];
    const guard = async route => {
      const url = route.request().url();
      if (url.startsWith(`${base}/`) || /^(data|blob):/.test(url)) await route.continue();
      else { external.push(url); await route.abort(); }
    };
    const pageError = error => errors.push(String(error));
    const hostContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await hostContext.route('**/*', guard);
    const host = await hostContext.newPage();
    host.on('pageerror', pageError);
    await host.goto(`${base}/host`);
    await host.locator('.game[data-id="bowling"]').waitFor();
    if (await host.locator('.game').count() !== 30) throw new Error('Catalog no longer has 30 games');
    for (const width of [320, 360, 390, 430, 700, 900, 1440]) {
      await host.setViewportSize({ width, height: width <= 430 ? 800 : 700 });
      await sleep(120);
      const mark = await host.locator('.brand-mark').boundingBox();
      const identity = await host.locator('.app-header > .identity').boundingBox();
      const headerLayout = await host.evaluate(() => {
        const box = selector => { const r = document.querySelector(selector)?.getBoundingClientRect(); return r && { x:r.x, y:r.y, right:r.right, bottom:r.bottom, width:r.width, height:r.height }; };
        return { overflow: document.documentElement.scrollWidth > innerWidth, identity: box('.app-header > .identity'), nav: box('.app-header > nav:last-of-type'), filters: box('#catalogFilters') };
      });
      const overlaps = (a, b) => a && b && a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
      const markBottomDelta = mark && identity ? identity.y + identity.height - mark.y - mark.height : Infinity;
      if (!mark || !identity || headerLayout.overflow || mark.width < (width <= 430 ? 70 : 60) || mark.x < identity.x || mark.x + mark.width > identity.x + identity.width + 1 || markBottomDelta < -18 || markBottomDelta > 1 || overlaps(headerLayout.identity, headerLayout.nav) || overlaps(headerLayout.nav, headerLayout.filters)) {
        throw new Error(`Lobby header does not fit ${width}px: ${JSON.stringify({ mark, identity, headerLayout })}`);
      }
      await host.screenshot({ path: path.join(OUT, `brand-lobby-${width}.png`) });
    }
    await host.setViewportSize({ width: 1440, height: 1000 });
    const freshOrder = await host.locator('#freshTrack .game').evaluateAll(cards => cards.slice(0, 4).map(card => card.dataset.id));
    if (freshOrder.join(',') !== 'curling,bowling,swarm_gate,peek_shoot') throw new Error(`Wrong fresh order: ${freshOrder}`);
    await host.setViewportSize({ width: 1180, height: 700 });
    await sleep(250);
    const railAlignment = await host.evaluate(() => {
      const sectionTop = document.querySelector('#catalogSection').getBoundingClientRect().top;
      return {
        sectionTop,
        leftTop: document.querySelector('.evening-console').getBoundingClientRect().top,
        rightTop: document.querySelector('.company').getBoundingClientRect().top,
      };
    });
    if (Math.abs(railAlignment.leftTop - railAlignment.sectionTop) > 3 || Math.abs(railAlignment.rightTop - railAlignment.sectionTop) > 3) throw new Error(`Narrow rail alignment failed: ${JSON.stringify(railAlignment)}`);
    await host.screenshot({ path: path.join(OUT, 'narrow-rails.png'), fullPage: true });
    await host.setViewportSize({ width: 1440, height: 1000 });
    await sleep(150);
    await host.locator('#lp-updates').click();
    await host.locator('.lp-updates-dialog').waitFor();
    await host.screenshot({ path: path.join(OUT, 'updates.png') });
    await host.locator('.lp-update-close').click();

    const phones = [];
    for (let i = 0; i < 2; i++) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
      await context.route('**/*', guard);
      const page = await context.newPage();
      page.on('pageerror', pageError);
      await page.goto(`${base}/`);
      await page.locator('#name').fill(`Alpha ${i}`);
      if (i === 0) {
        await page.locator('input[name="hand"][value="left"]').check();
        await page.locator('#avatarFile').setInputFiles(path.join(ROOT, 'public', 'assets', 'games', 'bowling.png'));
        await page.locator('#avatarPreview img').waitFor();
        await page.screenshot({ path: path.join(OUT, 'profile-photo-phone.png') });
      }
      await page.locator('#joinForm button[type="submit"]').click();
      await page.locator('#home').waitFor();
      phones.push(page);
    }
    await host.locator('.player .avatar.has-photo img').waitFor();
    if (await host.locator('.player .avatar.has-photo img').count() !== 1) throw new Error('Player photo missing from host roster');
    await host.screenshot({ path: path.join(OUT, 'profile-photo-host.png') });

    for (const mode of ['curling', 'bowling', 'swarm_gate', 'peek_shoot']) {
      await host.locator(`.game[data-id="${mode}"] .start-game`).click();
      for (const phone of phones) {
        await phone.locator(`#gameFrame[src*="/games/${mode}/"]`).waitFor({ state: 'attached' });
        await phone.frameLocator('#gameFrame').locator('#ss-name').waitFor({ state: 'attached' });
        await phone.locator('#readyButton').click();
      }
      if (mode === 'curling') {
        await phones[0].waitForFunction(() => Array.isArray(document.querySelector('#gameFrame')?.contentWindow?.PARTY_ROSTER) && document.querySelector('#gameFrame').contentWindow.PARTY_ROSTER.length >= 2);
        const forwarded = await phones[0].evaluate(() => {
          const game = document.querySelector('#gameFrame').contentWindow;
          return {
            profileAvatar: game.PARTY_PROFILE?.avatar,
            rosterAvatar: game.PARTY_ROSTER?.find(player => player.id === window.PARTY_PROFILE.id)?.avatar,
          };
        });
        if (!forwarded.profileAvatar?.startsWith('data:image/') || !forwarded.rosterAvatar?.startsWith('data:image/')) throw new Error(`Avatar was not forwarded into the game: ${JSON.stringify(forwarded)}`);
      }
      const frame = host.frameLocator('#gameFrame');
      await frame.locator('#ss-overlay').waitFor({ state: 'hidden', timeout: 25000 });
      await sleep(mode === 'swarm_gate' ? 7000 : 1000);
      await frame.locator('#ss-scene canvas').waitFor();
      if (await frame.locator('#ss-error').isVisible()) throw new Error(await frame.locator('#ss-error').innerText());
      await host.screenshot({ path: path.join(OUT, `${mode}-host.png`) });
      if (mode === 'swarm_gate') {
        for (const width of [320, 360, 390, 430, 700, 900, 1440]) {
          await host.setViewportSize({ width, height: width <= 430 ? 800 : 700 });
          await sleep(180);
          const shell = await host.evaluate(() => ({
            overflow: document.documentElement.scrollWidth > innerWidth,
            playbar: getComputedStyle(document.querySelector('#play > .playbar')).display,
          }));
          const heading = await frame.locator('.ss-heading').boundingBox();
          const title = await frame.locator('#ss-title').boundingBox();
          const mark = await host.locator('.brand-mark').boundingBox();
          const identity = await host.locator('.app-header > .identity').boundingBox();
          const timer = await host.locator('#hudTimer').boundingBox();
          const nav = await host.locator('.app-header > nav:last-of-type').boundingBox();
          if (shell.overflow || shell.playbar !== 'none' || !heading || !title || !mark || !identity || !timer || !nav || heading.x < 0 || heading.x + heading.width > width || title.height < 1 || mark.x < identity.x || mark.x + mark.width > identity.x + identity.width + 1 || mark.x + mark.width > timer.x || timer.x + timer.width > nav.x + 1) {
            throw new Error(`Sports HUD does not fit ${width}px: ${JSON.stringify({ shell, heading, title, mark, identity, timer, nav })}`);
          }
          await host.screenshot({ path: path.join(OUT, `swarm_gate-${width}.png`) });
        }
        await host.setViewportSize({ width: 1440, height: 1000 });
        await sleep(180);
      }
      await phones[0].screenshot({ path: path.join(OUT, `${mode}-phone.png`) });

      const firstFrame = phones[0].frameLocator('#gameFrame');
      if (mode === 'swarm_gate' || mode === 'peek_shoot') {
        const box = await firstFrame.locator('#ss-fire').boundingBox();
        await phones[0].mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await phones[0].mouse.down();
        await sleep(450);
        await host.screenshot({ path: path.join(OUT, `${mode}-effects.png`) });
        await phones[0].mouse.up();
      } else {
        let shooter;
        for (const phone of phones) {
          if ((await phone.frameLocator('#gameFrame').locator('#ss-turn').innerText()).includes('ТВОЙ БРОСОК')) {
            shooter = phone;
            break;
          }
        }
        if (!shooter) throw new Error(`No active thrower in ${mode}`);
        const pad = shooter.frameLocator('#gameFrame').locator('#ss-throw-pad');
        const box = await pad.boundingBox();
        const x = box.x + box.width * .5;
        const y = box.y + box.height * .85;
        await shooter.mouse.move(x, y);
        await shooter.mouse.down();
        for (let k = 0; k < 10; k++) {
          await shooter.mouse.move(x, y - box.height * .06 * (k + 1));
          await sleep(25);
        }
        await shooter.mouse.up();
        await firstFrame.locator('#ss-turn').waitFor();
        await sleep(1100);
        await host.screenshot({ path: path.join(OUT, `${mode}-throw.png`) });
        const revealLabel = mode === 'bowling' ? 'КЕГЛИ' : 'ЗАМЕР';
        await host.waitForFunction(expected => (
          document.querySelector('#gameFrame')?.contentDocument?.querySelector('#ss-stage')?.textContent?.trim() === expected
        ), revealLabel, { timeout: 15000 });
        await host.screenshot({ path: path.join(OUT, `${mode}-reveal.png`) });
      }

      await host.evaluate(async () => {
        const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/lobby`);
        await new Promise(resolve => { ws.onopen = resolve; });
        ws.send(JSON.stringify({ type: 'host', key: window.PARTY_HOST_KEY }));
        await new Promise(resolve => { ws.onmessage = event => { if (JSON.parse(event.data).type === 'host-ok') resolve(); }; });
        ws.send(JSON.stringify({ type: 'stop' }));
        setTimeout(() => ws.close(), 100);
      });
      await host.locator('#lobby').waitFor();
      for (const phone of phones) await phone.locator('#lobby').waitFor();
    }
    const report = { pageErrors: errors, externalRequests: external };
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    console.log(`ALPHA_REPORT ${JSON.stringify(report)}`);
    if (errors.length) throw new Error(`Browser page errors: ${errors.join('; ')}`);
    if (external.length) throw new Error(`External requests: ${external.join('; ')}`);
  } finally {
    if (browser) await browser.close();
    launcher.kill();
    fs.closeSync(log);
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
