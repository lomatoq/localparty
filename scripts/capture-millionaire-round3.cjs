'use strict';
// Real launcher, real engine and browser players; no question, score or phase injection.
const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { webkit } = require(process.env.PARTY_PLAYWRIGHT || 'playwright');
const output = path.resolve(process.env.QA_OUTPUT || '.localparty-build/design-round3/millionaire/after');
fs.mkdirSync(output, { recursive: true });
const strict = process.env.QA_ACCEPT !== '0';
const files = fs.readdirSync('games/millionaire/public').filter(f => /\.(js|css|html)$/.test(f)).map(f => 'games/millionaire/public/' + f);
const shared = ['public/background-scene.css','public/tv.js','public/tv-information.css','public/branding.css','public/polish.css','public/assets/backgrounds/brick-wall-wide-v1.png','public/assets/backgrounds/brick-wall-mobile-v1.png', 'public/game-ui-system.css', 'public/game-polish.css', 'public/game-ui-system.js', 'public/tv-information.js', 'public/i18n.js', 'public/i18n-dictionary.js', 'public/i18n-shell.js'];
const hashes = () => Object.fromEntries([...files, ...shared].map(f => [f, crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const report = { startedAt: new Date().toISOString(), method: 'Normal-clock real browser players, public game state and actual buttons; no fixtures or injected results.', revisionStart: hashes(), captures: [], scenarios: [], errors: [] };
const child = spawn(process.execPath, ['server.js'], { env: { ...process.env, PARTY_EMBEDDED: '1', PARTY_INTERNAL_PORT: '0', PARTY_EPHEMERAL: '1', PARTY_PORT: '0', PARTY_NO_BROWSER: '1', PARTY_ADMIN_KEY: 'millionaire-round3' } });
let log = '', browser;
child.stdout.on('data', d => log += d); child.stderr.on('data', d => log += d);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const save = () => fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
async function until(fn, label, timeout = 30000) { const end = Date.now() + timeout; while (Date.now() < end) { const value = await fn(); if (value) return value; await sleep(80); } throw Error(label); }
const frameOf = page => page.frames().find(f => f.url().includes('/games/millionaire/'));
async function metrics(page) {
  const frame = frameOf(page);
  const inner = await frame.evaluate(() => {
    const box = e => { if (!e || !e.getClientRects().length) return null; const r = e.getBoundingClientRect(), s = getComputedStyle(e); return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom, scroll: e.scrollHeight, client: e.clientHeight, text: e.textContent.trim(), family: s.fontFamily, weight: s.fontWeight, style: s.fontStyle, transform: s.textTransform, font: s.fontSize,background:s.backgroundColor,backgroundImage:s.backgroundImage,border:s.borderColor,outline:s.outlineStyle,shadow:s.boxShadow }; };
    const nodes = Object.fromEntries(['.phone', '#answer', '#wait', '#reveal', '#phoneQuestion', '.view:not(.hidden) .statusTop', '#myMoney', '#moneyPill', '#waitText', '#miniRank', '#wait .centerCard', '.wait-player-name', '.wait-copy', '#game', '.scoreboard', '.stage', '.questionWrap', '#scoreList', '#activeName', '#questionText', '#explanation', '.turnMeta'].map(s => [s, box(document.querySelector(s))]));
    return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, phase: state?.phase, questionId: state?.question?.id, activeId: state?.activePlayerId, self: window.PARTY_PROFILE?.id, playerCount: state?.players?.length, nodes, buttons: [...document.querySelectorAll('button')].map(box).filter(Boolean), answers: [...document.querySelectorAll('#phoneAnswers button,#answers .answer')].map(box), answerCopy: [...document.querySelectorAll('#phoneAnswers .txt,#answers .text')].map(box), scoreRows: [...document.querySelectorAll('#scoreList .scoreItem')].map(box), scoreNames: [...document.querySelectorAll('#scoreList .scoreTop b')].map(e => ({ ...box(e), protected: e.hasAttribute('data-no-translate') })), rosterFade: document.querySelector('#scoreList') ? { soft: document.querySelector('#scoreList').classList.contains('hp-soft-scroll'), above: document.querySelector('#scoreList').dataset.scrollAbove, below: document.querySelector('#scoreList').dataset.scrollBelow } : null };
  });
  const outer = await page.evaluate(() => { const box = q => { const e = document.querySelector(q); if (!e || !e.getClientRects().length) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, bottom: r.bottom }; }; return { width: innerWidth, height: innerHeight, header: box('#brandHeader') || box('.tv-header'), frame: box('#gameFrame'), footer: box('#sessionControls') || box('.playbar'), footerButtons: ['#sessionControls #pauseButton', '#sessionControls #exitVoteButton'].map(box).filter(Boolean), scrollWidth: document.documentElement.scrollWidth }; });
  return { inner, outer };
}
function check(capture) {
  const { inner: m, outer } = capture.metrics;
  assert(m.scrollWidth <= m.width + 1, capture.file + ' horizontal inner overflow');
  assert(outer.scrollWidth <= outer.width + 1, capture.file + ' horizontal shell overflow');
  if (capture.surface === 'phone') { assert(outer.footer, capture.file + ' footer is visible'); assert.equal(outer.footerButtons.length, 2, 'Pause and Lobby both visible'); assert(outer.footer.bottom <= outer.height + 1, capture.file + ' footer stays on screen'); for (const button of outer.footerButtons) assert(button.y >= outer.footer.y && button.bottom <= outer.height + 1 && button.x >= 0 && button.x + button.w <= outer.width + 1, capture.file + ' footer buttons are contained'); }
  if (capture.role === 'answer') {
    assert.equal(m.answers.length, 4, 'Four actual answers');
    for (const a of m.answers) assert(a.x >= 15.9 && a.right <= m.width - 15.9 && a.y >= 0 && a.bottom <= m.height - 7 && a.h >= 44, capture.file + ' answer bounds');
    const title = m.nodes['#phoneQuestion'];
    assert(title.y >= 0 && title.bottom <= m.answers[0].y + 1, 'Question never intersects answers');
    m.answerCopy.forEach((copy, i) => { const card = m.answers[i]; assert(copy.y >= card.y && copy.bottom <= card.bottom + 1, capture.file + ' answer text stays inside its card'); assert.match(copy.family, /KardiaFitRunner/, 'Choice copy uses the description face'); assert.equal(copy.transform, 'none'); });
    assert.equal(m.nodes['#myMoney'].weight, '900');
  }
  if (capture.role === 'waiting') {
    const card = m.nodes['#wait .centerCard'], rank = m.nodes['#miniRank'];
    assert(card && rank, 'Waiting shows the actual rank at both phone sizes');
    assert(card.x >= 15.9 && card.right <= m.width - 15.9 && card.y >= 0 && card.bottom <= m.height - 7, capture.file + ' waiting card fits');
    assert(rank.bottom <= card.bottom, 'Rank is contained');
    assert.equal(m.nodes['.wait-player-name'].transform, 'none');
    assert.match(m.nodes['.wait-player-name'].family, /KardiaFit,/);
    assert.match(m.nodes['.wait-copy'].family, /KardiaFitRunner/);
    assert.equal(m.nodes['.wait-copy'].transform, 'none');
  }
  if (capture.surface === 'tv' && ['question', 'reveal'].includes(m.phase)) {
    assert.equal(m.answers.length, 4, 'TV retains all four choices in question and reveal');
    for (const a of m.answers) assert(a.x >= 0 && a.right <= m.width + 1 && a.y >= 0 && a.bottom <= m.height + 1, capture.file + ' TV choices bounds');
    const left = m.nodes['.scoreboard'], right = m.nodes['.stage'];assert.equal(right.background,'rgba(0, 0, 0, 0)');assert.equal(right.backgroundImage,'none');assert.equal(right.shadow,'none');assert.equal(right.border,'rgba(0, 0, 0, 0)');
    assert(Math.abs(left.y - right.y) < 1 && Math.abs(left.bottom - right.bottom) < 1, 'Ladder and question stage have equal outer height');
    for (const name of m.scoreNames) { assert.match(name.family, /KardiaFit,/); assert.equal(name.style, 'normal'); assert.equal(name.weight, '550'); assert.equal(name.transform, 'none'); assert(name.protected, 'Roster names are literal identities'); }
  }
}
async function capture(page, label, role, scenario) {
  if (process.env.QA_TV_ONLY === '1' && !label.includes('tv-')) return;
  for (const f of page.frames()) await f.evaluate(() => document.fonts.ready).catch(() => {});
  await sleep(260);
  const file = `${scenario}-${label}.png`, row = { file, scenario, role, surface: label.includes('tv-') ? 'tv' : 'phone', capturedAt: new Date().toISOString(), metrics: await metrics(page) };
  await page.screenshot({ path: path.join(output, file) }); row.sha256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(output, file))).digest('hex');
  report.captures.push(row); save(); if (strict && role !== 'pause') check(row); return row;
}
async function phonePair(page, stateLabel, role, scenario) { for (const [width, height] of [[320, 568], [393, 852]]) { await page.setViewportSize({ width, height }); await capture(page, `phone-${stateLabel}-${width}`, role, scenario); } }
async function tvPair(tv, stateLabel, scenario) { for (const [width, height] of [[1280, 720], [1920, 1080]]) { await tv.setViewportSize({ width, height }); await capture(tv, `tv-${stateLabel}-${height}`, 'public', scenario); } }
(async () => { try {
  await until(() => /localhost:(\d+)/.test(log), 'Launcher ready'); const origin = 'http://127.0.0.1:' + log.match(/localhost:(\d+)/)[1];
  const api = async body => { const r = await fetch(origin + '/api/manage', { method: body ? 'POST' : 'GET', headers: { Authorization: 'Bearer millionaire-round3', 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) }); const value = await r.json(); if (!r.ok) throw Error(JSON.stringify(value)); return value; };
  browser = await webkit.launch({ headless: true });
  const tvContext = await browser.newContext({ deviceScaleFactor: 2 }); await tvContext.addInitScript(() => localStorage.setItem('local-party-language', 'en')); const tv = await tvContext.newPage(); await tv.setViewportSize({ width: 1280, height: 720 }); tv.on('pageerror', e => report.errors.push({ surface: 'tv', error: e.message })); await tv.goto(origin + '/tv');
  // One roster per fresh launcher. Stopped games intentionally retain offline
  // identities, so reusing a room for 2 + 4 + 16 would test a full room of 22.
  for (const count of (process.env.QA_PLAYERS || '2').split(',').map(Number)) {
    const scenario = `${count}p`, entry = { scenario, actions: [] }; report.scenarios.push(entry); const contexts = [], phones = [];
    for (let i = 0; i < count; i++) { const context = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); contexts.push(context); await context.addInitScript(() => localStorage.setItem('local-party-language', 'en')); const p = await context.newPage(); p.on('pageerror', e => report.errors.push({ surface: scenario + '-phone' + i, error: e.message })); await p.goto(origin + '/play'); const suffix = i < 4 ? '' : ' ' + (i + 1), name = ['Alexandra LongSurname', 'Пауза', 'Maximilian Northbridge', 'Nadia Southbridge'][i % 4].slice(0, 24 - suffix.length) + suffix; await p.locator('#name').fill(name); await p.locator('#joinForm button[type=submit]').click(); try { await p.locator('#home').waitFor(); } catch (e) { entry.joinFailure = { index: i, name, body: await p.locator('body').innerText(), roster: (await api()).players }; await p.screenshot({ path: path.join(output, 'join-failure.png') }); throw e; } phones.push(p); console.log('JOIN', scenario, i + 1, name); }
    const walk = Number(process.env.QA_WALK || 0);
    await api({ type: 'settings', id: 'millionaire', settings: { seconds: '60', maxTurns: String(walk || 3) } }); await api({ type: 'launch', id: 'millionaire' });
    for (const p of phones) { await p.waitForFunction(() => document.querySelector('#gameFrame').src.includes('/games/millionaire/')); await p.waitForFunction(() => !document.querySelector('#readyButton').disabled); await p.locator('#readyButton').click(); }
    await until(async () => (await api()).active?.ui?.phase === 'playing', 'Actual first question');
    await until(() => frameOf(tv), 'TV engine');
    const activePhone = await until(async () => { for (const p of phones) { const f = frameOf(p); if (f && await f.locator('#answer').isVisible()) return p; } }, 'Human active respondent');
    const idlePhone = phones.find(p => p !== activePhone); const firstQuestion = await frameOf(activePhone).evaluate(() => ({ id: state.question.id, active: state.activePlayerId, players: state.players.map(p => ({ id: p.id, name: p.name })) })); entry.firstQuestion = firstQuestion;
    await phonePair(activePhone, 'question', 'answer', scenario); await phonePair(idlePhone, 'waiting', 'waiting', scenario); await tvPair(tv, 'question', scenario);
    if (count === 2) {
      const idBefore = await activePhone.evaluate(() => PARTY_PROFILE.id); await activePhone.reload(); await until(() => frameOf(activePhone)?.locator('#answer').isVisible(), 'Question restored after reload'); await activePhone.setViewportSize({ width: 320, height: 568 }); await capture(activePhone, 'phone-question-reload-320', 'answer', scenario);
      entry.actions.push({ action: 'actual reload', sameIdentity: idBefore === await activePhone.evaluate(() => PARTY_PROFILE.id), sameQuestion: firstQuestion.id === await frameOf(activePhone).evaluate(() => state.question.id) });
      await activePhone.locator('#pauseButton').click(); await until(async () => (await api()).active?.session?.paused, 'Pause from actual phone'); await until(() => frameOf(activePhone).evaluate(() => window.PARTY_GAME_CLOCK?.paused), 'Frame received pause'); const timer = await frameOf(activePhone).evaluate(() => Date.now()); await sleep(550); assert.equal(await frameOf(activePhone).evaluate(() => Date.now()), timer, 'Game clock paused'); await capture(activePhone, 'phone-paused-320', 'pause', scenario); await activePhone.locator('#resumeButton').click(); await until(async () => !(await api()).active?.session?.paused, 'Actual resume'); entry.actions.push('Actual pause/resume; inner game clock remained frozen');
    }
    if (count === 16) {
      const screen = frameOf(tv); entry.roster = await screen.locator('#scoreList .scoreItem').count(); assert.equal(entry.roster, 16); entry.rosterEnds = [];
      for (const [width, height] of [[1280, 720], [1920, 1080]]) {
        await tv.setViewportSize({ width, height }); await sleep(180); await screen.locator('#scoreList').evaluate(e => e.scrollTop = e.scrollHeight);
        const row = await capture(tv, `tv-roster-end-${height}`, 'public', scenario);
        const reached = await screen.locator('#scoreList .scoreItem').last().evaluate(e => { const p = e.parentElement.getBoundingClientRect(), r = e.getBoundingClientRect(); return r.top >= p.top - 1 && r.bottom <= p.bottom + 1; });
        entry.rosterEnds.push({ height, lastNameReached: reached });
        if (strict) { assert(reached, 'Last roster name reachable'); assert.deepEqual(row.metrics.inner.rosterFade, { soft: true, above: 'true', below: 'false' }, 'Only the overflowing edge fades at the roster end'); }
      }
      await screen.locator('#scoreList').evaluate(e => e.scrollTop = 0);
    }
    await activePhone.setViewportSize({ width: 320, height: 568 }); const answerId = await frameOf(activePhone).evaluate(() => state.question.id); await frameOf(activePhone).locator('#phoneAnswers button').first().click(); await until(() => frameOf(activePhone).locator('#reveal').isVisible(), 'Actual answer reveals result'); entry.actions.push({ action: 'clicked first actual answer', question: answerId });
    await phonePair(activePhone, 'reveal', 'reveal', scenario); await tvPair(tv, 'reveal', scenario);
    await until(async () => (await api()).active?.ui?.phase === 'playing', 'Automatic next real question', 10000);
    const next = await until(async () => { const value=await frameOf(tv).evaluate(() => ({ question: state.question?.id, active: state.activePlayerId, turn: state.turnsUsed }));return value.question && value.question!==answerId && value.active!==firstQuestion.active ? value : null; }, 'TV receives actual next turn',10000); assert.notEqual(next.question, answerId); assert.notEqual(next.active, firstQuestion.active); entry.actions.push({ action: 'automatic next turn', ...next });
    if (count === 2) { const nextPhone = await until(async () => { for (const p of phones) if (await frameOf(p).locator('#answer').isVisible()) return p; }, 'Next respondent'); await phonePair(nextPhone, 'next-question', 'answer', scenario); await tvPair(tv, 'next-question', scenario); }
    if (walk) {
      entry.walk = []; let longestQuestion = 0, longestChoice = 0;
      while ((await api()).active?.ui?.phase !== 'results') {
        const s = await api(); if (s.active?.ui?.phase === 'reveal') { await api({ type: 'game-action', instance: s.active.instance, action: 'next' }); await sleep(120); continue; }
        const respondent = await until(async () => { for (const p of phones) if (await frameOf(p).locator('#answer').isVisible()) return p; }, 'Real walkthrough respondent');
        await respondent.setViewportSize({ width: 320, height: 568 }); await sleep(160);
        const geometry = await metrics(respondent), q = await frameOf(respondent).evaluate(() => ({ id: state.question.id, turn: state.turnsUsed, text: document.querySelector('#phoneQuestion').textContent, choices: [...document.querySelectorAll('#phoneAnswers .txt')].map(e => e.textContent) }));
        if (entry.walk.some(item => item.id === q.id)) { await sleep(120); continue; }
        check({ file: 'real-walk-' + q.id, metrics: geometry, role: 'answer', surface: 'phone' }); entry.walk.push({ ...q, geometry });
        const choiceLength = Math.max(...q.choices.map(s => s.length));
        if (q.text.length > longestQuestion) { longestQuestion = q.text.length; await capture(respondent, `phone-long-question-${q.turn}-320`, 'answer', scenario); }
        if (choiceLength > longestChoice) { longestChoice = choiceLength; await capture(respondent, `phone-long-choice-${q.turn}-320`, 'answer', scenario); }
        await frameOf(respondent).locator('#phoneAnswers button').first().click(); await until(async () => ['reveal', 'results'].includes((await api()).active?.ui?.phase), 'Walkthrough answer accepted');
      }
      entry.walkTotal = entry.walk.length + 1; entry.longestQuestion = longestQuestion; entry.longestChoice = longestChoice;
      await phones[0].locator('#sharedMatchResults').waitFor({ state: 'visible' }); await phonePair(phones[0], 'match-finish', 'result', scenario); await tvPair(tv, 'match-finish', scenario);
    }
    await api({ type: 'stop' }); for (const c of contexts) await c.close(); await until(async () => (await api()).players.filter(p => p.connected).length === 0, 'Players left scenario'); entry.finishedAt = new Date().toISOString(); save(); console.log('PASS', scenario);
  }
  assert.deepEqual(report.errors, []);
} finally { report.finishedAt = new Date().toISOString(); report.revisionEnd = hashes(); report.changedFiles = Object.keys(report.revisionStart).filter(f => report.revisionStart[f] !== report.revisionEnd[f]); save(); fs.writeFileSync(path.join(output, 'server.log'), log); await browser?.close(); child.kill(); } })().catch(e => { report.failure = e.message; save(); console.error(e); process.exitCode = 1; });
