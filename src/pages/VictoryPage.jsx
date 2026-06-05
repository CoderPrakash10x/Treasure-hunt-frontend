import { useState, useEffect, useRef } from "react";
import { getUser, getProgress, getTimerStart, formatTime } from "../utils/storage";
import { fetchLeaderboard } from "../utils/api";
import { sounds } from "../utils/sounds";

export default function VictoryPage() {
  const user = getUser();
  const progress = getProgress();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lbRevealed, setLbRevealed] = useState(false);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  // ── Correct time calculation ───────────────────────────────────────────
  const timerStart = getTimerStart();
  const finishTime = progress.finishTime;
  const finalSeconds = (timerStart && finishTime)
    ? Math.max(0, Math.floor((finishTime - timerStart) / 1000))
    : 0;
  const finalTime = formatTime(finalSeconds);

  // ── Fireworks canvas ───────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);

    const GOLD = ["#D4AF37","#F4C542","#FFD700","#B8960C","#FFF0A0","#E8C84A"];
    const particles = [];

    const burst = (x, y) => {
      for (let i = 0; i < 40; i++) {
        const angle = (Math.PI * 2 * i) / 40 + Math.random() * 0.3;
        const speed = 2 + Math.random() * 5;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          alpha: 1,
          r: Math.random() * 3 + 1,
          color: GOLD[Math.floor(Math.random() * GOLD.length)],
        });
      }
    };

    // Trigger bursts
    const burstTimers = [0,300,600,900,1200,1600].map((d) =>
      setTimeout(() => burst(
        canvas.width * (0.2 + Math.random() * 0.6),
        canvas.height * (0.1 + Math.random() * 0.5)
      ), d)
    );

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.alpha -= 0.015;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      burstTimers.forEach(clearTimeout);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  useEffect(() => {
    sounds.victory();
    if (user?.token) {
      fetchLeaderboard(user.token)
        .then((data) => {
          setLeaderboard(data.leaderboard || []);
          setLoading(false);
          setTimeout(() => { sounds.leaderboard(); setLbRevealed(true); }, 600);
        })
        .catch(() => { setLoading(false); setLbRevealed(true); });
    } else {
      setLoading(false); setLbRevealed(true);
    }
  }, []);

  return (
    <div className="victory-root">
      <canvas ref={canvasRef} className="victory-canvas" />

      <div className="victory-card">
        <div className="trophy-container">
          <div className="trophy-glow" />
          <div className="trophy-icon">🏆</div>
        </div>

        <h1 className="victory-title">VAULT BREACHED</h1>
        <p className="victory-sub">You have conquered all 5 layers of the Ignitia Nexus</p>
        <div className="victory-divider" />

        <div className="victory-stats">
          <div className="stat-box">
            <div className="stat-icon">👤</div>
            <div className="stat-label">AGENT</div>
            <div className="stat-value">{user?.name || "—"}</div>
          </div>
          <div className="stat-box highlight">
            <div className="stat-icon">⏱</div>
            <div className="stat-label">COMPLETION TIME</div>
            <div className="stat-value-gold">{finalTime}</div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">🏛</div>
            <div className="stat-label">INSTITUTION</div>
            <div className="stat-value">{user?.college || "—"}</div>
          </div>
        </div>

        <div className="victory-divider" />

        <div className={`leaderboard-section ${lbRevealed ? "lb-revealed" : ""}`}>
          <h3 className="lb-title">◆ VAULT LEADERBOARD ◆</h3>
          {loading ? (
            <div className="lb-loading"><span className="spinner" /> Loading rankings...</div>
          ) : leaderboard.length === 0 ? (
            <div className="lb-empty">
              <p>No finishers yet — you may be the first! 🥇</p>
            </div>
          ) : (
            <div className="lb-table">
              <div className="lb-header-row">
                <span>RANK</span><span>AGENT</span><span>COLLEGE</span><span>TIME</span>
              </div>
              {leaderboard.slice(0, 10).map((entry, i) => (
                <div
                  key={entry._id || i}
                  className={`lb-row ${entry.email === user?.email ? "lb-you" : ""} ${i < 3 ? `lb-top-${i + 1}` : ""}`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span className="lb-rank">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <span className="lb-name">{entry.name}</span>
                  <span className="lb-college">{entry.college}</span>
                  <span className="lb-time">
                    {entry.completionSeconds ? formatTime(Math.floor(entry.completionSeconds)) : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
