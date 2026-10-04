// Curling arena dressing ("Ice & Nerves"): the event build around the sheet so the club reads
// as a televised championship, not a room. Presentation only, static geometry merged per
// material (a handful of draw calls), canvases redrawn only when the score/end changes.
// - Dasher boards with HeyPals sponsor panels, a cap rail and tempered glass (posts, env
//   reflection, soft diagonal reflection streaks) between the walkway and the stands.
// - Roof trusses with lamp housings over the sheet.
// - Rink-side detail: LED scoreboard pylons at the house corners, team benches and broom racks
//   on the walkway, molded rubber hacks with a hack line.
import {mergeGeometries} from './vendor/utils/BufferGeometryUtils.js';

const TEAM = [
  {main: '#ff8a76', deep: '#d9564a', pale: '#ffd2c8'},
  {main: '#4fd9e8', deep: '#1597ad', pale: '#c4f6fb'}
];
const R = .43, EDGE_X = 3.35 + R, EDGE_BACK = -14.6 - R, EDGE_FRONT = 15 + R, RELEASE = 13;
const GLASS_X = 4.95, BOARD_H = .9, GLASS_H = 1.15, RUN_Z0 = -15.9, RUN_Z1 = 17.1;
const LAYER = 1;

export class CurlingArena {
  constructor(sc) {
    this.sc = sc; this.T = sc.T; this.low = !!sc.low; this.reduced = !!sc.reduced;
    const T = this.T;
    this.root = new T.Group(); this.root.name = 'curling-arena'; sc.root.add(this.root);
    this.parts = {dark: [], light: [], coral: [], teal: [], white: []};
    this.mats();
    this.buildBoards(); this.buildRoof(); this.buildPylons(); this.buildBenches(); this.buildRacks(); this.buildHacks();
    this.flush();
    this.root.traverse(o => o.layers.set(LAYER)); sc.camera.layers.enable(LAYER);
    this.pylonKey = ''; this.clock = 0;
  }
  t(x) {return this.sc.track(x);}
  mats() {
    const T = this.T, t = x => this.t(x);
    this.M = {
      dark: t(new T.MeshStandardMaterial({color: '#1d1a2a', roughness: .42, metalness: .65, envMapIntensity: .9})),
      light: t(new T.MeshStandardMaterial({color: '#d7dbe8', roughness: .28, metalness: .75, envMapIntensity: 1.1})),
      coral: t(new T.MeshStandardMaterial({color: TEAM[0].deep, roughness: .7})),
      teal: t(new T.MeshStandardMaterial({color: TEAM[1].deep, roughness: .7})),
      white: t(new T.MeshStandardMaterial({color: '#eef1f8', roughness: .45, envMapIntensity: .6})),
      glass: t(new T.MeshPhysicalMaterial({color: '#cfe6ff', roughness: .04, metalness: 0, transparent: true, opacity: .12, depthWrite: false, envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: .03, side: T.DoubleSide}))
    };
  }
  // Collect a transformed primitive into a merged per-material bucket.
  put(kind, geo, x, y, z, rx = 0, ry = 0, rz = 0) {
    const T = this.T, m = new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), new T.Vector3(1, 1, 1));
    const g = (geo.index ? geo : geo).clone(); g.applyMatrix4(m); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    this.parts[kind].push(g);
  }
  flush() {
    const T = this.T;
    for (const [kind, list] of Object.entries(this.parts)) {
      if (!list.length) continue;
      const merged = mergeGeometries(list.map(g => g.index ? g : g), false); list.forEach(g => g.dispose());
      if (!merged) continue; this.t(merged);
      const mesh = new T.Mesh(merged, this.M[kind]); mesh.castShadow = false; mesh.receiveShadow = kind !== 'dark'; this.root.add(mesh);
    }
    this.parts = null;
  }

  // ---------- dasher boards + glass ----------
  sponsorTexture() {
    const W = 4096, H = 160;
    const tex = this.sc.canvas(W, H, (c, w, h) => {
      const font = s => `italic 900 ${s}px KardiaFatRunner, HeyPalsDisplay, system-ui, sans-serif`;
      const n = 6, pw = w / n;
      for (let i = 0; i < n; i++) {
        const x = i * pw, kind = i % 6;
        c.save(); c.beginPath(); c.rect(x + 3, 0, pw - 6, h); c.clip();
        const g = c.createLinearGradient(x, 0, x, h);
        const bg = [['#6a2bd8', '#3a137e'], ['#f4f6fb', '#d9deea'], [TEAM[0].main, TEAM[0].deep], ['#141026', '#241a44'], [TEAM[1].main, TEAM[1].deep], ['#f4f6fb', '#d9deea']][kind];
        g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]); c.fillStyle = g; c.fillRect(x, 0, pw, h);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        const cx = x + pw / 2, cy = h / 2 + 4;
        if (kind === 0 || kind === 3) {
          // HeyPals wordmark with a pebble-dot mascot mark.
          c.font = font(96); c.fillStyle = '#ffffff'; c.fillText('HeyPals', cx + 30, cy);
          const mx = cx - c.measureText('HeyPals').width / 2 - 34; const rg = c.createRadialGradient(mx - 10, cy - 12, 4, mx, cy, 34); rg.addColorStop(0, '#ffd2f0'); rg.addColorStop(.6, '#ff5fae'); rg.addColorStop(1, '#a23cff'); c.fillStyle = rg; c.beginPath(); c.arc(mx, cy, 32, 0, 7); c.fill();
          if (kind === 3) {c.strokeStyle = '#ff5fae'; c.lineWidth = 6; c.beginPath(); c.moveTo(x + 20, h - 14); c.lineTo(x + pw - 20, h - 14); c.stroke();}
        } else if (kind === 1 || kind === 5) {
          c.font = font(84); c.fillStyle = '#25205a'; const a = 'ICE ', b = '& ', d = 'NERVES', wa = c.measureText(a).width, wb = c.measureText(b).width, wd = c.measureText(d).width, x0 = cx - (wa + wb + wd) / 2;
          c.textAlign = 'left'; c.fillStyle = '#2f8fd8'; c.fillText(a, x0, cy); c.fillStyle = '#ff6a55'; c.fillText(b, x0 + wa, cy); c.fillStyle = '#25205a'; c.fillText(d, x0 + wa + wb, cy);
          c.fillStyle = '#7a4ad6'; c.fillRect(x + 12, h - 12, pw - 24, 6);
        } else {
          // Team panels: big mark + diagonal speed stripes.
          const team = kind === 2 ? 0 : 1; c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 22;
          for (let k = -2; k < 9; k++) {c.beginPath(); c.moveTo(x + k * 90, h); c.lineTo(x + k * 90 + 120, 0); c.stroke();}
          c.fillStyle = '#ffffff'; c.strokeStyle = '#ffffff'; c.lineCap = 'round';
          if (team === 0) {c.lineWidth = 14; c.beginPath(); c.arc(cx, cy - 4, 46, 0, 7); c.stroke(); c.beginPath(); c.arc(cx, cy - 4, 14, 0, 7); c.fill();}
          else {c.lineWidth = 20; c.beginPath(); c.moveTo(cx - 38, cy - 42); c.lineTo(cx + 38, cy + 34); c.moveTo(cx + 38, cy - 42); c.lineTo(cx - 38, cy + 34); c.stroke();}
          c.font = font(60); c.fillText('HeyPals', cx + (team ? -1 : 1) * 330, cy); c.fillText('HeyPals', cx - (team ? -1 : 1) * 330, cy);
        }
        // Gloss and seam shading so the panels read as hard boards.
        const gl = c.createLinearGradient(0, 0, 0, h); gl.addColorStop(0, 'rgba(255,255,255,.22)'); gl.addColorStop(.35, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(0,0,0,.18)'); c.fillStyle = gl; c.fillRect(x, 0, pw, h);
        c.restore();
      }
      c.fillStyle = '#0e0b18'; for (let i = 0; i <= n; i++) c.fillRect(i * pw - 3, 0, 6, h);
    });
    tex.wrapS = this.T.RepeatWrapping; return tex;
  }
  streakTexture() {
    const tex = this.sc.canvas(512, 128, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      for (const [x, wd, a] of [[60, 70, .55], [150, 22, .4], [330, 110, .35], [420, 18, .5]]) {
        const g = c.createLinearGradient(x, 0, x + wd, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.save(); c.translate(x, 0); c.transform(1, 0, -.55, 1, 0, 0); c.fillStyle = g; c.fillRect(-x + 40, 0, wd + 60, h); c.restore();
      }
      const v = c.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(.2, 'rgba(0,0,0,1)'); v.addColorStop(.8, 'rgba(0,0,0,1)'); v.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalCompositeOperation = 'destination-in'; c.fillStyle = v; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'source-over';
    });
    tex.wrapS = this.T.RepeatWrapping; return tex;
  }
  buildBoards() {
    const T = this.T, len = RUN_Z1 - RUN_Z0, mid = (RUN_Z0 + RUN_Z1) / 2;
    const box = (w, h, d) => new T.BoxGeometry(w, h, d);
    const sponsor = this.sponsorTexture(); sponsor.repeat.set(len / 13.33, 1); // 16 m canvas on a .5 m face (keeps text proportions)
    const faceMat = this.t(new T.MeshStandardMaterial({map: sponsor, roughness: .35, metalness: 0, envMapIntensity: .5, emissive: '#ffffff', emissiveMap: sponsor, emissiveIntensity: .32}));
    const streak = this.streakTexture(); streak.repeat.set(len / 5, 1);
    const streakMat = this.t(new T.MeshBasicMaterial({map: streak, color: '#dff0ff', transparent: true, opacity: .1, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false, side: T.DoubleSide}));
    const faceGeo = new T.PlaneGeometry(len, .5), glassGeo = new T.PlaneGeometry(len, GLASS_H), streakGeo = new T.PlaneGeometry(len, GLASS_H * .9);
    const boardBody = box(.1, BOARD_H, len), cap = box(.16, .06, len), kick = box(.012, .14, len), post = box(.07, GLASS_H + .04, .07);
    for (const s of [-1, 1]) {
      this.put('white', boardBody, s * (GLASS_X + .05), BOARD_H / 2, mid);
      this.put('dark', cap, s * (GLASS_X + .04), BOARD_H + .03, mid);
      this.put('dark', kick, s * (GLASS_X - .004), .07, mid);
      for (let z = RUN_Z0; z <= RUN_Z1 + .01; z += len / 14) this.put('light', post, s * (GLASS_X + .04), BOARD_H + GLASS_H / 2 + .04, z);
      this.put('light', box(.05, .04, len), s * (GLASS_X + .04), BOARD_H + GLASS_H + .06, mid);
    }
    // Sponsor faces, glass and streaks for both sides: one merged mesh each.
    const side = (geo, x, y) => [-1, 1].map(s => {const g = geo.clone(); g.rotateY(-s * Math.PI / 2); g.translate(s * x, y, mid); return g;});
    const both = (geo, x, y, mat, order = 0) => {const m = new T.Mesh(this.sc.geo(mergeGeometries(side(geo, x, y))), mat); m.renderOrder = order; this.root.add(m); return m;};
    both(faceGeo, GLASS_X - .006, .36, faceMat);
    both(glassGeo, GLASS_X + .04, BOARD_H + .06 + GLASS_H / 2, this.M.glass, 3);
    both(streakGeo, GLASS_X + .03, BOARD_H + .06 + GLASS_H / 2, streakMat, 3);
    // End glass behind the house (above the LED board), same build.
    const endLen = (GLASS_X + .05) * 2;
    this.put('white', box(endLen, BOARD_H, .1), 0, BOARD_H / 2, RUN_Z0 - .05);
    this.put('dark', box(endLen, .06, .16), 0, BOARD_H + .03, RUN_Z0 - .04);
    const endGlass = new T.Mesh(this.sc.geo(new T.PlaneGeometry(endLen, GLASS_H)), this.M.glass); endGlass.position.set(0, BOARD_H + .06 + GLASS_H / 2, RUN_Z0 - .04); endGlass.renderOrder = 3; this.root.add(endGlass);
    for (let x = -GLASS_X; x <= GLASS_X + .01; x += GLASS_X / 2) this.put('light', post, x, BOARD_H + GLASS_H / 2 + .04, RUN_Z0 - .04);
  }

  // ---------- roof ----------
  buildRoof() {
    const T = this.T, span = 26, y0 = 8.55, y1 = 9.45;
    const chord = new T.BoxGeometry(span, .12, .12), web = new T.CylinderGeometry(.03, .03, 1, 6), lampBox = new T.BoxGeometry(1.25, .2, 3.6), side = new T.BoxGeometry(.08, .08, 48);
    for (let z = -18; z <= 22; z += 5) {
      this.put('dark', chord, 0, y0, z); this.put('dark', chord, 0, y1, z);
      for (let i = 0; i <= 13; i++) {
        const x = -span / 2 + i * 2;
        this.put('dark', web, x, (y0 + y1) / 2, z, 0, 0, 0);
        if (i < 13) {const len = Math.hypot(2, y1 - y0), a = Math.atan2(2, y1 - y0) * (i % 2 ? 1 : -1); const g = web.clone(); g.scale(1, len, 1); this.put('dark', g, x + 1, (y0 + y1) / 2, z, 0, 0, a); g.dispose();}
      }
    }
    for (const x of [-9, -3, 3, 9]) {this.put('dark', side, x, y0, 2); this.put('dark', side, x, y1, 2);}
    // Lamp housings around the existing lamp panels (the emissive faces live in scene-curling).
    for (const x of [-2.6, 2.6, -8.4, 8.4]) for (let z = -18; z <= 22; z += 8) this.put('dark', lampBox, x, 9.58, z);
  }

  // ---------- LED pylons at the house corners ----------
  buildPylons() {
    const T = this.T;
    this.pyCanvas = document.createElement('canvas'); this.pyCanvas.width = 192; this.pyCanvas.height = 768;
    this.pyTex = this.t(new T.CanvasTexture(this.pyCanvas)); this.pyTex.colorSpace = T.SRGBColorSpace; this.pyTex.anisotropy = 4;
    const screen = this.t(new T.MeshBasicMaterial({map: this.pyTex, toneMapped: false}));
    const glowTex = this.sc.canvas(64, 256, (c, w, h) => {const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);});
    this.pyGlowMat = this.t(new T.MeshBasicMaterial({map: glowTex, color: '#9b5cff', transparent: true, opacity: .7, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false}));
    const body = new T.BoxGeometry(.56, 2.5, .3), base = new T.BoxGeometry(.72, .12, .44);
    const sGeo = this.sc.geo(new T.PlaneGeometry(.46, 1.84)), gGeo = new T.PlaneGeometry(.06, 2.3), glows = [];
    this.pylons = [-1, 1].map(s => {
      const x = s * 4.42, z = EDGE_BACK + 1.15;
      this.put('dark', body, x, 1.31, z); this.put('dark', base, x, .06, z);
      const scr = new T.Mesh(sGeo, screen); scr.position.set(x, 1.38, z + .155); this.root.add(scr);
      for (const e of [-1, 1]) {const g = gGeo.clone(); g.translate(x + e * .29, 1.31, z + .16); glows.push(g);}
      return scr;
    });
    this.root.add(new T.Mesh(this.sc.geo(mergeGeometries(glows)), this.pyGlowMat));
  }
  drawPylons(s) {
    const ex = this.sc.extras, fl = ex?.flash, flashing = fl && fl.team !== null && ex.clock < fl.until;
    const teams = s.teams || [0, 0], ru = this.sc.lang() === 'ru';
    const key = [teams.join(), s.endIndex, s.endCount, flashing && fl.team, flashing && fl.points, ru].join('|');
    if (key === this.pylonKey) return; this.pylonKey = key;
    const c = this.pyCanvas.getContext('2d'), w = this.pyCanvas.width, h = this.pyCanvas.height, font = sz => `italic 900 ${sz}px KardiaFatRunner, HeyPalsDisplay, system-ui, sans-serif`;
    const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#1a1030'); bg.addColorStop(1, '#0b1626'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const mark = (team, x, y, r) => {
      const t = TEAM[team], g = c.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); g.addColorStop(0, t.pale); g.addColorStop(.6, t.main); g.addColorStop(1, t.deep);
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.strokeStyle = c.fillStyle = '#fff'; c.lineCap = 'round';
      if (team === 0) {c.lineWidth = r * .18; c.beginPath(); c.arc(x, y, r * .58, 0, 7); c.stroke(); c.beginPath(); c.arc(x, y, r * .18, 0, 7); c.fill();}
      else {c.lineWidth = r * .26; c.beginPath(); c.moveTo(x - r * .42, y - r * .42); c.lineTo(x + r * .42, y + r * .42); c.moveTo(x + r * .42, y - r * .42); c.lineTo(x - r * .42, y + r * .42); c.stroke();}
    };
    if (flashing) {
      const t = TEAM[fl.team], g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, t.main); g.addColorStop(1, t.deep); c.fillStyle = g; c.fillRect(0, 0, w, h);
      mark(fl.team, w / 2, 170, 70); c.font = font(150); c.fillStyle = '#fff'; c.fillText('+' + fl.points, w / 2, 450);
    } else {
      for (const team of [0, 1]) {const y = team ? 520 : 150; mark(team, w / 2, y - 40, 52); c.font = font(132); c.fillStyle = TEAM[team].pale; c.fillText(String(teams[team]), w / 2, y + 90);}
      c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(24, h / 2 + 8, w - 48, 3);
      c.font = font(30); c.fillStyle = '#efe9ff'; c.fillText((ru ? 'ЭНД ' : 'END ') + (s.endIndex || 1) + '/' + (s.endCount || 1), w / 2, h / 2 - 16);
    }
    c.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < h; y += 4) c.fillRect(0, y, w, 1);
    this.pyTex.needsUpdate = true;
  }

  // ---------- benches + broom racks + hacks ----------
  buildBenches() {
    // Low team benches on the walkway by the delivery end: dark frame, padded team cushion.
    const T = this.T, seat = new T.CapsuleGeometry(.11, 2.1, 4, 8), back = new T.CapsuleGeometry(.07, 2.1, 4, 8), rail = new T.BoxGeometry(.06, .06, 2.3), leg = new T.BoxGeometry(.05, .36, .05);
    seat.rotateX(Math.PI / 2); seat.scale(1.6, .55, 1); back.rotateX(Math.PI / 2); back.scale(.7, 1.5, 1);
    for (const s of [-1, 1]) {
      const x = s * 4.55, z = 10.6, kind = s < 0 ? 'coral' : 'teal';
      this.put(kind, seat, x, .42, z); this.put(kind, back, x + s * .17, .66, z);
      this.put('dark', rail, x, .34, z); this.put('dark', rail, x + s * .17, .5, z);
      for (const dz of [-1.05, 1.05]) for (const dx of [-.14, .14]) this.put('dark', leg, x + dx, .18, z + dz);
    }
  }
  buildRacks() {
    const T = this.T, post = new T.BoxGeometry(.05, 1.15, .05), bar = new T.BoxGeometry(.05, .05, 1.3), handle = new T.CylinderGeometry(.018, .018, 1.38, 8), pad = new T.CapsuleGeometry(.05, .32, 4, 8);
    for (const s of [-1, 1]) {
      const x = s * 4.62, z = -11.4, kind = s < 0 ? 'coral' : 'teal';
      for (const dz of [-.62, .62]) this.put('dark', post, x, .575, z + dz);
      this.put('dark', bar, x, 1.12, z); this.put('dark', bar, x, .3, z);
      for (let i = 0; i < 4; i++) {
        const bz = z - .45 + i * .3, lean = s * .1;
        this.put('light', handle, x - s * .05, .86, bz, 0, 0, lean);
        this.put(kind, pad, x - s * .12, .1, bz, Math.PI / 2, 0, 0);
      }
    }
  }
  buildHacks() {
    // Molded rubber hacks with a white hack line, at the delivery end behind the release mark.
    const T = this.T, hack = new T.CapsuleGeometry(.07, .12, 4, 10);
    hack.rotateX(Math.PI / 2); hack.scale(1.2, .45, 1);
    for (const x of [-.22, .22]) this.put('dark', hack, x, .03, RELEASE + 1.35);
    this.put('white', new T.BoxGeometry(EDGE_X * 2, .006, .05), 0, .003, RELEASE + 1.35);
  }

  update(s, dt) {
    this.clock += dt;
    this.drawPylons(s);
    const ex = this.sc.extras, fl = ex?.flash, flashing = fl && fl.team !== null && ex.clock < fl.until;
    this.pyGlowMat.color.set(flashing ? TEAM[fl.team].main : '#9b5cff');
    this.pyGlowMat.opacity = this.reduced ? .7 : .55 + .2 * Math.sin(this.clock * (flashing ? 8 : 1.4));
  }
  dispose() {this.root.parent?.remove(this.root);}
}
