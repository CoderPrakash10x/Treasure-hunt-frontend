export default function ProgressVault({ progress, total }) {
  const stages = Array.from({ length: total }, (_, i) => i + 1);
  const completed = progress.completedStages?.length || 0;
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="progress-vault">
      <div className="vault-label">VAULT BREACH PROGRESS</div>
      <div className="vault-layers">
        {stages.map((s) => {
          const isDone    = progress.completedStages?.includes(s);
          const isCurrent = progress.currentStage === s;
          const isLocked  = s > progress.currentStage;
          return (
            <div key={s} className={`vault-layer${isDone?" layer-done":isCurrent?" layer-active":isLocked?" layer-locked":""}`}>
              <div className="layer-icon">{isDone ? "🔓" : isCurrent ? "🔐" : "🔒"}</div>
              <div className="layer-info">
                <span className="layer-num">L{s}</span>
                <span className="layer-status-text">{isDone ? "DONE" : isCurrent ? "ACTIVE" : "LOCKED"}</span>
              </div>
              {isDone && <div className="layer-glow" />}
            </div>
          );
        })}
      </div>
      <div className="vault-bar-track">
        <div className="vault-bar-fill" style={{ width:`${pct}%` }} />
      </div>
      <div className="vault-pct">{pct}% BREACHED · {completed}/{total} LAYERS CLEARED</div>
    </div>
  );
}
