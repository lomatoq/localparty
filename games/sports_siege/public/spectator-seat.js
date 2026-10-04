// One repeatable stadium chair. Local origin is the floor; forward is +Z.
// Scene owners may clone a prototype or pass one resource set to many chairs.
function roundedRectangle(THREE, width, height, radius) {
  const s = new THREE.Shape(), x = -width / 2, y = -height / 2;
  s.moveTo(x + radius, y);
  s.lineTo(x + width - radius, y);
  s.quadraticCurveTo(x + width, y, x + width, y + radius);
  s.lineTo(x + width, y + height - radius);
  s.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  s.lineTo(x + radius, y + height);
  s.quadraticCurveTo(x, y + height, x, y + height - radius);
  s.lineTo(x, y + radius);
  s.quadraticCurveTo(x, y, x + radius, y);
  return s;
}

export function createSpectatorSeatResources(THREE) {
  const geometries = [], materials = [];
  const extrusion = (w, h, r, depth, bevel = .006) => {
    const g = new THREE.ExtrudeGeometry(roundedRectangle(THREE, w, h, r), {
      depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel,
      bevelSegments: 3, curveSegments: 6, steps: 1
    });
    g.translate(0, 0, -depth / 2);
    geometries.push(g);
    return g;
  };
  const cylinder = (top, bottom, height) => {
    const g = new THREE.CylinderGeometry(top, bottom, height, 10);
    geometries.push(g);
    return g;
  };
  const material = color => {
    const m = new THREE.MeshStandardMaterial({color, roughness: .86, metalness: .02});
    materials.push(m);
    return m;
  };
  const cushion = extrusion(.5, .48, .065, .056);
  cushion.rotateX(-Math.PI / 2);
  const resources = {
    cushion,
    back: extrusion(.5, .38, .065, .044),
    backPad: extrusion(.416, .282, .052, .014, .004),
    leg: cylinder(.021, .025, .252),
    backSupport: cylinder(.016, .016, .16),
    brace: cylinder(.014, .014, .38),
    shellMaterial: material('#5a407d'),
    cushionMaterial: material('#8865b7'),
    padMaterial: material('#74529b'),
    frameMaterial: material('#292236'),
    geometries, materials
  };
  let disposed = false;
  resources.dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const geometry of geometries) geometry.dispose();
    for (const m of materials) m.dispose();
  };
  return resources;
}

export function createSpectatorSeat(THREE, {resources} = {}) {
  const ownsResources = !resources;
  const r = resources || createSpectatorSeatResources(THREE);
  const seat = new THREE.Group();
  seat.name = 'spectator-seat';
  const add = (geometry, material, x, y, z, rotationX = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.x = rotationX;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    seat.add(mesh);
    return mesh;
  };
  // Cushion surface .286 + .056/2 + .006 bevel = exactly .32.
  add(r.cushion, r.cushionMaterial, 0, .286, 0);
  // Rounded shell leans back gently; its front padding is a separate inset.
  add(r.back, r.shellMaterial, 0, .499, -.215, -.10);
  add(r.backPad, r.padMaterial, 0, .504, -.186, -.10);
  for (const x of [-.182, .182]) {
    for (const z of [-.167, .167]) add(r.leg, r.frameMaterial, x, .126, z);
    add(r.backSupport, r.frameMaterial, x, .292, -.213);
  }
  const brace = add(r.brace, r.frameMaterial, 0, .234, -.05);
  brace.rotation.z = Math.PI / 2;
  seat.userData.seatHip = [0, .32, 0];
  seat.userData.seatWidth = .5;
  seat.userData.seatDepth = .48;
  seat.userData.front = [0, 0, 1];
  // Keep GPU resource references outside userData so Three's clone serializes it safely.
  seat.resources = r;
  seat.dispose = () => {if (ownsResources) r.dispose();};
  return seat;
}
