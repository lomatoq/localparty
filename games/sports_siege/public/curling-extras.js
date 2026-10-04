// Curling arena extras ("Ice & Nerves"): presentation-only life layered on CurlingScene.
// Sweeping haze spotlights that chase the stone and converge on the house, a rink-end LED
// scoreboard and side LED ribbons fed from the snapshot (end, score, stones), team banners
// with cloth motion, lamp reflections and a speed sheen on the ice, frost spray from the
// brooms, contact sparks, a measuring pulse over the rings, counted-stone light pillars and
// team-colour confetti on a scoring end. Server snapshots stay authoritative: nothing here
// changes positions, validity or score. Everything is pooled/bounded and released with the
// scene. Reduced motion: static beams/cloth/LED, no confetti or sparks, no camera changes.

const TEAM = [
  {main: '#ff8a76', deep: '#d9564a', pale: '#ffd2c8', mark: 'ring'},
  {main: '#4fd9e8', deep: '#1597ad', pale: '#c4f6fb', mark: 'cross'}
];
const GOLD = '#ffd84a';
const R = .43, EDGE_X = 3.35 + R, EDGE_BACK = -14.6 - R, EDGE_FRONT = 15 + R;
const LAYER = 1; // main camera only: the overhead inset (layer 0) stays clean
const REFL = 2;  // ice mirror pass: stones and brooms only
const smooth = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const rnd = seed => {const n = Math.sin(seed * 12.9898 + 78.233) * 43758.5453; return n - Math.floor(n);};

const BEAM_VERT = `varying vec3 vN; varying vec3 vV; varying float vY; varying float vD;
void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);vY=uv.y;vD=-mv.z;gl_Position=projectionMatrix*mv;}`;
const BEAM_FRAG = `uniform vec3 uColor; uniform float uInt; uniform float uTime; varying vec3 vN; varying vec3 vV; varying float vY; varying float vD;
void main(){float f=abs(dot(normalize(vN),normalize(vV)));float edge=pow(f,1.7);float along=smoothstep(0.,.42,vY)*(.55+.45*vY)*smoothstep(2.5,11.,vD);
float haze=.8+.2*sin(vY*17.-uTime*.8)*sin(vY*5.3+uTime*.37);gl_FragColor=vec4(uColor*uInt*edge*along*haze,1.);}`;

export class CurlingExtras {
  constructor(sc) {
    this.sc = sc; this.T = sc.T; this.reduced = !!sc.reduced; this.low = !!sc.low;
    const T = this.T;
    this.root = new T.Group(); this.root.name = 'curling-extras'; sc.root.add(this.root);
    this.clock = 0; this.lastT = 0; this.u = new T.Object3D(); this.v = new T.Vector3(); this.w = new T.Vector3(); this.c = new T.Color();
    this.state = {mode: 'idle', team: null, since: 0}; this.flash = {team: null, until: -9, points: 0};
    this.textures(); this.buildBeams(); this.buildLed(); this.buildBanners(); this.buildIce(); this.buildParticles(); this.buildHouseFx(); this.buildAmbient(); this.buildReflection();
    this.root.traverse(o => o.layers.set(LAYER)); sc.camera.layers.enable(LAYER);
    window.__ssCurlingExtras = this; // QA probe handle (presentation only), removed on dispose
    if (document.fonts?.ready) document.fonts.ready.then(() => {this.ledKey = ''; this.ribbonKey = '';}).catch(() => {});
  }
  t(x) {return this.sc.track(x);}
  add(o, parent = this.root) {parent.add(o); return o;}

  // ---------- textures ----------
  textures() {
    const sc = this.sc;
    this.softTex = sc.canvas(128, 128, (c, w) => {const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w);});
    this.sparkTex = sc.canvas(64, 64, (c, w) => {const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.18, 'rgba(255,255,255,.95)'); g.addColorStop(.45, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w);});
    this.lampTex = sc.canvas(64, 128, (c, w, h) => {
      const v = c.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(255,255,255,0)'); v.addColorStop(.25, 'rgba(255,255,255,.85)'); v.addColorStop(.75, 'rgba(255,255,255,.85)'); v.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = v; c.fillRect(0, 0, w, h);
      const x = c.createLinearGradient(0, 0, w, 0); x.addColorStop(0, 'rgba(0,0,0,0)'); x.addColorStop(.35, 'rgba(0,0,0,1)'); x.addColorStop(.65, 'rgba(0,0,0,1)'); x.addColorStop(1, 'rgba(0,0,0,0)'); c.globalCompositeOperation = 'destination-in'; c.fillStyle = x; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'source-over';
    });
    this.ringTex = sc.canvas(256, 256, (c, w) => {const g = c.createRadialGradient(w / 2, w / 2, w * .36, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.55, 'rgba(255,255,255,1)'); g.addColorStop(.7, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w);});
    this.mistTex = sc.canvas(256, 128, (c, w, h) => {
      for (let i = 0; i < 26; i++) {const x = w * (.15 + rnd(i + 3) * .7), y = h * (.3 + rnd(i + 9) * .4), r = 18 + rnd(i + 15) * 34, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(235,244,255,.22)'); g.addColorStop(1, 'rgba(235,244,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);}
    });
  }

  // ---------- haze spotlights ----------
  beamMaterial(color, intensity) {
    return this.t(new this.T.ShaderMaterial({uniforms: {uColor: {value: new this.T.Color(color)}, uInt: {value: intensity}, uTime: {value: 0}}, vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG, transparent: true, depthWrite: false, blending: this.T.AdditiveBlending, side: this.T.DoubleSide}));
  }
  buildBeams() {
    const T = this.T;
    const cone = this.t(new T.CylinderGeometry(.14, 1, 1, 40, 1, true)); cone.translate(0, -.5, 0);
    const pool = this.t(new T.PlaneGeometry(1, 1)); this.poolGeo = pool;
    const housing = this.t(new T.CylinderGeometry(.2, .28, .45, 16)), lens = this.t(new T.CircleGeometry(.2, 20));
    const dark = this.t(new T.MeshStandardMaterial({color: '#1c1828', roughness: .5, metalness: .6}));
    // Truss across the ceiling carrying the rig.
    const truss = this.add(new T.Mesh(this.t(new T.BoxGeometry(18, .16, .16)), dark)); truss.position.set(0, 9.25, -5);
    this.beams = [
      {src: new T.Vector3(-8.2, 9.1, -5), phase: 0, side: -1},
      {src: new T.Vector3(8.2, 9.1, -5), phase: 2.1, side: 1}
    ].map(b => {
      const mat = this.beamMaterial('#e9e4ff', .6), mesh = this.add(new T.Mesh(cone, mat)); mesh.renderOrder = 9; mesh.frustumCulled = false;
      const poolMat = this.t(new T.MeshBasicMaterial({map: this.softTex, color: '#ffffff', transparent: true, opacity: .18, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false}));
      const spot = this.add(new T.Mesh(pool, poolMat)); spot.rotation.x = -Math.PI / 2; spot.renderOrder = 4;
      const head = this.add(new T.Mesh(housing, dark)); head.position.copy(b.src).add(new T.Vector3(0, .12, 0));
      const glass = this.add(new T.Mesh(lens, this.t(new T.MeshBasicMaterial({color: '#fff6e8', toneMapped: false})))); glass.position.copy(b.src);
      return {...b, mat, mesh, spot, head, glass, target: new T.Vector3(b.side * 1.2, 0, -9), color: new T.Color('#e9e4ff'), int: .6};
    });
    // Overhead column on the button for the measure / score moment.
    this.column = this.add(new T.Mesh(cone, this.beamMaterial(GOLD, 0))); this.column.position.set(0, 9.2, -9); this.column.scale.set(2.9, 9.2, 2.9); this.column.renderOrder = 9; this.column.visible = false;
  }
  aimBeam(b, target, dt, color, intensity, speed) {
    const k = 1 - Math.exp(-dt * (this.reduced ? 20 : speed));
    b.target.lerp(target, k); b.color.lerp(this.c.set(color), 1 - Math.exp(-dt * 4)); b.int += (intensity - b.int) * (1 - Math.exp(-dt * 3));
    const dir = this.v.copy(b.target).sub(b.src), len = dir.length(); dir.normalize();
    b.mesh.position.copy(b.src); b.mesh.quaternion.setFromUnitVectors(this.w.set(0, -1, 0), dir);
    const rad = .95 + len * .055; b.mesh.scale.set(rad, len, rad);
    b.mat.uniforms.uColor.value.copy(b.color); b.mat.uniforms.uInt.value = b.int; b.mat.uniforms.uTime.value = this.clock + b.phase;
    // Floor pool: broad and faint (no hard ellipse around the stone); on the ice it fades
    // further while the beam chases a moving stone, which already carries its own sheen.
    const onIce = b.target.y < .05 && Math.abs(b.target.x) < EDGE_X, chase = this.state.mode === 'rolling' ? .3 : 1;
    b.spot.position.set(b.target.x, b.target.y + .006, b.target.z); b.spot.scale.set(rad * 3.4, rad * 3.8, 1); b.spot.material.color.copy(b.color); b.spot.material.opacity = Math.min(.1, b.int * .2) * (onIce ? chase : 1);
    b.glass.quaternion.setFromUnitVectors(this.w.set(0, 0, 1), dir);
  }

  // ---------- LED scoreboard + ribbons ----------
  buildLed() {
    const T = this.T, sc = this.sc, w = 6.6, h = .92;
    this.ledCanvas = document.createElement('canvas'); this.ledCanvas.width = 1152; this.ledCanvas.height = 160;
    this.ledTex = this.t(new T.CanvasTexture(this.ledCanvas)); this.ledTex.colorSpace = T.SRGBColorSpace; this.ledTex.anisotropy = 8;
    const frame = this.t(new T.MeshStandardMaterial({color: '#151221', roughness: .45, metalness: .5}));
    this.led = new T.Group(); this.led.position.set(0, .82, EDGE_BACK - .32); this.add(this.led);
    this.add(new T.Mesh(this.t(new T.BoxGeometry(w + .2, h + .16, .14)), frame), this.led).position.z = -.08;
    this.ledScreen = this.add(new T.Mesh(this.t(new T.PlaneGeometry(w, h)), this.t(new T.MeshBasicMaterial({map: this.ledTex, toneMapped: false}))), this.led);
    this.ledGlow = this.add(new T.Mesh(this.t(new T.PlaneGeometry(w + 1.6, h + 1.2)), this.t(new T.MeshBasicMaterial({map: this.softTex, color: '#9b5cff', transparent: true, opacity: .2, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false}))), this.led);
    this.ledGlow.position.z = -.16;
    // Side ribbons at the glass base: slow scrolling team pattern, flare in the scoring colour.
    this.ribbonCanvas = document.createElement('canvas'); this.ribbonCanvas.width = 1024; this.ribbonCanvas.height = 64;
    this.ribbonTex = this.t(new T.CanvasTexture(this.ribbonCanvas)); this.ribbonTex.colorSpace = T.SRGBColorSpace; this.ribbonTex.wrapS = T.RepeatWrapping; this.ribbonTex.anisotropy = 8; this.ribbonTex.repeat.set(5, 1);
    this.ribbonMat = this.t(new T.MeshBasicMaterial({map: this.ribbonTex, toneMapped: false, color: '#d8d0ff'}));
    // LED band along the top of the dasher boards (curling-arena.js), above the sponsor panels.
    const geo = this.t(new T.PlaneGeometry(32.6, .22));
    this.ribbons = [-1, 1].map(s => {const m = this.add(new T.Mesh(geo, this.ribbonMat)); m.position.set(s * 4.938, .74, .6); m.rotation.y = -s * Math.PI / 2; return m;});
    this.ledKey = ''; this.ribbonKey = ''; this.ledDraw = 0;
  }
  font(size) {return `italic 900 ${size}px KardiaFatRunner, HeyPalsDisplay, system-ui, sans-serif`;}
  mark(c, team, x, y, r) {
    const t = TEAM[team], g = c.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); g.addColorStop(0, t.pale); g.addColorStop(.6, t.main); g.addColorStop(1, t.deep);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.strokeStyle = c.fillStyle = '#fff'; c.lineCap = 'round';
    if (team === 0) {c.lineWidth = r * .18; c.beginPath(); c.arc(x, y, r * .58, 0, 7); c.stroke(); c.beginPath(); c.arc(x, y, r * .18, 0, 7); c.fill();}
    else {c.lineWidth = r * .26; c.beginPath(); c.moveTo(x - r * .42, y - r * .42); c.lineTo(x + r * .42, y + r * .42); c.moveTo(x + r * .42, y - r * .42); c.lineTo(x - r * .42, y + r * .42); c.stroke();}
  }
  drawLed(s) {
    const ru = this.sc.lang() === 'ru', teams = s.teams || [0, 0], fl = this.flash, flashing = fl.team !== null && this.clock < fl.until;
    const measuring = this.state.mode === 'measure', thrown = Math.min(s.throwCount || 0, (s.throwIndex || 0) + (s.stage === 'aim' ? 0 : 1));
    const key = [ru, teams.join(), s.endIndex, s.endCount, thrown, s.throwCount, flashing && fl.team, flashing && fl.points, measuring, s.phase].join('|');
    if (key === this.ledKey) return; this.ledKey = key;
    const c = this.ledCanvas.getContext('2d'), w = this.ledCanvas.width, h = this.ledCanvas.height;
    c.clearRect(0, 0, w, h);
    const bg = c.createLinearGradient(0, 0, w, 0); bg.addColorStop(0, '#2a1222'); bg.addColorStop(.5, '#140f26'); bg.addColorStop(1, '#0d2230'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (flashing) {
      const t = TEAM[fl.team], g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, t.deep); g.addColorStop(.5, t.main); g.addColorStop(1, t.deep); c.fillStyle = g; c.fillRect(0, 0, w, h);
      this.mark(c, fl.team, 120, h / 2, 52); this.mark(c, fl.team, w - 120, h / 2, 52);
      c.font = this.font(104); c.fillStyle = '#fff'; c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 12; c.fillText('+' + fl.points, w / 2, h / 2 + 6); c.shadowBlur = 0;
    } else {
      this.mark(c, 0, 92, h / 2, 50); this.mark(c, 1, w - 92, h / 2, 50);
      c.font = this.font(108); c.fillStyle = TEAM[0].pale; c.fillText(String(teams[0]), 250, h / 2 + 6); c.fillStyle = TEAM[1].pale; c.fillText(String(teams[1]), w - 250, h / 2 + 6);
      c.font = this.font(44); c.fillStyle = measuring ? GOLD : '#efe9ff';
      c.fillText(measuring ? (ru ? 'ЗАМЕР' : 'MEASURE') : (ru ? 'ЭНД ' : 'END ') + (s.endIndex || 1) + '/' + (s.endCount || 1), w / 2, 52);
      const n = s.throwCount || 0, gap = Math.min(48, 380 / Math.max(1, n)), x0 = w / 2 - gap * (n - 1) / 2;
      for (let i = 0; i < n; i++) {const team = i % 2 === 0 ? (this.firstTeam ?? 0) : 1 - (this.firstTeam ?? 0), used = i < thrown; c.globalAlpha = used ? .28 : 1; c.fillStyle = TEAM[team].main; c.beginPath(); c.arc(x0 + i * gap, 112, 13, 0, 7); c.fill(); c.globalAlpha = 1;}
    }
    // LED pixel grid + glossy top edge.
    c.fillStyle = 'rgba(0,0,0,.22)'; for (let x = 0; x < w; x += 4) c.fillRect(x, 0, 1, h); for (let y = 0; y < h; y += 4) c.fillRect(0, y, w, 1);
    const gl = c.createLinearGradient(0, 0, 0, h); gl.addColorStop(0, 'rgba(255,255,255,.14)'); gl.addColorStop(.4, 'rgba(255,255,255,0)'); c.fillStyle = gl; c.fillRect(0, 0, w, h);
    this.ledTex.needsUpdate = true;
  }
  drawRibbon(s) {
    const teams = s.teams || [0, 0], key = teams.join() + '|' + this.sc.lang();
    if (key === this.ribbonKey) return; this.ribbonKey = key;
    const c = this.ribbonCanvas.getContext('2d'), w = this.ribbonCanvas.width, h = this.ribbonCanvas.height;
    const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#1b1030'); g.addColorStop(.5, '#2a1240'); g.addColorStop(1, '#1b1030'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let k = 0; k < 2; k++) {
      const x = k * w / 2;
      this.mark(c, 0, x + 60, h / 2, 22); c.font = this.font(40); c.fillStyle = TEAM[0].pale; c.fillText(String(teams[0]), x + 110, h / 2 + 3);
      c.fillStyle = '#efe9ff'; c.font = this.font(30); c.fillText('ICE & NERVES', x + 256, h / 2 + 2);
      c.font = this.font(40); c.fillStyle = TEAM[1].pale; c.fillText(String(teams[1]), x + 402, h / 2 + 3); this.mark(c, 1, x + 452, h / 2, 22);
    }
    c.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 0; x < w; x += 3) c.fillRect(x, 0, 1, h);
    this.ribbonTex.needsUpdate = true;
  }

  // ---------- team banners ----------
  bannerTexture(team) {
    const t = TEAM[team];
    return this.sc.canvas(256, 512, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0); c.lineTo(w, h); c.lineTo(w / 2, h * .84); c.lineTo(0, h); c.closePath();
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, t.main); g.addColorStop(1, t.deep); c.fillStyle = g; c.fill();
      c.save(); c.clip(); c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(0, 34, w, 10); c.fillStyle = GOLD; c.fillRect(0, 48, w, 6);
      c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 18; for (let y = 120; y < h + 200; y += 70) {c.beginPath(); c.moveTo(-20, y); c.lineTo(w + 20, y - 120); c.stroke();}
      c.restore();
      this.mark(c, team, w / 2, h * .42, 72);
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 6; c.beginPath(); c.moveTo(3, 0); c.lineTo(3, h - 6); c.moveTo(w - 3, 0); c.lineTo(w - 3, h - 6); c.stroke();
    });
  }
  buildBanners() {
    const T = this.T, mats = [0, 1].map(team => this.t(new T.MeshStandardMaterial({map: this.bannerTexture(team), side: T.DoubleSide, alphaTest: .5, roughness: .78})));
    const rod = this.t(new T.CylinderGeometry(.035, .035, 1.6, 8)), rodMat = this.t(new T.MeshStandardMaterial({color: '#d9d4ea', metalness: .8, roughness: .3}));
    this.banners = [];
    let i = 0;
    // Rink-end banner bar behind the LED board: coral on the left, turquoise on the right.
    const bar = this.add(new T.Mesh(this.t(new T.BoxGeometry(11.6, .1, .1)), rodMat)); bar.position.set(0, 3.98, -17.6);
    for (const x of [-5.6, 5.6]) {const cable = this.add(new T.Mesh(this.t(new T.CylinderGeometry(.012, .012, 5.6, 4)), rodMat)); cable.position.set(x, 6.8, -17.6);}
    for (const x of [-4.6, -2.5, 2.5, 4.6]) {
      const team = x < 0 ? 0 : 1, geo = this.t(new T.PlaneGeometry(1.4, 2.5, 6, 12)), m = this.add(new T.Mesh(geo, mats[team]));
      m.position.set(x, 2.68, -17.6); m.castShadow = false;
      const r = this.add(new T.Mesh(rod, rodMat)); r.rotation.set(0, 0, Math.PI / 2); r.position.set(x, 3.93, -17.58);
      geo.userData.base = Float32Array.from(geo.getAttribute('position').array);
      this.banners.push({mesh: m, geo, phase: rnd(i * 7 + 1) * 6.28, team}); i++;
    }
    this.bannerFrame = 0;
  }
  updateBanners(dt) {
    if (this.reduced) {if (this.bannerStill) return; this.bannerStill = true;}
    if (this.low && this.bannerFrame++ % 2) return;
    const cheer = this.clock < this.flash.until ? 1 : 0;
    for (const b of this.banners) {
      const pos = b.geo.getAttribute('position'), base = b.geo.userData.base, amp = this.reduced ? 0 : .07 + .08 * cheer + (this.flash.team === b.team ? .06 * cheer : 0);
      for (let k = 0; k < pos.count; k++) {
        const x = base[k * 3], y = base[k * 3 + 1], hang = Math.pow((1.25 - y) / 2.5, 1.3);
        pos.setZ(k, amp * hang * (Math.sin(this.clock * 1.6 + b.phase + y * 2.3 + x * 1.7) + .45 * Math.sin(this.clock * 2.9 + b.phase * 2 + x * 3.1)));
      }
      pos.needsUpdate = true; b.geo.computeVertexNormals();
    }
  }

  // ---------- ice: lamp reflections + speed sheen ----------
  buildIce() {
    const T = this.T, mat = this.t(new T.MeshBasicMaterial({map: this.lampTex, color: '#fff4e6', transparent: true, opacity: .04, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false}));
    this.lampRefl = []; const geo = this.t(new T.PlaneGeometry(1, 1));
    for (const x of [-2.6, 2.6]) for (let z = -18; z <= 22; z += 8) {const m = this.add(new T.Mesh(geo, mat)); m.rotation.x = -Math.PI / 2; m.renderOrder = 4; m.userData.lamp = new T.Vector3(x, 9.45, z); this.lampRefl.push(m);}
    this.sheen = this.add(new T.Mesh(geo, this.t(new T.MeshBasicMaterial({map: this.softTex, color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false}))));
    this.sheen.rotation.order = 'YXZ'; this.sheen.renderOrder = 4; this.sheen.visible = false;
  }
  updateIce(s, active, positions) {
    const cam = this.sc.camera;
    for (const m of this.lampRefl) {
      const L = m.userData.lamp, t = cam.position.y / (cam.position.y + L.y);
      const x = cam.position.x + (L.x - cam.position.x) * t, z = cam.position.z + (L.z - cam.position.z) * t;
      const inside = Math.abs(x) < EDGE_X - .45 && z > EDGE_BACK + .4 && z < EDGE_FRONT - .4;
      m.visible = inside; if (!inside) continue;
      m.position.set(x, .007, z); m.scale.set(.32 * t + .08, 4.2 * t + 1, 1);
      const fade = Math.min(1, (EDGE_X - .45 - Math.abs(x)) / .6) * Math.min(1, (z - EDGE_BACK - .4) / 1.5, (EDGE_FRONT - .4 - z) / 1.5);
      m.scale.multiplyScalar(.6 + .4 * fade);
    }
    const p = active && positions.get(active.id), v = p ? this.sc.velocity(active.id) : null, sp = v ? Math.hypot(v.vx, v.vz) : 0;
    this.sheen.visible = !!p && s.stage === 'rolling' && sp > .15;
    if (this.sheen.visible) {
      const k = Math.min(1, sp / 2.5), ux = v.vx / sp, uz = v.vz / sp;
      this.sheen.position.set(p.x - ux * (.35 + .5 * k), .009, p.z - uz * (.35 + .5 * k)); this.sheen.rotation.set(-Math.PI / 2, Math.atan2(ux, uz), 0, 'YXZ');
      this.sheen.scale.set(1.25, 1.4 + 2.2 * k, 1); this.sheen.material.color.set(TEAM[active.team].pale); this.sheen.material.opacity = .05 + .12 * k;
    }
  }

  // ---------- planar ice reflection of stones and brooms ----------
  // A low-resolution mirror pass renders only the stones/brooms (layer REFL) from a camera
  // reflected in the ice plane; the ice and the painted markings sample it projectively,
  // slightly broken up by the pebble bump. Low resolution gives the soft, polished-ice blur.
  buildReflection() {
    if (this.low) return;
    const T = this.T, sc = this.sc;
    this.reflRT = this.t(new T.WebGLRenderTarget(4, 4, {type: T.HalfFloatType, depthBuffer: true}));
    this.reflCam = new T.PerspectiveCamera(); this.reflCam.layers.set(REFL);
    this.reflUniforms = {uRefl: {value: this.reflRT.texture}, uReflMatrix: {value: new T.Matrix4()}, uReflK: {value: .5}};
    const U = this.reflUniforms, patch = mat => {
      mat.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, U);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform mat4 uReflMatrix; varying vec4 vReflCoord;').replace('#include <project_vertex>', '#include <project_vertex>\nvReflCoord = uReflMatrix * modelMatrix * vec4(transformed, 1.0);');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uRefl; uniform float uReflK; varying vec4 vReflCoord;').replace('#include <opaque_fragment>', 'vec4 rc = vReflCoord; rc.xy += (normal.xy - nonPerturbedNormal.xy) * .35 * rc.w;\nvec4 refl = texture2DProj(uRefl, rc);\nfloat reflF = 1. - clamp(dot(normalize(vViewPosition), nonPerturbedNormal), 0., 1.);\noutgoingLight = mix(outgoingLight, refl.rgb, clamp(refl.a, 0., 1.) * uReflK * (.45 + .55 * reflF * reflF));\n#include <opaque_fragment>');
      };
      mat.customProgramCacheKey = () => 'curling-ice-reflection'; mat.needsUpdate = true;
    };
    for (const k of ['ice', 'ring12', 'ring8', 'ring4', 'button', 'line', 'hog']) if (sc.mat[k]) patch(sc.mat[k]);
    this.reflSize = new T.Vector2(); this.reflLightsFor = 0;
  }
  updateReflection(s) {
    if (!this.reflRT) return;
    // Between throws stones are still and the camera eases slowly: refresh every third frame.
    if (s?.stage !== 'rolling' && (this.reflFrame = (this.reflFrame || 0) + 1) % 3) return;
    const T = this.T, sc = this.sc, r = sc.renderer, cam = sc.camera, rc = this.reflCam;
    // Stones, the next stone and brooms join the mirror layer (their blob shadows do not).
    const tag = g => {if (!g || g.userData.reflTagged) return; g.userData.reflTagged = true; g.traverse(o => {if (o.isMesh && o !== g.userData.blob) o.layers.enable(REFL);});};
    for (const g of sc.stones.values()) tag(g); for (const g of sc.next) tag(g); for (const g of sc.brooms) tag(g);
    // Lights must be identical in both passes (no shader variants): enable them on REFL too.
    if (this.reflLightsFor !== sc.scene.children.length) {this.reflLightsFor = sc.scene.children.length; sc.scene.traverse(o => {if (o.isLight) o.layers.enable(REFL);});}
    r.getDrawingBufferSize(this.reflSize); const w = Math.max(64, Math.round(this.reflSize.x / 3)), h = Math.max(64, Math.round(this.reflSize.y / 3));
    if (this.reflRT.width !== w || this.reflRT.height !== h) this.reflRT.setSize(w, h);
    // Mirror the camera in the ice plane (y = 0): position, look target and up are reflected.
    cam.updateMatrixWorld(); const e = cam.matrixWorld.elements, p = this.v.setFromMatrixPosition(cam.matrixWorld);
    rc.position.set(p.x, -p.y, p.z); rc.up.set(e[4], -e[5], e[6]); this.w.set(p.x - e[8], -(p.y - e[9]), p.z - e[10]); rc.lookAt(this.w);
    rc.fov = cam.fov; rc.aspect = cam.aspect; rc.near = cam.near; rc.far = cam.far; rc.updateProjectionMatrix(); rc.updateMatrixWorld();
    this.reflUniforms.uReflMatrix.value.set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1).multiply(rc.projectionMatrix).multiply(rc.matrixWorldInverse);
    const prev = r.getRenderTarget(), auto = r.shadowMap.autoUpdate, alpha = r.getClearAlpha(); r.getClearColor(this.c);
    const bg = sc.scene.background, fog = sc.scene.fog; sc.scene.background = null; sc.scene.fog = null;
    r.shadowMap.autoUpdate = false; r.setRenderTarget(this.reflRT); r.setClearColor(0x000000, 0); r.clear(); r.render(sc.scene, rc);
    r.setRenderTarget(prev); r.setClearColor(this.c, alpha); r.shadowMap.autoUpdate = auto; sc.scene.background = bg; sc.scene.fog = fog;
  }

  // ---------- particles ----------
  buildParticles() {
    const T = this.T, geo = this.t(new T.PlaneGeometry(1, 1));
    this.sparkCap = this.low ? 120 : 260; this.sparks = [];
    this.sparkMesh = this.add(new T.InstancedMesh(geo, this.t(new T.MeshBasicMaterial({map: this.sparkTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false})), this.sparkCap));
    this.sparkMesh.count = 0; this.sparkMesh.frustumCulled = false; this.sparkMesh.renderOrder = 12; this.sparkMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    this.sparkMesh.setColorAt(0, this.c.set('#fff')); this.sparkMesh.instanceColor.setUsage(T.DynamicDrawUsage);
    this.confCap = this.low ? 70 : 150; this.confetti = [];
    this.confMesh = this.add(new T.InstancedMesh(this.t(new T.PlaneGeometry(.1, .06)), this.t(new T.MeshBasicMaterial({side: T.DoubleSide, toneMapped: false})), this.confCap));
    this.confMesh.count = 0; this.confMesh.frustumCulled = false; this.confMesh.renderOrder = 11; this.confMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    this.confMesh.setColorAt(0, this.c.set('#fff')); this.confMesh.instanceColor.setUsage(T.DynamicDrawUsage);
    // Contact flash + shock ring pools.
    const flashMat = () => this.t(new T.SpriteMaterial({map: this.sparkTex, color: '#fff6dc', transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false, opacity: 0}));
    this.flashes = Array.from({length: 3}, () => {const f = this.add(new T.Sprite(flashMat())); f.visible = false; f.renderOrder = 13; f.userData.born = -9; return f;});
    const ringGeo = this.t(new T.PlaneGeometry(1, 1));
    this.shocks = Array.from({length: 4}, () => {const r = this.add(new T.Mesh(ringGeo, this.t(new T.MeshBasicMaterial({map: this.ringTex, color: '#dff4ff', transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false})))); r.rotation.x = -Math.PI / 2; r.renderOrder = 6; r.visible = false; r.userData.born = -9; return r;});
  }
  spark(p) {if (this.sparks.length >= this.sparkCap) this.sparks.shift(); this.sparks.push({grav: 0, drag: 1.5, stretch: 0, ...p, born: this.clock + (p.delay || 0)});}
  updateParticles(dt) {
    const cam = this.sc.camera, u = this.u, aspect = cam.aspect || 1.7;
    this.sparks = this.sparks.filter(p => this.clock - p.born < p.life); let n = 0;
    for (const p of this.sparks) {
      const age = this.clock - p.born, k = age / p.life, drag = Math.exp(-p.drag * dt);
      if (age < 0) continue; // staggered (fireworks)
      p.vx *= drag; p.vz *= drag; p.vy = p.vy * drag - p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.y < .02) {p.y = .02; p.vy = Math.abs(p.vy) * .25;}
      u.position.set(p.x, p.y, p.z); u.quaternion.copy(cam.quaternion);
      let sx = p.size, sy = p.size;
      if (p.stretch) {
        const a = this.v.set(p.x, p.y, p.z).project(cam), b = this.w.set(p.x + p.vx * .05, p.y + p.vy * .05, p.z + p.vz * .05).project(cam);
        const dx = (b.x - a.x) * aspect, dy = b.y - a.y, l = Math.hypot(dx, dy); u.rotateZ(Math.atan2(dy, dx)); sx = p.size * (1 + Math.min(4, l * 60 * p.stretch));
      }
      const fade = (1 - k) * Math.min(1, age * 12), tw = p.twinkle ? .6 + .4 * Math.sin(this.clock * 14 + p.born * 31) : 1;
      u.scale.set(sx * (.4 + .6 * fade), sy * (.4 + .6 * fade), 1); u.updateMatrix(); this.sparkMesh.setMatrixAt(n, u.matrix);
      this.sparkMesh.setColorAt(n++, this.c.set(p.color).multiplyScalar(fade * tw * (p.gain || 1)));
    }
    this.sparkMesh.count = n; this.sparkMesh.instanceMatrix.needsUpdate = true; if (this.sparkMesh.instanceColor) this.sparkMesh.instanceColor.needsUpdate = true;
    this.confetti = this.confetti.filter(p => this.clock - p.born < p.life); let m = 0;
    for (const p of this.confetti) {
      const age = this.clock - p.born, drag = Math.exp(-(p.vy < 0 ? 2.6 : .7) * dt);
      if (age < 0) continue; // staggered launch
      p.vx *= drag; p.vz *= drag; p.vy = Math.max(-1.1, p.vy - 6.5 * dt); p.x += (p.vx + Math.sin(this.clock * 5 + p.ph) * .35) * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.y < .03) {p.y = .03; p.vx = p.vz = p.vy = 0; p.rest = true;}
      u.position.set(p.x, p.y, p.z);
      if (p.rest) u.rotation.set(-Math.PI / 2, 0, p.ph); else u.rotation.set(age * p.rx + p.ph, age * p.ry, age * p.rz);
      const fade = 1 - smooth((age - (p.life - .6)) / .6); u.scale.setScalar(Math.max(.001, fade)); u.updateMatrix(); this.confMesh.setMatrixAt(m, u.matrix); this.confMesh.setColorAt(m++, this.c.set(p.color));
    }
    this.confMesh.count = m; this.confMesh.instanceMatrix.needsUpdate = true; if (this.confMesh.instanceColor) this.confMesh.instanceColor.needsUpdate = true;
    for (const f of this.flashes) {const a = (this.clock - f.userData.born) / .26; f.visible = a < 1; if (!f.visible) continue; f.scale.setScalar(f.userData.size * (.6 + .6 * smooth(a))); f.material.opacity = (1 - a) * .95;}
    for (const r of this.shocks) {const a = (this.clock - r.userData.born) / .55; r.visible = a < 1; if (!r.visible) continue; const k = 1 - Math.pow(1 - a, 3); r.scale.setScalar(.6 + k * r.userData.size); r.material.opacity = (1 - a) * .8;}
  }

  // ---------- house: measure pulse, column, counted pillars ----------
  buildHouseFx() {
    const T = this.T, h = this.sc.house;
    this.ringPulse = [1, 2 / 3, 1 / 3].map((f, i) => {const m = this.add(new T.Mesh(this.t(new T.RingGeometry(h.r * f - .05, h.r * f + .05, 128)), this.t(new T.MeshBasicMaterial({color: GOLD, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false})))); m.rotation.x = -Math.PI / 2; m.position.set(h.x, .016, h.z); m.renderOrder = 6; m.visible = false; m.userData.i = i; return m;});
    const pillarGeo = this.t(new T.CylinderGeometry(.5, .5, 1, 28, 1, true)); pillarGeo.translate(0, .5, 0);
    // Pillar: same haze shader, upright (bright at the ice, fading upwards).
    const pillarFrag = BEAM_FRAG.replace('smoothstep(0.,.42,vY)*(.55+.45*vY)', '(1.-vY)*(1.-vY)');
    this.pillarMats = TEAM.map(t => this.t(new T.ShaderMaterial({uniforms: {uColor: {value: new T.Color(t.main)}, uInt: {value: .55}, uTime: {value: 0}}, vertexShader: BEAM_VERT, fragmentShader: pillarFrag, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide})));
    this.pillars = Array.from({length: 8}, () => {const m = this.add(new T.Mesh(pillarGeo, this.pillarMats[0])); m.visible = false; m.renderOrder = 9; m.frustumCulled = false; return m;});
    this.pillarKey = '';
  }
  updateHouse(s, positions, dt) {
    const h = this.sc.house, mode = this.state.mode, score = mode === 'score' && this.state.team !== null, measure = mode === 'measure';
    const on = measure || score, age = this.clock - this.state.since, col = score ? TEAM[this.state.team].main : GOLD;
    for (const r of this.ringPulse) {
      r.visible = on; if (!on) continue; r.position.set(h.x, .016, h.z); r.material.color.set(col);
      const ph = this.reduced ? .5 : ((this.clock * (measure ? 1.4 : .8) - r.userData.i * .28) % 1 + 1) % 1;
      r.material.opacity = (score ? .55 : .75) * (this.reduced ? .6 : .3 + .7 * Math.pow(1 - ph, 2)) * smooth(age / .4);
    }
    const colTarget = on ? (score ? .16 : .13) : 0;
    const ci = this.column.material.uniforms.uInt; ci.value += (colTarget - ci.value) * (1 - Math.exp(-dt * 3)); this.column.visible = ci.value > .005;
    this.column.position.set(h.x, 9.2, h.z); this.column.material.uniforms.uColor.value.set(col); this.column.material.uniforms.uTime.value = this.clock;
    // Counted stones (server endScores) get a rising light pillar in the team colour.
    const result = score ? s.endScores?.[Math.max(0, (s.endIndex || 1) - 1)] : null, ids = result?.team === this.state.team ? result.ids || [] : [];
    const key = ids.join() + ':' + this.state.team;
    if (key !== this.pillarKey) {this.pillarKey = key; this.pillarBorn = this.clock;}
    this.pillars.forEach((m, i) => {
      const id = ids[i], p = id !== undefined ? positions.get(id) : null; m.visible = !!p; if (!p) return;
      m.material = this.pillarMats[this.state.team]; m.material.uniforms.uTime.value = this.clock;
      const pop = this.reduced ? 1 : smooth((this.clock - this.pillarBorn - .35 - i * .18) / .6); m.visible = pop > .01;
      m.position.set(p.x, .01, p.z); m.scale.set(.95, 3.4 * pop, .95);
    });
  }

  // ---------- ambient: mist + motes ----------
  buildAmbient() {
    const T = this.T;
    this.mist = Array.from({length: this.low ? 4 : 8}, (_, i) => {
      const s = this.add(new T.Sprite(this.t(new T.SpriteMaterial({map: this.mistTex, color: '#dfe9ff', transparent: true, opacity: .0, depthWrite: false, toneMapped: false}))));
      s.userData = {x: (rnd(i + 2) - .5) * 7, z: -16 + i * (30 / 8) + rnd(i + 5) * 2, y: .35 + rnd(i + 8) * .35, speed: (.08 + rnd(i + 11) * .1) * (i % 2 ? 1 : -1), op: .22 + rnd(i + 13) * .14};
      s.scale.set(6, 1.6, 1); s.renderOrder = 10; return s;
    });
    this.moteCap = this.low ? 24 : 48;
    this.motes = this.add(new T.InstancedMesh(this.t(new T.PlaneGeometry(1, 1)), this.t(new T.MeshBasicMaterial({map: this.sparkTex, color: '#fff4dc', transparent: true, opacity: .75, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false})), this.moteCap));
    this.motes.frustumCulled = false; this.motes.renderOrder = 12; this.motes.instanceMatrix.setUsage(T.DynamicDrawUsage);
    this.moteData = Array.from({length: this.moteCap}, (_, i) => ({x: (rnd(i + 31) - .5) * 7, y: 1 + rnd(i + 37) * 7, z: -14 + rnd(i + 41) * 12, ph: rnd(i + 43) * 6.28, s: .025 + rnd(i + 47) * .03}));
    // Ice twinkles: tiny glints that light up on the pebble around the house between throws.
    this.twinkles = [];
  }
  updateAmbient(s, dt) {
    const idle = s.phase !== 'playing' || s.stage === 'aim' || s.stage === 'end';
    for (const m of this.mist) {
      const d = m.userData; if (!this.reduced) {d.x += d.speed * dt; if (d.x > 6) d.x = -6; if (d.x < -6) d.x = 6;}
      m.position.set(d.x, d.y, d.z); const edge = 1 - smooth((Math.abs(d.x) - 4) / 2);
      m.material.opacity += ((idle ? d.op : d.op * .6) * edge - m.material.opacity) * Math.min(1, dt * 2);
    }
    const u = this.u, cam = this.sc.camera;
    this.moteData.forEach((p, i) => {
      const t = this.reduced ? 0 : this.clock;
      const x = p.x + Math.sin(t * .23 + p.ph) * .5, y = p.y + Math.sin(t * .17 + p.ph * 2) * .4, z = p.z + Math.cos(t * .19 + p.ph) * .5;
      // Brightest inside the beams' haze: distance to each beam axis.
      let lit = .12; for (const b of this.beams) {const d = this.v.set(x, y, z).sub(b.src), dir = this.w.copy(b.target).sub(b.src), len = dir.length(); dir.divideScalar(len); const along = Math.max(0, Math.min(len, d.dot(dir))), rad = .2 + along * .1, off = d.addScaledVector(dir, -along).length(); lit = Math.max(lit, (1 - smooth(off / rad)) * b.int * 1.4);}
      const tw = this.reduced ? .8 : .55 + .45 * Math.sin(this.clock * 2.3 + p.ph * 3);
      u.position.set(x, y, z); u.quaternion.copy(cam.quaternion); u.scale.setScalar(p.s * (.5 + Math.min(1, lit)) * tw); u.updateMatrix(); this.motes.setMatrixAt(i, u.matrix);
    });
    this.motes.instanceMatrix.needsUpdate = true;
    // Between throws: a few sparkles wink on the ice around the house.
    if (idle && !this.reduced && rnd(this.clock * 17) < dt * 3 && this.sparks.length < this.sparkCap - 20) {
      const h = this.sc.house, a = rnd(this.clock * 3) * 6.28, r = rnd(this.clock * 5) * (h.r + 1.2);
      this.spark({x: h.x + Math.cos(a) * r, y: .03, z: h.z + Math.sin(a) * r, vx: 0, vy: 0, vz: 0, life: .9 + rnd(this.clock) * .6, size: .16 + rnd(this.clock * 9) * .12, color: '#eaf6ff', twinkle: true, gain: .8});
    }
  }

  // ---------- events from the scene ----------
  contact(x, z, power = .5) {
    const f = this.flashes.reduce((a, b) => a.userData.born < b.userData.born ? a : b); f.userData.born = this.clock; f.userData.size = 1.2 + 1.4 * power; f.position.set(x, .3, z); f.visible = true;
    const r = this.shocks.reduce((a, b) => a.userData.born < b.userData.born ? a : b); r.userData.born = this.clock; r.userData.size = 2.2 + 2.4 * power; r.position.set(x, .017, z); r.visible = true;
    if (this.reduced) return;
    const n = Math.round(14 + 18 * Math.min(1, power));
    for (let i = 0; i < n; i++) {
      const a = rnd(this.clock * 7 + i) * 6.28, sp = 1.8 + rnd(i * 3 + this.clock) * 4.2 * (.5 + power);
      this.spark({x, y: .18, z, vx: Math.cos(a) * sp, vy: .6 + rnd(i * 5.7 + this.clock) * 2.2, vz: Math.sin(a) * sp, grav: 7, drag: 2.2, life: .3 + rnd(i * 1.3) * .35, size: .07 + rnd(i * 2.1) * .05, color: i % 3 ? '#fff1c8' : '#bfe8ff', stretch: 1, gain: 1.4});
    }
  }
  effect(e, s) {
    if (e.kind !== 'score' || !(e.points > 0) || e.team === null || e.team === undefined) return;
    if (typeof e.at === 'number' && Math.max(this.lastT, s?.t || 0) - e.at > 1.5) return; // replayed after a TV reload: no stale party
    if (this.celebrated === e.id) return; this.celebrated = e.id;
    // Celebration scales with the end: 1 point is a nod, 3+ is a party.
    const pts = Math.min(4, e.points), scale = .35 + .2 * pts;
    this.flash = {team: e.team, until: this.clock + 2.4 + .5 * pts, points: e.points}; this.ledKey = '';
    this.sc.feel?.celebrate(e.points, e.team);
    if (this.reduced) return;
    const h = this.sc.house, t = TEAM[e.team], cols = [t.main, t.pale, t.deep, '#ffffff', GOLD];
    for (const side of [-1, 1]) for (let i = 0; i < Math.round(this.confCap / 2 * Math.min(1, scale)); i++) {
      if (this.confetti.length >= this.confCap) this.confetti.shift();
      const k = rnd(i * 3.1 + side + this.clock);
      this.confetti.push({x: side * (EDGE_X - .3), y: .4, z: h.z + (rnd(i * 7.7 + side) - .5) * 3, vx: -side * (1.4 + k * 3.2), vy: 5.2 + rnd(i * 1.7 + side) * 3.4, vz: (rnd(i * 5.3 - side) - .5) * 2.4,
        rx: 2 + rnd(i) * 7, ry: 1 + rnd(i + 1) * 5, rz: 1 + rnd(i + 2) * 6, ph: rnd(i + 3) * 6.28, color: cols[i % cols.length], born: this.clock + rnd(i * 9.1) * .25, life: 3.6 + rnd(i * 2.9) * 1.2});
    }
    const ringN = Math.round(18 + 9 * pts); for (let i = 0; i < ringN; i++) {const a = i / ringN * 6.28, sp = 2.6 + rnd(i) * 1.2; this.spark({x: h.x, y: 2.2, z: h.z, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .55 + .6, vz: Math.sin(a) * sp * .45, grav: 1.6, drag: 1.6, life: 1.1 + rnd(i * 4) * .4, size: .14, color: i % 2 ? t.main : GOLD, twinkle: true, gain: 1.3});}
  }

  // ---------- per frame ----------
  update(s, dt, positions, active) {
    this.clock += dt; if (typeof s.t === 'number') this.lastT = s.t;
    const lastStone = (s.throwIndex || 0) >= (s.throwCount || 0) - 1;
    const result = s.stage === 'end' || (s.phase === 'results' && s.endScores?.length) ? s.endScores?.[Math.max(0, (s.endIndex || 1) - 1)] : null;
    const mode = result ? 'score' : s.stage === 'reveal' && lastStone ? 'measure' : s.stage === 'rolling' ? 'rolling' : 'idle';
    const team = result ? result.team : null;
    if (mode !== this.state.mode || team !== this.state.team) this.state = {mode, team, since: this.clock};
    if (s.stage === 'aim' && s.players) {const cur = s.players.find(p => p.id === s.currentId); if (cur && (s.throwIndex || 0) === 0) this.firstTeam = cur.team;}

    // Spotlights: idle sweep around the house, chase the moving stone, converge for the measure/score.
    const h = this.sc.house, p = active && positions.get(active.id);
    this.beams.forEach((b, i) => {
      let target = this.v.set(0, 0, 0), color = '#e9e4ff', int = .15, speed = 1.2;
      if (mode === 'score' && team !== null) {
        const ids = result.ids || [], q = positions.get(ids[i % Math.max(1, ids.length)]) || h; target.set(q.x + (i ? .25 : -.25), 0, q.z); color = TEAM[team].main; int = .42; speed = 2.2;
      } else if (mode === 'measure' || mode === 'score') {target.set(h.x + (i ? 1.7 : -1.7), 0, h.z + .6); color = '#fff0c0'; int = .36; speed = 2;}
      else if (mode === 'rolling' && p) {
        const v = this.sc.velocity(active.id), lead = Math.min(1.5, Math.hypot(v.vx, v.vz) * .5);
        target.set(p.x + (i ? .35 : -.35), 0, p.z + Math.sign(v.vz || -1) * lead); color = i ? '#f3f0ff' : TEAM[active.team].pale; int = this.sc.houseView ? .12 : .26; speed = 3.2; // crane looks down the cones: keep the house clear
      } else {
        // Between throws the rig sweeps the opposite stands: light washing over the crowd.
        const t = this.reduced ? b.phase : this.clock * .17 + b.phase;
        target.set(-b.side * (6.6 + .9 * Math.sin(t * 1.7)), 1.25 + .35 * Math.sin(t * 1.7), -2 + Math.sin(t) * 9); int = .5; speed = 1.4;
      }
      if (target.y === 0) {target.z = Math.max(EDGE_BACK + .6, Math.min(13, target.z)); target.x = Math.max(-EDGE_X + .3, Math.min(EDGE_X - .3, target.x));}
      this.aimBeam(b, target, dt, color, int, speed);
    });

    this.drawLed(s); this.drawRibbon(s);
    const fl = this.flash.team !== null && this.clock < this.flash.until;
    this.ledGlow.material.color.set(fl ? TEAM[this.flash.team].main : mode === 'measure' ? GOLD : '#9b5cff');
    this.ledGlow.material.opacity = fl ? .45 + (this.reduced ? 0 : .15 * Math.sin(this.clock * 8)) : .2;
    if (!this.reduced) this.ribbonTex.offset.x = (this.ribbonTex.offset.x + dt * .035) % 1;
    this.ribbonMat.color.set(fl ? TEAM[this.flash.team].pale : '#d8d0ff');

    this.updateBanners(dt);
    this.updateIce(s, active, positions);
    this.updateHouse(s, positions, dt);
    this.updateAmbient(s, dt);
    // Frost spray from the brooms while the team sweeps.
    if (!this.reduced && s.stage === 'rolling' && (s.sweepAmount || 0) > 0 && p) {
      const v = this.sc.velocity(active.id), sp = Math.hypot(v.vx, v.vz) || 1, ux = v.vx / sp, uz = v.vz / sp;
      for (const broom of this.sc.brooms) if (broom.visible && this.sparks.length < this.sparkCap - 6) for (let k = 0; k < 2; k++) {
        const side = rnd(this.clock * 41 + k) < .5 ? -1 : 1, sp2 = .7 + rnd(this.clock * 13 + k) * 1.3;
        this.spark({x: broom.position.x, y: .05, z: broom.position.z, vx: -uz * side * sp2 + ux * .3, vy: .35 + rnd(this.clock * 7 + k) * .6, vz: ux * side * sp2 + uz * .3, grav: 2.4, drag: 2.5, life: .35 + rnd(this.clock * 3 + k) * .3, size: .05 + rnd(this.clock * 19 + k) * .04, color: k ? '#e8f8ff' : '#9fdcff', stretch: .6, gain: 1.1});
      }
    }
    this.updateParticles(dt);
    this.updateReflection(s);
  }

  dispose() {
    this.sc.camera.layers.disable(LAYER); if (window.__ssCurlingExtras === this) delete window.__ssCurlingExtras;
    this.root.parent?.remove(this.root);
    // Geometries/materials/textures were registered with the scene's tracker and are disposed with it.
  }
}
