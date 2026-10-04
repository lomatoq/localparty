// Curling ice surface layer ("Ice & Nerves"): makes the sheet read as deep, cold, pebbled
// ice instead of a flat floor. Presentation only, fed from the scene's interpolated stones.
// - Clear top coat over the painted markings: cool subsurface haze with slow cloudy depth,
//   a grazing-angle sheen, and view-dependent pebble glints that twinkle as the camera moves.
// - Logos painted under the ice (event wordmark between hog line and delivery, HeyPals marks).
// - Scratch map that accumulates during an end: faint running-band scuffs along every stone
//   path and polished swirls where the team swept; it fades out (resurface) on a new end.
// Bounded: one canvas (192x768) uploaded at most ~20 Hz while dirty; one extra draw call each
// for the top coat and the logo decal. Reduced motion: glints are static (no time twinkle).

const R = .43, EDGE_X = 3.35 + R, EDGE_BACK = -14.6 - R, EDGE_FRONT = 15 + R, LEN = EDGE_FRONT - EDGE_BACK;
const SW = 192, SH = 768; // scratch map: ~4 cm per texel

const COAT_VERT = `varying vec3 vW; varying vec2 vS;
uniform vec4 uSheet;
void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vS=vec2((w.x-uSheet.x)/uSheet.y,(w.z-uSheet.w)/uSheet.z);gl_Position=projectionMatrix*viewMatrix*w;}`;
const COAT_FRAG = `uniform sampler2D uScratch; uniform float uTime; uniform float uGlint; uniform vec3 uTint; uniform float uFade;
varying vec3 vW; varying vec2 vS;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
void main(){
  vec3 V=normalize(cameraPosition-vW);
  float graze=1.-clamp(V.y,0.,1.);
  float fres=graze*graze*graze*graze;
  // Subsurface depth: slow cloudy variation (frozen layers), cooler towards the boards.
  float cloud=vnoise(vW.xz*vec2(.55,.22))*.6+vnoise(vW.xz*1.7+3.1)*.4;
  float edge=smoothstep(.55,1.,abs(vW.x)/${EDGE_X.toFixed(3)});
  vec4 sc=texture2D(uScratch,vS);
  // Haze: thin cool veil over the paint (markings read under the surface), thicker at grazing angles.
  float haze=.1+.07*cloud+.2*edge+.2*fres;
  haze*=1.-.55*sc.g;                       // swept ice is clearer
  // Deep blue in the body of the ice, cooler and darker towards the boards; white sheen at grazing angles.
  vec3 col=mix(uTint,vec3(.42,.6,.82),edge*.7);
  col=mix(col,vec3(.93,.97,1.),.25+.5*fres);
  // Running-band scuffs: matte white scratches that collect along stone paths during the end.
  float scuff=sc.r;
  col=mix(col,vec3(.97,.99,1.),clamp(scuff*1.6,0.,1.));
  float a=haze+scuff*.42;
  // Pebble glints: one droplet per 4.5 cm cell with its own tilt; lit when its normal bisects
  // the overhead lamps and the eye. Footprint fade keeps distant cells from shimmering.
  vec2 g=vW.xz/.045, gi=floor(g), gf=fract(g)-.5;
  float r1=h21(gi), r2=h21(gi+17.3), r3=h21(gi+31.7);
  vec2 off=(vec2(r1,r2)-.5)*.6; float d=length(gf-off);
  vec3 n=normalize(vec3((r2-.5)*2.2,1.,(r3-.5)*2.2));
  vec3 L=normalize(vec3(sin(vW.z*.11)*.15,1.,.12));
  float spec=pow(max(dot(n,normalize(L+V)),0.),90.);
  float foot=fwidth(g.x)+fwidth(g.y);
  float dot1=smoothstep(.28,.06,d)*(1.-smoothstep(.25,.9,foot));
  float tw=.65+.35*sin(uTime*(1.5+r1*2.5)+r3*40.);
  float glint=spec*dot1*tw*uGlint*(1.-.6*scuff)*(1.+1.5*sc.g);
  // Swept polish: a soft wet gloss streak where brooms worked.
  float polish=sc.g*(.10+.35*fres);
  col+=vec3(.85,.95,1.)*(glint*3.2+polish);
  a=clamp(a+glint*.9+polish*.6,0.,.92)*uFade;
  gl_FragColor=vec4(col,a);
}`;

export class CurlingIce {
  constructor(sc) {
    this.sc = sc; this.T = sc.T; this.reduced = !!sc.reduced; this.low = !!sc.low;
    const T = this.T, mid = (EDGE_FRONT + EDGE_BACK) / 2;
    this.root = new T.Group(); this.root.name = 'curling-ice'; sc.root.add(this.root);
    // Scratch canvas: R = running-band scuffs, G = swept polish. Drawn additively.
    this.canvas = document.createElement('canvas'); this.canvas.width = SW; this.canvas.height = SH;
    this.ctx = this.canvas.getContext('2d'); this.ctx.fillStyle = '#000'; this.ctx.fillRect(0, 0, SW, SH);
    this.scratchTex = sc.track(new T.CanvasTexture(this.canvas)); this.scratchTex.colorSpace = T.NoColorSpace; this.scratchTex.minFilter = T.LinearFilter; this.scratchTex.generateMipmaps = false;
    this.uniforms = {
      uScratch: {value: this.scratchTex}, uTime: {value: 0}, uGlint: {value: this.low ? 0 : 1},
      uTint: {value: new T.Color('#86b4e0')}, uFade: {value: 1},
      uSheet: {value: new T.Vector4(-EDGE_X, EDGE_X * 2, LEN, EDGE_BACK)}
    };
    const coatMat = sc.track(new T.ShaderMaterial({uniforms: this.uniforms, vertexShader: COAT_VERT, fragmentShader: COAT_FRAG, transparent: true, depthWrite: false}));
    this.coat = new T.Mesh(sc.geo(new T.PlaneGeometry(EDGE_X * 2, LEN)), coatMat);
    this.coat.rotation.x = -Math.PI / 2; this.coat.position.set(0, .0046, mid); this.coat.renderOrder = 4; this.root.add(this.coat);
    this.buildLogos(mid);
    this.last = new Map(); this.dirty = false; this.frame = 0; this.endKey = null; this.resurface = 0;
  }
  // World (x, z) -> scratch canvas pixels.
  px(x, z) {return [(x + EDGE_X) / (EDGE_X * 2) * SW, (z - EDGE_BACK) / LEN * SH];} // canvas top = house end (flipY)

  buildLogos(mid) {
    const T = this.T, sc = this.sc;
    // Paint under the ice: event wordmark between hog line and delivery, HeyPals marks by the hog line.
    const W = 1024, H = 2048, can = document.createElement('canvas'); can.width = W; can.height = H;
    const c = can.getContext('2d'), tex = sc.track(new T.CanvasTexture(can)); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = Math.min(8, sc.renderer.capabilities.getMaxAnisotropy());
    // Canvas spans x [-EDGE_X, EDGE_X], z [EDGE_BACK, EDGE_FRONT]; y = (EDGE_FRONT - z) / LEN * H.
    const Y = z => (z - EDGE_BACK) / LEN * H, X = x => (x + EDGE_X) / (EDGE_X * 2) * W; // canvas top = house end (flipY)
    const paint = img => {
      c.clearRect(0, 0, W, H);
      const font = s => `italic 900 ${s}px KardiaFatRunner, HeyPalsDisplay, system-ui, sans-serif`;
      // HeyPals wordmarks either side of the centre line, just past the hog line (read from the thrower).
      c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
      for (const sx of [-1.95, 1.95]) {c.save(); c.translate(X(sx), Y(-2.2)); c.font = font(54); c.fillStyle = 'rgba(122,74,214,.55)'; c.fillText('HeyPals', 0, 0); c.restore();}
      c.restore();
      // Event wordmark (generated logo when available, drawn text otherwise).
      const cx = X(0), cy = Y(6.6), w = W * .64;
      // Frozen-in paint: faded wordmark under a frost veil (it must not compete with the stones).
      if (img?.naturalWidth) {const h = w * img.naturalHeight / img.naturalWidth; c.globalAlpha = .4; c.drawImage(img, cx - w / 2, cy - h / 2, w, h); c.globalAlpha = 1; c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(214,232,248,.45)'; c.fillRect(cx - w / 2, cy - h / 2, w, h); c.globalCompositeOperation = 'source-over';}
      else {c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = font(120); c.fillStyle = 'rgba(70,150,230,.5)'; c.fillText('ICE & NERVES', cx, cy);}
      tex.needsUpdate = true;
    };
    paint(null);
    const img = new Image(); img.decoding = 'async'; img.onload = () => {if (this.logo) paint(img);}; img.src = '/assets/game-logos-v1/logos/curling.png';
    document.fonts?.ready?.then(() => {if (this.logo && !img.naturalWidth) paint(null);}).catch(() => {});
    const mat = sc.track(new T.MeshBasicMaterial({map: tex, transparent: true, depthWrite: false, opacity: .9}));
    this.logo = new T.Mesh(sc.geo(new T.PlaneGeometry(EDGE_X * 2, LEN)), mat);
    this.logo.rotation.x = -Math.PI / 2; this.logo.position.set(0, .0019, mid); this.logo.renderOrder = 1.5; this.root.add(this.logo);
  }

  // Stroke from the last drawn point once a stone has moved ~20 cm (butt caps: no overdraw).
  trace(positions, s) {
    const c = this.ctx; c.globalCompositeOperation = 'lighter'; c.lineCap = 'butt';
    const sweeping = s.stage === 'rolling' && (s.sweepAmount || 0) > 0, active = s.stones?.at(-1), k = SW / (EDGE_X * 2);
    for (const [id, p] of positions) {
      const prev = this.last.get(id);
      if (!prev) {this.last.set(id, {x: p.x, z: p.z}); continue;}
      const dx = p.x - prev.x, dz = p.z - prev.z, l = Math.hypot(dx, dz);
      if (l < .2) continue; this.last.set(id, {x: p.x, z: p.z}); if (l > 1.5) continue;
      const nx = -dz / l, nz = dx / l, [ax, ay] = this.px(prev.x, prev.z), [bx, by] = this.px(p.x, p.z);
      // Soft wear band the width of the running surface, plus two crisp hairlines at its rim.
      c.strokeStyle = 'rgba(30,0,0,1)'; c.lineWidth = .46 * k; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
      c.strokeStyle = 'rgba(64,0,0,1)'; c.lineWidth = 1;
      for (const o of [-.2, .2]) {const [sx, sy] = this.px(prev.x + nx * o, prev.z + nz * o), [ex, ey] = this.px(p.x + nx * o, p.z + nz * o); c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.stroke();}
      this.dirty = true;
    }
    // Swept polish in front of the active stone: short strokes across the path (broom scrubs).
    const a = active && positions.get(active.id);
    if (sweeping && a && this.sweepPrev) {
      const dx = a.x - this.sweepPrev.x, dz = a.z - this.sweepPrev.z, l = Math.hypot(dx, dz);
      if (l > .06) {
        const ux = dx / l, uz = dz / l, nx = -uz, nz = ux;
        for (let i = 0; i < 2; i++) {
          const ahead = .5 + Math.random() * .6, side = (Math.random() - .5) * .7, qx = a.x + ux * ahead + nx * side, qz = a.z + uz * ahead + nz * side;
          const [sx, sy] = this.px(qx - nx * .3, qz - nz * .3), [ex, ey] = this.px(qx + nx * .3, qz + nz * .3);
          c.strokeStyle = 'rgba(0,40,0,1)'; c.lineWidth = 2; c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.stroke();
        }
        this.sweepPrev = {x: a.x, z: a.z}; this.dirty = true;
      }
    } else this.sweepPrev = a ? {x: a.x, z: a.z} : null;
    c.globalCompositeOperation = 'source-over';
  }

  update(s, dt, positions) {
    this.uniforms.uTime.value = this.reduced ? 0 : this.uniforms.uTime.value + dt;
    // New end: the ice is "resurfaced" - accumulated scratches fade out over ~1.6 s.
    const key = s.phase === 'playing' ? s.endIndex : null;
    if (key !== this.endKey) {if (this.endKey !== null || s.phase !== 'playing') this.resurface = this.reduced ? 1 : 1.6; this.endKey = key; this.last.clear();}
    if (this.resurface > 0) {
      this.resurface = Math.max(0, this.resurface - dt); const c = this.ctx;
      c.globalCompositeOperation = 'source-over'; c.fillStyle = this.resurface > 0 ? 'rgba(0,0,0,.09)' : '#000'; c.fillRect(0, 0, SW, SH); this.dirty = true;
    }
    if (s.phase === 'playing' && (s.stage === 'rolling' || s.stage === 'reveal')) this.trace(positions, s);
    else for (const [id, p] of positions) this.last.set(id, {x: p.x, z: p.z});
    if (this.dirty && (this.frame++ % 3 === 0)) {this.scratchTex.needsUpdate = true; this.dirty = false;}
  }
  diagnostics() {return {resurface: +this.resurface.toFixed(2), tracked: this.last.size};}
  dispose() {this.root.parent?.remove(this.root); this.logo = null;}
}
