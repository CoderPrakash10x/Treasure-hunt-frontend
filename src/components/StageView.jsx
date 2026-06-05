import { useEffect, useRef, useState } from "react";
import { sounds } from "../utils/sounds";

export default function StageView({
  stage, status, answer, onAnswerChange, onSubmit,
  attempts, showHint, hintIndex, onHintNext,
}) {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (inputRef.current && status !== "unlocking") inputRef.current.focus();
  }, [stage.id, status]);

  const handleKey = (e) => { if (e.key === "Enter") onSubmit(); };

  const statusClass =
    status === "correct" ? "stage-correct" :
    status === "wrong" ? "stage-wrong" :
    status === "unlocking" ? "stage-unlocking" : "";

  return (
    <div className={`stage-container ${statusClass}`}>
      {/* Layer badge */}
      <div className="layer-badge">
        <span className="layer-glyph">{stage.backgroundGlyph}</span>
        <span className="layer-name">{stage.layer}</span>
      </div>

      <div className="stage-header">
        <h2 className="stage-title">{stage.title}</h2>
        <p className="stage-subtitle">{stage.subtitle}</p>
      </div>

      <p className="stage-description">{stage.description}</p>

      <div className="stage-divider"><span className="divider-gem">◆</span></div>

      {/* Question */}
      <div className="question-box">
        <div className="question-label">⬡ DECRYPT THE CIPHER</div>
        <p className="question-text" style={{ whiteSpace: "pre-line" }}>{stage.question}</p>
      </div>

      {/* Unlock animation */}
      {status === "unlocking" && (
        <div className="unlock-animation">
          <div className="unlock-rings">
            <div className="u-ring r1" /><div className="u-ring r2" /><div className="u-ring r3" />
          </div>
          <p className="unlock-text">⚡ LAYER BREACHED ⚡</p>
          <p className="unlock-sub">Seal broken. Proceeding to next layer...</p>
        </div>
      )}

      {/* Answer input */}
      {status !== "unlocking" && (
        <div className="answer-section">
          <div className={`input-wrapper ${focused ? "input-focused" : ""}`}>
            <span className="input-prefix">▶</span>
            <input
              ref={inputRef}
              className={`answer-input ${status === "wrong" ? "shake" : ""}`}
              value={answer}
              onChange={(e) => onAnswerChange(e.target.value)}
              onKeyDown={handleKey}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Type your answer..."
              autoComplete="off" autoCorrect="off" spellCheck={false}
            />
          </div>
          <button
            className={`submit-btn ${status === "correct" ? "btn-correct" : ""}`}
            onClick={onSubmit}
            onMouseEnter={() => sounds.hover()}
            disabled={status === "correct"}
          >
            {status === "correct" ? "✓ CORRECT" : "SUBMIT →"}
          </button>
        </div>
      )}

      {/* Wrong feedback */}
      {status === "wrong" && (
        <p className="wrong-feedback">✗ Incorrect. Try again.</p>
      )}

      {/* Hint */}
      {showHint && status !== "unlocking" && (
        <div className="hint-box">
          <div className="hint-header">
            <span className="hint-icon">💡</span>
            <span className="hint-label">VAULT HINT {hintIndex + 1}/{stage.hints.length}</span>
          </div>
          <p className="hint-text">{stage.hints[hintIndex]}</p>
          {hintIndex < stage.hints.length - 1 && (
            <button className="hint-next-btn" onClick={onHintNext}>Next Hint →</button>
          )}
        </div>
      )}

      {/* Attempt counter */}
      {attempts > 0 && !showHint && status !== "unlocking" && (
        <p className="attempt-count">
          Attempts: <strong>{attempts}</strong> ·{" "}
          {3 - attempts > 0 ? `Hint in ${3 - attempts} more` : "Hint available above"}
        </p>
      )}
    </div>
  );
}
