// Sensor adapter + pure gesture filters. All distances remain server-owned;
// motion produces the same bounded shot/sweep inputs as the touch controller.
export const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const finite = n => typeof n === 'number' && Number.isFinite(n);
const vector = v => v && ['x', 'y', 'z'].every(k => finite(v[k]));
const magnitude = v => Math.hypot(v.x, v.y, v.z);
const rad = Math.PI / 180;
const quaternion = q => q && ['x', 'y', 'z', 'w'].every(k => finite(q[k])) && Math.hypot(q.x,q.y,q.z,q.w) > .5;
const normalize = q => {const n=Math.hypot(q.x,q.y,q.z,q.w);return {x:q.x/n,y:q.y/n,z:q.z/n,w:q.w/n};};
export const multiplyQuaternion = (a,b) => ({w:a.w*b.w-a.x*b.x-a.y*b.y-a.z*b.z,x:a.w*b.x+a.x*b.w+a.y*b.z-a.z*b.y,y:a.w*b.y-a.x*b.z+a.y*b.w+a.z*b.x,z:a.w*b.z+a.x*b.y-a.y*b.x+a.z*b.w});
const axisQuaternion = (axis,angle) => ({x:axis==='x'?Math.sin(angle/2):0,y:axis==='y'?Math.sin(angle/2):0,z:axis==='z'?Math.sin(angle/2):0,w:Math.cos(angle/2)});
export function screenQuaternion(q,screenAngle=0){return normalize(multiplyQuaternion(q,axisQuaternion('z',-screenAngle*rad)));}
// DeviceOrientation is intrinsic Z-X-Y, not CoreMotion's Euler yaw/pitch/roll.
export function orientationQuaternion(alpha,beta,gamma,screenAngle=0){return screenQuaternion(multiplyQuaternion(multiplyQuaternion(axisQuaternion('z',alpha*rad),axisQuaternion('x',beta*rad)),axisQuaternion('y',gamma*rad)),screenAngle);}
export function relativeRotation(neutral,current){
  const a=normalize(neutral),b=normalize(current);let q=normalize(multiplyQuaternion({w:a.w,x:-a.x,y:-a.y,z:-a.z},b));
  if(q.w<0)q={w:-q.w,x:-q.x,y:-q.y,z:-q.z};
  const n=Math.hypot(q.x,q.y,q.z),scale=n<1e-8?2:2*Math.atan2(n,q.w)/n;
  return{x:q.x*scale,y:q.y*scale,z:q.z*scale};
}

const rotate = (q,v) => {const r=multiplyQuaternion(multiplyQuaternion(q,{...v,w:0}),{w:q.w,x:-q.x,y:-q.y,z:-q.z});return{x:r.x,y:r.y,z:r.z};};
export function motionDirection(neutral,current){
  const a=normalize(neutral),b=normalize(current),long={x:0,y:1,z:0},normal={x:0,y:0,z:1};
  // Upright long axis has no horizontal heading; the screen normal does.
  const axis=Math.hypot(...Object.values(rotate(a,long)).slice(0,2))>.2?long:normal;
  const n=rotate(a,axis),c=rotate(b,axis);
  const heading=Math.hypot(c.x,c.y)>.1?Math.atan2(n.x*c.y-n.y*c.x,n.x*c.x+n.y*c.y):0;
  const residual=multiplyQuaternion(axisQuaternion('z',-heading),b);
  return{heading,twist:relativeRotation(a,residual).y};
}
export const FRESH_MS = 250;

export class MotionThrow {
  begin(sample, now) {
    this.cancel();
    if (!sample || now - sample.at > FRESH_MS) return false;
    if(!quaternion(sample.quaternion))return false;
    this.neutral = {...sample.quaternion}; this.started = now; this.last = now;
    this.count = 0; this.peak = 0; this.rotation = 0; this.filtered = 0;
    this.latest = sample; return true;
  }
  add(sample) {
    if (!this.neutral || sample.at <= this.last) return;
    // Reject a sensor interruption rather than carrying an old power peak forward.
    if (sample.at - this.last > FRESH_MS) { this.cancel(); return; }
    const dt = Math.min(.08, (sample.at - this.last) / 1000);
    this.last = sample.at; this.latest = sample; this.count++;
    this.filtered += (1 - Math.exp(-dt / .045)) * (magnitude(sample.acceleration) - this.filtered);
    this.peak = Math.max(this.peak, this.filtered);
    this.rotation = Math.max(this.rotation, magnitude(sample.rotation) * Math.PI / 180);
  }
  preview() { return clamp(.12 + this.peak / 24 * .60 + this.rotation / 9 * .28); }
  finish(now, position, spin) {
    if (!this.neutral) return null;
    const duration = now - this.started;
    const valid = now - this.last <= FRESH_MS && duration >= 150 && duration <= 4000 && this.count >= 4 && (this.peak >= 2.2 || this.rotation >= .9);
    const direction = motionDirection(this.neutral,this.latest.quaternion);
    const shot = valid ? {power: this.preview(), angle: clamp(direction.heading * .7, -.32, .32),
      spin: clamp(spin + direction.twist / (55 * rad), -1, 1), position: clamp(position, -1, 1), valid: true} : null;
    this.cancel(); return shot;
  }
  cancel() { this.neutral = null; this.latest = null; }
}

// The room heading is captured once, with the phone facing the TV. Attitude
// transforms later samples into that fixed frame; rotating the grip never
// rotates the lane. Quiet arming and a forward impulse replace a touch hold.
export class FreeMotionThrow {
  constructor() { this.reset(); }
  reset() { this.frame = null; this.calibrationAt = null; this.last = null; this.basis = null; this.restAcceleration = {x:0,y:0,z:0}; this.restRotation = {x:0,y:0,z:0}; this.cancel(); }
  cancel() { this.attempt = null; this.quietAt = null; this.armed = false; this.state = this.frame ? 'settle' : 'calibrating'; }
  feed(sample, allowed) {
    if (!sample || !vector(sample.acceleration) || !vector(sample.rotation) || !quaternion(sample.deviceQuaternion || sample.quaternion)) return null;
    if (sample.attitudeBasis && this.basis !== sample.attitudeBasis) {
      this.reset(); this.basis = sample.attitudeBasis;
    }
    if (this.last !== null && sample.at <= this.last) return null;
    const gap = this.last === null ? 0 : sample.at - this.last;
    if (gap > FRESH_MS) { this.cancel(); this.calibrationAt = null; }
    const dt = Math.min(.08, (gap || 1000 / 30) / 1000); this.last = sample.at;
    const q = normalize(sample.deviceQuaternion || sample.quaternion);
    const acceleration = rotate(q, sample.acceleration), angular = rotate(q, sample.rotation);
    const quiet = magnitude(sample.acceleration) < 1.25 && magnitude(sample.rotation) < 24;
    // Learn only while still. Never let a deliberate lateral movement or twist
    // become the next throw's neutral, and never recapture the TV heading.
    if (quiet && !this.attempt) {
      const k = 1 - Math.exp(-dt / .3);
      for (const axis of ['x','y','z']) {
        this.restAcceleration[axis] += (acceleration[axis] - this.restAcceleration[axis]) * k;
        this.restRotation[axis] += (angular[axis] - this.restRotation[axis]) * k;
      }
    }
    if (!this.frame) {
      if (!quiet) { this.calibrationAt = null; return null; }
      this.calibrationAt ??= sample.at;
      if (sample.at - this.calibrationAt < 450) return null;
      const edge = rotate(q, {x: 0, y: 1, z: 0}), back = rotate(q, {x: 0, y: 0, z: -1});
      const forward = Math.hypot(edge.x, edge.y) >= Math.hypot(back.x, back.y) ? edge : back;
      const length = Math.hypot(forward.x, forward.y);
      if (length < .25) return null;
      this.frame = {forward: {x: forward.x / length, y: forward.y / length}, right: {x: forward.y / length, y: -forward.x / length}};
      this.quietAt = sample.at; this.state = 'settle';
    }
    if (!allowed) { this.cancel(); this.state = 'watch'; return null; }
    const ax = acceleration.x - this.restAcceleration.x, ay = acceleration.y - this.restAcceleration.y;
    const forward = ax * this.frame.forward.x + ay * this.frame.forward.y;
    const lateral = ax * this.frame.right.x + ay * this.frame.right.y;
    if (!this.attempt) {
      if (quiet) {
        this.quietAt ??= sample.at;
        if (sample.at - this.quietAt >= 280) this.armed = true;
      } else if (!this.armed) this.quietAt = null;
      this.state = this.armed ? 'ready' : 'settle';
      if (!this.armed || forward < 2.8 || forward < Math.abs(acceleration.z) * .65) return null;
      this.attempt = {started: sample.at, samples: 0, activeSamples: 0, impulse: 0, lateral: 0, spin: 0, peak: 0, quiet: 0};
      this.armed = false; this.quietAt = null; this.state = 'throwing';
    }
    const a = this.attempt; a.samples++;
    if (forward > .8) {
      a.activeSamples++; a.impulse += forward * dt; a.lateral += lateral * dt; a.peak = Math.max(a.peak, forward);
      a.quiet = 0;
    } else a.quiet += dt;
    const twist = (angular.x - this.restRotation.x) * this.frame.forward.x + (angular.y - this.restRotation.y) * this.frame.forward.y;
    a.spin += (Math.abs(twist) > 8 ? twist : 0) * rad * dt;
    const elapsed = sample.at - a.started;
    if (a.quiet < .065 && elapsed < 500) return null;
    const valid = a.activeSamples >= 3 && elapsed >= 65 && a.impulse >= .22 && a.peak >= 3.2;
    // Leave headroom for a deliberate hard throw; mild flicks should not max out.
    const heading = Math.atan2(a.lateral, a.impulse);
    // A symmetric four-degree neutral lane removes hand tremor without hiding
    // intentional steering; subtract it smoothly, rather than adding a jump.
    const aim = Math.abs(heading) <= .07 ? 0 : Math.sign(heading) * (Math.abs(heading) - .07);
    const shot = valid ? {valid: true, power: clamp(.12 + a.peak / 35 * .72 + a.impulse / 5 * .16),
      angle: clamp(aim, -.32, .32), spin: clamp(a.spin / .55, -1, 1), position: 0} : null;
    this.cancel(); this.state = valid ? 'sent' : 'settle'; return shot;
  }
  preview() { return this.attempt ? clamp(.12 + this.attempt.peak / 35 * .72 + this.attempt.impulse / 5 * .16) : 0; }
}

export class ShakeSweep {
  reset() { this.level = 0; this.until = 0; this.last = 0; this.peaks = []; this.high = false; }
  constructor() { this.reset(); }
  add(sample, allowed) {
    if (!allowed) { this.reset(); return false; }
    const dt = this.last ? (sample.at - this.last) / 1000 : 1 / 30;
    if (dt <= 0) return this.active(sample.at);
    if (dt * 1000 > FRESH_MS) this.reset();
    this.last = sample.at;
    this.level += (1 - Math.exp(-Math.min(.08, dt) / .04)) * (magnitude(sample.acceleration) - this.level);
    // Two distinct pulses; a stationary tilt or one bump does not sweep.
    if (!this.high && this.level > 3.2) {
      this.high = true; this.peaks = this.peaks.filter(t => sample.at - t < 650);
      this.peaks.push(sample.at);
      if (this.peaks.length >= 2) this.until = sample.at + 280;
    } else if (this.high && this.level < 1.5) this.high = false;
    return this.active(sample.at);
  }
  active(now) { return now - this.last <= FRESH_MS && now < this.until; }
}

export class SportsSensors {
  constructor({onSample, onStatus, onDiagnostic = () => {}, host = window}) {
    this.host = host; this.onSample = onSample; this.onStatus = onStatus;
    this.onDiagnostic = onDiagnostic; this.received = 0; this.status = 'idle';
    this.motion = e => this.browserMotion(e); this.orient = e => this.browserOrientation(e);
    this.epoch = 0; this.running = false; this.sample = null;
  }
  async enable() {
    this.stop(); const epoch = ++this.epoch; this.running = true;
    this.ready = false; this.started = performance.now(); this.lastSourceTime = null;
    this.orientation = null; this.gravity = null; this.received = 0; this.nativeAttitudeInverse = true;
    this.status = 'waiting'; this.onStatus('waiting');
    const native = this.host.webkit?.messageHandlers?.partyShell;
    this.transport = native ? 'native' : 'browser';
    this.onDiagnostic({event:'enable',transport:this.transport,session:epoch});
    if (native) {
      this.native = native;
      this.host.__partySportsMotion = payload => {
        if (!this.running || payload.session !== epoch) return false;
        if (payload.available === false) { this.fail('unavailable'); return false; }
        if (!vector(payload.acceleration) || !vector(payload.rotation) || !quaternion(payload.quaternion)) return false;
        if (!finite(payload.sourceTime) || (this.lastSourceTime !== null && payload.sourceTime <= this.lastSourceTime)) return false;
        this.lastSourceTime = payload.sourceTime;
        // Gravity fixes the attitude convention: device→world must map the
        // measured gravity to -Z. Flat poses are ambiguous, so retain the last
        // established convention. Screen rotation never rotates sensor axes.
        const q = normalize(payload.quaternion);
        const inverse = {w:q.w,x:-q.x,y:-q.y,z:-q.z};
        if (vector(payload.gravity) && magnitude(payload.gravity) > .5) {
          const down = v => Math.hypot(v.x,v.y,v.z+magnitude(payload.gravity));
          const directError=down(rotate(q,payload.gravity)),inverseError=down(rotate(inverse,payload.gravity));
          if (Math.abs(directError-inverseError) > .1) this.nativeAttitudeInverse = inverseError < directError;
        }
        this.emit(payload.acceleration, payload.rotation, screenQuaternion(q,this.screenAngle()), this.nativeAttitudeInverse?inverse:q, this.nativeAttitudeInverse?'native-inverse':'native-direct');
        return true;
      };
      native.postMessage({type: 'sports-motion-start', session: epoch});
    } else {
      try {
        const permissions = [this.host.DeviceMotionEvent, this.host.DeviceOrientationEvent]
          .filter(c => typeof c?.requestPermission === 'function').map(c => c.requestPermission());
        // Both permission calls are initiated synchronously inside the button gesture.
        this.permissionPending = true;
        const values = await Promise.all(permissions);
        if(epoch===this.epoch)this.permissionPending=false;
        if (!this.running || epoch !== this.epoch) return;
        if (values.some(v => v !== 'granted')) { this.fail('denied'); return; }
        if (!this.host.DeviceMotionEvent) { this.fail('unavailable'); return; }
        this.host.addEventListener('devicemotion', this.motion);
        this.host.addEventListener('deviceorientation', this.orient);
      } catch { if (epoch === this.epoch) this.fail('denied'); return; }
    }
    if (!this.running || epoch !== this.epoch) return;
    this.watchdog = setInterval(() => {
      const now = performance.now();
      if ((!this.ready && now - this.started > 2200) || (this.ready && now - this.sample.at > 1000)) this.fail('unavailable');
    }, 100);
  }
  browserOrientation(e) {
    if(finite(e.timeStamp)&&e.timeStamp>0&&performance.now()-e.timeStamp>FRESH_MS)return;
    if (['alpha', 'beta', 'gamma'].every(k => finite(e[k]))) this.orientation = {quaternion: orientationQuaternion(e.alpha,e.beta,e.gamma,this.screenAngle()), deviceQuaternion:orientationQuaternion(e.alpha,e.beta,e.gamma), at: performance.now()};
  }
  browserMotion(e) {
    let acceleration = e.acceleration;
    const now = performance.now();
    if(finite(e.timeStamp)&&e.timeStamp>0&&now-e.timeStamp>FRESH_MS)return;
    if(!this.orientation||now-this.orientation.at>FRESH_MS){
      if(this.ready){this.ready=false;this.sample=null;this.started=now;this.status='waiting';this.onStatus('waiting');this.onDiagnostic({event:'attitude-stale',transport:'browser',received:this.received});}
      return;
    }
    const dt = this.sample ? clamp((now - this.sample.at) / 1000, .005, .08) : 1 / 30;
    if (!vector(acceleration)) {
      if (!vector(e.accelerationIncludingGravity)) return;
      const g = e.accelerationIncludingGravity;
      if (!this.gravity) { this.gravity = {x: g.x, y: g.y, z: g.z}; return; }
      const k = 1 - Math.exp(-dt / .35);
      acceleration = {};
      for (const axis of ['x', 'y', 'z']) { this.gravity[axis] += k * (g[axis] - this.gravity[axis]); acceleration[axis] = g[axis] - this.gravity[axis]; }
    }
    const r = e.rotationRate;
    const rotation = {x: finite(r?.beta) ? r.beta : 0, y: finite(r?.gamma) ? r.gamma : 0, z: finite(r?.alpha) ? r.alpha : 0};
    this.emit(acceleration, rotation, this.orientation.quaternion, this.orientation.deviceQuaternion);
  }
  screenAngle(){return this.host.screen?.orientation?.angle??this.host.orientation??0;}
  emit(acceleration, rotation, q, deviceQuaternion = q, attitudeBasis = 'browser') {
    if (!this.running) return;
    ++this.received;
    this.sample = {at: performance.now(), acceleration: {...acceleration}, rotation: {...rotation}, quaternion: {...q}, deviceQuaternion: {...deviceQuaternion}, attitudeBasis};
    if (!this.ready) { this.ready = true; this.status='ready'; this.onStatus('ready');this.onDiagnostic({event:'ready',transport:this.transport,received:this.received}); }
    this.onSample(this.sample);
  }
  fail(reason) { this.onDiagnostic({event:reason,transport:this.transport,received:this.received});this.stop();this.status=reason;this.onStatus(reason); }
  fresh(now = performance.now()) { return this.ready && this.sample && now - this.sample.at <= FRESH_MS; }
  stop() {
    if(this.running)this.onDiagnostic({event:'stop',transport:this.transport,received:this.received});
    this.status='idle';
    this.running = this.ready = this.permissionPending = false; ++this.epoch; clearInterval(this.watchdog);
    this.host.removeEventListener('devicemotion', this.motion); this.host.removeEventListener('deviceorientation', this.orient);
    this.native?.postMessage({type: 'sports-motion-stop'}); this.native = null; this.sample = null;
  }
}
