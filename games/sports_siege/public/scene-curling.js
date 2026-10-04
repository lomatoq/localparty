import {SpectatorCrowd} from './spectator-crowd.js';
import {CurlingExtras} from './curling-extras.js';
import {CurlingIce} from './curling-ice.js';
import {CurlingArena} from './curling-arena.js';
import {CurlingFeel} from './curling-feel.js';
// Curling host scene: stylised indoor club, sheet markings that match the
// authoritative server geometry, snapshot-interpolated stones, framing cameras,
// sweep/contact/out/score feedback. Rendering only: the server owns every
// position, validity decision and score. Loaded by host.js for mode=curling.

// Server geometry (games/sports_siege/curling.js, rules.js, match.js).
const R = .43;                    // stone radius
const OUT_X = 3.35, OUT_BACK = -14.6, OUT_FRONT = 15; // centre limits -> valid=false
const EDGE_X = OUT_X + R, EDGE_BACK = OUT_BACK - R, EDGE_FRONT = OUT_FRONT + R; // a stone edge touching the board is out
const HOG = 0, RELEASE = 13;
const DEFAULT_HOUSE = {x: 0, z: -9, r: 2.6};
const FRICTION = .46;             // m/s^2, for camera look-ahead only
const DELAY = .1;                 // interpolation delay behind the newest snapshot (s)
const TEAM = [
  {main: '#ff8a76', deep: '#d9564a', pale: '#ffd2c8'},  // 0 · Коралловые · mark: ring
  {main: '#4fd9e8', deep: '#1597ad', pale: '#c4f6fb'}   // 1 · Бирюзовые · mark: cross
];
const smooth = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const rand = seed => {const n = Math.sin(seed * 12.9898 + 78.233) * 43758.5453; return n - Math.floor(n);};

// Ice sound: granite rumble that follows the stone's speed (with a soft beat per turn of
// the stone), brush strokes while the team sweeps, and a clack on contact. Procedural Web
// Audio on the TV shell's window (it owns the user gesture), silent unless the shared
// HeyPals audio is unlocked and not muted; level follows its effects volume.
class IceAudio {
  host() {try {return window.parent !== window && window.parent.HeyPalsAudio ? window.parent : window;} catch {return window;}}
  level() {
    const h = this.host(), a = h.HeyPalsAudio; if (!a) return 0;
    const st = a.status?.(), pr = a.preferences?.(); if (!st?.unlocked || pr?.muted || h.document.hidden) return 0;
    return Math.max(0, Math.min(1, pr?.sfxVolume ?? .55));
  }
  ensure() {
    if (this.ctx || this.failed) return this.ctx;
    try {
      const h = this.host(), C = h.AudioContext || h.webkitAudioContext, ctx = this.ctx = new C(), n = ctx.sampleRate * 2, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
      let b = 0; for (let i = 0; i < n; i++) {b = .97 * b + .03 * (Math.random() * 2 - 1); d[i] = b * 6;} // brown-ish noise
      const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
      this.master = ctx.createGain(); this.master.gain.value = 0; this.master.connect(ctx.destination);
      this.low = ctx.createBiquadFilter(); this.low.type = 'lowpass'; this.low.frequency.value = 220; this.glide = ctx.createGain(); this.glide.gain.value = 0;
      noise.connect(this.low); this.low.connect(this.glide); this.glide.connect(this.master);
      const white = ctx.createBufferSource(), wb = ctx.createBuffer(1, n, ctx.sampleRate), wd = wb.getChannelData(0); for (let i = 0; i < n; i++) wd[i] = Math.random() * 2 - 1; white.buffer = wb; white.loop = true;
      this.band = ctx.createBiquadFilter(); this.band.type = 'bandpass'; this.band.frequency.value = 2600; this.band.Q.value = .9; this.brush = ctx.createGain(); this.brush.gain.value = 0;
      white.connect(this.band); this.band.connect(this.brush); this.brush.connect(this.master);
      noise.start(); white.start(); ctx.resume?.().catch(() => {});
    } catch {this.failed = true; this.ctx = null;}
    return this.ctx;
  }
  update(speed, spin, sweep) {
    const level = this.level();
    if (!level && !this.ctx) return;
    if (level && (speed > .05 || sweep) && !this.ensure()) return;
    if (!this.ctx) return;
    const t = this.ctx.currentTime, k = Math.min(1, speed / 3), beat = .82 + .18 * Math.sin(spin * 2);
    this.master.gain.setTargetAtTime(level * .9, t, .05);
    this.glide.gain.setTargetAtTime(speed > .05 ? (.05 + .22 * k) * beat : 0, t, .06);
    this.low.frequency.setTargetAtTime(160 + 260 * k, t, .1);
    this.brush.gain.setTargetAtTime(sweep ? .05 + .09 * sweep : 0, t, .02);
  }
  clack(power) {
    if (!this.level() || !this.ensure()) return; const ctx = this.ctx, t = ctx.currentTime;
    for (const [f, g] of [[1180, .16], [2350, .07]]) {const o = ctx.createOscillator(), a = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .82, t + .12); a.gain.setValueAtTime(g * (.4 + .6 * power), t); a.gain.exponentialRampToValueAtTime(.0005, t + .16); o.connect(a); a.connect(this.master); o.start(t); o.stop(t + .18);}
  }
  dispose() {try {this.ctx?.close();} catch {} this.ctx = null;}
}

export class CurlingScene {
  constructor(stage, THREE, {reduced = false} = {}) {
    this.stage = stage; this.T = THREE; this.reduced = reduced;
    this.scene = stage.scene; this.camera = stage.camera; this.renderer = stage.renderer;
    this.low = !!stage.software;
    this.disposables = new Set(); this.root = new THREE.Group(); this.root.name = 'curling-club'; this.scene.add(this.root);
    this.house = {...DEFAULT_HOUSE};
    this.snaps = []; this.renderT = null; this.stones = new Map(); this.fading = []; this.contactAt = {};
    this.pendingContacts = []; this.sweepLabels = []; this.trail = null; this.trailPoints = []; this.trailFor = null; this.lastStage = null; this.highlightKey = '';
    this.v1 = new THREE.Vector3(); this.v2 = new THREE.Vector3(); this.q = new THREE.Quaternion();
    this.camPos = new THREE.Vector3(0, 6, 30); this.camLook = new THREE.Vector3(0, 0, -4); this.cameraReady = false;
    this.fitCam = new THREE.PerspectiveCamera(30, 1, .1, 200);
    this.setupLook(); this.textures(); this.materials(); this.buildRoom(); this.buildSheet(); this.buildStoneParts(); this.buildRack();
    this.buildFeedback(); this.buildCrowd(); this.buildInset(); this.audio = new IceAudio();
    this.extras = new CurlingExtras(this); // arena life layer (curling-extras.js)
    this.ice = new CurlingIce(this); this.arena = new CurlingArena(this); this.feel = new CurlingFeel(this); // ice surface, event build, game feel
    this.clock = 0; this.diagFrame = 0;
    window.__ssCurlingDiag = () => ({crowd:this.crowd.diagnostics(), calls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles, geometries: this.renderer.info.memory.geometries, textures: this.renderer.info.memory.textures, brooms: this.brooms.filter(b=>b.visible).map(b=>{b.updateMatrixWorld(true);const lower=b.userData.lower.clone().applyMatrix4(b.matrixWorld),joint=b.userData.handle.localToWorld(new this.T.Vector3(0,-b.userData.lower.distanceTo(b.userData.upper)/2,0));return {jointGap:lower.distanceTo(joint),corners:[[-.45,.01,-.18],[.45,.16,.18],[0,1.58,.72]].map(p=>{const v=new this.T.Vector3(...p).applyMatrix4(b.matrixWorld).project(this.camera);return {x:(v.x*.5+.5)*this.renderer.domElement.clientWidth,y:(-v.y*.5+.5)*this.renderer.domElement.clientHeight};})};}), frostCount:this.frostGlints.count, feel:this.feel?.diagnostics(), ice:this.ice?.diagnostics(), presentationBounds:this.presentationBounds, stones: this.stones.size, contacts: this.contactCount || 0, particles: this.dust.count, glows: this.glows.map(g => ({v: g.visible, o: +g.material.opacity.toFixed(2), y: g.position.y, s: +g.scale.x.toFixed(2), inScene: !!g.parent})), measure: {v: this.measure.visible, o: this.measure.material.opacity, s: +this.measure.scale.x.toFixed(2), r: this.measureRadius}, inset: +(this.insetOpacity || 0).toFixed(2)});
    this.onHide = () => this.dispose(); window.addEventListener('pagehide', this.onHide, {once: true});
  }

  // ---------- resources ----------
  track(x) {this.disposables.add(x); return x;}
  canvas(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = this.track(new this.T.CanvasTexture(c)); t.colorSpace = this.T.SRGBColorSpace; t.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy()); return t;
  }
  setupLook() {
    const T = this.T;
    // Stage() lit every mode the same way; the club brings its own lighting rig.
    for (const child of [...this.scene.children]) if (child.isLight) child.visible = false;
    this.scene.background = new T.Color('#130e1c'); this.scene.fog = new T.Fog('#130e1c', 46, 120);
    // Ice is a near-white surface under ACES: exposure and fill sit lower than the other
    // modes so the sheet keeps its pebble, markings and reflections instead of clipping.
    this.renderer.toneMappingExposure = .94;
    const hemi = new T.HemisphereLight('#dbe8ff', '#3a2340', .9); this.root.add(hemi);
    const key = new T.DirectionalLight('#fff3e4', 2.1); key.position.set(-5, 20, 6); key.target.position.set(0, 0, -3);
    key.castShadow = !this.low; key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, {left: -8, right: 8, top: 20, bottom: -20, near: 2, far: 50}); key.shadow.bias = -.0002; key.shadow.normalBias = .02;
    this.root.add(key, key.target);
    const fill = new T.DirectionalLight('#a9d4ff', .55); fill.position.set(9, 7, -14); this.root.add(fill);
    // Low cool back light from the house end: crisp rim highlights on granite and handles.
    const rim = new T.DirectionalLight('#d6ecff', 1.1); rim.position.set(-2, 3.2, -24); rim.target.position.set(0, 0, 0); this.root.add(rim, rim.target);
    // Warm club light on the stands; a soft cool spot keeps the far house crisp without glare.
    for (const x of [-8.5, 8.5]) {const warm = new T.PointLight('#ffb36e', 20, 22, 1.6); warm.position.set(x, 5.2, 0); this.root.add(warm);}
    const spot = new T.SpotLight('#eef6ff', 30, 16, .46, 1, 1.4); spot.position.set(0, 8.6, -6.4); spot.target.position.set(0, 0, -9.2); this.root.add(spot, spot.target);
    // Small procedural environment for glossy ice/granite reflections (light strips + plum walls).
    const env = new T.Scene(); env.background = new T.Color('#1b1426');
    const box = new T.Mesh(new T.BoxGeometry(40, 14, 70), new T.MeshBasicMaterial({color: '#221a30', side: T.BackSide})); env.add(box);
    const strip = new T.MeshBasicMaterial({color: '#fff1dc'}), pink = new T.MeshBasicMaterial({color: '#c157ff'}), warm = new T.MeshBasicMaterial({color: '#ff9f61'});
    for (const x of [-3, 3]) for (let z = -30; z <= 30; z += 8) {const m = new T.Mesh(new T.BoxGeometry(1.2, .1, 5), strip); m.position.set(x, 6.8, z); env.add(m);}
    for (const x of [-19.8, 19.8]) {const m = new T.Mesh(new T.BoxGeometry(.2, .5, 60), pink); m.position.set(x, 4, 0); env.add(m); const w = new T.Mesh(new T.BoxGeometry(.2, 2.5, 60), warm); w.position.set(x, 1.2, 0); env.add(w);}
    const pmrem = new T.PMREMGenerator(this.renderer); this.envTexture = this.track(pmrem.fromScene(env, .04).texture); pmrem.dispose();
    env.traverse(o => {o.geometry?.dispose(); o.material?.dispose();});
    this.scene.environment = this.envTexture;
  }
  textures() {
    // Tiled pebble + hairline scratches. Low contrast: texture, never noise over the rings.
    this.iceTex = this.canvas(512, 512, (c, w, h) => {
      c.fillStyle = '#f4f8fa'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 5200; i++) {const x = rand(i) * w, y = rand(i + 7e3) * h, r = .5 + rand(i + 3e3) * 1.4; c.fillStyle = rand(i + 9e3) > .5 ? 'rgba(255,255,255,.55)' : 'rgba(150,176,194,.10)'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();}
      c.lineCap = 'round';
      for (let i = 0; i < 46; i++) {
        const x = rand(i + 11) * w, y = rand(i + 23) * h, len = 40 + rand(i + 37) * 260, a = Math.PI / 2 + (rand(i + 41) - .5) * .5;
        c.strokeStyle = `rgba(${rand(i) > .4 ? '140,165,182' : '255,255,255'},${.05 + rand(i + 5) * .09})`; c.lineWidth = .6 + rand(i + 3) * .9;
        c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * len * .5 + (rand(i + 8) - .5) * 30, y + Math.sin(a) * len * .5, x + Math.cos(a) * len, y + Math.sin(a) * len); c.stroke();
      }
    });
    this.iceTex.wrapS = this.iceTex.wrapT = this.T.RepeatWrapping; this.iceTex.repeat.set(2, 8);
    // Generated HeyPals ice (assets/ice-pebble.seamless.png) replaces the canvas pebble once decoded; the canvas stays as fallback.
    { const img = new Image(); img.decoding = 'async'; img.onload = () => { if (!this.iceTex) return; this.iceTex.image = img; this.iceTex.needsUpdate = true; }; img.src = './assets/ice-pebble.seamless.png'; }
    // Transparent pebble sparkle drawn over the markings too (they read as under-ice paint).
    this.sparkleTex = this.canvas(256, 256, (c, w, h) => {for (let i = 0; i < 900; i++) {const x = rand(i + 401) * w, y = rand(i + 809) * h; c.fillStyle = rand(i + 77) > .3 ? 'rgba(255,255,255,.55)' : 'rgba(120,140,170,.22)'; c.beginPath(); c.arc(x, y, .5 + rand(i + 3) * .9, 0, 7); c.fill();}});
    this.sparkleTex.wrapS = this.sparkleTex.wrapT = this.T.RepeatWrapping; this.sparkleTex.repeat.set(3, 12);
    // Large-scale sheet tint: frosted running path along the centre, slightly cooler edges.
    this.frostTex = this.canvas(128, 1024, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(120,150,200,.10)'); g.addColorStop(.3, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.16)'); g.addColorStop(.7, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(120,150,200,.10)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 18; i++) {const x = w * (.32 + rand(i + 91) * .36); c.strokeStyle = `rgba(255,255,255,${.03 + rand(i) * .04})`; c.lineWidth = 1 + rand(i + 2) * 2; c.beginPath(); c.moveTo(x, h); c.bezierCurveTo(x, h * .6, x + (rand(i + 4) - .5) * 40, h * .35, x + (rand(i + 6) - .5) * 60, h * .1); c.stroke();}
    });
    // Ailsa Craig-style granite: blue-grey base, dense multi-size crystal speckle (dark
    // hornblende, pale feldspar, a few rose grains) and a darker polished striking band.
    this.graniteTex = this.canvas(512, 256, (c, w, h) => {
      const base = c.createLinearGradient(0, 0, 0, h); base.addColorStop(0, '#7f878f'); base.addColorStop(.5, '#8c939b'); base.addColorStop(1, '#79818a'); c.fillStyle = base; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) {const x = rand(i + 5) * w, y = rand(i + 17) * h, r = .35 + Math.pow(rand(i + 29), 3) * 2.6, k = rand(i + 43); c.fillStyle = k < .42 ? `rgba(34,38,46,${.45 + rand(i + 3) * .4})` : k < .82 ? `rgba(214,218,224,${.35 + rand(i + 7) * .4})` : k < .94 ? 'rgba(150,110,118,.45)' : 'rgba(255,255,255,.85)'; for (const dx of [-w, 0, w]) {c.beginPath(); c.arc(x + dx, y, r, 0, 7); c.fill();}}
      // Lathe v runs bottom->top: darker striking band around the widest part.
      const band = c.createLinearGradient(0, 0, 0, h); band.addColorStop(0, 'rgba(26,28,36,.0)'); band.addColorStop(.42, 'rgba(26,28,36,.0)'); band.addColorStop(.47, 'rgba(26,28,36,.38)'); band.addColorStop(.6, 'rgba(26,28,36,.38)'); band.addColorStop(.65, 'rgba(26,28,36,0)');
      c.fillStyle = band; c.fillRect(0, 0, w, h);
    });
    this.graniteTex.wrapS = this.T.RepeatWrapping;
    // Team marks on the cap: coral = ring + dot, turquoise = cross. Readable without colour.
    this.capTex = TEAM.map((team, index) => this.canvas(256, 256, (c, w) => {
      const g = c.createRadialGradient(w * .42, w * .38, 10, w / 2, w / 2, w / 2); g.addColorStop(0, team.pale); g.addColorStop(.55, team.main); g.addColorStop(1, team.deep);
      c.fillStyle = g; c.beginPath(); c.arc(w / 2, w / 2, w / 2, 0, 7); c.fill();
      c.fillStyle = c.strokeStyle = '#ffffff'; c.lineCap = 'round';
      if (index === 0) {c.lineWidth = 24; c.beginPath(); c.arc(w / 2, w / 2, 78, 0, 7); c.stroke(); c.beginPath(); c.arc(w / 2, w / 2, 24, 0, 7); c.fill();}
      else {c.lineWidth = 34; c.beginPath(); c.moveTo(w * .26, w * .26); c.lineTo(w * .74, w * .74); c.moveTo(w * .74, w * .26); c.lineTo(w * .26, w * .74); c.stroke();}
      c.strokeStyle = 'rgba(20,16,30,.55)'; c.lineWidth = 6; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 3, 0, 7); c.stroke();
    }));
    this.blobTex = this.canvas(128, 128, (c, w) => {const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(10,14,30,.55)'); g.addColorStop(.55, 'rgba(10,14,30,.28)'); g.addColorStop(1, 'rgba(10,14,30,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w);});
    this.glowTex = this.canvas(256, 256, (c, w) => {const g = c.createRadialGradient(w / 2, w / 2, w * .22, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.12, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,255,255,1)'); g.addColorStop(.34, 'rgba(255,255,255,.4)'); g.addColorStop(.7, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w);});
    this.boardTex = this.canvas(1024, 256, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#2b1650'); g.addColorStop(.5, '#4a1f6e'); g.addColorStop(1, '#6b1f5a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      // Pure graphic (no text, nothing to translate): concentric house + gliding stones.
      const cx = w / 2, cy = h / 2;
      for (const [r, col] of [[96, '#7d6bff'], [66, '#f2ecff'], [36, '#ff5fae'], [12, '#ffffff']]) {c.fillStyle = col; c.globalAlpha = .9; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();}
      c.globalAlpha = 1;
      for (const [x, col] of [[cx - 300, TEAM[0].main], [cx + 300, TEAM[1].main]]) {c.fillStyle = '#c9ced6'; c.beginPath(); c.ellipse(x, cy + 12, 54, 30, 0, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.ellipse(x, cy + 2, 40, 21, 0, 0, 7); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 5; for (let i = 1; i <= 3; i++) {c.beginPath(); c.moveTo(x + Math.sign(cx - x) * -70 - Math.sign(cx - x) * i * 34, cy + 8 - i * 4); c.lineTo(x + Math.sign(cx - x) * -60 - Math.sign(cx - x) * i * 34 - Math.sign(cx - x) * 22, cy + 8 - i * 4); c.stroke();}}
      c.strokeStyle = 'rgba(255,180,230,.6)'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12);
    });
  }
  materials() {
    const T = this.T, m = (x, o) => this.track(new x(o));
    this.mat = {
      // Pebbled ice: cooler, darker albedo so the generated pebble map reads; the pebble also
      // drives a fine bump so highlights break into glints instead of long white streaks.
      ice: m(T.MeshPhysicalMaterial, {color: '#b6cee2', map: this.iceTex, bumpMap: this.iceTex, bumpScale: .55, roughness: .3, metalness: 0, clearcoat: .5, clearcoatRoughness: .1, envMapIntensity: .3}),
      frost: m(T.MeshBasicMaterial, {map: this.frostTex, transparent: true, depthWrite: false, toneMapped: true}),
      pebble: m(T.MeshBasicMaterial, {map: this.sparkleTex, transparent: true, opacity: .42, depthWrite: false}),
      step: m(T.MeshStandardMaterial, {color: '#ffffff', roughness: .62, envMapIntensity: .4}),
      ring12: m(T.MeshStandardMaterial, {color: '#4b3fd6', roughness: .35, emissive: '#2b1f9a', emissiveIntensity: .35, depthWrite: false}),
      ring8: m(T.MeshStandardMaterial, {color: '#f3f5fb', roughness: .35, depthWrite: false}),
      ring4: m(T.MeshStandardMaterial, {color: '#e03f95', roughness: .35, emissive: '#8a1250', emissiveIntensity: .35, depthWrite: false}),
      button: m(T.MeshStandardMaterial, {color: '#ffffff', roughness: .35, depthWrite: false}),
      line: m(T.MeshStandardMaterial, {color: '#28324f', roughness: .5, depthWrite: false}),
      hog: m(T.MeshStandardMaterial, {color: '#ff4f93', roughness: .4, emissive: '#b01a5c', emissiveIntensity: .45, depthWrite: false}),
      board: m(T.MeshStandardMaterial, {color: '#24203a', roughness: .62, metalness: .05}),
      boardTop: m(T.MeshStandardMaterial, {color: '#3a2f5c', roughness: .45}),
      neon: m(T.MeshBasicMaterial, {vertexColors: true, toneMapped: false}),
      rubber: m(T.MeshStandardMaterial, {color: '#1d1828', roughness: .95}),
      floor: m(T.MeshStandardMaterial, {color: '#241d31', roughness: .9}),
      wall: m(T.MeshStandardMaterial, {color: '#2a2040', roughness: .85}),
      slat: m(T.MeshStandardMaterial, {color: '#5a3b2f', roughness: .7}),
      ceiling: m(T.MeshStandardMaterial, {color: '#15101f', roughness: 1}),
      lamp: m(T.MeshBasicMaterial, {color: '#fff2dd', toneMapped: false}),
      wood: m(T.MeshStandardMaterial, {color: '#c2804a', roughness: .62, envMapIntensity: .4}),
      woodDark: m(T.MeshStandardMaterial, {color: '#8a5432', roughness: .7}),
      seat: m(T.MeshStandardMaterial, {color: '#ffffff', roughness: .55}),
      glass: m(T.MeshPhysicalMaterial, {color: '#b9dcff', roughness: .05, metalness: 0, transmission: 0, transparent: true, opacity: .1, depthWrite: false, envMapIntensity: .8}),
      rail: m(T.MeshStandardMaterial, {color: '#c7cbe0', roughness: .25, metalness: .8}),
      board2: m(T.MeshBasicMaterial, {map: this.boardTex, toneMapped: false, color: '#c9b8e6'}),
      hack: m(T.MeshStandardMaterial, {color: '#14121c', roughness: .8}),
      granite: m(T.MeshPhysicalMaterial, {map: this.graniteTex, bumpMap: this.graniteTex, bumpScale: .8, roughness: .44, metalness: .02, clearcoat: .75, clearcoatRoughness: .09, envMapIntensity: 1.05}),
      blob: m(T.MeshBasicMaterial, {map: this.blobTex, transparent: true, depthWrite: false}),
      person: m(T.MeshStandardMaterial, {color: '#ffffff', roughness: .8}),
      broomHandle: m(T.MeshStandardMaterial, {color: '#e3e5f0', roughness: .3, metalness: .5}),
      dust: m(T.MeshStandardMaterial, {color: '#e9f6ff', roughness: .4, emissive: '#5f86b8', emissiveIntensity: .25})
    };
    this.teamMat = TEAM.map((team, i) => ({
      capTop: this.track(new T.MeshStandardMaterial({map: this.capTex[i], roughness: .3, envMapIntensity: .7})),
      capSide: this.track(new T.MeshStandardMaterial({color: team.deep, roughness: .35})),
      handle: this.track(new T.MeshPhysicalMaterial({color: team.main, roughness: .22, clearcoat: .8, clearcoatRoughness: .15, emissive: team.deep, emissiveIntensity: .18})),
      glow: this.track(new T.MeshBasicMaterial({map: this.glowTex, color: team.main, transparent: true, depthWrite: false, toneMapped: false})),
      pad: this.track(new T.MeshStandardMaterial({color: team.main, roughness: .9}))
    }));
  }
  mesh(geo, mat, x = 0, y = 0, z = 0, parent = this.root) {const o = new this.T.Mesh(geo, mat); o.position.set(x, y, z); parent.add(o); return o;}
  geo(g) {return this.track(g);}

  // ---------- environment ----------
  buildRoom() {
    const T = this.T, M = this.mat;
    const floor = this.mesh(this.geo(new T.PlaneGeometry(44, 80)), M.floor, 0, -.02, 0); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
    // Walkway between boards and glass.
    for (const s of [-1, 1]) {const w = this.mesh(this.geo(new T.BoxGeometry(1, .04, EDGE_FRONT - EDGE_BACK + 6)), M.rubber, s * (EDGE_X + .7), -.0, .2); w.receiveShadow = true;}
    // Walls & ceiling.
    const wallGeo = this.geo(new T.BoxGeometry(.4, 10, 64));
    for (const s of [-1, 1]) {
      this.mesh(wallGeo, M.wall, s * 13.2, 5, 4);
      const slats = new T.InstancedMesh(this.geo(new T.BoxGeometry(.12, 3.6, .22)), M.slat, 120), u = new T.Object3D();
      for (let i = 0; i < 120; i++) {u.position.set(s * 12.95, 6.2, -26 + i * .5); u.updateMatrix(); slats.setMatrixAt(i, u.matrix);} this.root.add(slats);
      this.neonStrip(s * 12.9, 4.15, -27, 31, s);
      this.neonStrip(s * 12.9, 8.15, -27, 31, -s);
    }
    this.mesh(this.geo(new T.BoxGeometry(27, 10, .4)), M.wall, 0, 5, -21);
    this.mesh(this.geo(new T.BoxGeometry(27, 10, .4)), M.wall, 0, 5, 36.5);
    const board = this.mesh(this.geo(new T.PlaneGeometry(9.6, 2.4)), M.board2, 0, 5.1, -20.75); board.renderOrder = 1;
    const frame = this.mesh(this.geo(new T.BoxGeometry(10, 2.8, .12)), M.board, 0, 5.1, -20.85);
    frame.position.z = -20.86;
    const ceiling = this.mesh(this.geo(new T.PlaneGeometry(27, 60)), M.ceiling, 0, 9.6, 4); ceiling.rotation.x = Math.PI / 2;
    const lamps = new T.InstancedMesh(this.geo(new T.BoxGeometry(1.1, .08, 3.4)), M.lamp, 24), u = new T.Object3D();
    let i = 0; for (const x of [-2.6, 2.6, -8.4, 8.4]) for (let z = -18; z <= 22; z += 8) {if (i >= 24) break; u.position.set(x, 9.45, z); u.updateMatrix(); lamps.setMatrixAt(i++, u.matrix);} lamps.count = i; this.root.add(lamps);
    // Glass + dasher boards between the walkway and the stands live in curling-arena.js.
    this.buildStands();
  }
  neonStrip(x, y, z0, length, dir, pair = ['#9b5cff', '#ff5fae']) {
    const T = this.T, geo = this.geo(new T.BoxGeometry(.06, .07, length * 2, 1, 1, 24)), colors = [], pos = geo.getAttribute('position'), a = new T.Color(pair[0]), b = new T.Color(pair[1]), c = new T.Color();
    for (let i = 0; i < pos.count; i++) {const u = (pos.getZ(i) / (length * 2) + .5); c.copy(a).lerp(b, dir > 0 ? u : 1 - u); colors.push(c.r, c.g, c.b);}
    geo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    this.mesh(geo, this.mat.neon, x, y, z0 + length);
  }
  buildStands() {
    const T = this.T, u = new T.Object3D(), tiers = this.low ? 4 : 6;
    const steps = new T.InstancedMesh(this.geo(new T.BoxGeometry(.95, .44, 6.2)), this.mat.step, tiers * 2 * 4);
    let n = 0; this.seatSlots = [];
    for (const side of [-1, 1]) for (let tier = 0; tier < tiers; tier++) for (let section = 0; section < 4; section++) {
      const x = side * (5.75 + tier * .95), y = .22 + tier * .44, z = -12.4 + section * 7.1 + (section >= 2 ? .4 : 0);
      u.position.set(x, y, z); u.updateMatrix(); steps.setMatrixAt(n, u.matrix);
      steps.setColorAt(n++, new T.Color(tier % 2 ? '#4a3b5b' : '#534464'));
      for (let j = 0; j < 10; j++) this.seatSlots.push({x:x-side*.06, floor:y+.22, z:z-2.75+j*.61, side, tier});
    }
    steps.instanceMatrix.needsUpdate = true; steps.receiveShadow = true; this.root.add(steps);
  }
  buildCrowd() {
    this.crowd = new SpectatorCrowd(this.T, this.root, this.camera, this.seatSlots, x => this.track(x), {density:this.low?.16:.27, reduced:this.reduced});
  }
  placeCrowd() {this.crowd.update(this.clock);}

  // ---------- sheet ----------
  buildSheet() {
    const T = this.T, M = this.mat, length = EDGE_FRONT - EDGE_BACK, mid = (EDGE_FRONT + EDGE_BACK) / 2, h = this.house;
    const ice = this.mesh(this.geo(new T.BoxGeometry(EDGE_X * 2, .12, length)), M.ice, 0, -.06, mid); ice.receiveShadow = true;
    const plane = (w, d, mat, x, y, z, order = 2) => {const p = this.mesh(this.geo(new T.PlaneGeometry(w, d)), mat, x, y, z); p.rotation.x = -Math.PI / 2; p.renderOrder = order; p.receiveShadow = true; return p;};
    plane(EDGE_X * 2, length, M.frost, 0, .001, mid, 1);
    // House rings exactly at the server house (centre and 2.6 outer radius).
    const ring = (inner, outer, mat, y, order = 2) => {const r = this.mesh(this.geo(new T.RingGeometry(inner, outer, 96)), mat, h.x, y, h.z); r.rotation.x = -Math.PI / 2; r.receiveShadow = true; r.renderOrder = order; return r;};
    ring(h.r * 2 / 3, h.r, M.ring12, .002); ring(h.r / 3, h.r * 2 / 3, M.ring8, .002); ring(h.r * .11, h.r / 3, M.ring4, .002);
    const button = this.mesh(this.geo(new T.CircleGeometry(h.r * .11, 48)), M.button, h.x, .002, h.z); button.rotation.x = -Math.PI / 2; button.renderOrder = 2;
    for (const [r, w] of [[h.r, .025], [h.r / 3, .014]]) ring(r - w, r + w, M.line, .003, 3);
    // Lines: tee (through the house centre), back (house edge), hog (z0, the server's crossing rule), centre.
    plane(EDGE_X * 2, .03, M.line, 0, .003, h.z, 3);
    plane(EDGE_X * 2, .035, M.line, 0, .003, h.z - h.r, 3);
    plane(EDGE_X * 2, .12, M.hog, 0, .003, HOG, 3);
    plane(.022, (RELEASE + 1.2) - (h.z - h.r), M.line, 0, .003, ((h.z - h.r) + (RELEASE + 1.2)) / 2, 3);
    // Delivery: hack footholds behind the release point and a faint release mark.
    // Molded rubber hacks: curling-arena.js.
    plane(.9, .03, M.line, 0, .003, RELEASE + .55, 3);
    // Pebble sparkle over everything (multiply keeps rings vivid, adds ice texture).
    plane(EDGE_X * 2, length, M.pebble, 0, .004, mid, 4);
    // Boards: the inner face sits where a stone edge makes the server mark it out.
    const boardH = .2;
    for (const s of [-1, 1]) {const b = this.mesh(this.geo(new T.BoxGeometry(.18, boardH, length + .36)), M.board, s * (EDGE_X + .09), boardH / 2, mid); b.receiveShadow = true; this.neonStrip(s * (EDGE_X + .09), boardH + .02, EDGE_BACK - .1, (length + .2) / 2, s, ['#6fd6ff', '#b9a4ff']);}
    for (const z of [EDGE_BACK - .09, EDGE_FRONT + .09]) this.mesh(this.geo(new T.BoxGeometry(EDGE_X * 2 + .36, boardH + .1, .18)), M.board, 0, (boardH + .1) / 2, z);
    // Back curtain: dark padded wall behind the house end.
    this.mesh(this.geo(new T.BoxGeometry(EDGE_X * 2 + 1.4, 1.3, .3)), M.boardTop, 0, .65, EDGE_BACK - .55);
  }

  // ---------- stones ----------
  buildStoneParts() {
    const T = this.T, V = (r, y) => new T.Vector2(r, y);
    this.parts = {
      body: this.geo(new T.LatheGeometry([V(0, .012), V(.27, .012), V(.31, .03), V(.37, .07), V(.415, .115), V(.43, .155), V(.422, .2), V(.395, .238), V(.35, .262), V(.31, .27), V(0, .27)], 40)),
      cap: this.geo(new T.CylinderGeometry(.29, .3, .03, 40)),
      handle: this.geo(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(-.2, .27, 0), new T.Vector3(-.2, .39, 0), new T.Vector3(-.15, .45, 0), new T.Vector3(.15, .45, 0), new T.Vector3(.2, .39, 0), new T.Vector3(.2, .27, 0)]), 32, .038, 12, false)),
      bolt: this.geo(new T.CylinderGeometry(.06, .075, .03, 24)),
      trim: this.geo(new T.TorusGeometry(.295, .012, 8, 48).rotateX(Math.PI / 2)),
      blob: this.geo(new T.PlaneGeometry(1.5, 1.5)),
      ringGlow: this.geo(new T.PlaneGeometry(2.1, 2.1))
    };
  }
  makeStone(team, {shadow = true} = {}) {
    const T = this.T, g = new T.Group(), tm = this.teamMat[team];
    const body = new T.Mesh(this.parts.body, this.mat.granite); body.castShadow = shadow; body.receiveShadow = true;
    const cap = new T.Mesh(this.parts.cap, [tm.capSide, tm.capTop, tm.capSide]); cap.position.y = .275; cap.receiveShadow = true;
    const handle = new T.Mesh(this.parts.handle, tm.handle); handle.castShadow = shadow;
    const blob = new T.Mesh(this.parts.blob, this.mat.blob); blob.rotation.x = -Math.PI / 2; blob.position.y = .006; blob.renderOrder = 3;
    // Chrome bolt under the handle and a chrome trim ring where the cap meets the granite.
    this.chromeMat ||= this.track(new T.MeshStandardMaterial({color: '#e9ecf4', roughness: .26, metalness: .7, envMapIntensity: 1.3}));
    const bolt = new T.Mesh(this.parts.bolt, this.chromeMat); bolt.position.y = .3; const trim = new T.Mesh(this.parts.trim, this.chromeMat); trim.position.y = .272;
    g.add(blob, body, cap, handle, bolt, trim); g.userData = {team, blob, parts: [body, cap, handle, bolt, trim]}; return g;
  }
  buildRack() {
    // Remaining stones wait behind the front board: a diegetic count per team.
    const T = this.T, max = 8;
    this.rack = TEAM.map((_, team) => {const list = []; for (let i = 0; i < max; i++) {const s = this.makeStone(team, {shadow: false}); s.scale.setScalar(.9); s.visible = false; const row = Math.floor(i / 4), col = i % 4; s.position.set((team ? 1 : -1) * (.75 + col * .92), 0, EDGE_FRONT + .85 + row * .95); s.rotation.y = team ? .4 : -.4; this.root.add(s); list.push(s);} return list;});
    this.next = TEAM.map((_, team) => {const s = this.makeStone(team); s.visible = false; s.position.set(0, 0, RELEASE); this.root.add(s); return s;});
  }

  // ---------- feedback ----------
  buildFeedback() {
    const T = this.T;
    this.pulseRing = this.mesh(this.parts.ringGlow, this.track(new T.MeshBasicMaterial({map: this.glowTex, color: '#ffffff', transparent: true, depthWrite: false, toneMapped: false})), 0, .012, RELEASE);
    this.pulseRing.rotation.x = -Math.PI / 2; this.pulseRing.renderOrder = 5; this.pulseRing.visible = false;
    this.contactRings = Array.from({length: 6}, () => {const r = this.mesh(this.geo(new T.RingGeometry(.86, 1, 48)), this.track(new T.MeshBasicMaterial({color: '#8a63ff', transparent: true, opacity: 0, depthWrite: false, toneMapped: false})), 0, .015, 0); r.rotation.x = -Math.PI / 2; r.renderOrder = 6; r.visible = false; r.userData.born = -9; return r;});
    this.dust = new T.InstancedMesh(this.geo(new T.IcosahedronGeometry(1, 0)), this.mat.dust, this.low ? 48 : 96); this.dust.count = 0; this.dust.frustumCulled = false; this.dust.renderOrder = 7; this.root.add(this.dust); this.dustParts = [];
    // Sweep: two brooms that work ahead of the moving stone.
    this.brooms = [0, 1].map(i => {
      // One brush pivot: the shaft's lower endpoint is inside the head, and every part
      // follows the same group transform during the side-to-side sweep.
      const g = new T.Group(), lower = new T.Vector3(0, .14, 0), upper = new T.Vector3(0, 1.52, .68), axis = upper.clone().sub(lower);
      const handle = new T.Mesh(this.geo(new T.CylinderGeometry(.035, .035, axis.length(), 10)), this.mat.broomHandle);
      handle.position.copy(lower).add(upper).multiplyScalar(.5); handle.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), axis.clone().normalize());
      // Pill-shaped brush head (rounded ends like a real pad broom) over the dark pad.
      const head = new T.Mesh(this.geo(new T.CapsuleGeometry(.1, .56, 6, 16).rotateZ(Math.PI / 2).scale(1, .6, 1.25)), this.teamMat[0].pad); head.position.y = .1;
      const bristles = new T.Mesh(this.geo(new T.BoxGeometry(.73, .045, .235)), this.mat.rubber); bristles.position.y = .035;
      head.castShadow = handle.castShadow = bristles.castShadow = true;
      g.add(handle, head, bristles); for (let tooth=0; tooth<12; tooth++) {const tuft=new T.Mesh(this.geo(new T.BoxGeometry(.036,.02,.235)),this.mat.dust);tuft.position.set(-.33+tooth*.06,.018,0);g.add(tuft);} g.scale.setScalar(1.15); g.visible = false; g.userData = {head, handle, bristles, lower, upper}; this.root.add(g); return g;
    });
    // Measurement circle (radius = nearest opposing stone) and counted-stone glows.
    this.measure = this.mesh(this.geo(new T.RingGeometry(.965, 1, 128)), this.track(new T.MeshBasicMaterial({color: '#ffd84a', transparent: true, opacity: 0, depthWrite: false, toneMapped: false})), 0, .02, 0);
    this.measure.rotation.x = -Math.PI / 2; this.measure.renderOrder = 6; this.measure.visible = false;
    this.glows = []; this.badges = []; this.labelCache = new Map();
    // Path ribbon of the stone in play (shows the curl; swept parts brighter).
    const cap = 700, geo = this.geo(new T.BufferGeometry());
    geo.setAttribute('position', new T.BufferAttribute(new Float32Array(cap * 2 * 3), 3).setUsage(T.DynamicDrawUsage));
    geo.setAttribute('color', new T.BufferAttribute(new Float32Array(cap * 2 * 4), 4).setUsage(T.DynamicDrawUsage));
    const index = []; for (let i = 0; i < cap - 1; i++) {const a = i * 2; index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);} geo.setIndex(index); geo.setDrawRange(0, 0);
    this.trail = this.mesh(geo, this.track(new T.MeshBasicMaterial({vertexColors: true, transparent: true, depthWrite: false, toneMapped: false})), 0, .008, 0);
    this.trail.renderOrder = 4; this.trail.frustumCulled = false; this.trailCap = cap; this.trailAlpha = 1;
    // Sweep frost: polished-ice glints left where the team swept; they twinkle and fade (bounded pool).
    this.glintTex = this.canvas(64, 64, c => {const g = c.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.22, 'rgba(214,244,255,.5)'); g.addColorStop(1, 'rgba(214,244,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.moveTo(32, 3); c.lineTo(34.5, 29.5); c.lineTo(61, 32); c.lineTo(34.5, 34.5); c.lineTo(32, 61); c.lineTo(29.5, 34.5); c.lineTo(3, 32); c.lineTo(29.5, 29.5); c.closePath(); c.fill();});
    this.frostCap = this.low ? 40 : 110; this.frostParts = [];
    this.frostGlints = new T.InstancedMesh(this.geo(new T.PlaneGeometry(1, 1)), this.track(new T.MeshBasicMaterial({map: this.glintTex, color: '#5fb8f2', transparent: true, opacity: .85, depthWrite: false, toneMapped: false})), this.frostCap);
    this.frostGlints.count = 0; this.frostGlints.frustumCulled = false; this.frostGlints.renderOrder = 8; this.frostGlints.instanceMatrix.setUsage(T.DynamicDrawUsage); this.root.add(this.frostGlints);
    // Glide rhythm: a faint ring under the moving stone every ~1.2 m, so the pace reads (and visibly slows).
    this.gliders = Array.from({length: 5}, () => {const r = this.mesh(this.parts.ringGlow, this.track(new T.MeshBasicMaterial({map: this.glowTex, color: '#cfeaff', transparent: true, opacity: 0, depthWrite: false, toneMapped: false})), 0, .011, 0); r.rotation.x = -Math.PI / 2; r.renderOrder = 5; r.visible = false; r.userData.born = -9; return r;});
    this.glideDist = 0; this.glideLast = null;
  }
  label(text, color = '#ffffff', bg = 'rgba(22,16,36,.92)') {
    const key = text + color + bg; if (this.labelCache.has(key)) return this.labelCache.get(key);
    const font = 'italic 900 56px KardiaFatRunner, HeyPalsDisplay, system-ui, sans-serif', probe = document.createElement('canvas').getContext('2d'); probe.font = font;
    const w = Math.ceil(probe.measureText(text).width) + 64, h = 92;
    const tex = this.canvas(w, h, c => {c.fillStyle = bg; c.beginPath(); c.roundRect(4, 4, w - 8, h - 8, 40); c.fill(); c.strokeStyle = color; c.lineWidth = 5; c.stroke(); c.font = font; c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, w / 2, h / 2 + 3);});
    const mat = this.track(new this.T.SpriteMaterial({map: tex, depthTest: false, depthWrite: false, toneMapped: false, transparent: true}));
    const entry = {mat, aspect: w / h}; this.labelCache.set(key, entry); return entry;
  }
  sprite(text, color, height = .42) {const {mat, aspect} = this.label(text, color); const s = new this.T.Sprite(mat.clone()); this.track(s.material); s.scale.set(height * aspect, height, 1); s.userData.aspect = aspect; s.userData.height = height; s.renderOrder = 20; this.root.add(s); return s;}
  lang() {return (window.PartyI18n?.language || document.documentElement.lang || 'ru').startsWith('ru') ? 'ru' : 'en';}
  burst(x, z, power = 1) {
    const n = Math.round(10 + 10 * Math.min(1, power));
    for (let i = 0; i < n; i++) {if (this.dustParts.length >= this.dust.instanceMatrix.count) this.dustParts.shift(); const a = rand(this.clock * 13 + i) * Math.PI * 2, sp = .5 + rand(i * 7 + this.clock) * 1.2 * power;
      this.dustParts.push({x, y: .05, z, vx: Math.cos(a) * sp, vy: .6 + rand(i + this.clock * 3) * .9, vz: Math.sin(a) * sp, born: this.clock, life: .45 + rand(i * 3.3) * .3, size: .035 + rand(i * 5.1) * .045});}
  }
  contact(x, z, power) {
    const ring = this.contactRings.reduce((a, b) => a.userData.born < b.userData.born ? a : b);
    ring.position.set(x, .015, z); ring.userData.born = this.clock; ring.userData.power = power; ring.visible = true;
    this.burst(x, z, power); this.audio?.clack(power); window.LocalPartyFeel?.emit?.('hit', {id: 'curling-contact:' + Math.round(this.clock * 100), x: .5, y: .5, intensity: Math.min(.45, .18 + power * .2), shake: false});
    this.extras?.contact(x, z, power); this.feel?.contact(x, z, power);
  }

  // ---------- server events ----------
  effect(e, s) {
    if (e.kind === 'score' && e.team !== null && e.points > 0) this.crowd.cheerUntil = this.clock + 1.2 + .6 * Math.min(4, e.points);
    this.extras?.effect(e, s);
  }

  // ---------- snapshots / interpolation ----------
  ingest(s) {
    const last = this.snaps.at(-1);
    if (last && s.t === last.t) return;
    if (last && s.t < last.t - .001) {this.snaps = []; this.renderT = null;}
    const map = new Map(); for (const st of s.stones || []) map.set(st.id, st);
    const snap = {t: s.t, stones: map}; this.snaps.push(snap); if (this.snaps.length > 40) this.snaps.shift();
    // Contact detection on authoritative positions: touching pair that is moving.
    const prev = this.snaps.at(-2), prev2 = this.snaps.at(-3);
    if (prev && prev2 && s.stage === 'rolling') {
      const dt1 = Math.max(1e-3, s.t - prev.t), dt0 = Math.max(1e-3, prev.t - prev2.t), live = (s.stones || []).filter(x => x.valid);
      for (const st of live) {
        const a = prev.stones.get(st.id), b = prev2.stones.get(st.id); if (!a || !b) continue;
        const v1x = (st.x - a.x) / dt1, v1z = (st.z - a.z) / dt1, v0x = (a.x - b.x) / dt0, v0z = (a.z - b.z) / dt0, dv = Math.hypot(v1x - v0x, v1z - v0z);
        if (dv < .3) continue;
        let other = null, best = 1.25; for (const o of live) {if (o === st) continue; const d = Math.hypot(o.x - a.x, o.z - a.z); if (d < best) {best = d; other = o;}}
        if (!other) continue; const key = st.id < other.id ? st.id + '|' + other.id : other.id + '|' + st.id;
        if ((this.contactAt?.[key] ?? -9) > s.t - .5) continue; (this.contactAt ||= {})[key] = s.t;
        this.contactCount = (this.contactCount || 0) + 1;
        this.pendingContacts.push({t: prev.t, x: (a.x + other.x) / 2, z: (a.z + other.z) / 2, power: Math.min(1, dv / 3)});
      }
    }
    if (s.stage === 'aim') this.contactAt = {};
  }
  sample(dt) {
    const latest = this.snaps.at(-1); if (!latest) return null;
    const target = latest.t - DELAY;
    if (this.renderT === null || Math.abs(this.renderT - target) > .6) this.renderT = target;
    else {this.renderT += dt; this.renderT += (target - this.renderT) * Math.min(1, dt * 3);}
    this.renderT = Math.min(this.renderT, latest.t);
    let a = this.snaps[0], b = latest;
    for (let i = this.snaps.length - 1; i > 0; i--) if (this.snaps[i - 1].t <= this.renderT) {a = this.snaps[i - 1]; b = this.snaps[i]; break;}
    const alpha = b.t > a.t ? Math.min(1, Math.max(0, (this.renderT - a.t) / (b.t - a.t))) : 1;
    return {a, b, alpha, latest};
  }
  velocity(id) {
    const n = this.snaps.length; if (n < 2) return {vx: 0, vz: 0};
    const b = this.snaps[n - 1], a = this.snaps[n - 2], sb = b.stones.get(id), sa = a.stones.get(id), dt = b.t - a.t;
    return sa && sb && dt > 1e-4 ? {vx: (sb.x - sa.x) / dt, vz: (sb.z - sa.z) / dt} : {vx: 0, vz: 0};
  }

  // ---------- per frame ----------
  update(s, dt) {
    this.clock += dt; this.frameDt = dt; const T = this.T;
    if (s.house) this.house = {...DEFAULT_HOUSE, ...s.house};
    this.ingest(s);
    const sample = this.sample(this.feel ? this.feel.timeScale(dt) : dt), latest = sample?.latest, stageChanged = s.stage !== this.lastStage;
    const active = s.stage === 'rolling' || s.stage === 'reveal' ? (s.stones || []).at(-1) : null;
    // Stones: interpolate between bracketing snapshots; removed stones fade with a clear mark.
    const seen = new Set(), positions = new Map();
    if (sample) for (const [id, st] of latest.stones) {
      if (!sample.b.stones.has(id) && !this.stones.has(id)) continue; // thrown after the render time: appears when interpolation reaches it
      const sa = sample.a.stones.get(id), sb = sample.b.stones.get(id) || st, from = sa || sb, k = sa ? sample.alpha : 1;
      const x = from.x + (sb.x - from.x) * k, z = from.z + (sb.z - from.z) * k, rot = from.rotation + (sb.rotation - from.rotation) * k;
      let obj = this.stones.get(id);
      if (st.valid && sb.valid !== false) {
        if (!obj) {obj = this.makeStone(st.team); this.root.add(obj); this.stones.set(id, obj);}
        obj.position.set(x, 0, z); obj.rotation.y = -rot; seen.add(id); positions.set(id, {x, z, team: st.team});
      } else if (obj && !obj.userData.fade) {
        if (!sb.valid) this.fadeOut(id, obj, sb.crossed === false ? 'hog' : 'out');
        else {obj.position.set(x, 0, z); obj.rotation.y = -rot; seen.add(id);}
      } else if (obj?.userData.fade) seen.add(id);
    }
    for (const [id, obj] of this.stones) if (!seen.has(id) && !obj.userData.fade) this.fadeOut(id, obj, 'clear');
    this.updateFades();
    // Contacts are revealed when the interpolated stones actually meet.
    this.pendingContacts = this.pendingContacts.filter(c => {if (this.renderT === null || this.renderT >= c.t - .02) {this.contact(c.x, c.z, c.power); return false;} return true;});
    this.updateNext(s);
    this.updateTrail(s, active, positions, dt);
    this.updateSweep(s, active, positions);
    this.updateGlide(s, active, positions);
    this.updateScore(s, positions);
    this.updateCamera(s, active, positions, dt, stageChanged);
    this.camera.updateMatrixWorld();
    this.updateEffects(dt);
    this.extras?.update(s, dt, positions, active);
    this.ice?.update(s, dt, positions); this.arena?.update(s, dt); this.feel?.update(s, dt, positions, active);
    this.updateInset(s, positions);
    this.placeCrowd();
    this.lastStage = s.stage;
  }
  fadeOut(id, obj, reason) {
    const T = this.T; obj.userData.fade = {born: this.clock, reason, life: reason === 'clear' ? .7 : 1.6};
    obj.userData.parts.forEach(p => {p.material = Array.isArray(p.material) ? p.material.map(m => this.track(m.clone())) : this.track(p.material.clone()); for (const m of [].concat(p.material)) {m.transparent = true; m.userData.fadeClone = true;}});
    obj.userData.blob.material = this.track(obj.userData.blob.material.clone()); obj.userData.blob.material.userData.fadeClone = true;
    if (reason !== 'clear') {
      const ru = this.lang() === 'ru', text = reason === 'hog' ? (ru ? '✕ НЕ ДОШЁЛ ДО ЛИНИИ' : '✕ SHORT OF HOG LINE') : (ru ? '✕ АУТ' : '✕ OUT');
      const mark = this.sprite(text, '#ff5f7e', .38); mark.position.set(obj.position.x, .95, obj.position.z); obj.userData.fade.mark = mark;
    }
    this.fading.push({id, obj});
  }
  updateFades() {
    this.fading = this.fading.filter(({id, obj}) => {
      const f = obj.userData.fade, u = (this.clock - f.born) / f.life;
      const hold = f.reason === 'clear' ? 0 : .35, k = Math.max(0, Math.min(1, (u - hold) / (1 - hold))), opacity = 1 - smooth(k);
      for (const p of obj.userData.parts) for (const m of [].concat(p.material)) m.opacity = opacity;
      obj.userData.blob.material.opacity = opacity; obj.position.y = -.08 * smooth(k);
      if (f.mark) {f.mark.material.opacity = Math.min(1, u * 5) * (1 - smooth((u - .7) / .3)); f.mark.position.y = .95 + u * .25;}
      if (u < 1) return true;
      this.root.remove(obj); if (f.mark) this.root.remove(f.mark);
      for (const p of obj.userData.parts) for (const m of [].concat(p.material)) {m.dispose(); this.disposables.delete(m);}
      obj.userData.blob.material.dispose(); this.disposables.delete(obj.userData.blob.material); if (f.mark) {f.mark.material.dispose(); this.disposables.delete(f.mark.material);}
      if (this.stones.get(id) === obj) this.stones.delete(id); return false;
    });
  }
  remaining(s) {
    const current = s.players?.find(p => p.id === s.currentId), left = Math.max(0, (s.throwCount || 0) - (s.throwIndex || 0) - (s.stage === 'aim' ? 0 : 1));
    if (!current || s.phase !== 'playing' || s.stage === 'end') return [0, 0];
    const mine = s.stage === 'aim' ? Math.ceil(left / 2) : Math.floor(left / 2), other = left - mine, out = [0, 0];
    // Count after the stone in hand: when aiming, the stone at the release mark is not in the rack.
    if (s.stage === 'aim') {out[current.team] = Math.max(0, mine - 1); out[1 - current.team] = other;} else {out[current.team] = mine; out[1 - current.team] = other;}
    return out;
  }
  updateNext(s) {
    const current = s.players?.find(p => p.id === s.currentId), aiming = s.phase === 'playing' && s.stage === 'aim' && current;
    // Hand-off: the stone in hand stays until the thrown stone is drawn (no blink at release).
    const thrown = s.stage === 'rolling' ? s.stones?.at(-1) : null, handoff = thrown && !this.stones.has(thrown.id) && this.lastNextTeam === thrown.team;
    this.next.forEach((stone, team) => {
      stone.visible = (!!aiming && current.team === team) || (!!handoff && thrown.team === team);
      if (!stone.visible) return;
      // Delivery ritual between throws: a slow slider rock (forward/back) and a handle wiggle.
      const t = this.clock;
      stone.rotation.y = this.reduced ? 0 : Math.sin(t * .8) * .25;
      stone.position.z = RELEASE + (this.reduced || handoff ? 0 : Math.sin(t * 1.25) * .06 + Math.sin(t * 2.5) * .015);
      if (handoff) stone.position.x = thrown.x;
      else stone.position.x = 0;
    });
    if (aiming) this.lastNextTeam = current.team;
    this.pulseRing.visible = !!aiming;
    if (aiming) {const u = this.reduced ? .5 : (this.clock * .9) % 1; this.pulseRing.scale.setScalar(.75 + u * .45); this.pulseRing.material.opacity = .65 * (1 - u); this.pulseRing.material.color.set(TEAM[current.team].main);}
    const rest = this.remaining(s);
    this.rack.forEach((list, team) => list.forEach((stone, i) => {stone.visible = i < rest[team];}));
    if (aiming && current.id !== this.bubbleFor) {
      this.bubble && this.root.remove(this.bubble); this.bubbleFor = current.id;
      this.bubble = this.sprite(String(current.number), current.color || TEAM[current.team].main, .5);
    }
    if (this.bubble) {this.bubble.visible = !!aiming; this.bubble.position.set(0, 1.12 + (this.reduced ? 0 : Math.sin(this.clock * 2.4) * .05), RELEASE);}
  }
  updateTrail(s, active, positions, dt) {
    const geo = this.trail.geometry, pos = geo.getAttribute('position'), col = geo.getAttribute('color');
    if (s.stage === 'rolling' && active?.valid && positions.has(active.id)) {
      if (this.trailFor !== active.id) {this.trailFor = active.id; this.trailPoints = []; this.trailAlpha = 1;}
      const p = positions.get(active.id), last = this.trailPoints.at(-1);
      if ((!last || Math.hypot(p.x - last.x, p.z - last.z) > .07) && this.trailPoints.length < this.trailCap) this.trailPoints.push({x: p.x, z: p.z, sweep: (s.sweepAmount || 0) > 0, team: active.team});
    } else if (s.stage === 'aim' || s.stage === 'end' || s.phase !== 'playing') this.trailAlpha = Math.max(0, this.trailAlpha - dt * .9);
    const pts = this.trailPoints, n = pts.length;
    if (n < 2 || this.trailAlpha <= 0) {geo.setDrawRange(0, 0); return;}
    const team = new this.T.Color(TEAM[pts[0].team].deep), swept = new this.T.Color('#3fb7ff');
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l, w = pts[i].sweep ? .36 : .3;
      pos.setXYZ(i * 2, pts[i].x + nx * w, 0, pts[i].z + nz * w); pos.setXYZ(i * 2 + 1, pts[i].x - nx * w, 0, pts[i].z - nz * w);
      const head = Math.min(1, (n - 1 - i) / 6), alpha = (pts[i].sweep ? .34 : .2) * head * this.trailAlpha, c = pts[i].sweep ? swept : team;
      col.setXYZW(i * 2, c.r, c.g, c.b, alpha); col.setXYZW(i * 2 + 1, c.r, c.g, c.b, alpha);
    }
    pos.needsUpdate = col.needsUpdate = true; geo.setDrawRange(0, (n - 1) * 6);
  }
  updateSweep(s, active, positions) {
    const sweepers = active ? (s.players || []).filter(p => p.sweeping && p.team === active.team && p.participant !== false).length : 0;
    const on = s.stage === 'rolling' && active?.valid && positions.has(active.id) && (s.sweepAmount || 0) > 0;
    const count = on ? Math.max(1, Math.min(2, sweepers || 1)) : 0;
    if (on) {
      const p = positions.get(active.id), v = this.velocity(active.id), sp = Math.hypot(v.vx, v.vz), dx = sp > .05 ? v.vx / sp : 0, dz = sp > .05 ? v.vz / sp : -1, yaw = Math.atan2(-dx, -dz);
      this.brooms.forEach((broom, i) => {
        broom.visible = i < count; if (!broom.visible) return;
        broom.userData.head.material = this.teamMat[active.team].pad;
        const amp = this.reduced ? .07 : .2, swing = Math.sin(this.clock * (this.reduced ? 6 : 15) + i * Math.PI) * amp, ahead = .85 + i * .45, side = (i ? .28 : -.28) + swing;
        broom.position.set(p.x + dx * ahead - dz * side, 0, p.z + dz * ahead + dx * side); broom.rotation.y = yaw + (i ? 1.05 : -1.05); // handles out to the sides, clear of the stone
        if (!this.reduced && rand(this.clock * 50 + i) < .35 && this.dustParts.length < this.dust.instanceMatrix.count - 4) this.dustParts.push({x: broom.position.x, y: .04, z: broom.position.z, vx: (rand(this.clock + i) - .5) * .7, vy: .3 + rand(this.clock * 3) * .35, vz: (rand(this.clock * 2 + i) - .5) * .7, born: this.clock, life: .4, size: .035});
      });
      // Sweep state is shown in the compact HUD wing; the brush and stone stay clear.
      if (this.sweepLabel) this.sweepLabel.visible = false;
    } else {this.brooms.forEach(b => b.visible = false); if (this.sweepLabel) this.sweepLabel.visible = false;}
  }
  updateGlide(s, active, positions) {
    const moving = s.stage === 'rolling' && active?.valid && positions.has(active.id), p = moving ? positions.get(active.id) : null;
    const v = moving ? this.velocity(active.id) : {vx: 0, vz: 0}, sp = Math.hypot(v.vx, v.vz), sweep = moving && (s.sweepAmount || 0) > 0 ? Math.min(1, s.sweepAmount || 0) : 0;
    this.audio?.update(moving ? sp : 0, moving ? (this.stones.get(active.id)?.rotation.y || 0) : 0, sweep);
    if (!moving) {this.glideLast = null; return;}
    if (this.glideLast) this.glideDist += Math.hypot(p.x - this.glideLast.x, p.z - this.glideLast.z); this.glideLast = {x: p.x, z: p.z};
    if (this.glideDist > 1.2 && sp > .25 && !this.reduced) {
      this.glideDist = 0; const ring = this.gliders.reduce((a, b) => a.userData.born < b.userData.born ? a : b);
      ring.position.set(p.x, .011, p.z); ring.userData.born = this.clock; ring.userData.speed = Math.min(1, sp / 2.5); ring.visible = true;
    }
    // Frost glints on the freshly swept ice just behind the stone.
    if (sweep && !this.reduced && this.frostParts.length < this.frostCap && rand(this.clock * 31) < .6) {
      const ux = sp > .05 ? v.vx / sp : 0, uz = sp > .05 ? v.vz / sp : -1, back = .3 + rand(this.clock * 7) * .9, side = (rand(this.clock * 11) - .5) * .8;
      this.frostParts.push({x: p.x - ux * back - uz * side, z: p.z - uz * back + ux * side, born: this.clock, life: 1.6 + rand(this.clock * 3) * 1.2, size: .14 + rand(this.clock * 5) * .16, phase: rand(this.clock * 13) * 6.28});
    }
  }
  updateScore(s, positions) {
    // Highlight only the stones the server counted (endScores of this end).
    const result = s.stage === 'end' || (s.phase === 'results' && s.endScores?.length) ? s.endScores?.[Math.max(0, (s.endIndex || 1) - 1)] : null;
    const key = result ? s.endIndex + ':' + result.ids.join() + ':' + result.team : '';
    if (key !== this.highlightKey) {
      this.highlightKey = key; this.highlightAt = this.clock;
      for (const g of this.glows) this.root.remove(g); for (const b of this.badges) this.root.remove(b); this.glows = []; this.badges = [];
      if (result && result.team !== null) {
        const tee = this.house, counted = result.ids.map(id => ({id, p: positions.get(id)})).filter(x => x.p).sort((a, b) => Math.hypot(a.p.x - tee.x, a.p.z - tee.z) - Math.hypot(b.p.x - tee.x, b.p.z - tee.z));
        counted.forEach(({id, p}, i) => {
          const glow = new this.T.Mesh(this.parts.ringGlow, this.teamMat[result.team].glow); glow.rotation.x = -Math.PI / 2; glow.position.set(p.x, .013, p.z); glow.renderOrder = 5; glow.userData.id = id; this.root.add(glow); this.glows.push(glow);
          const badge = this.sprite(String(i + 1), TEAM[result.team].main, .44); badge.position.set(p.x, 1.0, p.z); badge.userData.id = id; this.badges.push(badge);
        });
        // The opponent's closest stone defines the scoring circle.
        let limit = null; for (const [id, p] of positions) if (p.team !== result.team) {const d = Math.hypot(p.x - tee.x, p.z - tee.z); if (d <= tee.r + R && (limit === null || d < limit)) limit = d;}
        this.measureRadius = limit;
      } else this.measureRadius = null;
    }
    const show = !!result && result.team !== null, age = this.clock - (this.highlightAt || 0);
    this.measure.visible = show && this.measureRadius !== null;
    if (this.measure.visible) {const grow = this.reduced ? 1 : smooth(age / .7); this.measure.position.set(this.house.x, .02, this.house.z); this.measure.scale.setScalar(Math.max(.01, this.measureRadius * grow)); this.measure.material.opacity = .85;}
    this.glows.forEach((g, i) => {const p = positions.get(g.userData.id); if (p) g.position.set(p.x, .013, p.z); const pop = this.reduced ? 1 : smooth((age - i * .18) / .35); g.scale.setScalar(.6 + .4 * pop + (this.reduced ? 0 : Math.sin(this.clock * 3) * .03)); g.material.opacity = pop;});
    this.badges.forEach((b, i) => {const p = positions.get(b.userData.id); if (p) b.position.set(p.x, 1.0, p.z); const pop = this.reduced ? 1 : smooth((age - i * .18) / .3), hgt = b.userData.height * (.7 + .3 * pop); b.material.opacity = pop; b.scale.set(hgt * b.userData.aspect, hgt, 1);});
    // Measuring sweep while the last stone of the end settles (before the server result).
    const lastReveal = s.stage === 'reveal' && (s.throwIndex || 0) >= (s.throwCount || 0) - 1;
    if (lastReveal && !show) {const u = ((this.clock * .9) % 1); this.measure.visible = true; this.measure.position.set(this.house.x, .02, this.house.z); this.measure.scale.setScalar(.2 + u * (this.house.r + R)); this.measure.material.opacity = .55 * (1 - u);}
  }
  updateEffects(dt) {
    for (const r of this.contactRings) {const age = (this.clock - r.userData.born) / .7; r.visible = age < 1; if (!r.visible) continue; const k = 1 - Math.pow(1 - age, 2); r.scale.setScalar(.85 + k * (.8 + (r.userData.power || .5))); r.material.opacity = (1 - age) * (1 - age) * .65;}
    const u = this.unit ||= new this.T.Object3D(); let n = 0;
    this.dustParts = this.dustParts.filter(p => this.clock - p.born < p.life);
    for (const p of this.dustParts) {
      const age = this.clock - p.born, k = age / p.life; p.vy -= 2.6 * dt; p.x += p.vx * dt; p.y = Math.max(.02, p.y + p.vy * dt); p.z += p.vz * dt; p.vx *= .96; p.vz *= .96;
      u.position.set(p.x, p.y, p.z); u.rotation.set(age * 5, age * 3, 0); u.scale.setScalar(p.size * (1 - k * .7)); u.updateMatrix(); this.dust.setMatrixAt(n++, u.matrix);
    }
    this.dust.count = n; this.dust.instanceMatrix.needsUpdate = true;
    for (const r of this.gliders) {const age = (this.clock - r.userData.born) / .65; r.visible = age < 1; if (!r.visible) continue; r.scale.setScalar(.42 + age * (.35 + .35 * (r.userData.speed || .5))); r.material.opacity = .32 * (1 - age) * (.5 + .5 * (r.userData.speed || .5));}
    this.frostParts = this.frostParts.filter(p => this.clock - p.born < p.life); let g = 0;
    for (const p of this.frostParts) {
      const age = this.clock - p.born, k = age / p.life, tw = .55 + .45 * Math.sin(this.clock * 9 + p.phase), size = p.size * Math.min(1, age * 6) * (1 - k * k) * tw;
      // Frost trails taper before the roster/header rather than being cut in half by them.
      const bounds = this.presentationBounds, projected = this.v1.set(p.x, .03, p.z).project(this.camera);
      let safe = 1;
      if (bounds) {
        const px = (projected.x * .5 + .5) * bounds.width, py = (-projected.y * .5 + .5) * bounds.height;
        const edge = Math.min(px - bounds.left, bounds.right - px, py - bounds.top, bounds.bottom - py);
        safe = smooth(Math.max(0, Math.min(1, edge / 48))); if (safe < .01 || projected.z > 1) continue;
      }
      u.position.set(p.x, .03, p.z); u.quaternion.copy(this.camera.quaternion); u.rotateZ(p.phase + age * .8); u.scale.setScalar(Math.max(.001, size * safe)); u.updateMatrix(); this.frostGlints.setMatrixAt(g++, u.matrix);
    }
    this.frostGlints.count = g; this.frostGlints.instanceMatrix.needsUpdate = true;
  }

  // ---------- overhead house inset ----------
  buildInset() {
    // Broadcast-style top view of the house for wide TV fields: the far target stays readable
    // during aim and roll. Rendered to a small target and shown on a camera-space card.
    const T = this.T, size = this.low ? 320 : 512;
    this.insetRT = this.track(new T.WebGLRenderTarget(size, size, {samples: this.low ? 0 : 4}));
    this.insetCam = new T.PerspectiveCamera(26, 1, .5, 40);
    const mask = this.canvas(256, 256, (c, w) => {c.fillStyle = '#000'; c.fillRect(0, 0, w, w); c.fillStyle = '#fff'; c.beginPath(); c.roundRect(10, 10, w - 20, w - 20, 26); c.fill();});
    const ru = this.lang() === 'ru';
    const frame = this.canvas(512, 512, (c, w) => {
      c.fillStyle = 'rgba(16,11,26,.88)'; c.beginPath(); c.roundRect(4, 4, w - 8, w - 8, 56); c.fill();
      const g = c.createLinearGradient(0, 0, w, w); g.addColorStop(0, '#9b5cff'); g.addColorStop(1, '#ff5fae'); c.strokeStyle = g; c.lineWidth = 7; c.beginPath(); c.roundRect(6, 6, w - 12, w - 12, 54); c.stroke();
    });
    this.insetCard = new T.Group(); this.insetCard.renderOrder = 30;
    const back = new T.Mesh(this.geo(new T.PlaneGeometry(1, 1)), this.track(new T.MeshBasicMaterial({map: frame, transparent: true, depthTest: false, depthWrite: false, toneMapped: false})));
    const view = new T.Mesh(this.geo(new T.PlaneGeometry(.9, .9)), this.track(new T.MeshBasicMaterial({map: this.insetRT.texture, alphaMap: mask, transparent: true, depthTest: false, depthWrite: false})));
    back.renderOrder = 30; view.renderOrder = 31; view.position.z = .001;
    const tag = this.sprite(ru ? 'ДОМ' : 'HOUSE', '#9b5cff', .1); this.root.remove(tag); tag.position.set(0, .5, .002); tag.renderOrder = 32;
    this.insetCard.add(back, view, tag); this.insetCard.visible = false; this.insetFrame = 0;
    this.camera.add(this.insetCard); if (!this.camera.parent) this.scene.add(this.camera);
  }
  updateInset(s, positions) {
    const cam = this.camera, aspect = cam.aspect || 1.7, h = this.house;
    // Projected house size in the main view: hide the inset once the camera shows the house itself.
    const a = this.v1.set(h.x, 0, h.z - h.r).project(cam), b = this.v2.set(h.x, 0, h.z + h.r).project(cam), big = Math.abs(a.y - b.y) > .5 || a.z > 1 || b.z > 1;
    const want = !this.houseView && !big && aspect >= 2.2 && s.phase === 'playing' && ['aim', 'rolling', 'reveal'].includes(s.stage);
    this.insetOpacity = Math.max(0, Math.min(1, (this.insetOpacity || 0) + (want ? 1 : -1) * (this.reduced ? 1 : this.frameDt * 4)));
    for (const child of this.insetCard.children) child.material.opacity = this.insetOpacity;
    const show = this.insetOpacity > .01; this.insetCard.visible = show; if (!show) return;
    // Card placement in camera space (distance 1): right side, inside the safe band.
    const halfH = Math.tan(cam.fov * Math.PI / 360), halfW = halfH * aspect, size = Math.min(halfH * 2 * .64, halfW * .34), cy = -.06 * halfH;
    this.insetCard.position.set(halfW * .94 - size / 2, cy, -1); this.insetCard.scale.setScalar(size);
    // Overhead framing of the house and stones around it (slight tilt from the thrower's side).
    const near = [...positions.values()].filter(p => Math.hypot(p.x - h.x, p.z - h.z) < h.r + 1.6);
    let reach = h.r + R + .25; for (const p of near) reach = Math.max(reach, Math.hypot(p.x - h.x, p.z - h.z) + R + .2);
    const dist = reach / Math.tan(13 * Math.PI / 180) * 1.02;
    this.insetCam.position.set(h.x, dist * .985, h.z + dist * .17); this.insetCam.lookAt(h.x, 0, h.z);
    const moving = s.stage === 'rolling';
    if (!moving && this.insetFrame++ % 6) return;
    const r = this.renderer, auto = r.shadowMap.autoUpdate, prev = r.getRenderTarget();
    this.insetCard.visible = false; r.shadowMap.autoUpdate = false; r.setRenderTarget(this.insetRT); r.clear(); r.render(this.scene, this.insetCam); r.setRenderTarget(prev); r.shadowMap.autoUpdate = auto; this.insetCard.visible = true;
  }

  // ---------- camera ----------
  fovFor(aspect) {
    // Hold the horizontal angle near 64 deg on very wide TV fields: no fish-eye stretching.
    const v = 2 * Math.atan(Math.tan(32 * Math.PI / 180) / aspect) * 180 / Math.PI;
    return Math.min(46, Math.max(24, v));
  }
  fit(points, pitch, yaw, box = {x: .9, top: .72, bottom: -.88}) {
    const T = this.T, cam = this.fitCam, dir = new T.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    cam.fov = this.camera.fov; cam.aspect = this.camera.aspect; cam.updateProjectionMatrix();
    const min = new T.Vector3(Infinity, Infinity, Infinity), max = new T.Vector3(-Infinity, -Infinity, -Infinity); for (const p of points) {min.min(p); max.max(p);}
    const target = min.clone().add(max).multiplyScalar(.5), v = this.v1, place = d => {cam.position.copy(target).addScaledVector(dir, d); cam.lookAt(target); cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();};
    const bounds = () => {let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, behind = false; for (const p of points) {v.copy(p).project(cam); if (v.z > 1) behind = true; x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);} return {x0, x1, y0, y1, behind};};
    let d = 20;
    for (let pass = 0; pass < 3; pass++) {
      let lo = 1.5, hi = 90;
      for (let k = 0; k < 22; k++) {d = (lo + hi) / 2; place(d); const b = bounds(); if (!b.behind && b.x0 >= -box.x && b.x1 <= box.x && b.y0 >= box.bottom && b.y1 <= box.top) hi = d; else lo = d;}
      d = hi; place(d); const b = bounds();
      // Centre the content inside the safe box (camera space shift at the target depth).
      const halfH = Math.tan(cam.fov * Math.PI / 360) * d, halfW = halfH * cam.aspect;
      const sx = ((b.x0 + b.x1) / 2) * halfW, sy = ((b.y0 + b.y1) / 2 - (box.top + box.bottom) / 2) * halfH;
      const right = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
      target.addScaledVector(right, sx).addScaledVector(up, sy);
    }
    place(d); return {pos: cam.position.clone(), look: target.clone()};
  }
  housePoints(extra = []) {
    const T = this.T, h = this.house, r = h.r + R + .1, pts = [];
    for (let i = 0; i < 12; i++) {const a = i / 12 * Math.PI * 2; pts.push(new T.Vector3(h.x + Math.cos(a) * r, 0, h.z + Math.sin(a) * r));}
    for (const p of extra) pts.push(new T.Vector3(p.x - R, 0, p.z - R), new T.Vector3(p.x + R, .5, p.z + R), new T.Vector3(p.x + R, 0, p.z - R), new T.Vector3(p.x - R, .5, p.z + R));
    return pts;
  }
  updateCamera(s, active, positions, dt, stageChanged) {
    const T = this.T, cam = this.camera, fov = this.fovFor(cam.aspect || 1.7) + (this.feel?.fovKick || 0);
    if (Math.abs(cam.fov - fov) > .01) {cam.fov = fov; cam.updateProjectionMatrix();}
    const live = [...positions.values()], h = this.house, deg = Math.PI / 180;
    let shot, speed = 2.1; this.houseView = false;
    const lastStone = (s.throwIndex || 0) >= (s.throwCount || 0) - 1;
    if (s.phase === 'results' || s.stage === 'end' || (s.stage === 'reveal' && lastStone)) {
      // Readable diagonal top view over the house: all scoring candidates in frame.
      const near = live.filter(p => Math.hypot(p.x - h.x, p.z - h.z) <= 6.5);
      const drift = this.reduced ? 0 : Math.sin(this.clock * .32) * 5 * deg;
      shot = this.fit(this.housePoints(near), 58 * deg, 12 * deg + drift, {x: .86, top: .66, bottom: -.84}); speed = 1.7; this.houseView = true;
    } else if ((s.stage === 'rolling' || s.stage === 'reveal') && active && positions.has(active.id)) {
      // Look ahead at most ~9 m: a close chase early, the contact/stop area as the stone slows.
      const p = positions.get(active.id), v = this.velocity(active.id), sp = Math.hypot(v.vx, v.vz), reach = Math.min(9, sp * sp / (2 * FRICTION));
      const ux = sp > .05 ? v.vx / sp : 0, uz = sp > .05 ? v.vz / sp : -1;
      const stop = {x: Math.max(-EDGE_X, Math.min(EDGE_X, p.x + ux * reach)), z: Math.max(EDGE_BACK, Math.min(EDGE_FRONT, p.z + uz * reach))};
      const pts = [new T.Vector3(p.x - .7, 0, p.z + .9), new T.Vector3(p.x + .7, .55, p.z - .5), new T.Vector3(stop.x - .8, 0, stop.z - .8), new T.Vector3(stop.x + .8, 0, stop.z + .8)];
      // Fit the whole joined brush alongside the moving stone, including its handle.
      for (const broom of this.brooms) if (broom.visible) {broom.updateMatrixWorld(true); for (const corner of [[-.45,.01,-.18],[.45,.16,.18],[0,1.58,.72]]) pts.push(new T.Vector3(...corner).applyMatrix4(broom.matrixWorld));}
      // Stones near the remaining path: the camera shows the contact area before it happens.
      for (const q of live) {if (q === p) continue; const t = Math.max(0, Math.min(1, ((q.x - p.x) * (stop.x - p.x) + (q.z - p.z) * (stop.z - p.z)) / Math.max(1e-6, (stop.x - p.x) ** 2 + (stop.z - p.z) ** 2))), cx = p.x + (stop.x - p.x) * t, cz = p.z + (stop.z - p.z) * t; if (Math.hypot(q.x - cx, q.z - cz) < 2.2) pts.push(new T.Vector3(q.x - R, 0, q.z - R), new T.Vector3(q.x + R, .5, q.z + R));}
      if (stop.z < h.z + h.r + 1.5) pts.push(...this.housePoints());
      for (const {obj} of this.fading) if (obj.userData.fade.reason !== 'clear') pts.push(new T.Vector3(obj.position.x - R, 0, obj.position.z - R), new T.Vector3(obj.position.x + R, 1.3, obj.position.z + R));
      const nearHouse = smooth((4 - p.z) / 12), pitch = (24 + 16 * nearHouse) * deg, yaw = Math.max(-.12, Math.min(.12, -p.x * .02));
      // House close-up: a slow stone that will stop in (or next to) the house gets a tighter,
      // steeper shot of the rings and the stones around its stopping point.
      const settling = sp < 1.3 && p.z < h.z + h.r + 3 && Math.hypot(stop.x - h.x, stop.z - h.z) < h.r + 1.6;
      if (settling && !this.reduced) {const near = live.filter(q => Math.hypot(q.x - stop.x, q.z - stop.z) < 3.4 || Math.hypot(q.x - h.x, q.z - h.z) <= h.r + R); shot = this.fit(this.housePoints([...near, stop]), 50 * deg, yaw, {x: .84, top: .66, bottom: -.82}); speed = 1.5; this.houseView = true;}
      else {shot = this.fit(pts, pitch, yaw, {x: .88, top: .7, bottom: -.86}); speed = 2.4;}
    }
    // Choreographed chase / crane / measure shots (curling-feel.js); default framing otherwise.
    const directed = (s.phase === 'playing' && s.stage !== 'end') ? this.feel?.shot(s, active, positions, {lastStone, live}) : null;
    if (directed) {shot = directed.shot; speed = directed.speed; this.houseView = directed.houseView;}
    else if (!shot) {
      // Aim: release stone, the full sheet width at the release line and the house with any guards.
      const pts = [new T.Vector3(-EDGE_X, 0, RELEASE + .6), new T.Vector3(EDGE_X, 0, RELEASE + .6), new T.Vector3(0, .55, RELEASE), ...this.housePoints(live.filter(p => p.z < 4))];
      shot = this.fit(pts, 21 * deg, 0, {x: .92, top: .7, bottom: -.9}); speed = 2.8;
    }
    // Keep inside the room.
    shot.pos.y = Math.min(8.8, Math.max(1.2, shot.pos.y)); shot.pos.z = Math.min(35, shot.pos.z); shot.pos.x = Math.max(-11, Math.min(11, shot.pos.x));
    if (!this.cameraReady) {this.camPos.copy(shot.pos); this.camLook.copy(shot.look); this.cameraReady = true;}
    const k = 1 - Math.exp(-dt * (this.reduced ? Math.max(5, speed * 2.5) : speed));
    this.camPos.lerp(shot.pos, k); this.camLook.lerp(shot.look, k);
    cam.position.copy(this.camPos); cam.lookAt(this.camLook);
    cam.updateMatrixWorld(); this.feel?.postCamera(s, cam, this.camLook, dt);
    // Measure only: the ceiling clamp and camera interpolation can invalidate the
    // destination fit. Keep the whole house and stone bodies clear of the actual HUD.
    if (s.phase === 'results' || s.stage === 'end' || (s.stage === 'reveal' && lastStone)) {
      this.keepMeasureVisible(live);
    }
  }

  keepMeasureVisible(live) {
    const bounds = this.presentationBounds; if (!bounds) return;
    const cam = this.camera, T = this.T, h = this.house, margin = 10;
    const box = {left: 2 * (bounds.left + margin) / bounds.width - 1, right: 2 * (bounds.right - margin) / bounds.width - 1,
      top: 1 - 2 * (bounds.top + margin) / bounds.height, bottom: 1 - 2 * (bounds.bottom - margin) / bounds.height};
    const points = this.housePoints(live.filter(p => Math.hypot(p.x - h.x, p.z - h.z) <= 6.5));
    const v = this.v1, fits = () => points.every(p => {v.copy(p).project(cam); return v.z <= 1 && v.x >= box.left && v.x <= box.right && v.y >= box.bottom && v.y <= box.top;});
    cam.updateMatrixWorld(); if (fits()) return;
    const origin = cam.position.clone(), away = origin.clone().sub(this.camLook).normalize();
    const place = d => {cam.position.copy(origin).addScaledVector(away, d); cam.position.y = Math.min(8.8, cam.position.y); cam.position.z = Math.min(35, cam.position.z); cam.position.x = Math.max(-11, Math.min(11, cam.position.x)); cam.lookAt(this.camLook); cam.updateMatrixWorld();};
    let lo = 0, hi = 24; place(hi);
    if (fits()) for (let i = 0; i < 12; i++) {const mid = (lo + hi) / 2; place(mid); if (fits()) hi = mid; else lo = mid;}
    place(hi); this.camPos.copy(cam.position);
  }

  dispose() {
    window.removeEventListener('pagehide', this.onHide); this.audio?.dispose();
    this.extras?.dispose(); this.extras = null; this.ice?.dispose(); this.arena?.dispose(); this.feel?.dispose();
    this.scene.remove(this.root); this.scene.environment = null;
    for (const x of this.disposables) x.dispose?.();
    this.disposables.clear(); delete window.__ssCurlingDiag;
  }
}
