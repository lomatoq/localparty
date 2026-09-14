/*
 * Visual geometry smoke for the six new games.
 *
 * The assertions intentionally stay outside the game runtime. Canvas screenshots are
 * evidence for projection/art review; DOM measurements catch shell/HUD regressions.
 * Override a matrix locally with QA_GAMES, QA_WIDTHS or QA_COUNTS (comma separated).
 */
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
const OUT = path.join(ROOT, 'test-results', 'game-scene-visual-qa');
const DEFAULT_GAMES = ['bowling', 'curling', 'swarm_gate', 'peek_shoot', 'taprace', 'carryball'];
const DEFAULT_WIDTHS = [320, 390, 700, 900, 1440, 2560];
const DEFAULT_COUNTS = [2, 16];
const HEIGHTS = new Map([[320, 568], [390, 844], [700, 700], [900, 700], [1440, 900], [2560, 1080]]);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function list(name, fallback, mapper = value => value) {
  return (process.env[name] ? process.env[name].split(',') : fallback)
    .map(value => mapper(String(value).trim()))
    .filter(value => value !== '' && !Number.isNaN(value));
}

function freePort() {
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
  for (let attempt = 0; attempt < 150; attempt++) {
    try {
      if ((await fetch(`${base}/api/health`)).ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error('Temporary launcher did not become healthy');
}

function boxWithinViewport(box, width, height, tolerance = 1.5) {
  return box.x >= -tolerance && box.y >= -tolerance
    && box.right <= width + tolerance && box.bottom <= height + tolerance;
}

function overlap(a, b, tolerance = 1) {
  return a && b
    && a.x < b.right - tolerance && a.right > b.x + tolerance
    && a.y < b.bottom - tolerance && a.bottom > b.y + tolerance;
}

async function measureFrame(frame) {
  return frame.evaluate(() => {
    const rect = element => {
      if (!element) return null;
      const style = getComputedStyle(element);
      const r = element.getBoundingClientRect();
      if (style.display === 'none' || style.visibility === 'hidden' || r.width < 1 || r.height < 1) return null;
      return {
        selector: element.id ? `#${element.id}` : `.${[...element.classList].join('.')}`,
        x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height,
        scrollWidth: element.scrollWidth, clientWidth: element.clientWidth,
        scrollHeight: element.scrollHeight, clientHeight: element.clientHeight,
        overflowX: style.overflowX, overflowY: style.overflowY, fontSize: Number.parseFloat(style.fontSize) || 0,
      };
    };
    const visible = selector => [...document.querySelectorAll(selector)].map(rect).filter(Boolean);
    const canvas = rect(document.querySelector('canvas'));
    return {
      viewport: { width: innerWidth, height: innerHeight },
      overflow: {
        htmlX: document.documentElement.scrollWidth > innerWidth + 1,
        bodyX: document.body.scrollWidth > innerWidth + 1,
        htmlY: document.documentElement.scrollHeight > innerHeight + 1,
        bodyY: document.body.scrollHeight > innerHeight + 1,
      },
      canvas,
      sports: {
        heading: rect(document.querySelector('.ss-heading')),
        scoreboard: rect(document.querySelector('.ss-scoreboard')),
        gate: rect(document.querySelector('.ss-gate-health')),
        announcement: rect(document.querySelector('.ss-announcement.show')),
        cards: visible('.ss-player-card'),
        title: rect(document.querySelector('#ss-title')),
        stats: visible('.ss-hud-stats > span'),
        error: document.querySelector('#ss-error:not([hidden])')?.textContent?.trim() || '',
      },
      arcade: {
        lobby: rect(document.querySelector('#lobbyStage:not([hidden])')),
        scorePanel: rect(document.querySelector('.score-panel')),
        boardRows: visible('.score-panel .runner-row'),
      },
    };
  });
}

async function measureShell(host) {
  return host.evaluate(() => {
    const rect = element => {
      if (!element) return null;
      const style = getComputedStyle(element);
      const r = element.getBoundingClientRect();
      if (style.display === 'none' || style.visibility === 'hidden' || r.width < 1 || r.height < 1) return null;
      return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      overflowX: document.documentElement.scrollWidth > innerWidth + 1 || document.body.scrollWidth > innerWidth + 1,
      frame: rect(document.querySelector('#gameFrame')),
      header: rect(document.querySelector('.app-header')),
      playbar: rect(document.querySelector('#play > .playbar')),
      objective: rect(document.querySelector('#gameObjective:not([hidden])')),
      controls: rect(document.querySelector('#sessionControls:not([hidden])')),
      liveTop: rect(document.querySelector('#liveTop:not([hidden])')),
    };
  });
}

function validateLayout(game, count, width, shell, frame) {
  const failures = [];
  const height = frame.viewport.height;
  if (shell.overflowX) failures.push('launcher has horizontal overflow');
  if (frame.overflow.htmlX || frame.overflow.bodyX) failures.push('game iframe has horizontal overflow');
  if (!shell.frame || !boxWithinViewport(shell.frame, width, shell.viewport.height)) failures.push('game iframe escapes launcher viewport');
  if (!frame.canvas || !boxWithinViewport(frame.canvas, width, height, 2.5)) failures.push('canvas does not cover a bounded game viewport');

  if (frame.sports.heading) {
    const { heading, scoreboard, gate, announcement, cards, title, stats, error } = frame.sports;
    if (error) failures.push(`runtime error: ${error}`);
    for (const [name, item] of [['heading', heading], ['scoreboard', scoreboard], ['gate health', gate], ['announcement', announcement]]) {
      if (item && !boxWithinViewport(item, width, height)) failures.push(`${name} escapes iframe viewport`);
    }
    if (!heading) failures.push('sports heading is missing');
    if (!scoreboard) failures.push('sports scoreboard is missing');
    if (!title || title.height < 8) failures.push('sports title is missing or collapsed');
    if (heading && scoreboard && overlap(heading, scoreboard)) failures.push('sports heading overlaps scoreboard');
    if (heading && gate && overlap(heading, gate)) failures.push('sports heading overlaps gate health');
    if (scoreboard && gate && overlap(scoreboard, gate)) failures.push('sports scoreboard overlaps gate health');
    if (heading && announcement && overlap(heading, announcement)) failures.push('sports heading overlaps announcement');
    if (scoreboard && announcement && overlap(scoreboard, announcement)) failures.push('sports scoreboard overlaps announcement');
    cards.forEach((card, index) => {
      if (!boxWithinViewport(card, width, height)) failures.push(`player card ${index + 1} escapes iframe viewport`);
      for (let other = index + 1; other < cards.length; other++) if (overlap(card, cards[other], .5)) failures.push(`player cards ${index + 1} and ${other + 1} overlap`);
    });
    if (cards.length !== count) failures.push(`expected ${count} player cards, found ${cards.length}`);
    if (count <= 2 && width >= 700 && cards.some(card => card.width < 150 || card.height < 64)) failures.push('two-player rail is too small for living-room readability');
    if (announcement && width <= 430 && announcement.height > 120) failures.push('announcement becomes an oversized multiline block');
    stats.forEach((stat, index) => {
      if (stat.scrollWidth > stat.clientWidth + 1 && stat.overflowX === 'visible') failures.push(`HUD stat ${index + 1} spills horizontally`);
      if (stat.scrollHeight > stat.clientHeight + 1 && stat.overflowY === 'visible') failures.push(`HUD stat ${index + 1} spills vertically`);
    });
  } else {
    const { lobby, scorePanel, boardRows } = frame.arcade;
    if (lobby) failures.push('arcade lobby panel remains visible after start');
    if (scorePanel && !boxWithinViewport(scorePanel, width, height)) failures.push('arcade score panel escapes iframe viewport');
    if (scorePanel && frame.canvas && overlap(scorePanel, frame.canvas, 0)) {
      // The score panel intentionally overlays the canvas, but it must be compact enough
      // to leave most of the playfield visible.
      if (scorePanel.width > width * .34 || scorePanel.height > height * .72) failures.push('arcade score panel covers too much of the playfield');
    }
    if (boardRows.length !== count) failures.push(`expected ${count} arcade score rows, found ${boardRows.length}`);
  }

  return failures.map(message => `${game}/${count}p/${width}px: ${message}`);
}

async function main() {
  const games = list('QA_GAMES', DEFAULT_GAMES);
  const widths = list('QA_WIDTHS', DEFAULT_WIDTHS, Number);
  const counts = list('QA_COUNTS', DEFAULT_COUNTS, Number);
  fs.mkdirSync(OUT, { recursive: true });
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const logPath = path.join(OUT, 'launcher.log');
  const log = fs.openSync(logPath, 'w');
  const launcher = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, PARTY_PORT: String(port), PARTY_EPHEMERAL: '1', PARTY_NO_BROWSER: '1' },
    stdio: ['ignore', log, log],
    windowsHide: true,
  });
  let browser;
  const report = { generatedAt: new Date().toISOString(), games, widths, counts, captures: [], failures: [], pageErrors: [], externalRequests: [] };
  try {
    await waitForHealth(base);
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PARTY_TEST_BROWSER || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
    });
    const guard = async route => {
      const url = route.request().url();
      if (url.startsWith(`${base}/`) || /^(data|blob):/.test(url)) await route.continue();
      else {
        report.externalRequests.push(url);
        await route.abort();
      }
    };
    const hostContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await hostContext.route('**/*', guard);
    await phoneContext.route('**/*', guard);
    const host = await hostContext.newPage();
    const phone = await phoneContext.newPage();
    host.on('pageerror', error => report.pageErrors.push(`host: ${error}`));
    phone.on('pageerror', error => report.pageErrors.push(`phone: ${error}`));
    await host.goto(`${base}/host`);
    await host.locator('.game[data-id="bowling"]').waitFor();
    await phone.goto(`${base}/`);
    await phone.locator('#name').fill('Visual QA');
    await phone.locator('#joinForm button[type="submit"]').click();
    await phone.locator('#home').waitFor();
    await host.evaluate(() => new Promise((resolve, reject) => {
      const ws = window.__visualQaSocket = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/lobby`);
      const timer = setTimeout(() => reject(new Error('QA host websocket timeout')), 5000);
      ws.onopen = () => ws.send(JSON.stringify({ type: 'host', key: window.PARTY_HOST_KEY }));
      ws.onmessage = event => {
        const message = JSON.parse(event.data);
        window.__visualQaState = message.type === 'state' ? message : window.__visualQaState;
        if (message.type === 'host-ok') { clearTimeout(timer); resolve(); }
      };
      ws.onerror = reject;
    }));

    for (const count of counts) {
      await host.evaluate(count => window.__visualQaSocket.send(JSON.stringify({ type: 'bots-set', count: count - 1 })), count);
      await host.waitForFunction(count => window.__visualQaState?.players?.length === count, count);
      for (const game of games) {
        await host.evaluate(game => window.__visualQaSocket.send(JSON.stringify({ type: 'launch', id: game })), game);
        await host.locator(`#gameFrame[src*="/games/${game}/"]`).waitFor({ state: 'attached' });
        await phone.locator(`#gameFrame[src*="/games/${game}/"]`).waitFor({ state: 'attached' });
        await phone.locator('#readyButton').waitFor({ state: 'visible' });
        await phone.locator('#readyButton').click();

        const hostFrame = host.frames().find(candidate => candidate.url().includes(`/games/${game}/`));
        if (!hostFrame) throw new Error(`No host iframe found for ${game}`);
        await hostFrame.locator('canvas').waitFor({ state: 'visible', timeout: 25000 });
        if (['bowling', 'curling', 'swarm_gate', 'peek_shoot'].includes(game)) {
          await hostFrame.locator('#ss-overlay').waitFor({ state: 'hidden', timeout: 25000 });
          await hostFrame.waitForFunction(expected => document.querySelectorAll('.ss-player-card').length === expected, count, { timeout: 10000 });
          await sleep(game === 'swarm_gate' ? 1700 : 700);
        } else {
          await hostFrame.locator('#lobbyStage').waitFor({ state: 'hidden', timeout: 5000 }).catch(async () => {
            const start = hostFrame.locator('#start');
            if (await start.isVisible() && await start.isEnabled()) await start.click();
          });
          await hostFrame.locator('#lobbyStage').waitFor({ state: 'hidden', timeout: 20000 });
          await hostFrame.waitForFunction(expected => document.querySelectorAll('.runner-row').length === expected, count, { timeout: 10000 });
          await sleep(500);
        }
        await host.waitForFunction(() => document.querySelector('#gameFrame')?.dataset.loading !== 'true');

        for (const width of widths) {
          const height = HEIGHTS.get(width) || Math.max(568, Math.round(width * .625));
          await host.setViewportSize({ width, height });
          await sleep(180);
          const shell = await measureShell(host);
          const frame = await measureFrame(hostFrame);
          const failures = validateLayout(game, count, width, shell, frame);
          report.failures.push(...failures);
          const name = `${String(count).padStart(2, '0')}p-${game}-${width}x${height}.png`;
          const screenshot = path.join(OUT, name);
          await host.screenshot({ path: screenshot });
          report.captures.push({ game, count, width, height, screenshot: name, shell, frame, failures });
          console.log(`VISUAL_QA_CAPTURE ${game} ${count}p ${width}x${height} ${failures.length ? `FAIL ${failures.join(' | ')}` : 'PASS'}`);
        }

        await host.evaluate(() => window.__visualQaSocket.send(JSON.stringify({ type: 'stop' })));
        await host.locator('#lobby').waitFor({ state: 'visible', timeout: 15000 });
        await phone.locator('#lobby').waitFor({ state: 'visible', timeout: 15000 });
      }
    }

    report.externalRequests = [...new Set(report.externalRequests)].sort();
    if (report.pageErrors.length) report.failures.push(...report.pageErrors.map(error => `page error: ${error}`));
    if (report.externalRequests.length) report.failures.push(...report.externalRequests.map(url => `external request: ${url}`));
  } finally {
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    await browser?.close();
    launcher.kill();
    fs.closeSync(log);
  }
  console.log(`VISUAL_QA_REPORT ${JSON.stringify({ captures: report.captures.length, failures: report.failures.length, output: OUT })}`);
  if (report.failures.length) throw new Error(report.failures.join('\n'));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
