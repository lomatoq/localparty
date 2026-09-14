const { spawn } = require('child_process');
const fs = require('fs');
const assert = require('assert/strict');
const { chromium } = require('C:/Users/nirrt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const widths = [320, 360, 390, 430, 700, 900, 1440, 2560];

function roomFixtureSource() {
  return ` window.roomFixture=(v)=>{
    everAccepted=true;
    state.players=Array.from({length:v.count},(_,i)=>({
      id:String(i),name:'Игрок '+(i+1),
      avatar:i<3?'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="'+['#c8f58b','#a49aff','#75ddd5'][i]+'"/><text x="16" y="21" text-anchor="middle" font-size="13">'+(i+1)+'</text></svg>'):null
    }));
    state.active=v.active?{id:'taprace',instance:'fixture',ui:{phase:'playing',endsAt:Date.now()+120000,label:'До финиша'},session:{}}:null;
    renderRoom();renderHUD();
  }; init();`;
}

(async () => {
  const child = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, PARTY_PORT: '0', PARTY_EPHEMERAL: '1', PARTY_NO_BROWSER: '1' },
    windowsHide: true,
  });
  let browser;
  try {
    const port = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server did not start')), 15000);
      child.stdout.on('data', chunk => {
        const match = String(chunk).match(/localhost:(\d+)/);
        if (match) { clearTimeout(timeout); resolve(match[1]); }
      });
      child.once('exit', code => reject(new Error(`Server exited with ${code}`)));
    });
    browser = await chromium.launch({ channel: 'msedge', headless: true });

    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      await page.route('**/app.js', route => route.fulfill({
        contentType: 'text/javascript',
        body: fs.readFileSync('public/app.js', 'utf8').replace(' init();', roomFixtureSource()),
      }));
      await page.goto(`http://localhost:${port}/host`);
      await page.locator('#games .game').first().waitFor();

      for (const active of [false, true]) {
        for (const count of [2, 16]) {
          await page.evaluate(value => roomFixture(value), { active, count });
          await page.waitForTimeout(300);
          const metrics = await page.evaluate(({ active, count, width }) => {
            const box = element => {
              if (!element) return null;
              const style = getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              if (style.display === 'none' || style.visibility === 'hidden' || !rect.width || !rect.height) return null;
              return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
            };
            const intersects = (a, b) => !!a && !!b && a.left < b.right - .5 && a.right > b.left + .5 && a.top < b.bottom - .5 && a.bottom > b.top + .5;
            const roomElement = document.querySelector(active ? '#roomToggle' : '#mobileRoomStrip');
            const room = box(roomElement);
            const countElement = document.querySelector(active ? '#roomCount' : '.mobile-room-label');
            const countBox = box(countElement);
            const avatars = active
              ? [...document.querySelectorAll('#roomAvatars .room-avatar-chip')].map(box).filter(Boolean)
              : [...document.querySelectorAll('#mobileRoomStrip .mobile-room-avatar')].map(box).filter(Boolean);
            const caption = box(document.querySelector(active ? '#roomToggle .room-caption' : '#mobileRoomStrip .mobile-room-label'));
            const header = box(document.querySelector('.app-header'));
            const navControls = [...document.querySelectorAll('.app-header>nav:last-of-type>button')]
              .map(element => ({ id: element.id, box: box(element) })).filter(item => item.box);
            const navOverlaps = [];
            for (let i = 0; i < navControls.length; i++) for (let j = i + 1; j < navControls.length; j++) {
              if (intersects(navControls[i].box, navControls[j].box)) navOverlaps.push(`${navControls[i].id}/${navControls[j].id}`);
            }
            const hud = box(document.querySelector(active ? '#hudTimer' : '#catalogFilters'));
            const identity = box(document.querySelector('.app-header>.identity'));
            const majorOverlap = intersects(identity, hud) || navControls.some(item => intersects(item.box, hud));
            const contained = !room || [countBox, ...avatars].every(rect => !rect || (
              rect.left >= room.left - 1 && rect.right <= room.right + 1 && rect.top >= room.top - 1 && rect.bottom <= room.bottom + 1
            ));
            return {
              width, active, count, room, header, hud, identity, countBox, avatarCount: avatars.length,
              captionVisible: !!caption, label: roomElement?.getAttribute('aria-label') || '',
              roomCount: countElement?.textContent || '', contained, navControls, navOverlaps, majorOverlap,
              overflow: document.documentElement.scrollWidth > innerWidth,
            };
          }, { active, count, width });

          assert.equal(metrics.roomCount, String(count), JSON.stringify(metrics));
          assert(metrics.label.includes(String(count)), JSON.stringify(metrics));
          assert(!metrics.overflow, JSON.stringify(metrics));
          assert(!metrics.majorOverlap, JSON.stringify(metrics));
          assert.deepEqual(metrics.navOverlaps, [], JSON.stringify(metrics));

          if (active || width <= 850) {
            assert(metrics.room, JSON.stringify(metrics));
            assert(metrics.room.right <= width + .5, JSON.stringify(metrics));
            assert(metrics.contained, JSON.stringify(metrics));
          } else {
            assert.equal(metrics.room, null, JSON.stringify(metrics));
          }

          if (active) {
            const expectedAvatars = width <= 1000 ? 0 : width <= 1249 ? 1 : width <= 1439 ? 2 : Math.min(3, count);
            assert.equal(metrics.avatarCount, expectedAvatars, JSON.stringify(metrics));
            assert.equal(metrics.captionVisible, width >= 1440, JSON.stringify(metrics));
          }

          await page.screenshot({ path: `tests/room-count-${width}-${active ? 'active' : 'lobby'}-${count}.png` });
          if (metrics.room) {
            await page.locator(active ? '#roomToggle' : '#mobileRoomStrip').click();
            await page.locator('#roomDialog').waitFor({ state: 'visible' });
            await page.locator('#closeRoom').click();
            await page.locator('#roomDialog').waitFor({ state: 'hidden' });
          }
          console.log('PASS', JSON.stringify(metrics));
        }
      }
      await page.close();
    }
  } finally {
    await browser?.close();
    child.kill();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
