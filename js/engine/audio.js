/**
 * Web Audio API Sound Synthesizer for Diplomacy War Room
 * High quality procedural audio for military brass, cannons, telegraph, bells, and marches
 */

export class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  _initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  /**
   * Telegraph morse code ticker sound
   */
  playTelegraph() {
    if (!this.enabled) return;
    this._initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [800, 800, 800, 800];
    const timings = [0, 0.08, 0.16, 0.28];

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + timings[idx]);

      gain.gain.setValueAtTime(0, now + timings[idx]);
      gain.gain.linearRampToValueAtTime(0.08, now + timings[idx] + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + timings[idx] + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + timings[idx]);
      osc.stop(now + timings[idx] + 0.06);
    });
  }

  /**
   * Military drum / brass fanfare on phase advance
   */
  playPhaseFanfare() {
    if (!this.enabled) return;
    this._initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chords = [220, 277, 330, 440]; // A major

    chords.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);

      gain.gain.setValueAtTime(0, now + i * 0.07);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.07 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.55);
    });
  }

  /**
   * Artillery cannon explosion for dislodgement or clash
   */
  playArtillery() {
    if (!this.enabled) return;
    this._initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.6);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.7);
  }

  /**
   * Naval ship bell for fleet actions
   */
  playNavalBell() {
    if (!this.enabled) return;
    this._initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [1200, 1800, 2400];

    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.85);
    });
  }

  /**
   * Tactile click / order confirmation
   */
  playClick() {
    if (!this.enabled) return;
    this._initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }
}
