/* Test response only, appended to the real Sports host module by the harness.
   No production gate, quality setting, authoritative state or cadence changes. */
{
  const qp = window.__sportsProbe;
  const renderer = view?.renderer;
  if (renderer && view.bowling) {
    window.__newBowlingCounters = () => ({
      candidate: !!window.__bowlingShadowCandidate,
      phases: {}, renderMs: [], objectMs: [], signatureMs: [], shadowMs: [],
      shadowCalls: 0, sameCasterFrames: 0, changedCasterFrames: 0,
      mainDrawCalls: 0, shadowDrawCalls: 0, visibleCasterPeak: 0,
      unsafeHookFrames: 0, comparisons: [], compareErrors: [],
    });
    qp.bowling = window.__newBowlingCounters();
    const phase = () => state?.stage || state?.phase || 'unknown';
    const phaseStats = () => qp.bowling.phases[phase()] ||= {
      frames: 0, renderMs: 0, objectMs: 0, signatureMs: 0, shadowMs: 0,
      shadowCalls: 0, sameCasterFrames: 0, changedCasterFrames: 0,
      mainDrawCalls: 0, shadowDrawCalls: 0,
    };
    let shadowPass = false;
    let referenceRender = false;
    const seen = new Map();
    const compared = new Set();
    window.__resetBowlingComparison = () => compared.clear();
    renderer.domElement.addEventListener('webglcontextrestored', () => seen.clear());
    for (const type of ['resize', 'party-native-hide', 'party-native-resume']) addEventListener(type, () => seen.clear());
    document.fonts?.addEventListener('loadingdone', () => seen.clear());

    // Signatures use the renderer's already updated world matrices, immediately
    // before its shadow pass. No extra world-matrix update or layout read.
    const values = value => value?.toArray ? value.toArray().join(',') : String(value);
    const texture = t => !t ? '' : [t.id, t.version, t.channel, t.rotation,
      values(t.offset), values(t.repeat), values(t.center), values(t.matrix)].join('/');
    const material = m => !m ? '' : [m.id, m.version, m.visible, m.side, m.shadowSide,
      m.alphaTest, m.alphaHash, m.opacity, m.transparent, m.clipShadows,
      m.clipIntersection, m.wireframe, m.displacementScale, m.displacementBias,
      texture(m.map), texture(m.alphaMap), texture(m.displacementMap),
      (m.clippingPlanes || []).map(p => [values(p.normal), p.constant].join('/')).join(';'),
    ].join('|');
    function casterSignature(lights, scene, camera) {
      const start = performance.now(), parts = [renderer.shadowMap.type,
        renderer.localClippingEnabled, camera.layers.mask,
        (renderer.clippingPlanes || []).map(p => [values(p.normal), p.constant].join('/')).join(';')];
      let casters = 0, unsafe = renderer.shadowMap.type !== THREE.PCFSoftShadowMap;
      scene.traverseVisible(object => {
        if (!object.castShadow || !object.geometry) return;
        if (object.isInstancedMesh && object.count === 0) return;
        casters++;
        if (object.onBeforeShadow !== THREE.Object3D.prototype.onBeforeShadow ||
            object.onAfterShadow !== THREE.Object3D.prototype.onAfterShadow ||
            object.customDepthMaterial || object.customDistanceMaterial || object.isSkinnedMesh) unsafe = true;
        const geometry = object.geometry;
        const attributes = Object.entries(geometry.attributes).map(([name, a]) =>
          [name, a.version ?? a.data?.version, a.count, a.itemSize].join('/')).join(';');
        const morph = Object.entries(geometry.morphAttributes).map(([name, a]) =>
          name + ':' + a.map(x => [x.version ?? x.data?.version, x.count].join('/')).join(',')).join(';');
        // Compare actual instance matrix values: a repeated identical upload
        // changes BufferAttribute.version without changing the shadow picture.
        const instance = object.isInstancedMesh ? [object.count,
          object.instanceMatrix.array.subarray(0, object.count * 16).join(',')].join('/') : '';
        parts.push([object.id, object.layers.mask, object.frustumCulled,
          values(object.matrixWorld), geometry.id, attributes, morph,
          geometry.index?.version, geometry.index?.count,
          JSON.stringify(geometry.drawRange), JSON.stringify(geometry.groups),
          values(geometry.boundingSphere?.center), geometry.boundingSphere?.radius,
          values(geometry.boundingBox?.min), values(geometry.boundingBox?.max),
          values(object.boundingSphere?.center), object.boundingSphere?.radius,
          values(object.boundingBox?.min), values(object.boundingBox?.max),
          values(object.morphTargetInfluences), instance,
          Array.isArray(object.material) ? object.material.map(material).join(';') : material(object.material),
        ].join('#'));
      });
      for (const light of lights) {
        const s = light.shadow, c = s.camera;
        parts.push([light.id, light.visible, light.castShadow, values(light.matrixWorld),
          values(light.target?.matrixWorld), values(s.mapSize), s.bias, s.normalBias,
          s.radius, s.blurSamples, s.intensity, c.left, c.right, c.top, c.bottom,
          c.near, c.far, c.zoom, c.fov, c.aspect, c.layers.mask,
          values(c.projectionMatrix), values(s.getFrameExtents())].join('#'));
      }
      const ms = performance.now() - start;
      qp.bowling.signatureMs.push(ms); phaseStats().signatureMs += ms;
      qp.bowling.visibleCasterPeak = Math.max(qp.bowling.visibleCasterPeak, casters);
      return { signature: parts.join('~'), unsafe };
    }

    const renderShadow = renderer.shadowMap.render.bind(renderer.shadowMap);
    renderer.shadowMap.render = function (lights, scene, camera) {
      if (referenceRender) return renderShadow(lights, scene, camera);
      const current = casterSignature(lights, scene, camera);
      let changed = current.unsafe;
      for (const light of lights) {
        const old = seen.get(light.id);
        const dirty = current.unsafe || old !== current.signature || !light.shadow.map || renderer.shadowMap.needsUpdate;
        changed ||= dirty;
        if (window.__bowlingShadowCandidate) {
          light.shadow.autoUpdate = false;
          light.shadow.needsUpdate ||= dirty;
        }
        seen.set(light.id, current.signature);
      }
      const q = qp.bowling, stats = phaseStats();
      const key = changed ? 'changedCasterFrames' : 'sameCasterFrames';
      q[key]++; stats[key]++;
      if (current.unsafe) q.unsafeHookFrames++;
      const updates = lights.filter(light => light.shadow.autoUpdate || light.shadow.needsUpdate).length;
      q.shadowCalls += updates; stats.shadowCalls += updates;
      const at = performance.now(); shadowPass = true;
      try { return renderShadow(lights, scene, camera); }
      finally {
        shadowPass = false;
        const ms = performance.now() - at; q.shadowMs.push(ms); stats.shadowMs += ms;
      }
    };

    const draw = renderer.renderBufferDirect.bind(renderer);
    renderer.renderBufferDirect = function (...args) {
      if (!referenceRender) {
        const key = shadowPass ? 'shadowDrawCalls' : 'mainDrawCalls';
        qp.bowling[key]++; phaseStats()[key]++;
      }
      return draw(...args);
    };
    const update = Stage.prototype.updateObjects;
    Stage.prototype.updateObjects = function (...args) {
      const at = performance.now();
      try { return update.apply(this, args); }
      finally { const ms = performance.now() - at; qp.bowling.objectMs.push(ms); phaseStats().objectMs += ms; }
    };

    const render = renderer.render.bind(renderer);
    renderer.render = function (scene, camera) {
      if (referenceRender) return render(scene, camera);
      const at = performance.now(), result = render(scene, camera), q = qp.bowling, stats = phaseStats();
      const ms = performance.now() - at; q.renderMs.push(ms); stats.renderMs += ms; stats.frames++;
      // Same-frame original-shadow oracle is deliberately separate from timed
      // profiles. It does not advance the game, pose, clock or scene animation.
      const key = [phase(), innerWidth, innerHeight, !!state?.paused].join('|');
      if (window.__bowlingShadowCompare && !compared.has(key) && stats.frames > 3) {
        compared.add(key);
        try {
          const gl = renderer.getContext(), width = gl.drawingBufferWidth, height = gl.drawingBufferHeight;
          const before = new Uint8Array(width * height * 4), after = new Uint8Array(before.length);
          gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, before);
          referenceRender = true;
          for (const light of scene.children.filter(x => x.isLight && x.castShadow)) light.shadow.needsUpdate = true;
          render(scene, camera);
          gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, after);
          let different = 0, maxDelta = 0;
          for (let i = 0; i < before.length; i++) if (before[i] !== after[i]) {
            different++; maxDelta = Math.max(maxDelta, Math.abs(before[i] - after[i]));
          }
          q.comparisons.push({ key, width, height, differentChannels: different, maxDelta });
        } catch (error) { q.compareErrors.push(String(error.stack || error)); }
        finally { referenceRender = false; }
      }
      return result;
    };
  }
}
