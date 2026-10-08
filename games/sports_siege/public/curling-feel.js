// Curling game feel + camera choreography ("Ice & Nerves"). Presentation only: the server
// snapshot stays authoritative for every position, validity decision and score.
// - Camera: low chase behind the sliding stone with lag (the house far ahead), a rising crane
//   as the stone nears the house, a near top-down measure shot, idle breathing between throws,
//   trauma shake and a short FOV push on release/contact/score.
// - Hit-stop: on a stone-stone contact the TV holds interpolation for 50-120 ms (render time
//   only; it catches up smoothly afterwards).
// - Spin-off: struck stones get a decaying extra handle spin and a small wobble.
// - Release: launch puff + ring at the hack, spin ring decal under the moving stone so the
//   handle's turn direction reads at a glance.
// - Sweep: frost bursts on every broom stroke reversal, speed streaks on the ice.
// - House drama: live shot-stone ring + distance ring around the button while stones settle.
// - Celebration scaled by the end's points.
// Reduced motion: no hit-stop, shake, FOV push, drift, streaks, bursts or chase/crane shots.

const TEAM = [
  {main: '#ff8a76', deep: '#d9564a', pale: '#ffd2c8'},
  {main: '#4fd9e8', deep: '#1597ad', pale: '#c4f6fb'}
];
const R = .43, EDGE_X = 3.35 + R, RELEASE = 13;
const LAYER = 1;
const smooth = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const rnd = seed => {const n = Math.sin(seed * 12.9898 + 78.233) * 43758.5453; return n - Math.floor(n);};

export class CurlingFeel {
  constructor(sc) {
    this.sc = sc; this.T = sc.T; this.reduced = !!sc.reduced; this.low = !!sc.low;
    const T = this.T;
    this.root = new T.Group(); this.root.name = 'curling-feel'; sc.root.add(this.root);
    this.clock = 0; this.trauma = 0; this.freezeUntil = -9; this.freezeScale = 1; this.fovKick = 0; this.fovVel = 0;
    this.spinOff = new Map(); this.strokeSign = [0, 0]; this.lastRot = new Map(); this.shotId = null; this.shotAt = -9;
    this.v = new T.Vector3(); this.w = new T.Vector3(); this.u = new T.Object3D(); this.c = new T.Color();
    this.buildSpinRing(); this.buildStreaks(); this.buildHouse(); this.buildLaunch();
    this.root.traverse(o => o.layers.set(LAYER));
  }
  t(x) {return this.sc.track(x);}

  // ---------- resources ----------
  buildSpinRing() {
    const T = this.T;
    // Three curved arrows around the stone: rotates with the stone, so turn direction reads.
    const tex = this.sc.canvas(256, 256, (c, w) => {
      c.clearRect(0, 0, w, w); c.translate(w / 2, w / 2); c.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const a0 = i * 2.094 + .25, a1 = a0 + 1.35, r = 104;
        const g = c.createLinearGradient(Math.cos(a0) * r, Math.sin(a0) * r, Math.cos(a1) * r, Math.sin(a1) * r); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,1)');
        c.strokeStyle = g; c.lineWidth = 10; c.beginPath(); c.arc(0, 0, r, a0, a1); c.stroke();
        const hx = Math.cos(a1) * r, hy = Math.sin(a1) * r, tx = -Math.sin(a1), ty = Math.cos(a1);
        c.fillStyle = '#fff'; c.beginPath(); c.moveTo(hx + tx * 22, hy + ty * 22); c.lineTo(hx - ty * 15 - tx * 4, hy + tx * 15 - ty * 4); c.lineTo(hx + ty * 15 - tx * 4, hy - tx * 15 - ty * 4); c.closePath(); c.fill();
      }
    });
    this.spinRing = new T.Mesh(this.sc.geo(new T.PlaneGeometry(1.5, 1.5)), this.t(new T.MeshBasicMaterial({map: tex, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false})));
    this.spinRing.rotation.order = 'YXZ'; this.spinRing.renderOrder = 6; this.spinRing.visible = false; this.root.add(this.spinRing);
  }
  buildStreaks() {
    const T = this.T, tex = this.sc.canvas(128, 16, (c, w, h) => {const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.75, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); const v = c.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(.5, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)'); c.globalCompositeOperation = 'destination-out'; c.fillStyle = v; c.fillRect(0, 0, w, h);});
    this.streakCap = this.low ? 0 : 28; this.streaks = [];
    if (!this.streakCap) return;
    this.streakMesh = new T.InstancedMesh(this.sc.geo(new T.PlaneGeometry(1, 1)), this.t(new T.MeshBasicMaterial({map: tex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false})), this.streakCap);
    this.streakMesh.count = 0; this.streakMesh.frustumCulled = false; this.streakMesh.renderOrder = 7; this.streakMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    this.streakMesh.setColorAt(0, this.c.set('#fff')); this.streakMesh.instanceColor.setUsage(T.DynamicDrawUsage); this.root.add(this.streakMesh);
  }
  buildHouse() {
    const T = this.T, ringTex = this.sc.canvas(256, 256, (c, w) => {const g = c.createRadialGradient(w / 2, w / 2, w * .3, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.62, 'rgba(255,255,255,.95)'); g.addColorStop(.72, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w);});
    // Shot-stone halo (under the stone, team colour) and the live distance ring around the button.
    this.shotRing = new T.Mesh(this.sc.geo(new T.PlaneGeometry(1.55, 1.55)), this.t(new T.MeshBasicMaterial({map: ringTex, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false})));
    this.shotRing.rotation.x = -Math.PI / 2; this.shotRing.renderOrder = 5; this.shotRing.visible = false; this.root.add(this.shotRing);
    const dash = this.sc.canvas(1024, 8, (c, w, h) => {c.clearRect(0, 0, w, h); c.fillStyle = '#fff'; for (let x = 0; x < w; x += 32) c.fillRect(x, 0, 20, h);});
    dash.wrapS = T.RepeatWrapping;
    this.distRing = new T.Mesh(this.sc.geo(new T.RingGeometry(.985, 1, 128, 1)), this.t(new T.MeshBasicMaterial({map: dash, transparent: true, opacity: 0, depthWrite: false, toneMapped: false})));
    // Ring UVs are planar; remap u to the angle so the dashes run around the circle.
    const uv = this.distRing.geometry.getAttribute('uv'), pos = this.distRing.geometry.getAttribute('position');
    for (let i = 0; i < uv.count; i++) {const a = Math.atan2(pos.getY(i), pos.getX(i)); uv.setXY(i, (a / (Math.PI * 2) + .5) * 6, uv.getY(i));}
    this.distRing.rotation.x = -Math.PI / 2; this.distRing.renderOrder = 6; this.distRing.visible = false; this.root.add(this.distRing);
  }
  buildLaunch() {
    const T = this.T;
    this.launchRing = new T.Mesh(this.sc.geo(new T.RingGeometry(.9, 1, 64)), this.t(new T.MeshBasicMaterial({color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false})));
    this.launchRing.rotation.x = -Math.PI / 2; this.launchRing.renderOrder = 6; this.launchRing.visible = false; this.launchRing.userData.born = -9; this.root.add(this.launchRing);
  }

  // ---------- time / camera hooks used by the scene ----------
  // Render-time scale for interpolation (hit-stop). Effects keep their own clock.
  timeScale(dt) {return this.clock < this.freezeUntil ? dt * this.freezeScale : dt;}
  // Choreographed shots. Returns null to keep the scene's default framing.
  shot(s, active, positions, {lastStone, live}) {
    if (this.reduced) return null;
    const sc = this.sc, T = this.T, h = sc.house, deg = Math.PI / 180;
    if (s.stage === 'reveal' && lastStone && s.phase === 'playing') {
      // Measure: near top-down over the house, slow quarter drift so it reads as a live camera.
      const near = live.filter(p => Math.hypot(p.x - h.x, p.z - h.z) <= h.r + R + .6);
      const yaw = Math.sin(this.clock * .25) * 4 * deg;
      return {shot: sc.fit(sc.housePoints(near), 78 * deg, yaw, {x: .84, top: .64, bottom: -.82}), speed: 1.5, houseView: true};
    }
    if (!(s.stage === 'rolling' || s.stage === 'reveal') || !active || !positions.has(active.id)) return null;
    const p = positions.get(active.id), v = sc.velocity(active.id), sp = Math.hypot(v.vx, v.vz), ux = sp > .05 ? v.vx / sp : 0, uz = sp > .05 ? v.vz / sp : -1;
    // A stone close to the remaining path: keep the default fit, it frames both before contact.
    const reach = Math.min(9, sp * sp / (2 * .46));
    for (const q of live) {if (q === p) continue; const dx = q.x - p.x, dz = q.z - p.z, along = dx * ux + dz * uz, side = Math.abs(dx * uz - dz * ux); if (along > -.5 && along < Math.min(reach + 1, 5.5) && side < 1.3) return null;}
    const toHouse = p.z - (h.z + h.r), stop = {x: p.x + ux * reach, z: p.z + uz * reach};
    const stopsNear = Math.hypot(stop.x - h.x, stop.z - h.z) < h.r + 2.2;
    if (toHouse < 5.5 || (stopsNear && sp < 1.6) || s.stage === 'reveal') {
      // Crane: rises over the house as the stone arrives; frames the rings and stones near the stop.
      const k = smooth((5.5 - toHouse) / 6), pitch = (32 + 24 * k) * deg, yaw = Math.max(-.1, Math.min(.1, -p.x * .02));
      const near = live.filter(q => Math.hypot(q.x - stop.x, q.z - stop.z) < 3.4 || Math.hypot(q.x - h.x, q.z - h.z) <= h.r + R);
      return {shot: sc.fit(sc.housePoints([...near, p, stop]), pitch, yaw, {x: .84, top: .66, bottom: -.82}), speed: 1.7, houseView: k > .6};
    }
    // Chase: low, behind the stone along its travel, house far ahead; lag comes from the scene's smoothing.
    const back = 4.4, height = 1.6 + .25 * Math.min(1, sp / 4);
    const pos = new T.Vector3(p.x - ux * back, height, p.z - uz * back), look = new T.Vector3(p.x + ux * 6.5, .2, p.z + uz * 6.5);
    pos.x = Math.max(-EDGE_X + .4, Math.min(EDGE_X - .4, pos.x)); look.x = Math.max(-EDGE_X, Math.min(EDGE_X, look.x));
    return {shot: {pos, look}, speed: 3.2, houseView: false};
  }
  // After the scene places the camera: breathing drift (aim), trauma shake, FOV push.
  postCamera(s, cam, look, dt) {
    if (this.reduced) return;
    let ox = 0, oy = 0, roll = 0;
    if (s.phase === 'playing' && s.stage === 'aim') {ox += Math.sin(this.clock * .23) * .14; oy += Math.sin(this.clock * .31 + 1) * .05;}
    if (this.trauma > 0) {
      const k = this.trauma * this.trauma, t = this.clock * 32;
      ox += .09 * k * Math.sin(t * 1.7); oy += .06 * k * Math.sin(t * 2.3 + 1); roll = .012 * k * Math.sin(t * 1.1 + 2);
      this.trauma = Math.max(0, this.trauma - dt * 1.6);
    }
    if (ox || oy) {
      const right = this.v.setFromMatrixColumn(cam.matrixWorld, 0); cam.position.addScaledVector(right, ox); cam.position.y += oy; cam.lookAt(look);
    }
    if (roll) cam.rotateZ(roll);
  }
  updateFov(dt) {
    // Critically damped spring back to zero (push in on release, punch on contact).
    const k = 60, d = 2 * Math.sqrt(k);
    this.fovVel += (-k * this.fovKick - d * this.fovVel) * dt; this.fovKick += this.fovVel * dt;
    if (Math.abs(this.fovKick) < .005 && Math.abs(this.fovVel) < .01) {this.fovKick = 0; this.fovVel = 0;}
  }

  // ---------- events ----------
  contact(x, z, power) {
    if (this.reduced) return;
    this.freezeUntil = this.clock + .05 + .07 * Math.min(1, power); this.freezeScale = .06;
    this.trauma = Math.min(1, this.trauma + .3 + .45 * power);
    this.fovVel -= 18 * power;
    // Spin-off: the two stones nearest the contact get a decaying extra handle spin + wobble.
    const near = [...this.sc.stones.entries()].filter(([, o]) => !o.userData.fade).map(([id, o]) => ({id, d: Math.hypot(o.position.x - x, o.position.z - z)})).sort((a, b) => a.d - b.d).slice(0, 2);
    near.forEach(({id}, i) => {const so = this.spinOff.get(id) || {angle: 0, vel: 0, wob: 0}; so.vel += (i ? -1 : 1) * (3.5 + 7 * power); so.wob = Math.max(so.wob, .05 + .07 * power); so.born = this.clock; this.spinOff.set(id, so);});
  }
  release(s) {
    if (this.reduced) return;
    const lr = this.launchRing; lr.userData.born = this.clock; lr.visible = true; lr.position.set(s?.stones?.at(-1)?.x || 0, .014, RELEASE);
    const team = s?.stones?.at(-1)?.team ?? 0; lr.material.color.set(TEAM[team].pale);
    this.fovVel += 26; // brief widen: the stone "leaves"
    const ex = this.sc.extras; if (!ex) return;
    for (let i = 0; i < 18; i++) {const a = Math.PI / 2 + (rnd(i * 3.7 + this.clock) - .5) * 2.4, sp = .8 + rnd(i * 1.9) * 1.6; ex.spark({x: lr.position.x, y: .05, z: RELEASE + .3, vx: Math.cos(a) * sp * .8, vy: .25 + rnd(i * 5.3) * .7, vz: Math.sin(a) * sp, grav: 2.2, drag: 2.4, life: .45 + rnd(i) * .35, size: .07 + rnd(i * 2.3) * .06, color: i % 2 ? '#e8f8ff' : TEAM[team].pale, stretch: .5, gain: 1});}
  }
  celebrate(points, team) {
    if (this.reduced || !(points > 0)) return;
    const p = Math.min(4, points);
    this.trauma = Math.min(1, this.trauma + .12 + .1 * p); this.fovVel += 10 + 8 * p;
    // Fireworks over the house for bigger ends: staggered bursts in the team colour + gold.
    const ex = this.sc.extras; if (!ex || p < 2) return;
    const h = this.sc.house;
    for (let b = 0; b < p; b++) {
      const bx = h.x + (rnd(b * 3.1 + this.clock) - .5) * 4, bz = h.z + (rnd(b * 5.3) - .5) * 3, by = 1.5 + rnd(b * 7.7) * .9, delay = .25 + b * .32; // low bursts: inside the house shot
      for (let i = 0; i < 26; i++) {
        const a = rnd(i * 1.3 + b) * Math.PI * 2, e = (rnd(i * 2.7 + b) - .3) * 1.4, sp = 2.2 + rnd(i * 4.1 + b) * 1.4;
        ex.spark({x: bx, y: by, z: bz, vx: Math.cos(a) * Math.cos(e) * sp, vy: Math.sin(e) * sp, vz: Math.sin(a) * Math.cos(e) * sp, grav: 2.2, drag: 1.4, life: 1 + rnd(i) * .5, size: .12, color: i % 3 ? TEAM[team].main : '#ffd84a', twinkle: true, gain: 1.5, delay});
      }
    }
  }

  // ---------- per frame ----------
  update(s, dt, positions, active) {
    this.clock += dt; this.updateFov(dt);
    const sc = this.sc, h = sc.house, playing = s.phase === 'playing';
    if (s.stage === 'rolling' && this.prevStage === 'aim') this.release(s);
    this.prevStage = s.stage;
    // Spin-off: decaying extra yaw + wobble on top of the authoritative rotation.
    for (const [id, so] of this.spinOff) {
      const obj = sc.stones.get(id); if (!obj) {this.spinOff.delete(id); continue;}
      so.vel *= Math.exp(-2.6 * dt); so.angle += so.vel * dt; const age = this.clock - (so.born || 0), wob = so.wob * Math.exp(-5 * age);
      obj.rotation.y += so.angle; obj.rotation.x = wob * Math.sin(age * 22); obj.rotation.z = wob * Math.cos(age * 19);
      if (Math.abs(so.vel) < .01 && wob < .001) {obj.rotation.x = obj.rotation.z = 0; so.vel = 0; so.wob = 0;}
    }
    if (s.stage === 'aim') for (const so of this.spinOff.values()) so.wob = 0;
    // Launch ring.
    {const lr = this.launchRing, a = (this.clock - lr.userData.born) / .6; lr.visible = a < 1; if (lr.visible) {lr.scale.setScalar(.5 + 1.6 * (1 - Math.pow(1 - a, 3))); lr.material.opacity = .55 * (1 - a) * (1 - a);}}
    // Spin ring under the moving stone (turn direction from the stone's own rotation rate).
    const p = active && positions.get(active.id), obj = p && sc.stones.get(active.id), moving = playing && s.stage === 'rolling' && p;
    let spinRate = 0;
    if (obj) {const prev = this.lastRot.get(active.id); if (prev !== undefined && dt > 0) spinRate = (obj.rotation.y - prev) / dt; this.lastRot.set(active.id, obj.rotation.y);}
    this.spinRate = this.spinRate === undefined ? spinRate : this.spinRate + (spinRate - this.spinRate) * Math.min(1, dt * 6);
    const v = p ? sc.velocity(active.id) : {vx: 0, vz: 0}, sp = Math.hypot(v.vx, v.vz);
    const ringOn = !!moving && !this.reduced && Math.abs(this.spinRate) > .05;
    const ringTarget = ringOn ? Math.min(.75, Math.abs(this.spinRate) * .9) * smooth(sp / .6) : 0;
    this.spinRing.material.opacity += (ringTarget - this.spinRing.material.opacity) * Math.min(1, dt * 5);
    this.spinRing.visible = this.spinRing.material.opacity > .01 && !!p;
    if (this.spinRing.visible) {this.spinRing.position.set(p.x, .013, p.z); this.spinRing.rotation.set(-Math.PI / 2, obj ? obj.rotation.y : 0, 0, 'YXZ'); this.spinRing.scale.set(this.spinRate > 0 ? -1 : 1, 1, 1); this.spinRing.material.color.set(TEAM[active.team].pale);}
    // Speed streaks + sweep stroke bursts.
    if (moving && !this.reduced) this.motion(s, p, v, sp, active, dt);
    this.updateStreaks(dt);
    this.updateHouseDrama(s, positions, active, dt);
  }
  motion(s, p, v, sp, active, dt) {
    const ux = v.vx / (sp || 1), uz = v.vz / (sp || 1), sweep = Math.min(1, s.sweepAmount || 0), ex = this.sc.extras;
    if (this.streakCap && sp > 1.1) {
      const rate = (sp - 1.1) * 4.5 + sweep * 7;
      this.streakAcc = (this.streakAcc || 0) + rate * dt;
      while (this.streakAcc >= 1) {
        this.streakAcc -= 1; if (this.streaks.length >= this.streakCap) this.streaks.shift();
        const side = (rnd(this.clock * 7 + this.streaks.length) < .5 ? -1 : 1) * (.5 + rnd(this.clock * 13) * .9), ahead = .6 + rnd(this.clock * 3) * 2.4;
        this.streaks.push({x: p.x + ux * ahead - uz * side, z: p.z + uz * ahead + ux * side, ux, uz, len: .7 + sp * .25 + rnd(this.clock * 5) * .5, born: this.clock, life: .45 + rnd(this.clock * 9) * .2, cyan: sweep > 0 && rnd(this.clock * 17) < .6});
      }
    }
    // Broom stroke reversals: the brush scrubs and throws a frost puff each time it turns.
    if (sweep > 0 && ex) this.sc.brooms.forEach((b, i) => {
      if (!b.visible) {this.strokeSign[i] = 0; return;}
      const sign = Math.sign(Math.cos(this.sc.clock * 15 + i * Math.PI));
      if (this.strokeSign[i] && sign !== this.strokeSign[i]) {
        const n = 5 + Math.round(5 * sweep);
        for (let k = 0; k < n; k++) {const a = rnd(this.clock * 11 + k + i) * 6.28, s2 = .5 + rnd(k * 3.3 + this.clock) * 1.2; ex.spark({x: b.position.x + Math.cos(a) * .2, y: .04, z: b.position.z + Math.sin(a) * .2, vx: Math.cos(a) * s2 + ux * .5, vy: .3 + rnd(k + this.clock) * .55, vz: Math.sin(a) * s2 + uz * .5, grav: 2.6, drag: 3, life: .3 + rnd(k * 1.7) * .25, size: .06 + rnd(k * 2.9) * .05, color: k % 2 ? '#ffffff' : '#a8e6ff', gain: 1.15});}
        ex.puff?.(b.position.x, b.position.z, .5 + .5 * sweep);
      }
      this.strokeSign[i] = sign;
    });
  }
  updateStreaks(dt) {
    if (!this.streakMesh) return;
    const u = this.u; let n = 0;
    this.streaks = this.streaks.filter(q => this.clock - q.born < q.life);
    for (const q of this.streaks) {
      const k = (this.clock - q.born) / q.life, a = Math.sin(Math.PI * k);
      u.position.set(q.x, .018, q.z); u.rotation.set(-Math.PI / 2, 0, Math.atan2(-q.uz, q.ux)); u.scale.set(q.len * (.6 + .4 * k), .018, 1); u.updateMatrix();
      this.streakMesh.setMatrixAt(n, u.matrix); this.streakMesh.setColorAt(n++, this.c.set(q.cyan ? '#8fe3ff' : '#ffffff').multiplyScalar(.32 * a));
    }
    this.streakMesh.count = n; this.streakMesh.instanceMatrix.needsUpdate = true; if (this.streakMesh.instanceColor) this.streakMesh.instanceColor.needsUpdate = true;
  }
  updateHouseDrama(s, positions, active, dt) {
    const h = this.sc.house, show = s.phase === 'playing' && ['aim', 'rolling', 'reveal'].includes(s.stage);
    let best = null, bd = Infinity;
    if (show) for (const [id, q] of positions) {const d = Math.hypot(q.x - h.x, q.z - h.z); if (d <= h.r + R && d < bd) {bd = d; best = {id, ...q};}}
    if ((best?.id ?? null) !== this.shotId) {
      this.shotId = best?.id ?? null; this.shotAt = this.clock;
      // A new shot stone while play is live is a drama beat: small sparkle at the stone.
      if (best && s.stage !== 'aim' && !this.reduced && this.sc.extras) for (let i = 0; i < 14; i++) {const a = i / 14 * 6.28; this.sc.extras.spark({x: best.x + Math.cos(a) * .5, y: .06, z: best.z + Math.sin(a) * .5, vx: Math.cos(a) * .9, vy: .5, vz: Math.sin(a) * .9, grav: 1.2, drag: 2.5, life: .5, size: .08, color: TEAM[best.team].pale, gain: 1.2});}
    }
    const target = best ? 1 : 0, age = this.clock - this.shotAt;
    const sr = this.shotRing, dr = this.distRing;
    sr.userData.k = (sr.userData.k || 0) + (target - (sr.userData.k || 0)) * Math.min(1, dt * 6);
    sr.visible = dr.visible = sr.userData.k > .01 && !!best;
    if (!sr.visible) return;
    const pop = this.reduced ? 1 : 1 + .45 * Math.exp(-age * 6) * Math.cos(age * 14), breathe = this.reduced ? 1 : 1 + .04 * Math.sin(this.clock * 2.6);
    sr.position.set(best.x, .012, best.z); sr.scale.setScalar(pop * breathe); sr.material.color.set(TEAM[best.team].main); sr.material.opacity = .62 * sr.userData.k;
    dr.position.set(h.x, .017, h.z); dr.scale.setScalar(Math.max(.05, bd)); dr.material.color.set(TEAM[best.team].pale); dr.material.opacity = .55 * sr.userData.k;
    if (!this.reduced) dr.rotation.z = this.clock * .15;
  }
  diagnostics() {return {trauma: +this.trauma.toFixed(2), frozen: this.clock < this.freezeUntil, fovKick: +this.fovKick.toFixed(2), shot: this.shotId, streaks: this.streaks.length, spinOff: this.spinOff.size, spinRing: +this.spinRing.material.opacity.toFixed(2)};}
  dispose() {this.root.parent?.remove(this.root);}
}
