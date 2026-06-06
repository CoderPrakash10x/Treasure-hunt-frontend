import { useEffect, useRef, useState } from "react";

const PHASES = [
  { text: "INITIALIZING VAULT PROTOCOLS...", color: "#00ff88" },
  { text: "SCANNING BIOMETRICS... [OK]",     color: "#00ff88" },
  { text: "LOADING ENCRYPTION LAYERS... [OK]", color: "#00ff88" },
  { text: "CONNECTING TO NEXUS CORE... [OK]",  color: "#00ff88" },
  { text: "WELCOME TO TREASURE HUNT",         color: "#D4AF37" },
];

const NOTE =
  "Every clue you uncover is a key. The vault rewards those who observe, think, and remember. " +
  "Write down each answer, each symbol, each pattern — nothing is accidental. " +
  "The sharpest operative takes nothing for granted.";

export default function SplashScreen({ onDone }) {
  const canvasRef = useRef(null);
  const audioRef  = useRef(null);
  const animRef   = useRef(null);

  const [phase, setPhase]         = useState(-1);
  const [typed, setTyped]         = useState("");
  const [lineColor, setLineColor] = useState("#00ff88");
  const [barPct, setBarPct]       = useState(0);
  const [litLabels, setLitLabels] = useState([false,false,false,false,false]);
  const [showBar, setShowBar]     = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showNote, setShowNote]   = useState(false);
  const [noteTyped, setNoteTyped] = useState("");
  const [showBtn, setShowBtn]     = useState(false);
  const [showLine, setShowLine]   = useState(true);
  const [shattering, setShattering] = useState(false);
  const [glitch, setGlitch]       = useState(false);

  // ── Particle canvas ─────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);

    const COLS = ["#D4AF37","#F4C542","#B8960C","#E8C84A"];
    const pts = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.2,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(Math.random() * 0.3 + 0.07),
      alpha: Math.random() * 0.5 + 0.1,
      pulse: Math.random() * Math.PI * 2,
      color: COLS[Math.floor(Math.random() * COLS.length)],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.pulse += 0.02;
        if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
        if (p.x < -5) p.x = W + 5;
        if (p.x > W + 5) p.x = -5;
        const a = p.alpha * (0.4 + 0.6 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(a * 255).toString(16).padStart(2, "0");
        ctx.fill();
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animRef.current); };
  }, []);

  // ── Audio context (lazy) ─────────────────────────────────────────────
  const getCtx = () => {
    if (!audioRef.current) audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioRef.current;
  };
  const playTyping = () => {
    try {
      const c = getCtx();
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = "square";
      o.frequency.setValueAtTime(900 + Math.random() * 400, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(400 + Math.random() * 200, c.currentTime + 0.06);
      g.gain.setValueAtTime(0.04, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.07);
      o.start(c.currentTime); o.stop(c.currentTime + 0.07);
    } catch {}
  };
  const playGlitch = () => {
    try {
      const c = getCtx();
      [0, 0.04, 0.08].forEach(dt => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = "sawtooth";
        o.frequency.setValueAtTime(80 + Math.random() * 300, c.currentTime + dt);
        g.gain.setValueAtTime(0.05, c.currentTime + dt);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dt + 0.06);
        o.start(c.currentTime + dt); o.stop(c.currentTime + dt + 0.06);
      });
    } catch {}
  };
  const playWelcome = () => {
    try {
      const c = getCtx();
      [523, 659, 784, 1047].forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.frequency.value = f;
        const t = c.currentTime + i * 0.1;
        g.gain.setValueAtTime(0.1, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.start(t); o.stop(t + 0.35);
      });
    } catch {}
  };

  // ── Glitch interval ──────────────────────────────────────────────────
  useEffect(() => {
    let timer;
    const schedule = () => {
      timer = setTimeout(() => {
        setGlitch(true);
        playGlitch();
        setTimeout(() => setGlitch(false), 110 + Math.random() * 80);
        schedule();
      }, 2800 + Math.random() * 2500);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  // ── Typewriter engine ────────────────────────────────────────────────
  const typewriter = (text, speed, onTick, onDone) => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      onTick(text.slice(0, i));
      if (i % 2 === 0) playTyping();
      if (i >= text.length) { clearInterval(iv); setTimeout(onDone, 400); }
    }, speed);
    return iv;
  };

  // ── Phase sequencer ──────────────────────────────────────────────────
  useEffect(() => {
    let iv;
    const runPhase = (p) => {
      if (p === 1) setShowBar(true);
      setPhase(p);
      setLineColor(PHASES[p].color);
      setTyped("");
      const barTargets = [22, 44, 66, 88, 100];
      iv = typewriter(
        PHASES[p].text,
        p === 4 ? 60 : 35,
        (t) => setTyped(t),
        () => {
          if (p < 4) {
            setBarPct(barTargets[p]);
            setLitLabels(l => l.map((_, i) => i <= p));
            setTimeout(() => { setTyped(""); runPhase(p + 1); }, 500);
          } else {
            // Final phase — welcome
            setBarPct(100);
            setLitLabels([true,true,true,true,true]);
            playWelcome();
            setTimeout(() => {
              setShowLine(false);
              setShowWelcome(true);
              setTimeout(() => {
                setShowNote(true);
                typewriter(NOTE, 26, (t) => setNoteTyped(t), () => {
                  setTimeout(() => setShowBtn(true), 500);
                });
              }, 700);
            }, 800);
          }
        }
      );
    };
    const t = setTimeout(() => runPhase(0), 500);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, []);

  const handleEnter = () => {
    try { playWelcome(); } catch {}
    setShattering(true);
    setTimeout(onDone, 680);
  };

  const BAR_LABELS = ["INIT", "AUTH", "ENCRYPT", "NEXUS", "ONLINE"];

  return (
    <div className={`spl-root${shattering ? " spl-shatter" : ""}`}>
      <canvas ref={canvasRef} className="spl-canvas" />
      <div className="spl-scanlines" />
      <div className="spl-vignette" />

      {/* Glitch overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none",
        opacity: glitch ? 1 : 0, transition: "opacity 0.05s",
        background: "repeating-linear-gradient(0deg,rgba(0,255,136,0.04),rgba(0,255,136,0.04) 1px,transparent 1px,transparent 3px)",
      }} />

      <div className="spl-content">
        {/* Logo */}
        <div className="spl-logo-wrap spl-logo-in">
          <div style={{
            fontSize: 52, color: "#D4AF37", marginBottom: 12, textAlign: "center",
            filter: `drop-shadow(0 0 20px rgba(212,175,55,0.7))`,
            animation: "sphereGlow 2.4s ease-in-out infinite",
          }}>⚜</div>

          <div className="spl-brand" style={{
            transform: glitch ? `translate(${(Math.random()-0.5)*5}px,0)` : "",
            textShadow: glitch
              ? "3px 0 rgba(255,0,80,0.7), -3px 0 rgba(0,255,180,0.7), 0 0 20px rgba(212,175,55,0.5)"
              : "0 0 20px rgba(212,175,55,0.4)",
          }}>
            IGNITIA NEXUS
          </div>
          <div className="spl-brand-sub">THE SECRET ESCAPE</div>
        </div>

        {/* Typing line */}
        {showLine && (
          <div className="spl-init-line" style={{ color: lineColor }}>
            <span className="spl-prompt">▶ </span>
            {typed}<span className="spl-cur">█</span>
          </div>
        )}

        {/* Welcome */}
        {showWelcome && (
          <div style={{
            fontFamily: "var(--font-d, 'Cinzel', serif)",
            fontSize: "clamp(16px,4vw,24px)", fontWeight: 700,
            letterSpacing: "5px", color: "#D4AF37", marginTop: 22,
            textAlign: "center",
            textShadow: "0 0 24px rgba(212,175,55,0.6)",
            animation: "splWelcomeIn 0.6s ease forwards",
          }}>
            ✦ &nbsp;WELCOME TO TREASURE HUNT&nbsp; ✦
          </div>
        )}

        {/* Note box */}
        {showNote && (
          <div style={{
            marginTop: 24, border: "1px solid rgba(212,175,55,0.35)",
            borderLeft: "3px solid #D4AF37",
            background: "rgba(212,175,55,0.05)",
            padding: "14px 22px", maxWidth: 500,
            borderRadius: 3, animation: "fadeUp 0.5s ease forwards",
          }}>
            <div style={{ fontFamily: "var(--font-m,'Share Tech Mono',monospace)", fontSize: 10, letterSpacing: 3, color: "#D4AF37", marginBottom: 8 }}>
              ⬡ OPERATIVE DIRECTIVE
            </div>
            <div style={{ fontFamily: "var(--font-m,'Share Tech Mono',monospace)", fontSize: 13, color: "#B8AD8A", lineHeight: 1.75, letterSpacing: "0.5px" }}>
              {noteTyped}<span style={{ animation: "splBlink 0.6s step-end infinite", color: "#D4AF37" }}>
                {showBtn ? "" : "█"}
              </span>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {showBar && (
          <div className="spl-bar-section" style={{ marginTop: 20 }}>
            <div className="spl-bar-labels">
              {BAR_LABELS.map((lbl, i) => (
                <span key={i} className={`spl-bar-label${litLabels[i] ? " lit" : ""}`}>{lbl}</span>
              ))}
            </div>
            <div className="spl-bar-track">
              <div className="spl-bar-fill" style={{ width: `${barPct}%`, transition: "width 0.6s ease" }}>
                <div className="spl-bar-glow" style={{ left: "100%" }} />
              </div>
            </div>
          </div>
        )}

        {/* Enter button */}
        {showBtn && (
          <button
            onClick={handleEnter}
            style={{
              marginTop: 28, padding: "14px 48px",
              background: "transparent", border: "2px solid #D4AF37",
              color: "#D4AF37",
              fontFamily: "var(--font-d,'Cinzel',serif)",
              fontSize: 14, fontWeight: 700, letterSpacing: 4,
              cursor: "pointer", position: "relative", overflow: "hidden",
              borderRadius: 2, transition: "all 0.25s",
              animation: "fadeUp 0.4s ease forwards",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#D4AF37"; e.currentTarget.style.color = "#000"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#D4AF37"; }}
          >
            ⚡ ENTER THE VAULT ⚡
          </button>
        )}
      </div>

      {/* Corners */}
      <div className="spl-corner tl">◤</div>
      <div className="spl-corner tr">◥</div>
      <div className="spl-corner bl">◣</div>
      <div className="spl-corner br">◢</div>
    </div>
  );
}