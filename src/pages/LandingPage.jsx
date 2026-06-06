import { useState, useEffect, useRef, useCallback } from "react";
import { sounds, startAmbient, getMuted, setMuted, getSfxMuted, setSfxMuted, getVolume, setVolume } from "../utils/sounds";
import { getAudioPrefs } from "../utils/storage";

const BOOT_SEQUENCE = [
  { text: "IGNITIA NEXUS OS v4.7.1 — BOOT SEQUENCE INITIATED", delay: 0, color: "gold" },
  { text: "► Initializing secure vault protocols...", delay: 400, color: "dim" },
  { text: "► Loading biometric scanners... [OK]", delay: 900, color: "dim" },
  { text: "► Checking encryption layers... [OK]", delay: 1400, color: "dim" },
  { text: "► Scanning for intrusion attempts... [NONE DETECTED]", delay: 2000, color: "dim" },
  { text: "► Connecting to Nexus core... [ESTABLISHED]", delay: 2700, color: "dim" },
  { text: "WARNING: 5 encrypted layers detected. Proceed with extreme caution.", delay: 3400, color: "warn" },
  { text: "► ACCESS GRANTED — WELCOME, OPERATIVE.", delay: 4200, color: "green" },
];

const NARRATIVE = [
  "IGNITIA NEXUS — CLASSIFIED OPERATION",
  "Five layers of encryption guard the vault.",
  "Only the sharpest minds will breach its seals.",
  "The treasure awaits. The clock is already ticking.",
  "Are you ready to escape?",
];

// ─── Lightweight typing sound (won't conflict with existing sounds util) ──────
let _landAC = null;
const getLandAC = () => {
  if (!_landAC) {
    const AC = window.AudioContext || window.webkitAudioContext;
    _landAC = new AC();
  }
  return _landAC;
};

function playTypeSound() {
  try {
    const prefs = getAudioPrefs();
    if (prefs.muted || prefs.sfxMuted) return;
    const c = getLandAC();
    if (c.state === "suspended") c.resume();
    const o = c.createOscillator(), g = c.createGain();
    o.type = "square";
    o.frequency.value = 460 + Math.random() * 380;
    o.connect(g); g.connect(c.destination);
    const vol = (prefs.volume ?? 0.7) * 0.034;
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.046);
    o.start(); o.stop(c.currentTime + 0.05);
  } catch {}
}

// ─── Glitch state for landing page ───────────────────────────────────────────
function useTextGlitch(active, intensity = 1) {
  const [state, setState] = useState({ ox: 0, oy: 0, skew: 0, rgb: 0 });
  const rafRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setState({ ox: 0, oy: 0, skew: 0, rgb: 0 });
      return;
    }
    let alive = true;
    const run = () => {
      if (!alive) return;
      frameRef.current++;
      if (frameRef.current % 2 === 0) {
        setState({
          ox: (Math.random() - 0.5) * intensity * 14,
          oy: (Math.random() - 0.5) * intensity * 5,
          skew: (Math.random() - 0.5) * intensity * 3,
          rgb: Math.floor(intensity * 8),
        });
      }
      rafRef.current = requestAnimationFrame(run);
    };
    rafRef.current = requestAnimationFrame(run);
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
  }, [active, intensity]);

  const style = active ? {
    transform: `translate(${state.ox}px, ${state.oy}px) skewX(${state.skew}deg)`,
  } : {};

  const textShadow = active && state.rgb > 1
    ? `-${state.rgb}px 0 rgba(255,0,80,0.8), ${state.rgb}px 0 rgba(0,255,180,0.8), 0 0 18px rgba(212,175,55,0.7)`
    : undefined;

  return { style, textShadow };
}

export default function LandingPage({ onStart }) {
  const [bootLines, setBootLines] = useState([]);
  const [bootDone, setBootDone] = useState(false);
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [typed, setTyped] = useState("");
  const [showButton, setShowButton] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [glitchIntensity, setGlitchIntensity] = useState(0.5);
  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const [audioPrefs, setAudioPrefs] = useState(getAudioPrefs());
  const [typingActive, setTypingActive] = useState(false);
  const charRef = useRef(0);
  const lineRef = useRef(0);
  const typingSoundRef = useRef(null);

  // Glitch hook for logo
  const logoGlitch = useTextGlitch(glitch, glitchIntensity);

  // Boot sequence
  useEffect(() => {
    const timers = BOOT_SEQUENCE.map((item, i) =>
      setTimeout(() => {
        setBootLines((prev) => [...prev, item]);
        if (i === BOOT_SEQUENCE.length - 1) {
          setTimeout(() => setBootDone(true), 600);
        }
      }, item.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Glitch effect — randomized intensity
  useEffect(() => {
    let tid;
    const schedule = () => {
      tid = setTimeout(() => {
        const intensity = 0.3 + Math.random() * 0.7;
        setGlitchIntensity(intensity);
        setGlitch(true);
        setTimeout(() => setGlitch(false), 100 + Math.random() * 100);
        schedule();
      }, 3000 + Math.random() * 2500);
    };
    schedule();
    return () => clearTimeout(tid);
  }, []);

  // Typewriter narrative with typing sounds
  useEffect(() => {
    if (!bootDone) return;
    if (lineRef.current >= NARRATIVE.length) {
      setTimeout(() => setShowButton(true), 400);
      return;
    }
    const line = NARRATIVE[lineRef.current];
    charRef.current = 0;
    setTyped("");
    setTypingActive(true);

    const iv = setInterval(() => {
      charRef.current++;
      // Play typing sound for each character
      playTypeSound();
      setTyped(line.slice(0, charRef.current));

      if (charRef.current >= line.length) {
        clearInterval(iv);
        setTypingActive(false);
        setTimeout(() => {
          setLines((p) => [...p, line]);
          setTyped("");
          lineRef.current++;
          setCurrentLine((c) => c + 1);
        }, 500);
      }
    }, 35);
    return () => { clearInterval(iv); setTypingActive(false); };
  }, [currentLine, bootDone]);

  const handleStart = () => {
    sounds.pageTransition();
    startAmbient();
    onStart();
  };

  const updateAudio = (key, val) => {
    const newPrefs = { ...audioPrefs, [key]: val };
    setAudioPrefs(newPrefs);
    if (key === "muted") setMuted(val);
    if (key === "sfxMuted") setSfxMuted(val);
    if (key === "volume") setVolume(val);
  };

  // Logo text with RGB split when glitching
  const logoTextShadow = glitch && glitchIntensity > 0.5
    ? logoGlitch.textShadow
    : undefined;

  return (
    <div className="landing-root">
      <div className="scanlines" />

      {/* Audio controls */}
      <div className="audio-controls-wrap">
        <button className="audio-toggle-btn" onClick={() => setShowAudioPanel(p => !p)}
          title="Audio settings">🎵</button>
        {showAudioPanel && (
          <div className="audio-panel">
            <div className="audio-row">
              <span>Music</span>
              <button className={`toggle-pill ${audioPrefs.muted ? "off" : "on"}`}
                onClick={() => updateAudio("muted", !audioPrefs.muted)}>
                {audioPrefs.muted ? "OFF" : "ON"}
              </button>
            </div>
            <div className="audio-row">
              <span>SFX</span>
              <button className={`toggle-pill ${audioPrefs.sfxMuted ? "off" : "on"}`}
                onClick={() => updateAudio("sfxMuted", !audioPrefs.sfxMuted)}>
                {audioPrefs.sfxMuted ? "OFF" : "ON"}
              </button>
            </div>
            <div className="audio-row">
              <span>Vol</span>
              <input type="range" min="0" max="1" step="0.05"
                value={audioPrefs.volume ?? 0.7}
                onChange={(e) => updateAudio("volume", parseFloat(e.target.value))}
                className="vol-slider" />
            </div>
          </div>
        )}
      </div>

      {/* Logo — enhanced glitch */}
      <div
        className={`vault-logo ${glitch ? "glitch" : ""}`}
        style={logoGlitch.style}
      >
        <div className="logo-symbol" style={{ textShadow: logoTextShadow }}>⚜</div>
        <h1
          className="logo-title"
          data-text="IGNITIA NEXUS"
          style={{ textShadow: logoTextShadow }}
        >
          IGNITIA NEXUS
        </h1>
        <div className="logo-subtitle">THE SECRET ESCAPE</div>
        <div className="logo-divider" />
      </div>

      {/* Boot / Terminal */}
      <div className="terminal-box">
        <div className="terminal-header">
          <span className="terminal-dot red" /><span className="terminal-dot yellow" /><span className="terminal-dot green" />
          <span className="terminal-title">VAULT_ACCESS_TERMINAL v4.7</span>
        </div>
        <div className="terminal-body">
          {!bootDone && bootLines.map((l, i) => (
            <p key={i} className={`terminal-line boot-line boot-${l.color}`}>
              {l.text}
            </p>
          ))}
          {bootDone && lines.map((l, i) => (
            <p key={i} className={`terminal-line ${i === 0 ? "gold-line" : ""}`}>
              <span className="prompt">▶ </span>{l}
            </p>
          ))}
          {bootDone && lineRef.current < NARRATIVE.length && (
            <p className={`terminal-line typing${typingActive ? " typing-active" : ""}`}>
              <span className="prompt">▶ </span>
              <span className={typingActive ? "typing-glow" : ""}>{typed}</span>
              <span className="cursor">█</span>
            </p>
          )}
        </div>
      </div>

      {/* Start button */}
      {showButton && (
        <div className="start-container fade-in">
          <button className="start-btn" onClick={handleStart}
            onMouseEnter={() => sounds.hover()}>
            <span className="btn-text">⚡ ENTER THE VAULT ⚡</span>
          </button>
          <p className="start-hint">5 LAYERS · UNLIMITED MINDS · ONE VAULT</p>
        </div>
      )}

      <div className="corner tl">◤</div>
      <div className="corner tr">◥</div>
      <div className="corner bl">◣</div>
      <div className="corner br">◢</div>
    </div>
  );
}