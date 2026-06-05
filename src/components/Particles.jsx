import { useEffect, useRef } from "react";

export default function Particles() {
  const canvasRef = useRef(null);
  const stateRef = useRef({ particles: [], animId: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = window.innerWidth, H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = ["#D4AF37","#F4C542","#FFD700","#B8960C","#E8C84A","#FFF0A0"];

    // Initialize particles
    stateRef.current.particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.28,
      vy: -(Math.random() * 0.35 + 0.08),
      alpha: Math.random() * 0.5 + 0.1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      pulse: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      stateRef.current.particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.pulse += 0.018;
        const a = p.alpha * (0.4 + 0.6 * Math.sin(p.pulse));
        if (p.y < -8) { p.y = H + 8; p.x = Math.random() * W; }
        if (p.x < -8) p.x = W + 8;
        if (p.x > W + 8) p.x = -8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(a * 255).toString(16).padStart(2, "0");
        ctx.fill();
      });
      stateRef.current.animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(stateRef.current.animId);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position:"fixed", top:0, left:0,
      pointerEvents:"none", zIndex:0, opacity:0.65,
    }} />
  );
}
