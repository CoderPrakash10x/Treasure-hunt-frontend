import { useEffect, useRef, useState } from "react";

export default function TreasureAnimation({ onDone }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [phase, setPhase] = useState("shaking"); // shaking → opening → done
  const [showText, setShowText] = useState(false);
  const [showSubText, setShowSubText] = useState(false);

  // ── Treasure sound ─────────────────────────────────────────────────
  useEffect(() => {
    playTreasureSound();

    // Phase timeline
    const t1 = setTimeout(() => setPhase("opening"), 1200);
    const t2 = setTimeout(() => setPhase("open"),    2800);
    const t3 = setTimeout(() => setShowText(true),   3200);
    const t4 = setTimeout(() => setShowSubText(true),3800);
    const t5 = setTimeout(() => onDone(),            6500);

    return () => [t1,t2,t3,t4,t5].forEach(clearTimeout);
  }, []);

  const playTreasureSound = () => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const c = new AC();

      // Chest creak — low rumble
      const buf = c.createBuffer(1, c.sampleRate * 0.4, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.15)) * 0.6;
      const src = c.createBufferSource(), gn = c.createGain();
      src.buffer = buf; src.connect(gn); gn.connect(c.destination);
      gn.gain.value = 0.5; src.start(c.currentTime);

      // Victory melody — ascending golden arpeggio
      const melody = [261, 329, 392, 523, 659, 784, 1047, 1319, 1568];
      melody.forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = "sine"; o.frequency.value = f;
        const t = c.currentTime + 0.9 + i * 0.12;
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        o.start(t); o.stop(t + 0.5);
      });

      // Shimmer — high freq sparkle
      for (let i = 0; i < 8; i++) {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = "sine";
        o.frequency.value = 2000 + Math.random() * 2000;
        const t = c.currentTime + 1.8 + i * 0.15;
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        o.start(t); o.stop(t + 0.3);
      }
    } catch {}
  };

  // ── Gold particle canvas ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== "open") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const GOLD = ["#D4AF37","#F4C542","#FFD700","#FFF0A0","#E8C84A","#ffffff"];
    const particles = [];

    // Burst from center
    const cx = canvas.width / 2, cy = canvas.height * 0.55;
    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        alpha: 1,
        r: Math.random() * 4 + 1,
        color: GOLD[Math.floor(Math.random() * GOLD.length)],
        spin: Math.random() * 0.3 - 0.15,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.15; p.alpha -= 0.012;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (particles.length > 0) animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      zIndex: 9999, overflow: "hidden",
    }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      {/* Radial glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: phase === "open"
          ? "radial-gradient(ellipse at 50% 55%, rgba(212,175,55,0.25) 0%, transparent 65%)"
          : "none",
        transition: "all 1s ease",
      }} />

      {/* Treasure chest SVG */}
      <div style={{
        position: "relative", zIndex: 1,
        animation: phase === "shaking"
          ? "treasureShake 0.15s ease-in-out infinite"
          : phase === "opening"
          ? "treasureShake 0.1s ease-in-out infinite"
          : "none",
        filter: phase === "open" ? "drop-shadow(0 0 40px rgba(212,175,55,0.9))" : "drop-shadow(0 0 10px rgba(212,175,55,0.3))",
        transition: "filter 0.8s ease",
      }}>
        <TreasureChestSVG phase={phase} />
      </div>

      {/* Text */}
      {showText && (
        <div style={{
          position: "relative", zIndex: 2, textAlign: "center", marginTop: 32,
          animation: "treasureFadeUp 0.6s ease forwards",
        }}>
          <div style={{
            fontFamily: "var(--font-d, 'Cinzel', serif)",
            fontSize: "clamp(24px, 5vw, 44px)",
            color: "#D4AF37",
            fontWeight: 900,
            letterSpacing: "0.2em",
            textShadow: "0 0 40px rgba(212,175,55,0.8), 0 0 80px rgba(212,175,55,0.4)",
          }}>
            TREASURE UNLOCKED
          </div>
          {showSubText && (
            <div style={{
              fontFamily: "var(--font-m, 'Share Tech Mono', monospace)",
              fontSize: 14, color: "#B8AD8A",
              letterSpacing: "3px", marginTop: 12,
              animation: "treasureFadeUp 0.5s ease forwards",
            }}>
              ALL SEALS BROKEN · THE VAULT IS YOURS
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes treasureShake {
          0%,100% { transform: translateX(0) rotate(0deg); }
          25%      { transform: translateX(-6px) rotate(-2deg); }
          75%      { transform: translateX(6px) rotate(2deg); }
        }
        @keyframes treasureFadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── SVG Treasure Chest ─────────────────────────────────────────────────────
function TreasureChestSVG({ phase }) {
  const lidAngle = phase === "open" ? -110 : phase === "opening" ? -60 : 0;

  return (
    <svg width="220" height="200" viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Glow filter */}
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="goldGrad" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#FFD700"/>
          <stop offset="100%" stopColor="#8B6914"/>
        </radialGradient>
        <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity={phase === "open" ? "0.9" : "0"}/>
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* Inner glow when open */}
      {phase === "open" && (
        <ellipse cx="110" cy="115" rx="55" ry="20" fill="url(#innerGlow)" opacity="0.8"/>
      )}

      {/* Chest body */}
      <rect x="30" y="110" width="160" height="80" rx="8" fill="#5C3A1E" stroke="#D4AF37" strokeWidth="2.5"/>
      {/* Body gold band */}
      <rect x="30" y="135" width="160" height="12" fill="#D4AF37" opacity="0.3"/>
      {/* Body planks */}
      <line x1="75" y1="110" x2="75" y2="190" stroke="#3D2510" strokeWidth="1.5" opacity="0.5"/>
      <line x1="145" y1="110" x2="145" y2="190" stroke="#3D2510" strokeWidth="1.5" opacity="0.5"/>
      {/* Lock plate */}
      <rect x="93" y="125" width="34" height="28" rx="4" fill="#D4AF37" filter="url(#glow)"/>
      <circle cx="110" cy="136" r="6" fill="#8B6914"/>
      <rect x="106" y="136" width="8" height="10" rx="2" fill="#5C3A1E"/>

      {/* Lid — rotates on open */}
      <g transform={`rotate(${lidAngle}, 110, 112)`} style={{ transition: "transform 0.8s cubic-bezier(.2,1,.3,1)" }}>
        <rect x="30" y="70" width="160" height="45" rx="8 8 0 0" fill="#6B4423" stroke="#D4AF37" strokeWidth="2.5"/>
        {/* Lid arch */}
        <ellipse cx="110" cy="70" rx="80" ry="18" fill="#7A4E28" stroke="#D4AF37" strokeWidth="2"/>
        {/* Lid planks */}
        <line x1="75" y1="70" x2="75" y2="115" stroke="#3D2510" strokeWidth="1.5" opacity="0.5"/>
        <line x1="145" y1="70" x2="145" y2="115" stroke="#3D2510" strokeWidth="1.5" opacity="0.5"/>
        {/* Lid band */}
        <rect x="30" y="88" width="160" height="8" fill="#D4AF37" opacity="0.3"/>
        {/* Hinges */}
        <rect x="42" y="108" width="18" height="8" rx="2" fill="#D4AF37"/>
        <rect x="160" y="108" width="18" height="8" rx="2" fill="#D4AF37"/>
      </g>

      {/* Corner studs */}
      {[[30,110],[190,110],[30,185],[190,185]].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="5" fill="#D4AF37" filter="url(#glow)"/>
      ))}

      {/* Gold coins spilling when open */}
      {phase === "open" && (
        <g filter="url(#glow)">
          <ellipse cx="90" cy="115" rx="12" ry="6" fill="#FFD700"/>
          <ellipse cx="115" cy="112" rx="10" ry="5" fill="#F4C542"/>
          <ellipse cx="135" cy="116" rx="11" ry="5.5" fill="#FFD700"/>
          <ellipse cx="100" cy="108" rx="8" ry="4" fill="#E8C84A"/>
          <ellipse cx="122" cy="106" rx="9" ry="4.5" fill="#FFD700"/>
        </g>
      )}
    </svg>
  );
}