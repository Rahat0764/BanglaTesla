/**
 * AudioManager – fallback friendly
 * User can drop mp3/ogg into public/sounds/ later
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.buffers = {};
    this._init();
  }

  _init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) {
      this.enabled = false;
    }
  }

  resume() {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  /** Play a named sound if loaded, otherwise silent fallback */
  play(name, opts = {}) {
    if (!this.enabled || !this.ctx) return;
    const buf = this.buffers[name];
    if (!buf) return; // graceful fallback – no error
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const gain = this.ctx.createGain();
    gain.gain.value = opts.volume ?? 0.5;
    src.connect(gain);
    gain.connect(this.ctx.destination);
    src.loop = !!opts.loop;
    src.start();
    return src;
  }

  /** Optional: load a file. Call after user adds assets */
  async load(name, url) {
    if (!this.ctx) return;
    try {
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      this.buffers[name] = await this.ctx.decodeAudioData(arr);
    } catch (e) {
      console.warn('Sound load failed (ok to ignore):', name, e.message);
    }
  }
}
