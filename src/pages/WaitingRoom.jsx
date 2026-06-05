import { useEffect, useState } from "react";
import { getUser } from "../utils/storage";
import { startAmbient, isAmbientPlaying } from "../utils/sounds";

export default function WaitingRoom({ eventState, onEventStart }) {
  const [time, setTime] = useState(new Date());
  const [dots, setDots] = useState(1);
  const user = getUser();

  useEffect(() => {
    const t1 = setInterval(() => setTime(new Date()), 1000);
    const t2 = setInterval(() => setDots((d) => (d % 3) + 1), 700);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  useEffect(() => {
    if (!isAmbientPlaying()) startAmbient();
  }, []);

  useEffect(() => {
    if (eventState?.status === "active") onEventStart();
  }, [eventState]);

  const statusMap = {
    waiting: { label: "STANDBY", color: "#F4C542", msg: "Event has not started yet." },
    active: { label: "LIVE", color: "#00ff88", msg: "Event is live! Entering vault..." },
    paused: { label: "PAUSED", color: "#ff9900", msg: "Event is temporarily paused. Please wait." },
    ended: { label: "ENDED", color: "#ff4444", msg: "The event has concluded." },
  };
  const st = statusMap[eventState?.status] || statusMap.waiting;
  const waitingDots = ".".repeat(dots);

  return (
    <div className="waiting-root">
      <div className="waiting-card">
        <div className="vault-symbol-anim">
          <div className="vault-ring outer" /><div className="vault-ring middle" /><div className="vault-ring inner" />
          <div className="vault-center">⚜</div>
        </div>

        <h2 className="waiting-title">IGNITIA NEXUS</h2>
        <p className="waiting-sub">THE SECRET ESCAPE</p>

        <div className="status-badge" style={{ borderColor: st.color, color: st.color }}>
          <span className="status-dot" style={{ background: st.color, boxShadow: `0 0 8px ${st.color}` }} />
          {st.label}
        </div>

        <p className="waiting-msg">{st.msg}</p>

        {eventState?.status === "waiting" && (
          <p className="waiting-dots" style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)", fontSize: 14 }}>
            Waiting for event to start{waitingDots}
          </p>
        )}

        {user && (
          <div className="agent-card">
            <p className="agent-label">REGISTERED OPERATIVE</p>
            <p className="agent-name">{user.name}</p>
            {user.teamName && <p className="agent-team">⚡ Team: {user.teamName}</p>}
            <p className="agent-college">🏛 {user.college}</p>
          </div>
        )}

        <div className="waiting-clock">
          {time.toLocaleTimeString("en-IN", { hour12: false })}
        </div>
        <p className="waiting-hint">This page updates automatically every 10 seconds.</p>
      </div>
    </div>
  );
}
