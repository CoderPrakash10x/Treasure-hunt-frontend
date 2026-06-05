import { useState, useEffect, useRef, useCallback } from "react";
import { STAGES } from "../data/stages";
import {
  getProgress, saveProgress, getTimerStart, saveTimerStart,
  getElapsedSeconds, formatTime, getAttempts, incrementAttempts,
  resetAttempts, checkAnswer, getUser, getAudioPrefs, saveAudioPrefs,
} from "../utils/storage";
import { syncProgress } from "../utils/api";
import { sounds, startAmbient, stopAmbient, getMuted, setMuted,
  getSfxMuted, setSfxMuted, getVolume, setVolume, isAmbientPlaying } from "../utils/sounds";
import StageView from "../components/StageView";
import ProgressVault from "../components/ProgressVault";

export default function GamePage({ onFinish, onEventEnd }) {
  const [progress, setProgressState] = useState(getProgress);
  const [elapsed, setElapsed] = useState(getElapsedSeconds());
  const [stageStatus, setStageStatus] = useState("idle");
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [syncError, setSyncError] = useState(false);
  const [networkDown, setNetworkDown] = useState(false);
  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const [audioPrefs, setAudioPrefs] = useState(getAudioPrefs());
  const [achievement, setAchievement] = useState(null);
  const user = getUser();
  const timerRef = useRef(null);
  const syncRetryRef = useRef(null);

  const currentStageData = STAGES[progress.currentStage - 1];
  const attempts = getAttempts(progress.currentStage);

  // ── Timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!getTimerStart()) saveTimerStart(Date.now());
    setElapsed(getElapsedSeconds());
    timerRef.current = setInterval(() => setElapsed(getElapsedSeconds()), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // ── Start ambient on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!isAmbientPlaying()) startAmbient();
    return () => {};
  }, []);

  // ── Network detection ──────────────────────────────────────────────────
  useEffect(() => {
    const up = () => setNetworkDown(false);
    const dn = () => setNetworkDown(true);
    window.addEventListener("online", up);
    window.addEventListener("offline", dn);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", dn); };
  }, []);

  // ── Background sync ────────────────────────────────────────────────────
  const doSync = useCallback((p, timerStart) => {
    if (!user?.token) return;
    clearTimeout(syncRetryRef.current);
    syncProgress(user.token, {
      currentStage: p.currentStage,
      completedStages: p.completedStages,
      timerStart,
      finished: p.finished,
      finishTime: p.finishTime,
    })
      .then(() => setSyncError(false))
      .catch(() => {
        setSyncError(true);
        // Retry sync in 30s
        syncRetryRef.current = setTimeout(() => doSync(getProgress(), getTimerStart()), 30000);
      });
  }, [user?.token]);

  useEffect(() => {
    doSync(progress, getTimerStart());
    return () => clearTimeout(syncRetryRef.current);
  }, [progress.currentStage, progress.finished]);

  const showAchievement = (msg) => {
    setAchievement(msg);
    setTimeout(() => setAchievement(null), 2800);
  };

  // ── Answer submit ──────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!answer.trim() || stageStatus === "correct" || stageStatus === "unlocking") return;
    sounds.click();

    const isCorrect = checkAnswer(answer, currentStageData.answer);
    const newAttempts = incrementAttempts(progress.currentStage);

    if (isCorrect) {
      sounds.correct();
      setStageStatus("correct");
      setAnswer("");
      resetAttempts(progress.currentStage);

      setTimeout(() => {
        sounds.unlock();
        setStageStatus("unlocking");

        setTimeout(() => {
          const newCompleted = [...(progress.completedStages || []), progress.currentStage];
          const isLast = progress.currentStage >= STAGES.length;
          const finishTime = isLast ? Date.now() : null;

          const updated = {
            currentStage: isLast ? progress.currentStage : progress.currentStage + 1,
            completedStages: newCompleted,
            finished: isLast,
            finishTime,
          };

          saveProgress(updated);
          setProgressState({ ...updated });
          setStageStatus("idle");
          setShowHint(false);
          setHintIndex(0);

          if (isLast) {
            sounds.victory();
            showAchievement("🏆 VAULT BREACHED! CONGRATULATIONS!");
            setTimeout(onFinish, 2200);
          } else {
            sounds.stageComplete();
            showAchievement(`⚡ LAYER ${progress.currentStage} BREACHED!`);
          }
        }, 1800);
      }, 500);
    } else {
      sounds.wrong();
      setStageStatus("wrong");
      setTimeout(() => setStageStatus("idle"), 900);
      if (newAttempts >= 3 && !showHint) {
        sounds.hint();
        setShowHint(true);
        showAchievement("💡 Hint unlocked!");
      }
    }
  };

  const handleHintNext = () => {
    sounds.click();
    setHintIndex((i) => Math.min(i + 1, currentStageData.hints.length - 1));
  };

  const updateAudio = (key, val) => {
    const newPrefs = { ...audioPrefs, [key]: val };
    setAudioPrefs(newPrefs);
    saveAudioPrefs(newPrefs);
    if (key === "muted") setMuted(val);
    if (key === "sfxMuted") setSfxMuted(val);
    if (key === "volume") setVolume(val);
  };

  return (
    <div className="game-root">
      {/* Network banner */}
      {networkDown && (
        <div className="network-banner">
          <span className="pulse-dot red-dot" /> RECONNECTING TO NEXUS... Progress saved locally.
        </div>
      )}

      {/* Achievement popup */}
      {achievement && (
        <div className="achievement-popup">
          <span>{achievement}</span>
        </div>
      )}

      {/* HUD */}
      <div className="game-hud">
        <div className="hud-left">
          <span className="hud-logo">⚜ NEXUS</span>
          {user && <span className="hud-agent">{user.name}</span>}
        </div>
        <div className="hud-center">
          <div className={`hud-timer ${elapsed > 3600 ? "timer-danger" : ""}`}>
            ⏱ {formatTime(elapsed)}
          </div>
        </div>
        <div className="hud-right">
          {syncError && <span className="sync-warn" title="Sync failed — progress is saved locally">⚠</span>}
          <div className="audio-hud-wrap">
            <button className="mute-btn-small" onClick={() => setShowAudioPanel(p => !p)}>🎵</button>
            {showAudioPanel && (
              <div className="audio-panel hud-audio-panel">
                <div className="audio-row">
                  <span>Music</span>
                  <button className={`toggle-pill ${audioPrefs.muted ? "off" : "on"}`}
                    onClick={() => updateAudio("muted", !audioPrefs.muted)}>
                    {audioPrefs.muted ? "OFF" : "ON"}
                  </button>
                </div>
                <div className="audio-row">
                  <span>SFX</span>
                  <button className={`toggle-pill ${audioPrefs.sfxMuted ? "off" : "on"}`}
                    onClick={() => updateAudio("sfxMuted", !audioPrefs.sfxMuted)}>
                    {audioPrefs.sfxMuted ? "OFF" : "ON"}
                  </button>
                </div>
                <div className="audio-row">
                  <span>Vol</span>
                  <input type="range" min="0" max="1" step="0.05"
                    value={audioPrefs.volume ?? 0.7}
                    onChange={(e) => updateAudio("volume", parseFloat(e.target.value))}
                    className="vol-slider" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProgressVault progress={progress} total={STAGES.length} />

      <StageView
        stage={currentStageData}
        status={stageStatus}
        answer={answer}
        onAnswerChange={setAnswer}
        onSubmit={handleSubmit}
        attempts={attempts}
        showHint={showHint}
        hintIndex={hintIndex}
        onHintNext={handleHintNext}
      />
    </div>
  );
}
