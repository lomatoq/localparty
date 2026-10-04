import {createSpectatorSeat, createSpectatorSeatResources} from './spectator-seat.js';

// Decorative only: fixed floor/hip anchors, upright camera-facing human cutouts.
const PEOPLE = [
  ['01-coral', .4545454545, .6124401914, 1208 / 1254],
  ['02-teal', .4282296651, .6339712919, 1175 / 1254],
  ['03-violet', .4449760766, .6435406699, 1185 / 1254],
  ['04-lime', .4194577352, .6259968102, 1214 / 1254],
  ['05-lavender', .4250398724, .6220095694, 1199 / 1254]
];
export class SpectatorCrowd {
  constructor(T, parent, camera, slots, track, {density = .27, reduced = false} = {}) {
    this.T = T; this.camera = camera; this.reduced = reduced; this.cheerUntil = 0;
    this.root = new T.Group(); this.root.name = 'seated-human-spectators'; parent.add(this.root);
    this.slots = slots; this.u = new T.Object3D(); this.loaded = 0;
    const r = createSpectatorSeatResources(T);
    r.geometries.forEach(track); r.materials.forEach(track);
    const prototype = createSpectatorSeat(T, {resources:r});
    this.chairs = prototype.children.map(part => {
      part.updateMatrix();
      const mesh = new T.InstancedMesh(part.geometry, part.material, slots.length);
      mesh.receiveShadow = true; this.root.add(mesh);
      return {mesh, local:part.matrix.clone()};
    });
    const m = new T.Matrix4();
    slots.forEach((slot, i) => {
      const yaw = Math.atan2(-slot.x, 30 - slot.z);
      this.u.position.set(slot.x, slot.floor, slot.z); this.u.rotation.set(0, yaw, 0); this.u.scale.setScalar(1); this.u.updateMatrix();
      for(const chair of this.chairs) chair.mesh.setMatrixAt(i, m.multiplyMatrices(this.u.matrix, chair.local));
    });
    this.chairs.forEach(c => {c.mesh.instanceMatrix.needsUpdate = true;});
    this.people = PEOPLE.map(([name,hx,hy,foot], variant) => {
      const occupied = slots.filter((_, i) => ((i * 37 + 11) % 100) < density * 100 && i % 5 === variant);
      const map = track(new T.TextureLoader().load('/assets/spectators-20261002/spectator-' + name + '.png', () => {this.loaded++;}));
      map.colorSpace = T.SRGBColorSpace;
      const geometry = track(new T.PlaneGeometry(1,1)); geometry.translate(.5-hx, hy-.5, 0);
      const material = track(new T.MeshBasicMaterial({map, transparent:true, alphaTest:.12, depthWrite:true, toneMapped:false, fog:true}));
      const mesh = new T.InstancedMesh(geometry, material, occupied.length); mesh.frustumCulled = false; this.root.add(mesh);
      return {mesh, slots:occupied, scale:.32/(foot-hy), footDelta:foot-hy, variant};
    });
    this.update(0);
  }
  update(clock) {
    for(const person of this.people) {
      person.slots.forEach((slot,i) => {
        // A seated shoulder lean preserves the score cheer without lifting feet off the tier.
        const lean = !this.reduced && clock < this.cheerUntil ? Math.sin(clock*8+i)*.012 : 0;
        this.u.position.set(slot.x, slot.floor+.32, slot.z);
        this.u.rotation.set(0, Math.atan2(this.camera.position.x-slot.x, this.camera.position.z-slot.z), lean);
        this.u.scale.setScalar(person.scale); this.u.updateMatrix(); person.mesh.setMatrixAt(i,this.u.matrix);
      });
      person.mesh.instanceMatrix.needsUpdate = true;
    }
  }
  diagnostics() {
    return {loaded:this.loaded, variants:this.people.length, people:this.people.reduce((n,p)=>n+p.slots.length,0), seats:this.slots.length, footGapMax:Math.max(...this.people.map(p=>Math.abs(.32-p.scale*p.footDelta))), hipHeight:.32};
  }
}
