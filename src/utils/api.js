const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── RETRY FETCH with exponential backoff ────────────────────────────────
const retryFetch = async (url, options = {}, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Request failed" }));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delay * Math.pow(1.5, i)));
    }
  }
};

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// ─── AUTH ─────────────────────────────────────────────────────────────────
export const registerOrLogin = (formData) =>
  retryFetch(`${BASE}/auth/register`, { method: "POST", body: JSON.stringify(formData) });

export const verifyToken = (token) =>
  retryFetch(`${BASE}/auth/verify`, { headers: authHeader(token) });

// ─── PROGRESS ─────────────────────────────────────────────────────────────
export const syncProgress = (token, progressData) =>
  retryFetch(`${BASE}/progress/sync`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify(progressData),
  });

export const getServerProgress = (token) =>
  retryFetch(`${BASE}/progress`, { headers: authHeader(token) });

// ─── EVENT STATE ──────────────────────────────────────────────────────────
export const fetchEventState = () => retryFetch(`${BASE}/event/state`);

// ─── LEADERBOARD ─────────────────────────────────────────────────────────
export const fetchLeaderboard = (token) =>
  retryFetch(`${BASE}/leaderboard`, { headers: authHeader(token) });

// ─── ADMIN ────────────────────────────────────────────────────────────────
export const adminLogin = (credentials) =>
  retryFetch(`${BASE}/admin/login`, { method: "POST", body: JSON.stringify(credentials) });

// FIX: validate endpoint for session recovery on refresh
export const adminValidateToken = (token) =>
  retryFetch(`${BASE}/admin/validate`, { headers: authHeader(token) });

export const adminGetParticipants = (token) =>
  retryFetch(`${BASE}/admin/participants`, { headers: authHeader(token) });

export const adminSetEventState = (token, state) =>
  retryFetch(`${BASE}/admin/event`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify({ status: state }),
  });

export const adminGetAnalytics = (token) =>
  retryFetch(`${BASE}/admin/analytics`, { headers: authHeader(token) });
