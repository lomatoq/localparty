'use strict';
// Original camera method, preserved in its scene-module lexical scope by the browser oracle.
// This is a numerical correctness reference, not a timing or production implementation.
module.exports = {
  revision: '87dd64fa783c3092061ac5a77074839e2fbfb185',
  sceneHash: '8b4fd1cbf43966154fbb6ee3f5822cdfee96f55f75b8d51bb1d5eab492349fc3',
  method: String.raw`  updateCamera(s, active, positions, dt, stageChanged) {
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
    const measuring = s.phase === 'results' || s.stage === 'end' || (s.stage === 'reveal' && lastStone);
    // Measure: pre-correct the destination with the HUD-safe guard so the spring glides to a safe framing
    // (the guard below then only nudges in transit instead of snapping every frame).
    if (measuring && this.presentationBounds) {cam.position.copy(shot.pos); cam.lookAt(shot.look); const keep = this.camLook.clone(); this.camLook.copy(shot.look); const p = this.keepMeasureVisible(live, {dry: true}); this.camLook.copy(keep); if (p) shot.pos.copy(p);}
    if (!this.cameraReady) {this.camPos.copy(shot.pos); this.camLook.copy(shot.look); this.cameraReady = true;}
    // Ease the follow rate itself so cuts between chase, crane and measure never whip.
    this.camRate = this.camRate === undefined ? speed : this.camRate + (speed - this.camRate) * Math.min(1, dt * 1.8);
    if (this.reduced) {const k = 1 - Math.exp(-dt * Math.max(5, speed * 2.5)); this.camPos.lerp(shot.pos, k); this.camLook.lerp(shot.look, k);}
    else {
      // Critically damped spring (ease-in-out, no overshoot): shot changes blend, never cut or whip.
      // Long relocations (house -> next delivery) glide slower so the fly-back reads as a move, not a whip.
      const far = this.camPos.distanceTo(shot.pos), w = this.camRate * 1.4 * Math.max(.5, Math.min(1, 9 / Math.max(1, far))), e = Math.exp(-w * dt);
      this.camVel ||= new T.Vector3(); this.lookVel ||= new T.Vector3();
      for (const [p, v, t, vmax] of [[this.camPos, this.camVel, shot.pos, 11], [this.camLook, this.lookVel, shot.look, 16]]) {
        const before = this.v2.copy(p);
        for (const a of ['x', 'y', 'z']) {const d = p[a] - t[a], tmp = (v[a] + w * d) * dt; p[a] = t[a] + (d + tmp) * e; v[a] = (v[a] - w * tmp) * e;}
        // Speed cap: a framing target that jumps far (fit edge cases, long relocations) still reads as a glide.
        const step = p.distanceTo(before), cap = vmax * Math.max(dt, 1e-3);
        if (step > cap) {p.lerpVectors(before, p, cap / step); v.multiplyScalar(cap / step);}
      }
    }
    cam.position.copy(this.camPos); cam.lookAt(this.camLook);
    cam.updateMatrixWorld(); this.feel?.postCamera(s, cam, this.camLook, dt);
    // Measure only: the ceiling clamp and camera interpolation can invalidate the
    // destination fit. Keep the whole house and stone bodies clear of the actual HUD.
    if (measuring) {
      this.keepMeasureVisible(live, {dt});
    }
  }
`
};
