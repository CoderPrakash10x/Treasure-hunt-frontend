import { useEffect, useRef, useState, useCallback } from "react";

// ─── Audio Engine (self-contained, no deps) ───────────────────────────────────
let _ac = null;
const getAC = () => {
  if (!_ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    _ac = new AC();
  }
  return _ac;
};
const resumeAC = () => {
  const c = getAC();
  if (c.state === "suspended") c.resume();
  return c;
};

const SFX = {
  glitchBurst: (intensity = 1) => {
    try {
      const c = resumeAC();
      const len = Math.floor(c.sampleRate * (0.12 + intensity * 0.18));
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 0.5) * intensity;
      }
      const src = c.createBufferSource();
      const bpf = c.createBiquadFilter();
      bpf.type = "bandpass";
      bpf.frequency.value = 400 + Math.random() * 1200;
      bpf.Q.value = 0.4;
      const g = c.createGain();
      g.gain.value = 0.28 * intensity;
      src.buffer = buf;
      src.connect(bpf);
      bpf.connect(g);
      g.connect(c.destination);
      src.start();
      src.stop(c.currentTime + 0.3);
    } catch {}
  },

  startup: () => {
    try {
      const c = resumeAC();
      // Power-up sweep
      const o1 = c.createOscillator();
      const g1 = c.createGain();
      o1.type = "sawtooth";
      o1.frequency.setValueAtTime(30, c.currentTime);
      o1.frequency.exponentialRampToValueAtTime(180, c.currentTime + 0.8);
      g1.gain.setValueAtTime(0.001, c.currentTime);
      g1.gain.exponentialRampToValueAtTime(0.18, c.currentTime + 0.4);
      g1.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.85);
      o1.connect(g1); g1.connect(c.destination);
      o1.start(); o1.stop(c.currentTime + 0.9);

      // High whine
      const o2 = c.createOscillator();
      const g2 = c.createGain();
      o2.type = "sine";
      o2.frequency.setValueAtTime(800, c.currentTime + 0.2);
      o2.frequency.exponentialRampToValueAtTime(2400, c.currentTime + 0.8);
      g2.gain.setValueAtTime(0.0, c.currentTime + 0.2);
      g2.gain.linearRampToValueAtTime(0.07, c.currentTime + 0.5);
      g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.9);
      o2.connect(g2); g2.connect(c.destination);
      o2.start(c.currentTime + 0.2); o2.stop(c.currentTime + 0.95);
    } catch {}
  },

  impact: () => {
    try {
      const c = resumeAC();
      // Sub thud
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(120, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.3);
      g.gain.setValueAtTime(0.4, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
      o.connect(g); g.connect(c.destination);
      o.start(); o.stop(c.currentTime + 0.5);

      // Crack
      const bufLen = Math.floor(c.sampleRate * 0.08);
      const cracBuf = c.createBuffer(1, bufLen, c.sampleRate);
      const cd = cracBuf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) cd[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
      const crackSrc = c.createBufferSource();
      const crackG = c.createGain();
      crackG.gain.value = 0.35;
      crackSrc.buffer = cracBuf;
      crackSrc.connect(crackG); crackG.connect(c.destination);
      crackSrc.start();
    } catch {}
  },

  welcome: () => {
    try {
      const c = resumeAC();
      [[330, 0], [415, 0.1], [523, 0.2], [659, 0.32], [784, 0.44], [1047, 0.56]].forEach(([f, t]) => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.frequency.value = f; o.type = "sine";
        const ts = c.currentTime + t;
        g.gain.setValueAtTime(0.13, ts);
        g.gain.exponentialRampToValueAtTime(0.0001, ts + 0.5);
        o.start(ts); o.stop(ts + 0.5);
      });
    } catch {}
  },

  typing: () => {
    try {
      const c = resumeAC();
      const o = c.createOscillator(), g = c.createGain();
      o.type = "square";
      o.frequency.value = 480 + Math.random() * 360;
      o.connect(g); g.connect(c.destination);
      g.gain.setValueAtTime(0.032, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.048);
      o.start(); o.stop(c.currentTime + 0.05);
    } catch {}
  },

  barTick: (pct) => {
    try {
      const c = resumeAC();
      const o = c.createOscillator(), g = c.createGain();
      o.type = "sine";
      o.frequency.value = 200 + pct * 6;
      o.connect(g); g.connect(c.destination);
      g.gain.setValueAtTime(0.05, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.06);
      o.start(); o.stop(c.currentTime + 0.07);
    } catch {}
  },

  shatter: () => {
    try {
      const c = resumeAC();
      // Descending glitch storm
      for (let i = 0; i < 6; i++) {
        setTimeout(() => SFX.glitchBurst(0.6 + i * 0.1), i * 55);
      }
      // Low rumble
      const o = c.createOscillator(), g = c.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(60, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(20, c.currentTime + 0.6);
      g.gain.setValueAtTime(0.15, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.65);
      o.connect(g); g.connect(c.destination);
      o.start(); o.stop(c.currentTime + 0.7);
    } catch {}
  },
};

// ─── Glitch Engine ────────────────────────────────────────────────────────────
function useGlitchEngine(canvasRef, containerRef) {
  const stateRef = useRef({
    active: false,
    intensity: 0,
    timer: 0,
    slices: [],
    rgbShift: 0,
    frameCount: 0,
  });

  const buildSlices = useCallback((intensity) => {
    const canvas = canvasRef.current;
    if (!canvas) return [];
    const h = canvas.height;
    const count = Math.floor(intensity * 16) + 4;
    return Array.from({ length: count }, () => ({
      y: Math.random() * h,
      h: Math.random() * 22 + 2,
      ox: (Math.random() - 0.5) * intensity * 80,
      alpha: Math.random() * 0.35 + 0.08,
      r: Math.random() > 0.5 ? 212 : 0,
      g: Math.random() > 0.5 ? 175 : 255,
      b: Math.random() > 0.5 ? 55 : 80,
    }));
  }, [canvasRef]);

  const trigger = useCallback((intensity = 1, duration = 280) => {
    const s = stateRef.current;
    // Allow intensity upgrade mid-glitch
    if (s.active && intensity <= s.intensity) { s.timer = Math.max(s.timer, duration); return; }
    s.active = true;
    s.intensity = intensity;
    s.timer = duration;
    s.rgbShift = Math.floor(intensity * 10);
    s.slices = buildSlices(intensity);
  }, [buildSlices]);

  const drawFrame = useCallback((dt) => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return { active: false, offsetX: 0, offsetY: 0, rgb: 0 };
    const ctx = canvas.getContext("2d");

    if (!s.active) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return { active: false, offsetX: 0, offsetY: 0, rgb: 0 };
    }

    s.timer -= dt;
    s.frameCount++;

    // Rebuild slices every 2 frames
    if (s.frameCount % 2 === 0) s.slices = buildSlices(s.intensity);

    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Slice displacement
    s.slices.forEach(sl => {
      ctx.fillStyle = `rgba(${sl.r},${sl.g},${sl.b},${sl.alpha})`;
      ctx.fillRect(sl.ox, sl.y, w, sl.h);
    });

    // Tear lines
    const tears = Math.floor(s.intensity * 4) + 1;
    for (let i = 0; i < tears; i++) {
      ctx.fillStyle = `rgba(${Math.random() > 0.5 ? "255,0,80" : "0,255,140"},${Math.random() * 0.15})`;
      ctx.fillRect(0, Math.random() * h, w, Math.random() * 3 + 1);
    }

    // Pixel noise band (only at high intensity)
    if (s.intensity > 0.7 && Math.random() > 0.55) {
      const ny = Math.random() * h, nh = Math.floor(Math.random() * 10) + 2;
      try {
        const id = ctx.createImageData(w, nh);
        for (let i = 0; i < id.data.length; i += 4) {
          const v = Math.random() > 0.5 ? 255 : 0;
          id.data[i] = v * 0.85; id.data[i + 1] = v * 0.72; id.data[i + 2] = v * 0.18;
          id.data[i + 3] = Math.random() > 0.5 ? 160 : 0;
        }
        ctx.putImageData(id, 0, ny);
      } catch {}
    }

    // Block corruption
    if (s.intensity > 0.6 && Math.random() > 0.6) {
      ctx.fillStyle = `rgba(212,175,55,${Math.random() * 0.12})`;
      ctx.fillRect(Math.random() * w * 0.7, Math.random() * h, 30 + Math.random() * 80, Math.random() * 50 + 10);
    }

    const ox = (Math.random() - 0.5) * s.intensity * 16;
    const oy = (Math.random() - 0.5) * s.intensity * 6;

    if (s.timer <= 0) {
      s.active = false;
      s.frameCount = 0;
      ctx.clearRect(0, 0, w, h);
    }

    return { active: true, offsetX: ox, offsetY: oy, rgb: s.rgbShift };
  }, [canvasRef, buildSlices]);

  return { trigger, drawFrame, stateRef };
}

// ─── Component ────────────────────────────────────────────────────────────────
const STAGES = [
  { id: "boot",    duration: 800 },
  { id: "logo",    duration: 900 },
  { id: "init",    duration: 1000 },
  { id: "bar",     duration: 1400 },
  { id: "welcome", duration: 900 },
  { id: "shatter", duration: 700 },
];

export default function SplashScreen({ onDone }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const sphereCanvasRef = useRef(null);
  const rafRef = useRef(null);
  const lastTRef = useRef(0);
  const sphereTRef = useRef(0);

  const [stage, setStage] = useState("boot");
  const [initText, setInitText] = useState("");
  const [barPct, setBarPct] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [shattering, setShattering] = useState(false);

  // CSS glitch state for text elements
  const [textGlitch, setTextGlitch] = useState({ ox: 0, oy: 0, skew: 0, rgb: 0, active: false });

  const { trigger, drawFrame } = useGlitchEngine(canvasRef, containerRef);

  // Resize canvas
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !canvasRef.current) return;
    const resize = () => {
      canvasRef.current.width = el.offsetWidth;
      canvasRef.current.height = el.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Sphere renderer
  const drawSphere = useCallback((glitchState) => {
    const c = sphereCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const W = 160, H = 160, cx = 80, cy = 80, r = 68;
    const t = sphereTRef.current;
    ctx.clearRect(0, 0, W, H);

    // Glow rings
    for (let i = 3; i > 0; i--) {
      ctx.beginPath();
      ctx.arc(cx, cy, r + i * 9, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(212,175,55,${0.03 * i + (glitchState.active ? 0.04 : 0)})`;
      ctx.lineWidth = 7;
      ctx.stroke();
    }

    // Sphere
    const grad = ctx.createRadialGradient(cx - 20, cy - 20, 6, cx, cy, r);
    grad.addColorStop(0, "#5a4400");
    grad.addColorStop(0.45, "#231a00");
    grad.addColorStop(1, "#000");
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = glitchState.active ? `rgba(212,175,55,${0.6 + Math.random() * 0.4})` : "#D4AF37";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Latitude lines
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    for (let i = -3; i <= 3; i++) {
      const ly = cy + i * 20 + Math.sin(t + i * 0.7) * 3 + (glitchState.active ? glitchState.offsetY * 0.25 : 0);
      const rw = Math.sqrt(Math.max(0, r * r - (ly - cy) ** 2));
      const lx = cx + (glitchState.active ? glitchState.offsetX * 0.18 : 0);
      ctx.beginPath();
      ctx.ellipse(lx, ly, rw, rw * 0.17, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(212,175,55,0.17)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // Meridian
    ctx.beginPath();
    ctx.ellipse(cx + (glitchState.active ? glitchState.offsetX * 0.12 : 0), cy, r * 0.17, r, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(212,175,55,0.14)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Symbol
    ctx.font = "bold 44px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (glitchState.active && glitchState.rgb > 1) {
      const rgb = glitchState.rgb * 0.7;
      ctx.fillStyle = `rgba(255,0,80,0.75)`;
      ctx.fillText("⚜", cx - rgb, cy + 2);
      ctx.fillStyle = `rgba(0,255,180,0.75)`;
      ctx.fillText("⚜", cx + rgb, cy - 2);
    }
    ctx.fillStyle = "#D4AF37";
    ctx.fillText("⚜", cx, cy);
  }, []);

  // Main RAF loop
  useEffect(() => {
    let alive = true;
    const loop = (ts) => {
      if (!alive) return;
      const dt = Math.min(ts - lastTRef.current, 50);
      lastTRef.current = ts;
      sphereTRef.current += dt * 0.001;

      const glitchState = drawFrame(dt);

      if (glitchState.active) {
        setTextGlitch({
          active: true,
          ox: glitchState.offsetX,
          oy: glitchState.offsetY,
          skew: (Math.random() - 0.5) * glitchState.rgb * 0.4,
          rgb: glitchState.rgb,
        });
      } else {
        setTextGlitch(g => g.active ? { active: false, ox: 0, oy: 0, skew: 0, rgb: 0 } : g);
      }

      drawSphere(glitchState);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
  }, [drawFrame, drawSphere]);

  // Ambient micro-glitches
  useEffect(() => {
    let tid;
    const schedule = () => {
      tid = setTimeout(() => {
        trigger(0.15 + Math.random() * 0.35, 60 + Math.random() * 100);
        schedule();
      }, 2000 + Math.random() * 3500);
    };
    schedule();
    return () => clearTimeout(tid);
  }, [trigger]);

  // ── Main Sequence ────────────────────────────────────────────────────────────
  useEffect(() => {
    const seq = async () => {
      // STAGE 1: Boot glitch + startup sound
      await delay(60);
      SFX.startup();
      trigger(1.1, 400);
      await delay(200);
      trigger(0.9, 280);

      // STAGE 2: Logo reveal
      await delay(700);
      setShowLogo(true);
      trigger(0.8, 300);
      SFX.glitchBurst(0.8);

      // STAGE 3: Typewriter "INITIALIZING..."
      await delay(600);
      setStage("init");
      const msg = "INITIALIZING TREASURE HUNT...";
      for (let i = 0; i <= msg.length; i++) {
        SFX.typing();
        if (i % 5 === 0 && i > 0) trigger(0.25 + Math.random() * 0.2, 40 + Math.random() * 60);
        setInitText(msg.slice(0, i));
        await delay(48 + Math.random() * 32);
      }

      // STAGE 4: Progress bar
      await delay(200);
      setStage("bar");
      let pct = 0;
      const barMilestones = [0, 25, 50, 75, 100];
      let nextMilestone = 1;
      while (pct < 100) {
        pct = Math.min(pct + 1.2 + Math.random() * 0.8, 100);
        setBarPct(pct);
        if (Math.round(pct) === barMilestones[nextMilestone]) {
          SFX.barTick(pct);
          trigger(0.3 + nextMilestone * 0.08, 80);
          nextMilestone = Math.min(nextMilestone + 1, barMilestones.length - 1);
        }
        await delay(22);
      }

      // STAGE 5: Welcome reveal
      await delay(180);
      SFX.impact();
      trigger(1.2, 350);
      await delay(120);
      SFX.welcome();
      setShowWelcome(true);
      setStage("welcome");
      await delay(300);
      trigger(0.7, 200);

      // STAGE 6: Shatter and exit
      await delay(900);
      SFX.shatter();
      trigger(1.4, 500);
      setShattering(true);
      await delay(200);
      trigger(1.2, 300);
      await delay(600);
      onDone();
    };
    seq();
  }, []);  // eslint-disable-line

  const glitchStyle = textGlitch.active ? {
    transform: `translate(${textGlitch.ox}px, ${textGlitch.oy}px) skewX(${textGlitch.skew}deg)`,
    filter: `brightness(${1.1 + Math.abs(textGlitch.ox) * 0.03})`,
  } : { transform: "translate(0,0) skewX(0deg)", transition: "transform 0.05s" };

  const rgbShadow = textGlitch.active && textGlitch.rgb > 1
    ? `-${textGlitch.rgb}px 0 rgba(255,0,80,0.85), ${textGlitch.rgb}px 0 rgba(0,255,180,0.85), 0 0 20px rgba(212,175,55,0.7)`
    : "0 0 14px rgba(212,175,55,0.5)";

  return (
    <div
      ref={containerRef}
      className={`spl-root${shattering ? " spl-shatter" : ""}`}
      style={{ position: "fixed", inset: 0, zIndex: 9999 }}
    >
      <canvas ref={canvasRef} className="spl-canvas" />
      <div className="spl-scanlines" />
      <div className="spl-vignette" />

      {/* Particles */}
      <div className="spl-particles">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="spl-particle" style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${3 + Math.random() * 5}s`,
            animationDelay: `${Math.random() * 4}s`,
            opacity: 0.1 + Math.random() * 0.25,
          }} />
        ))}
      </div>

      <div className="spl-content">
        {/* Logo / Sphere */}
        <div className={`spl-logo-wrap${showLogo ? " spl-logo-in" : ""}`}>
          <canvas ref={sphereCanvasRef} width={160} height={160} className="spl-sphere-canvas" />
          <div
            className="spl-brand"
            style={{ ...glitchStyle, textShadow: rgbShadow }}
          >
            EVOLVERA
          </div>
          <div className="spl-brand-sub" style={glitchStyle}>IGNITIA NEXUS</div>
        </div>

        {/* Init text */}
        {(stage === "init" || stage === "bar" || stage === "welcome") && (
          <div className="spl-init-line" style={glitchStyle}>
            <span className="spl-prompt">▶ </span>
            {initText}
            {stage === "init" && <span className="spl-cur">█</span>}
          </div>
        )}

        {/* Progress bar */}
        {(stage === "bar" || stage === "welcome") && (
          <div className="spl-bar-section">
            <div className="spl-bar-labels">
              {[0, 25, 50, 75, 100].map(n => (
                <span key={n} className={`spl-bar-label${barPct >= n ? " lit" : ""}`}>{n}%</span>
              ))}
            </div>
            <div className="spl-bar-track">
              <div
                className="spl-bar-fill"
                style={{ width: `${barPct}%` }}
              />
              <div className="spl-bar-glow" style={{ left: `${barPct}%` }} />
            </div>
          </div>
        )}

        {/* Welcome */}
        {showWelcome && (
          <div className="spl-welcome" style={{ ...glitchStyle, textShadow: rgbShadow }}>
            WELCOME TO TREASURE HUNT
          </div>
        )}
      </div>

      {/* Corners */}
      <span className="spl-corner tl">◤</span>
      <span className="spl-corner tr">◥</span>
      <span className="spl-corner bl">◣</span>
      <span className="spl-corner br">◢</span>
    </div>
  );
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}