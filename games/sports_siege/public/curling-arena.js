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
    this.parts = {};
    this.mats();
    this.buildBoards(); this.buildRoof(); this.buildEndWall(); this.buildPylons(); this.buildBenches(); this.buildRacks(); this.buildHacks();
    this.flush();
    this.root.traverse(o => o.layers.set(LAYER)); sc.camera.layers.enable(LAYER);
    this.pylonKey = ''; this.clock = 0;
  }
  t(x) {return this.sc.track(x);}
  mats() {
    const T = this.T, t = x => this.t(x);
    this.M = {
      // Gunmetal powder-coat for structure, polished aluminium/chrome trim, vinyl team cushions,
      // polished HDPE dasher boards, matte rubber, and an unlit diffuser for lamp faces.
      dark: t(new T.MeshPhysicalMaterial({color: '#2a2640', roughness: .34, metalness: .72, clearcoat: .45, clearcoatRoughness: .2, envMapIntensity: 1})),
      light: t(new T.MeshPhysicalMaterial({color: '#e4e8f3', roughness: .16, metalness: .92, clearcoat: .3, envMapIntensity: 1.35})),
      coral: t(new T.MeshPhysicalMaterial({color: TEAM[0].deep, roughness: .5, clearcoat: .55, clearcoatRoughness: .25, sheen: .6, sheenColor: new T.Color(TEAM[0].pale), sheenRoughness: .5})),
      teal: t(new T.MeshPhysicalMaterial({color: TEAM[1].deep, roughness: .5, clearcoat: .55, clearcoatRoughness: .25, sheen: .6, sheenColor: new T.Color(TEAM[1].pale), sheenRoughness: .5})),
      white: t(new T.MeshPhysicalMaterial({color: '#f0f2f8', roughness: .3, clearcoat: .7, clearcoatRoughness: .12, envMapIntensity: .8})),
      rubber: t(new T.MeshStandardMaterial({color: '#15121d', roughness: .82, metalness: 0})),
      glow: t(new T.MeshBasicMaterial({color: '#fff1dc', toneMapped: false})),
      glass: t(new T.MeshPhysicalMaterial({color: '#cfe6ff', roughness: .04, metalness: 0, transparent: true, opacity: .12, depthWrite: false, envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: .03, side: T.DoubleSide}))
    };
  }
  // ---------- modelled primitives (rounded sections + bevels; merged per material) ----------
  rr(w, h, r) {
    const T = this.T, s = new T.Shape(), x = -w / 2, y = -h / 2; r = Math.min(r, w / 2, h / 2);
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  }
  // Rounded cross-section (w x h) swept along `len`; axis 'z' (default), 'x' or 'y'.
  bar(w, h, r, len, axis = 'z') {
    const g = new this.T.ExtrudeGeometry(this.rr(w, h, r), {depth: len, bevelEnabled: false, curveSegments: 4}); g.translate(0, 0, -len / 2);
    if (axis === 'x') g.rotateY(Math.PI / 2); else if (axis === 'y') g.rotateX(Math.PI / 2); return g;
  }
  // Box with rounded vertical edges and bevelled top/bottom edges (w x h x d).
  slab(w, h, d, r = .03, b = .015) {
    b = Math.min(b, w / 4, h / 4, d / 4);
    const g = new this.T.ExtrudeGeometry(this.rr(w - 2 * b, d - 2 * b, r), {depth: h - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 5});
    g.translate(0, 0, -(h - 2 * b) / 2); g.rotateX(-Math.PI / 2); return g;
  }
  tube(r, len, axis = 'y', seg = 12) {
    const g = new this.T.CylinderGeometry(r, r, len, seg, 1); if (axis === 'x') g.rotateZ(Math.PI / 2); else if (axis === 'z') g.rotateX(Math.PI / 2); return g;
  }
  // Collect a transformed primitive into a merged per-material bucket (non-indexed so extrusions merge).
  put(kind, geo, x, y, z, rx = 0, ry = 0, rz = 0) {
    const T = this.T, m = new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), new T.Vector3(1, 1, 1));
    const g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(m); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    (this.parts[kind] ||= []).push(g);
  }
  flush() {
    const T = this.T;
    for (const [kind, list] of Object.entries(this.parts)) {
      if (!list.length) continue;
      const merged = mergeGeometries(list, false); list.forEach(g => g.dispose());
      if (!merged) continue; this.t(merged);
      const mesh = new T.Mesh(merged, this.M[kind]); mesh.castShadow = false; mesh.receiveShadow = kind === 'white' || kind === 'coral' || kind === 'teal'; this.root.add(mesh);
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
    // Polished board with rounded section, a bull-nosed gunmetal cap, a rubber kick strip,
    // rounded glass stanchions with clamp blocks and chrome finials, and a round top rail.
    const boardBody = this.bar(.1, BOARD_H, .03, len), cap = this.bar(.17, .07, .032, len), kick = this.bar(.02, .15, .008, len);
    const post = this.bar(.07, .07, .022, GLASS_H + .04, 'y'), clamp = this.slab(.11, .07, .11, .02, .012), finial = new T.SphereGeometry(.045, 12, 8), rail = this.tube(.028, len, 'z', 14);
    for (const s of [-1, 1]) {
      this.put('white', boardBody, s * (GLASS_X + .05), BOARD_H / 2, mid);
      this.put('dark', cap, s * (GLASS_X + .045), BOARD_H + .035, mid);
      this.put('rubber', kick, s * (GLASS_X - .002), .075, mid);
      for (let z = RUN_Z0; z <= RUN_Z1 + .01; z += len / 14) {
        const px = s * (GLASS_X + .04), py = BOARD_H + GLASS_H / 2 + .06;
        this.put('dark', post, px, py, z); this.put('light', clamp, px, BOARD_H + .12, z); this.put('light', clamp, px, BOARD_H + GLASS_H - .05, z); this.put('light', finial, px, BOARD_H + GLASS_H + .1, z);
      }
      this.put('light', rail, s * (GLASS_X + .04), BOARD_H + GLASS_H + .08, mid);
    }
    // Sponsor faces, glass and streaks for both sides: one merged mesh each.
    const side = (geo, x, y) => [-1, 1].map(s => {const g = geo.clone(); g.rotateY(-s * Math.PI / 2); g.translate(s * x, y, mid); return g;});
    const both = (geo, x, y, mat, order = 0) => {const m = new T.Mesh(this.sc.geo(mergeGeometries(side(geo, x, y))), mat); m.renderOrder = order; this.root.add(m); return m;};
    both(faceGeo, GLASS_X - .006, .36, faceMat);
    both(glassGeo, GLASS_X + .04, BOARD_H + .06 + GLASS_H / 2, this.M.glass, 3);
    both(streakGeo, GLASS_X + .03, BOARD_H + .06 + GLASS_H / 2, streakMat, 3);
    // End glass behind the house (above the LED board), same build.
    const endLen = (GLASS_X + .05) * 2;
    this.put('white', this.bar(.1, BOARD_H, .03, endLen, 'x'), 0, BOARD_H / 2, RUN_Z0 - .05);
    this.put('dark', this.bar(.17, .07, .032, endLen, 'x'), 0, BOARD_H + .035, RUN_Z0 - .04);
    const endGlass = new T.Mesh(this.sc.geo(new T.PlaneGeometry(endLen, GLASS_H)), this.M.glass); endGlass.position.set(0, BOARD_H + .06 + GLASS_H / 2, RUN_Z0 - .04); endGlass.renderOrder = 3; this.root.add(endGlass);
    for (let x = -GLASS_X; x <= GLASS_X + .01; x += GLASS_X / 2) {this.put('dark', post, x, BOARD_H + GLASS_H / 2 + .06, RUN_Z0 - .04); this.put('light', finial, x, BOARD_H + GLASS_H + .1, RUN_Z0 - .04);}
    this.put('light', this.tube(.028, endLen, 'x', 14), 0, BOARD_H + GLASS_H + .08, RUN_Z0 - .04);
  }

  // ---------- roof ----------
  buildRoof() {
    // Triangular tube trusses (two top chords, one bottom chord, zig-zag webs), bevelled lamp
    // housings around the ceiling panels, and par-can spots on every truss (lit lenses).
    const T = this.T, span = 26, yb = 8.5, yt = 9.35, dz = .45;
    const chord = this.tube(.055, span, 'x', 10), web = this.tube(.024, 1, 'y', 6);
    const housing = this.slab(1.34, .2, 3.74, .08, .04), can = this.tube(.15, .34, 'y', 16), canRim = new T.TorusGeometry(.15, .022, 6, 16), lens = new T.CircleGeometry(.12, 16), yoke = this.bar(.36, .04, .015, .04, 'z');
    for (let z = -18; z <= 22; z += 5) {
      this.put('dark', chord, 0, yb, z); this.put('dark', chord, 0, yt, z - dz); this.put('dark', chord, 0, yt, z + dz);
      for (let i = 0; i < 13; i++) {
        const x = -span / 2 + i * 2 + 1, dy = yt - yb;
        for (const o of [-dz, dz]) {const len = Math.hypot(2, dy, dz), g = web.clone(); g.scale(1, len, 1); const a = Math.atan2(2, dy) * (i % 2 ? 1 : -1), b = Math.atan2(o, dy); this.put('dark', g, x, (yb + yt) / 2, z + o / 2, b, 0, a); g.dispose();}
      }
      for (const x of [-6.2, 6.2]) {
        const tilt = x < 0 ? .5 : -.5;
        this.put('dark', yoke, x, yb - .07, z); this.put('dark', can, x, yb - .3, z, 0, 0, tilt); this.put('light', canRim, x + Math.sin(tilt) * .17, yb - .3 - Math.cos(tilt) * .17, z, Math.PI / 2, 0, tilt);
        this.put('glow', lens, x + Math.sin(tilt) * .175, yb - .3 - Math.cos(tilt) * .175, z, Math.PI / 2, 0, tilt);
      }
    }
    for (const x of [-9, -3, 3, 9]) this.put('dark', this.tube(.04, 48, 'z', 8), x, yt, 2);
    for (const x of [-2.6, 2.6, -8.4, 8.4]) for (let z = -18; z <= 22; z += 8) this.put('dark', housing, x, 9.58, z);
  }

  // ---------- far end: jumbotron + acoustic wall ----------
  buildEndWall() {
    // The end wall behind the house is in every chase shot: a bevelled jumbotron with the event
    // wordmark replaces the flat graphic, framed by vertical acoustic slats and team light columns.
    const T = this.T, W = 2048, H = 560, can = document.createElement('canvas'); can.width = W; can.height = H;
    const tex = this.t(new T.CanvasTexture(can)); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
    const paint = img => {
      const c = can.getContext('2d'), g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#2a1250'); g.addColorStop(.5, '#170d33'); g.addColorStop(1, '#0d2440'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      const rg = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * .45); rg.addColorStop(0, 'rgba(155,92,255,.45)'); rg.addColorStop(1, 'rgba(155,92,255,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 3; for (let x = -H; x < W; x += 70) {c.beginPath(); c.moveTo(x, H); c.lineTo(x + H, 0); c.stroke();}
      if (img?.naturalWidth) {const h = H * .82, w = h * img.naturalWidth / img.naturalHeight; c.drawImage(img, W / 2 - w / 2, H / 2 - h / 2, w, h);}
      else {c.font = 'italic 900 150px KardiaFatRunner, HeyPalsDisplay, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#eaf6ff'; c.fillText('ICE & NERVES', W / 2, H / 2);}
      for (const [x, t] of [[190, 0], [W - 190, 1]]) {const col = TEAM[t], gg = c.createRadialGradient(x - 30, H / 2 - 30, 10, x, H / 2, 110); gg.addColorStop(0, col.pale); gg.addColorStop(.6, col.main); gg.addColorStop(1, col.deep); c.fillStyle = gg; c.beginPath(); c.arc(x, H / 2, 110, 0, 7); c.fill();
        c.strokeStyle = c.fillStyle = '#fff'; c.lineCap = 'round'; if (!t) {c.lineWidth = 20; c.beginPath(); c.arc(x, H / 2, 64, 0, 7); c.stroke(); c.beginPath(); c.arc(x, H / 2, 20, 0, 7); c.fill();} else {c.lineWidth = 28; c.beginPath(); c.moveTo(x - 46, H / 2 - 46); c.lineTo(x + 46, H / 2 + 46); c.moveTo(x + 46, H / 2 - 46); c.lineTo(x - 46, H / 2 + 46); c.stroke();}}
      c.fillStyle = 'rgba(0,0,0,.2)'; for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1);
      tex.needsUpdate = true;
    };
    paint(null); const img = new Image(); img.decoding = 'async'; img.onload = () => {if (this.parts !== undefined) paint(img);}; img.src = '/assets/game-logos-v1/logos/curling.png';
    const sw = 10.2, sh = sw * H / W;
    this.put('dark', this.slab(sw + .5, sh + .5, .3, .12, .05), 0, 5.1, -20.55);
    const screen = new T.Mesh(this.sc.geo(new T.PlaneGeometry(sw, sh)), this.t(new T.MeshBasicMaterial({map: tex, toneMapped: false, color: '#e4defa'}))); screen.position.set(0, 5.1, -20.39); this.root.add(screen);
    this.put('glow', this.slab(sw + .2, .05, .08, .02, .01), 0, 5.1 - sh / 2 - .2, -20.38);
    // Acoustic slats across the end wall above and around the jumbotron; team light columns at the corners.
    const slat = this.slab(.14, 9.2, .2, .03, .012);
    for (let x = -12.6; x <= 12.61; x += .45) if (Math.abs(x) > sw / 2 + .4) this.put('dark', slat, x, 4.9, -20.7);
    const col = this.slab(.12, 7.5, .12, .05, .02);
    this.put('coral', col, -sw / 2 - .55, 4.6, -20.6); this.put('teal', col, sw / 2 + .55, 4.6, -20.6);
  }

  // ---------- LED pylons at the house corners ----------
  buildPylons() {
    const T = this.T;
    this.pyCanvas = document.createElement('canvas'); this.pyCanvas.width = 192; this.pyCanvas.height = 768;
    this.pyTex = this.t(new T.CanvasTexture(this.pyCanvas)); this.pyTex.colorSpace = T.SRGBColorSpace; this.pyTex.anisotropy = 4;
    const screen = this.t(new T.MeshBasicMaterial({map: this.pyTex, toneMapped: false}));
    const glowTex = this.sc.canvas(64, 256, (c, w, h) => {const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);});
    this.pyGlowMat = this.t(new T.MeshBasicMaterial({map: glowTex, color: '#9b5cff', transparent: true, opacity: .7, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false}));
    const body = this.slab(.56, 2.5, .3, .07, .025), base = this.slab(.76, .14, .48, .05, .03), crown = this.slab(.5, .05, .24, .04, .015), bezel = this.slab(.5, 1.9, .03, .03, .008);
    const sGeo = this.sc.geo(new T.PlaneGeometry(.46, 1.84)), gGeo = new T.PlaneGeometry(.06, 2.3), glows = [];
    this.pylons = [-1, 1].map(s => {
      const x = s * 4.42, z = EDGE_BACK + 1.15;
      this.put('dark', body, x, 1.39, z); this.put('light', base, x, .07, z); this.put('glow', crown, x, 2.66, z); this.put('rubber', bezel, x, 1.38, z + .14);
      const scr = new T.Mesh(sGeo, screen); scr.position.set(x, 1.38, z + .164); this.root.add(scr);
      for (const e of [-1, 1]) {const g = gGeo.clone(); g.translate(x + e * .29, 1.39, z + .165); glows.push(g);}
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
    // Team benches on the walkway: aluminium tube frame with feet, padded vinyl seat and backrest.
    const T = this.T, seat = this.slab(.46, .11, 2.3, .05, .035), back = this.slab(.08, .44, 2.3, .03, .03);
    const leg = this.tube(.022, .4), foot = this.bar(.5, .03, .012, .06, 'x'), rail = this.tube(.02, 2.3, 'z'), upright = this.tube(.018, .46);
    for (const s of [-1, 1]) {
      const x = s * 4.55, z = 10.6, kind = s < 0 ? 'coral' : 'teal';
      this.put(kind, seat, x, .44, z); this.put(kind, back, x + s * .19, .72, z, 0, 0, -s * .1);
      this.put('light', rail, x - s * .14, .37, z); this.put('light', rail, x + s * .16, .37, z);
      for (const dz of [-1.05, 1.05]) {
        for (const dx of [-.16, .16]) this.put('light', leg, x + dx, .19, z + dz);
        this.put('dark', foot, x, .015, z + dz); this.put('light', upright, x + s * .19, .66, z + dz, 0, 0, -s * .1);
      }
    }
  }
  buildRacks() {
    // Broom racks by the house end: bevelled base plate, tube uprights and hook bar, four team brooms
    // (carbon handle, chrome ferrule, padded head with a dark brush face).
    const T = this.T, plate = this.slab(.42, .04, 1.45, .05, .015), up = this.tube(.02, 1.15), bar = this.tube(.018, 1.3, 'z');
    const handle = this.tube(.017, 1.32, 'y', 10), ferrule = this.tube(.024, .06, 'y', 10), head = this.slab(.44, .055, .13, .04, .018), brush = this.slab(.42, .03, .12, .03, .01);
    for (const s of [-1, 1]) {
      const x = s * 4.6, z = -11.4, kind = s < 0 ? 'coral' : 'teal';
      this.put('dark', plate, x, .02, z);
      for (const dz of [-.62, .62]) this.put('light', up, x + s * .12, .6, z + dz);
      this.put('light', bar, x + s * .12, 1.14, z); this.put('light', bar, x + s * .12, .32, z);
      for (let i = 0; i < 4; i++) {
        const bz = z - .45 + i * .3, lean = -s * .09, hx = x + s * .04;
        this.put('dark', handle, hx, .86, bz, 0, 0, lean); this.put('light', ferrule, hx - Math.sin(lean) * -.64, .2, bz, 0, 0, lean);
        this.put(kind, head, x - s * .02, .085, bz); this.put('rubber', brush, x - s * .02, .045, bz);
      }
    }
  }
  buildHacks() {
    // Molded rubber hacks on chrome base plates (toe cup bevelled), with a painted hack line.
    const T = this.T, block = this.slab(.17, .075, .26, .06, .025), toe = this.slab(.15, .03, .1, .04, .012), plate = this.slab(.21, .012, .33, .04, .005);
    for (const x of [-.22, .22]) {
      this.put('light', plate, x, .006, RELEASE + 1.37); this.put('rubber', block, x, .05, RELEASE + 1.4, -.18, 0, 0); this.put('rubber', toe, x, .095, RELEASE + 1.27);
    }
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
