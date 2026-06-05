import { useState, useEffect, useCallback } from "react";
import {
  adminLogin, adminValidateToken, adminGetParticipants,
  adminSetEventState, adminGetAnalytics,
} from "../utils/api";
import { saveAdminToken, getAdminToken, clearAdminToken, formatTime } from "../utils/storage";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [token, setToken] = useState(null);
  const [creds, setCreds] = useState({ username: "", password: "" });
  const [loginErr, setLoginErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [eventStatus, setEventStatus] = useState("waiting");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // ── SESSION RECOVERY ON REFRESH ── Critical fix ────────────────────────
  useEffect(() => {
    const savedToken = getAdminToken();
    if (!savedToken) { setRecovering(false); return; }
    adminValidateToken(savedToken)
      .then(() => {
        setToken(savedToken);
        setAuthed(true);
        loadData(savedToken);
      })
      .catch(() => {
        clearAdminToken();
      })
      .finally(() => setRecovering(false));
  }, []);

  // ── Auto-refresh every 20s ─────────────────────────────────────────────
  useEffect(() => {
    if (!authed || !autoRefresh) return;
    const id = setInterval(() => loadData(token), 20000);
    return () => clearInterval(id);
  }, [authed, token, autoRefresh]);

  const handleLogin = async () => {
    setLoginLoading(true); setLoginErr("");
    try {
      const data = await adminLogin(creds);
      saveAdminToken(data.token);
      setToken(data.token);
      setAuthed(true);
      loadData(data.token);
    } catch {
      setLoginErr("Invalid credentials. Try again.");
    }
    setLoginLoading(false);
  };

  const handleLogout = () => {
    clearAdminToken();
    setAuthed(false);
    setToken(null);
  };

  const loadData = useCallback(async (t) => {
    setLoading(true);
    try {
      const [pData, aData] = await Promise.all([
        adminGetParticipants(t),
        adminGetAnalytics(t),
      ]);
      setParticipants(pData.participants || []);
      setAnalytics(aData);
      setEventStatus(aData.eventStatus || "waiting");
    } catch {}
    setLoading(false);
  }, []);

  const handleEventControl = async (status) => {
    try {
      await adminSetEventState(token, status);
      setEventStatus(status);
      setTimeout(() => loadData(token), 500);
    } catch {}
  };

  const exportCSV = () => {
    const headers = ["Name,Email,Mobile,College,Team,Stage,Completed,CompletionTime,RegisteredAt"];
    const rows = participants.map((p) => [
      `"${p.name}"`, p.email, p.mobile, `"${p.college}"`,
      p.teamName || "", `L${p.currentStage || 1}`,
      p.finished ? "Yes" : "No",
      p.completionSeconds ? formatTime(Math.floor(p.completionSeconds)) : "",
      new Date(p.createdAt).toLocaleString(),
    ].join(","));
    const blob = new Blob([[...headers, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ignitia_participants_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const sorted = [...participants].sort((a, b) => {
    if (sortBy === "stage") return (b.currentStage || 1) - (a.currentStage || 1);
    if (sortBy === "time") return (a.completionSeconds || 999999) - (b.completionSeconds || 999999);
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const filtered = sorted.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.college?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = { waiting: "#F4C542", active: "#00ff88", paused: "#ff9900", ended: "#ff4444" };

  // ── Recovering state ───────────────────────────────────────────────────
  if (recovering) {
    return (
      <div className="admin-login-root">
        <div className="admin-login-card" style={{ gap: 20 }}>
          <div className="loader-ring" style={{ margin: "0 auto" }} />
          <p style={{ fontFamily: "var(--font-mono)", color: "var(--gold)", fontSize: 13, letterSpacing: 2 }}>
            RESTORING SESSION...
          </p>
        </div>
      </div>
    );
  }

  // ── Login ──────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="admin-login-root">
        <div className="admin-login-card">
          <div className="admin-logo">⚙</div>
          <h2 className="admin-title">ADMIN NEXUS</h2>
          <p className="admin-sub">Event Control Panel</p>
          <input className="vault-input" placeholder="Username" value={creds.username}
            onChange={(e) => setCreds((c) => ({ ...c, username: e.target.value }))} />
          <input className="vault-input" type="password" placeholder="Password" value={creds.password}
            onChange={(e) => setCreds((c) => ({ ...c, password: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          {loginErr && <p className="error-msg">{loginErr}</p>}
          <button className="reg-btn" onClick={handleLogin} disabled={loginLoading}>
            {loginLoading ? <><span className="spinner" /> VERIFYING...</> : "LOGIN →"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root">
      <div className="admin-header">
        <h1 className="admin-heading">⚙ IGNITIA ADMIN</h1>
        <div className="admin-header-actions">
          <label className="auto-refresh-label">
            <input type="checkbox" checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)} />
            Auto-refresh (20s)
          </label>
          <button className="admin-refresh-btn" onClick={() => loadData(token)}>↻ Refresh</button>
          <button className="admin-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="analytics-grid">
          <div className="stat-card"><div className="stat-n">{analytics.totalUsers}</div><div className="stat-l">REGISTERED</div></div>
          <div className="stat-card"><div className="stat-n" style={{color:"var(--gold)"}}>{analytics.activeUsers}</div><div className="stat-l">ACTIVE</div></div>
          <div className="stat-card"><div className="stat-n" style={{color:"var(--green)"}}>{analytics.completedUsers}</div><div className="stat-l">COMPLETED</div></div>
          <div className="stat-card"><div className="stat-n">{analytics.avgTime ? formatTime(Math.floor(analytics.avgTime)) : "—"}</div><div className="stat-l">AVG TIME</div></div>
        </div>
      )}

      {/* Event controls */}
      <div className="event-controls">
        <div className="event-status-display">
          EVENT: <span style={{ color: statusColors[eventStatus], fontWeight: 700 }}>{eventStatus.toUpperCase()}</span>
        </div>
        <div className="event-btns">
          <button className="ev-btn start" onClick={() => handleEventControl("active")}>▶ START</button>
          <button className="ev-btn pause" onClick={() => handleEventControl("paused")}>⏸ PAUSE</button>
          <button className="ev-btn resume" onClick={() => handleEventControl("active")}>▷ RESUME</button>
          <button className="ev-btn end" onClick={() => { if(confirm("End the event?")) handleEventControl("ended"); }}>■ END</button>
        </div>
      </div>

      {/* Participants */}
      <div className="admin-table-section">
        <div className="table-toolbar">
          <input className="admin-search" placeholder="🔍 Search name, email, college..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select className="admin-sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="createdAt">Sort: Recent</option>
              <option value="stage">Sort: Stage</option>
              <option value="time">Sort: Time</option>
              <option value="name">Sort: Name</option>
            </select>
            <button className="export-btn" onClick={exportCSV}>⬇ CSV</button>
          </div>
        </div>
        {loading ? (
          <div className="admin-loading">
            <span className="spinner" style={{ marginRight: 8 }} />
            Loading participants...
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Email</th><th>College</th>
                  <th>Stage</th><th>✓</th><th>Time</th><th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p._id || i} className={p.finished ? "row-finished" : ""}>
                    <td style={{ color: "var(--text-dim)" }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td className="td-email">{p.email}</td>
                    <td>{p.college}</td>
                    <td><span className="stage-badge">L{p.currentStage || 1}</span></td>
                    <td>{p.finished ? <span className="done-badge">✓</span> : <span style={{color:"var(--text-dark)"}}>—</span>}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: p.finished ? "var(--green)" : "var(--text-dim)" }}>
                      {p.completionSeconds ? formatTime(Math.floor(p.completionSeconds)) : "—"}
                    </td>
                    <td style={{ fontSize: 11, color: "var(--text-dark)" }}>
                      {new Date(p.createdAt).toLocaleTimeString("en-IN", { hour12: false })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="no-results">No participants found.</p>}
            <p className="table-count">Showing {filtered.length} of {participants.length} participants</p>
          </div>
        )}
      </div>
    </div>
  );
}
