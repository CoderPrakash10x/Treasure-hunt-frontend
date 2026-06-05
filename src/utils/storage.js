// ─── STORAGE KEYS ──────────────────────────────────────────────────────────
const KEYS = {
  USER: "ignitia_user",
  SESSION: "ignitia_session",
  PROGRESS: "ignitia_progress",
  TIMER: "ignitia_timer",
  ATTEMPTS: "ignitia_attempts",
  EVENT_STATE: "ignitia_event_state",
  ADMIN_TOKEN: "ignitia_admin_token",
  AUDIO_PREFS: "ignitia_audio",
};

// ─── SAFE JSON ────────────────────────────────────────────────────────────
const safeGet = (key) => {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; }
  catch { return null; }
};
const safeSet = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch { return false; }
};

// ─── USER SESSION ─────────────────────────────────────────────────────────
export const saveUser = (userData) => {
  safeSet(KEYS.USER, userData);
  safeSet(KEYS.SESSION, { token: userData.token, savedAt: Date.now() });
};
export const getUser = () => safeGet(KEYS.USER);
export const clearUser = () => { Object.values(KEYS).forEach((k) => localStorage.removeItem(k)); };
export const isLoggedIn = () => !!getUser()?.token;

// ─── ADMIN SESSION (persistent across refresh) ────────────────────────────
export const saveAdminToken = (token) => safeSet(KEYS.ADMIN_TOKEN, { token, savedAt: Date.now() });
export const getAdminToken = () => safeGet(KEYS.ADMIN_TOKEN)?.token || null;
export const clearAdminToken = () => localStorage.removeItem(KEYS.ADMIN_TOKEN);

// ─── PROGRESS ─────────────────────────────────────────────────────────────
export const saveProgress = (progress) => {
  const existing = getProgress();
  safeSet(KEYS.PROGRESS, { ...existing, ...progress, updatedAt: Date.now() });
};
export const getProgress = () =>
  safeGet(KEYS.PROGRESS) || { currentStage: 1, completedStages: [], finished: false, finishTime: null };

// ─── TIMER ────────────────────────────────────────────────────────────────
export const saveTimerStart = (ts) => safeSet(KEYS.TIMER, { startTimestamp: ts, savedAt: Date.now() });
export const getTimerStart = () => safeGet(KEYS.TIMER)?.startTimestamp || null;
export const getElapsedSeconds = () => {
  const start = getTimerStart();
  if (!start) return 0;
  const p = getProgress();
  if (p.finished && p.finishTime) return Math.floor((p.finishTime - start) / 1000);
  return Math.floor((Date.now() - start) / 1000);
};
export const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
};

// ─── ATTEMPTS ─────────────────────────────────────────────────────────────
export const getAttempts = (id) => (safeGet(KEYS.ATTEMPTS) || {})[id] || 0;
export const incrementAttempts = (id) => {
  const all = safeGet(KEYS.ATTEMPTS) || {};
  all[id] = (all[id] || 0) + 1;
  safeSet(KEYS.ATTEMPTS, all);
  return all[id];
};
export const resetAttempts = (id) => {
  const all = safeGet(KEYS.ATTEMPTS) || {};
  all[id] = 0;
  safeSet(KEYS.ATTEMPTS, all);
};

// ─── EVENT STATE ──────────────────────────────────────────────────────────
export const getEventState = () => safeGet(KEYS.EVENT_STATE) || { status: "waiting" };
export const saveEventState = (state) => safeSet(KEYS.EVENT_STATE, state);

// ─── AUDIO PREFS ─────────────────────────────────────────────────────────
export const getAudioPrefs = () =>
  safeGet(KEYS.AUDIO_PREFS) || { muted: false, sfxMuted: false, volume: 0.7 };
export const saveAudioPrefs = (prefs) => {
  const existing = getAudioPrefs();
  safeSet(KEYS.AUDIO_PREFS, { ...existing, ...prefs });
};

// ─── ANSWER VALIDATION ────────────────────────────────────────────────────
export const normalizeAnswer = (a) =>
  a.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, "");
export const checkAnswer = (user, correct) =>
  normalizeAnswer(user) === normalizeAnswer(correct);
