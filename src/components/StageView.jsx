import { useEffect, useRef, useState } from "react";
import { sounds } from "../utils/sounds";

const HINT_DELAY_MS = 3 * 60 * 1000; // 3 minutes

export default function StageView({
  stage, status, answer, onAnswerChange, onSubmit,
  attempts, showHint, hintIndex, onHintNext, onHintUnlock,
}) {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const [hintSecondsLeft, setHintSecondsLeft] = useState(null);
  const [bossIntro, setBossIntro] = useState(stage.isBonus);
  const timerRef = useRef(null);
  const startRef = useRef(null);

  // ── Focus input ────────────────────────────────────────────────────
  useEffect(() => {
    if (inputRef.current && status !== "unlocking" && !bossIntro)
      inputRef.current.focus();
  }, [stage.id, status, bossIntro]);

  // ── Boss intro dismiss after 3.5s ──────────────────────────────────
  useEffect(() => {
    if (!stage.isBonus) { setBossIntro(false); return; }
    setBossIntro(true);
    const t = setTimeout(() => setBossIntro(false), 3500);
    return () => clearTimeout(t);
  }, [stage.id]);

  // ── Hint countdown — starts fresh on each stage ────────────────────
  useEffect(() => {
    if (showHint) { setHintSecondsLeft(null); return; } // already unlocked
    startRef.current = Date.now();
    setHintSecondsLeft(Math.ceil(HINT_DELAY_MS / 1000));

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const left = Math.ceil((HINT_DELAY_MS - elapsed) / 1000);
      if (left <= 0) {
        clearInterval(timerRef.current);
        setHintSecondsLeft(0);
        onHintUnlock(); // tell GamePage hint is now available
      } else {
        setHintSecondsLeft(left);
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [stage.id, showHint]);

  const handleKey = (e) => { if (e.key === "Enter") onSubmit(); };

  const statusClass =
    status === "correct"   ? "stage-correct"   :
    status === "wrong"     ? "stage-wrong"      :
    status === "unlocking" ? "stage-unlocking"  : "";

  const formatCountdown = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  // ── Boss intro overlay ─────────────────────────────────────────────
  if (bossIntro) {
    return (
      <div className="boss-intro-overlay">
        <div className="boss-intro-content">
          <div className="boss-glyph-anim">∞</div>
          <div className="boss-warning-text">⚠ FINAL SEAL DETECTED ⚠</div>
          <div className="boss-sub-text">The Obsidian Archive stirs...</div>
          <div className="boss-sub-text" style={{ marginTop: 8, fontSize: 13 }}>
            Prepare yourself, Operative.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`stage-container ${statusClass} ${stage.isBonus ? "bonus-stage" : ""}`}>

      {/* Boss level banner */}
      {stage.isBonus && (
        <div className="boss-banner">
          <span className="boss-banner-glyph">💀</span>
          <span className="boss-banner-text">BOSS LEVEL — FINAL SEAL</span>
          <span className="boss-banner-glyph">💀</span>
        </div>
      )}

      {/* Layer badge */}
      <div className={`layer-badge ${stage.isBonus ? "layer-badge-boss" : ""}`}>
        <span className="layer-glyph">{stage.backgroundGlyph}</span>
        <span className="layer-name">{stage.layer}</span>
      </div>

      <div className="stage-header">
        <h2 className={`stage-title ${stage.isBonus ? "boss-title" : ""}`}>{stage.title}</h2>
        <p className="stage-subtitle">{stage.subtitle}</p>
      </div>

      <p className="stage-description">{stage.description}</p>

      <div className="stage-divider"><span className="divider-gem">◆</span></div>

      {/* Question */}
      <div className={`question-box ${stage.isBonus ? "question-box-boss" : ""}`}>
        <div className="question-label">
          {stage.isBonus ? "☠ FINAL CIPHER — SOLVE TO CLAIM THE TREASURE" : "⬡ DECRYPT THE CIPHER"}
        </div>
        <p className="question-text" style={{ whiteSpace: "pre-line" }}>{stage.question}</p>
      </div>

      {/* Unlock animation */}
      {status === "unlocking" && (
        <div className="unlock-animation">
          <div className="unlock-rings">
            <div className="u-ring r1" /><div className="u-ring r2" /><div className="u-ring r3" />
          </div>
          <p className="unlock-text">
            {stage.isBonus ? "💀 FINAL SEAL BROKEN 💀" : "⚡ LAYER BREACHED ⚡"}
          </p>
          <p className="unlock-sub">
            {stage.isBonus ? "The treasure is yours..." : "Seal broken. Proceeding to next layer..."}
          </p>
        </div>
      )}

      {/* Answer input */}
      {status !== "unlocking" && (
        <div className="answer-section">
          <div className={`input-wrapper ${focused ? "input-focused" : ""}`}>
            <span className="input-prefix">▶</span>
            <input
              ref={inputRef}
              className={`answer-input ${status === "wrong" ? "shake" : ""} ${stage.isBonus ? "boss-input" : ""}`}
              value={answer}
              onChange={(e) => onAnswerChange(e.target.value)}
              onKeyDown={handleKey}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={stage.isBonus ? "Speak the final answer..." : "Type your answer..."}
              autoComplete="off" autoCorrect="off" spellCheck={false}
            />
          </div>
          <button
            className={`submit-btn ${status === "correct" ? "btn-correct" : ""} ${stage.isBonus ? "boss-submit-btn" : ""}`}
            onClick={onSubmit}
            onMouseEnter={() => sounds.hover()}
            disabled={status === "correct"}
          >
            {status === "correct" ? "✓ CORRECT" : stage.isBonus ? "UNLEASH →" : "SUBMIT →"}
          </button>
        </div>
      )}

      {/* Wrong feedback */}
      {status === "wrong" && (
        <p className="wrong-feedback">✗ Incorrect. The vault remains sealed.</p>
      )}

      {/* Hint section */}
      {status !== "unlocking" && (
        <div className="hint-area">
          {showHint ? (
            <div className="hint-box">
              <div className="hint-header">
                <span className="hint-icon">💡</span>
                <span className="hint-label">
                  VAULT HINT {hintIndex + 1}/{stage.hints.length}
                </span>
              </div>
              <p className="hint-text">{stage.hints[hintIndex]}</p>
              {hintIndex < stage.hints.length - 1 && (
                <button className="hint-next-btn" onClick={onHintNext}>
                  Next Hint →
                </button>
              )}
            </div>
          ) : (
            <div className="hint-countdown-box">
              <span className="hint-countdown-icon">🔒</span>
              <span className="hint-countdown-text">
                {hintSecondsLeft !== null && hintSecondsLeft > 0
                  ? <>Hint unlocks in <strong>{formatCountdown(hintSecondsLeft)}</strong></>
                  : hintSecondsLeft === 0
                  ? "💡 Hint is now available — click to reveal"
                  : "Hint locked"}
              </span>
              {hintSecondsLeft === 0 && (
                <button className="hint-reveal-btn" onClick={onHintUnlock}>
                  Reveal Hint
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Attempt counter */}
      {attempts > 0 && status !== "unlocking" && (
        <p className="attempt-count">
          Attempts: <strong>{attempts}</strong>
        </p>
      )}
    </div>
  );
}