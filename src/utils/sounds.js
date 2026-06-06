import { getAudioPrefs, saveAudioPrefs } from "./storage";

// ─── AUDIO CONTEXT (lazy init) ────────────────────────────────────────────
let ctx = null;
let ambientNode = null;
let ambientGain = null;
let ambientPlaying = false;
let bgMusic = null;

const getCtx = () => {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
};

const resumeCtx = () => {
  const c = getCtx();
  if (c.state === "suspended") c.resume();
  return c;
};

// ─── PREFS ACCESSORS ─────────────────────────────────────────────────────
export const getMuted = () => getAudioPrefs().muted;
export const getSfxMuted = () => getAudioPrefs().sfxMuted;
export const getVolume = () => getAudioPrefs().volume ?? 0.7;

export const setMuted = (val) => {
  saveAudioPrefs({ muted: val });
  if (val) stopAmbient(); else if (ambientPlaying) startAmbient();
};
export const setSfxMuted = (val) => saveAudioPrefs({ sfxMuted: val });
export const setVolume = (val) => {
  saveAudioPrefs({ volume: val });
  if (ambientGain) ambientGain.gain.setTargetAtTime(val * 0.15, resumeCtx().currentTime, 0.1);
};

// ─── SFX PLAYER ──────────────────────────────────────────────────────────
const sfx = (fn) => {
  const prefs = getAudioPrefs();
  if (prefs.muted || prefs.sfxMuted) return;
  try {
    const c = resumeCtx();
    fn(c, prefs.volume ?? 0.7);
  } catch {}
};

// ─── SOUND EFFECTS ───────────────────────────────────────────────────────
export const sounds = {
  hover: () =>
    sfx((c, v) => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.frequency.value = 1200;
      g.gain.setValueAtTime(v * 0.04, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.08);
      o.start(c.currentTime); o.stop(c.currentTime + 0.08);
    }),

  click: () =>
    sfx((c, v) => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = "square";
      o.frequency.setValueAtTime(600, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.12);
      g.gain.setValueAtTime(v * 0.08, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.15);
      o.start(c.currentTime); o.stop(c.currentTime + 0.15);
    }),

  correct: () =>
    sfx((c, v) => {
      [523, 659, 784, 1047].forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.frequency.value = f;
        const t = c.currentTime + i * 0.1;
        g.gain.setValueAtTime(v * 0.15, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.start(t); o.stop(t + 0.35);
      });
    }),

  wrong: () =>
    sfx((c, v) => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = "sawtooth";
      o.frequency.setValueAtTime(220, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.35);
      g.gain.setValueAtTime(v * 0.12, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.35);
      o.start(c.currentTime); o.stop(c.currentTime + 0.35);
    }),

  hint: () =>
    sfx((c, v) => {
      [440, 554, 659].forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = "sine"; o.connect(g); g.connect(c.destination);
        o.frequency.value = f;
        const t = c.currentTime + i * 0.15;
        g.gain.setValueAtTime(v * 0.1, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        o.start(t); o.stop(t + 0.3);
      });
    }),

  unlock: () =>
    sfx((c, v) => {
      [330, 415, 523, 659, 784, 1047, 1319].forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.frequency.value = f;
        const t = c.currentTime + i * 0.07;
        g.gain.setValueAtTime(v * 0.12, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        o.start(t); o.stop(t + 0.5);
      });
    }),

  stageComplete: () =>
    sfx((c, v) => {
      // Fanfare arpeggio + chord
      [[523,0],[659,0.1],[784,0.2],[1047,0.3],[784,0.45],[1047,0.55],[1319,0.65]].forEach(([f,t]) => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.frequency.value = f;
        const ts = c.currentTime + t;
        g.gain.setValueAtTime(v * 0.14, ts);
        g.gain.exponentialRampToValueAtTime(0.0001, ts + 0.4);
        o.start(ts); o.stop(ts + 0.4);
      });
    }),

  victory: () =>
    sfx((c, v) => {
      const melody = [523,659,784,659,784,1047,784,1047,1319,1047,1319,1568];
      melody.forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.frequency.value = f;
        const t = c.currentTime + i * 0.11;
        g.gain.setValueAtTime(v * 0.15, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
        o.start(t); o.stop(t + 0.38);
      });
    }),

  pageTransition: () =>
    sfx((c, v) => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(400, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.2);
      g.gain.setValueAtTime(v * 0.06, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.25);
      o.start(c.currentTime); o.stop(c.currentTime + 0.25);
    }),

  leaderboard: () =>
    sfx((c, v) => {
      [330,415,523,415,523,659,523,659,784].forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.frequency.value = f;
        const t = c.currentTime + i * 0.09;
        g.gain.setValueAtTime(v * 0.1, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        o.start(t); o.stop(t + 0.25);
      });
    }),
};

// ─── AMBIENT MUSIC ───────────────────────────────────────────────────────
// Generates a looping dark mystery drone using Web Audio

export const startAmbient = () => {
  const prefs = getAudioPrefs();
  if (prefs.muted || ambientPlaying) return;
  
  bgMusic = new Audio('/sound/background.mp3'); // apni file ka path
  bgMusic.loop = true;
  bgMusic.volume = (prefs.volume ?? 0.7) * 0.4;
  bgMusic.play().catch(() => {});
  ambientPlaying = true;
};

export const stopAmbient = () => {
  if (!bgMusic) return;
  bgMusic.pause();
  bgMusic.currentTime = 0;
  bgMusic = null;
  ambientPlaying = false;
};

export const isAmbientPlaying = () => ambientPlaying;
