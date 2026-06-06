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

  const timerStart = getTimerStart();
  const finishTime = progress.finishTime;
  const finalSeconds = (timerStart && finishTime)
    ? Math.max(0, Math.floor((finishTime - timerStart) / 1000))
    : 0;
  const finalTime = formatTime(finalSeconds);

  // ── Fireworks ────────────────────────────────────────────────────────
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

    const burst = (x, y, count = 40) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
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

    const burstTimers = [0,300,600,900,1200,1600,2200,2800].map((d) =>
      setTimeout(() => burst(
        canvas.width * (0.15 + Math.random() * 0.7),
        canvas.height * (0.08 + Math.random() * 0.5)
      ), d)
    );

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.alpha -= 0.013;
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

  // ── Initial leaderboard fetch ────────────────────────────────────────
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

  // ── Auto-refresh every 8 min (keeps Render warm too) ─────────────────
  useEffect(() => {
    if (!user?.token) return;
    const id = setInterval(() => {
      fetchLeaderboard(user.token)
        .then((data) => setLeaderboard(data.leaderboard || []))
        .catch(() => {});
    }, 8 * 60 * 1000);
    return () => clearInterval(id);
  }, [user?.token]);

  const totalFinishers = leaderboard.length;

  return (
    <div className="victory-root">
      <canvas ref={canvasRef} className="victory-canvas" />

      <div className="victory-card">

        {/* Trophy */}
        <div className="trophy-container">
          <div className="trophy-glow" />
          <div className="trophy-icon">🏆</div>
        </div>

        <h1 className="victory-title">VAULT BREACHED</h1>
        <p className="victory-sub">You have conquered all 5 layers of the Ignitia Nexus</p>

        <div className="victory-divider" />

        {/* Stats */}
        <div className="victory-stats">
          <div className="stat-box">
            <div className="stat-icon">👤</div>
            <div className="stat-label">AGENT</div>
            <div className="stat-value">{user?.name || "—"}</div>
          </div>
          <div className="stat-box highlight">
            <div className="stat-icon">⏱</div>
            <div className="stat-label">YOUR TIME</div>
            <div className="stat-value-gold">{finalTime}</div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">🏛</div>
            <div className="stat-label">INSTITUTION</div>
            <div className="stat-value">{user?.college || "—"}</div>
          </div>
        </div>

        {/* Finisher count pill */}
        {!loading && totalFinishers > 0 && (
          <div style={{
            textAlign: "center",
            marginTop: 18,
          }}>
            <span style={{
              display: "inline-block",
              fontFamily: "var(--font-m)",
              fontSize: 12,
              letterSpacing: "2px",
              color: "var(--gold2)",
              background: "rgba(212,175,55,0.08)",
              border: "1px solid rgba(212,175,55,0.25)",
              borderRadius: 20,
              padding: "5px 18px",
            }}>
              ⚡ {totalFinishers} operative{totalFinishers !== 1 ? "s" : ""} have breached the vault
            </span>
          </div>
        )}

        <div className="victory-divider" />

        {/* Leaderboard — names + times only, NO rank numbers */}
        <div className={`leaderboard-section ${lbRevealed ? "lb-revealed" : ""}`}>
          <h3 className="lb-title">◆ VAULT LEADERBOARD ◆</h3>
          <p style={{
            textAlign: "center",
            fontFamily: "var(--font-m)",
            fontSize: 11,
            color: "var(--text-dim)",
            letterSpacing: "2px",
            marginBottom: 16,
            marginTop: -10,
          }}>
            RANKINGS REVEALED AT EVENT END
          </p>

          {loading ? (
            <div className="lb-loading"><span className="spinner" /> Loading rankings...</div>
          ) : leaderboard.length === 0 ? (
            <div className="lb-empty">
              <p>No finishers yet — you may be the first! 🥇</p>
            </div>
          ) : (
            <div className="lb-table">
              {/* Header — no rank column */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 100px",
                gap: 8,
                padding: "8px 12px",
                fontFamily: "var(--font-m)",
                fontSize: 10,
                letterSpacing: "2px",
                color: "var(--text-dark)",
                borderBottom: "1px solid var(--border)",
              }}>
                <span>AGENT</span>
                <span>COLLEGE</span>
                <span style={{ textAlign: "right" }}>TIME</span>
              </div>

              {leaderboard.slice(0, 10).map((entry, i) => {
                const isYou = entry.email === user?.email;
                return (
                  <div
                    key={entry._id || i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 100px",
                      gap: 8,
                      padding: "11px 12px",
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      background: isYou ? "rgba(212,175,55,0.07)" : "transparent",
                      borderLeft: isYou ? "2px solid var(--gold)" : "2px solid transparent",
                      fontSize: 14,
                      animationDelay: `${i * 80}ms`,
                      transition: "background 0.2s",
                    }}
                  >
                    <span style={{
                      fontWeight: 600,
                      color: isYou ? "var(--gold2)" : "var(--text)",
                    }}>
                      {entry.name}{isYou ? " ✦" : ""}
                    </span>
                    <span style={{ color: "var(--text-dim)", fontSize: 13 }}>
                      {entry.college}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-m)",
                      color: isYou ? "var(--gold2)" : "var(--green)",
                      fontSize: 13,
                      textAlign: "right",
                    }}>
                      {entry.completionSeconds ? formatTime(Math.floor(entry.completionSeconds)) : "—"}
                    </span>
                  </div>
                );
              })}

              {/* Subtle note at bottom */}
              <p style={{
                textAlign: "center",
                fontFamily: "var(--font-m)",
                fontSize: 11,
                color: "var(--text-dark)",
                letterSpacing: "1px",
                marginTop: 14,
                padding: "0 12px",
              }}>
                Final rankings with positions will be announced by the organiser.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}