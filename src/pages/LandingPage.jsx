import { useState, useEffect, useRef } from "react";
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

export default function LandingPage({ onStart }) {
  const [bootLines, setBootLines] = useState([]);
  const [bootDone, setBootDone] = useState(false);
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [typed, setTyped] = useState("");
  const [showButton, setShowButton] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const [audioPrefs, setAudioPrefs] = useState(getAudioPrefs());
  const charRef = useRef(0);
  const lineRef = useRef(0);
  const bootRef = useRef(0);

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

  // Glitch effect
  useEffect(() => {
    const id = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 120 + Math.random() * 80);
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  // Typewriter narrative (after boot)
  useEffect(() => {
    if (!bootDone) return;
    if (lineRef.current >= NARRATIVE.length) {
      setTimeout(() => setShowButton(true), 400);
      return;
    }
    const line = NARRATIVE[lineRef.current];
    charRef.current = 0;
    setTyped("");
    const iv = setInterval(() => {
      charRef.current++;
      setTyped(line.slice(0, charRef.current));
      if (charRef.current >= line.length) {
        clearInterval(iv);
        setTimeout(() => {
          setLines((p) => [...p, line]);
          setTyped("");
          lineRef.current++;
          setCurrentLine((c) => c + 1);
        }, 500);
      }
    }, 35);
    return () => clearInterval(iv);
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

      {/* Logo */}
      <div className={`vault-logo ${glitch ? "glitch" : ""}`}>
        <div className="logo-symbol">⚜</div>
        <h1 className="logo-title" data-text="IGNITIA NEXUS">IGNITIA NEXUS</h1>
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
            <p className="terminal-line typing">
              <span className="prompt">▶ </span>{typed}<span className="cursor">█</span>
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
