/* HeyPals shared audio. Asset provenance: /audio/credits.html. */
(function (global) {
  'use strict';
  const KEY = 'heypals-audio-v1';
  const clamp = (n, fallback) => Number.isFinite(Number(n)) ? Math.max(0, Math.min(1, Number(n))) : fallback;
  function createAudioManager(env = global) {
    const doc = env.document;
    let settings = { muted: false, musicVolume: .22, sfxVolume: .55 };
    try { const saved = JSON.parse(env.localStorage.getItem(KEY) || '{}'); settings = { muted: saved.muted === true, musicVolume: clamp(saved.musicVolume, .22), sfxVolume: clamp(saved.sfxVolume, .55) }; } catch (_) {}
    let context, master, musicGain, sfxGain, unlocked = false, unlocking;
    let surface = 'phone', musicOwner = false, currentScene = 'lobby', music, musicName, musicGeneration = 0;
    const cache = new Map(), active = new Set(), lastPlayed = new Map(), panels = new Set();
    const files = { click: 'click', confirm: 'confirm', back: 'back', error: 'error', ready: 'ready', countdown: 'countdown', hit: 'hit', win: 'win' };
    function audible() { return unlocked && !settings.muted && !doc?.hidden; }
    function applyVolumes() {
      if (!context) return;
      const now = context.currentTime;
      for (const [gain, value] of [[master, audible() ? 1 : 0], [musicGain, settings.musicVolume], [sfxGain, settings.sfxVolume]]) {
        gain.gain.cancelScheduledValues(now); gain.gain.setTargetAtTime(value, now, .035);
      }
    }
    async function buffer(path) {
      if (!cache.has(path)) cache.set(path, env.fetch(path).then(r => { if (!r.ok) throw new Error('Audio asset unavailable'); return r.arrayBuffer(); }).then(b => context.decodeAudioData(b)).catch(() => { cache.delete(path); return null; }));
      return cache.get(path);
    }
    function stopMusic() { musicGeneration++; if (music) { try { music.stop(); } catch (_) {} music.disconnect(); } music = null; musicName = null; }
    async function syncMusic() {
      const track = ({ lobby: 'lobby', matchmaking: 'matchmaking', game: 'battle' })[currentScene];
      if (!audible() || !musicOwner || !settings.musicVolume || !track) { stopMusic(); return; }
      if (musicName === track) return;
      stopMusic(); musicName = track;
      const generation = musicGeneration, data = await buffer('/audio/music/' + track + '.m4a');
      if (!data || generation !== musicGeneration || !audible()) { if (generation === musicGeneration) musicName = null; return; }
      const source = context.createBufferSource(); source.buffer = data; source.loop = true; source.connect(musicGain); source.start(); music = source;
    }
    function unlock() {
      if (unlocked && context?.state === 'running') return Promise.resolve(true);
      if (unlocking) { if(context?.state!=='running')Promise.resolve(context.resume()).catch(()=>{}); return unlocking; }
      try {
        const AudioContext = env.AudioContext || env.webkitAudioContext;
        if (!AudioContext) return Promise.resolve(false);
        if (!context) { context = new AudioContext(); master = context.createGain(); musicGain = context.createGain(); sfxGain = context.createGain(); musicGain.connect(master); sfxGain.connect(master); const limiter = context.createDynamicsCompressor(); limiter.threshold.value = -3; limiter.knee.value = 3; limiter.ratio.value = 12; limiter.attack.value = .003; limiter.release.value = .15; master.connect(limiter); limiter.connect(context.destination); }
        // Resume is called synchronously in the gesture handler, before any fetch/await.
        unlocking = Promise.resolve(context.resume()).then(() => { unlocked = context.state === 'running'; applyVolumes(); syncMusic(); return unlocked; }).catch(() => false).finally(() => { unlocking = null; });
        return unlocking;
      } catch (_) { return Promise.resolve(false); }
    }
    async function play(name) {
      if (!files[name] || !audible() || !settings.sfxVolume) return false;
      const now = Date.now(), interval = name === 'hit' ? 70 : 100;
      if (now - (lastPlayed.get(name) || 0) < interval) return false;
      lastPlayed.set(name, now);
      const data = await buffer('/audio/sfx/' + files[name] + '.wav');
      if (!data || !audible() || active.size >= 6) return false;
      const source = context.createBufferSource(); source.buffer = data; source.connect(sfxGain); active.add(source);
      source.onended = () => { active.delete(source); source.disconnect(); }; source.start(); return true;
    }
    function preferences(next) {
      if (!next) return { ...settings };
      settings = { muted: typeof next.muted === 'boolean' ? next.muted : settings.muted, musicVolume: next.musicVolume === undefined ? settings.musicVolume : clamp(next.musicVolume, settings.musicVolume), sfxVolume: next.sfxVolume === undefined ? settings.sfxVolume : clamp(next.sfxVolume, settings.sfxVolume) };
      try { env.localStorage.setItem(KEY, JSON.stringify(settings)); } catch (_) {}
      applyVolumes(); syncMusic(); panels.forEach(refresh => refresh()); return { ...settings };
    }
    function configure(options = {}) { surface = options.surface || surface; musicOwner = typeof options.musicOwner === 'boolean' ? options.musicOwner : surface === 'tv'; if(options.autoStart===true&&surface==='tv')unlock();else syncMusic(); }
    function scene(value) { if (!['lobby','matchmaking','game','pause','results'].includes(value) || value === currentScene) return; currentScene = value; syncMusic(); if (value === 'results' && musicOwner) play('win'); }
    function mountSettings(container) {
      if (!container || container.querySelector('.hp-audio-settings')) return;
      const lang = (doc?.documentElement.lang || 'en').startsWith('ru');
      const t = lang ? ['Звук','Без звука','Музыка','Эффекты','Авторы музыки и звуков'] : ['Audio','Mute','Music','Effects','Music and sound credits'];
      const panel = doc.createElement('fieldset'); panel.className = 'hp-audio-settings';
      panel.innerHTML = `<legend>${t[0]}</legend><label class="hp-audio-channel"><span class="hp-audio-caption">${t[2]}<output data-audio-value="musicVolume" aria-hidden="true"></output></span><input type="range" min="0" max="1" step=".05" data-audio-setting="musicVolume"></label><label class="hp-audio-channel"><span class="hp-audio-caption">${t[3]}<output data-audio-value="sfxVolume" aria-hidden="true"></output></span><input type="range" min="0" max="1" step=".05" data-audio-setting="sfxVolume"></label><label class="hp-audio-mute"><span>${t[1]}</span><input type="checkbox" data-audio-setting="muted"></label><a href="/audio/credits.html" target="_blank" rel="noopener">${t[4]}</a>`;
      const refresh = () => { for (const input of panel.querySelectorAll('input')) { const key = input.dataset.audioSetting; if (key === 'muted') input.checked = settings.muted; else { input.value = settings[key]; input.style.setProperty('--audio-level', `${Math.round(settings[key] * 100)}%`); } } for (const output of panel.querySelectorAll('[data-audio-value]')) output.textContent = `${Math.round(settings[output.dataset.audioValue] * 100)}%`; };
      panel.addEventListener('input', event => { const key = event.target.dataset.audioSetting; if (key) { unlock(); preferences({ [key]: key === 'muted' ? event.target.checked : Number(event.target.value) }); } });
      panels.add(refresh); refresh(); container.appendChild(panel);
      return () => { panels.delete(refresh); panel.remove(); };
    }
    doc?.addEventListener('pointerdown', unlock, { passive: true });
    doc?.addEventListener('keydown', unlock);
    doc?.addEventListener('click', event => {
      if (!event.isTrusted) return;
      const button = event.target.closest?.('button,[role="button"],[data-sound]');
      if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true' || button.dataset.sound === 'none' || button.closest('.hp-audio-settings')) return;
      unlock().then(() => play(button.dataset.sound || 'click'));
    });
    doc?.addEventListener('visibilitychange', () => { applyVolumes(); syncMusic(); });
    env.addEventListener?.('pagehide', () => { stopMusic(); for (const source of active) { try { source.stop(); } catch (_) {} } });
    return { unlock, configure, scene, play, preferences, mountSettings, status: () => ({ unlocked, surface, musicOwner, scene: currentScene, activeEffects: active.size, contextState: context?.state||'not-created', music: musicName }) };
  }
  if (typeof module === 'object' && module.exports) module.exports = { createAudioManager };
  else global.HeyPalsAudio = createAudioManager(global);
})(typeof window === 'object' ? window : globalThis);
