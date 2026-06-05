import { useState } from "react";
import { registerOrLogin } from "../utils/api";
import { saveUser, saveProgress, getProgress } from "../utils/storage";
import { sounds, startAmbient, isAmbientPlaying } from "../utils/sounds";

export default function RegisterPage({ onSuccess }) {
  const [form, setForm] = useState({ name:"", email:"", mobile:"", college:"", teamName:"" });
  const [status, setStatus] = useState("idle"); // idle|loading|error|success
  const [errorMsg, setErrorMsg] = useState("");
  const [networkError, setNetworkError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return "Full name is required.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email address.";
    if (!form.mobile.trim() || !/^\d{10}$/.test(form.mobile.replace(/\s/g,""))) return "Enter a valid 10-digit mobile number.";
    if (!form.college.trim()) return "College name is required.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setErrorMsg(err); setStatus("error"); sounds.wrong(); return; }

    setStatus("loading"); setNetworkError(false);
    try {
      const data = await registerOrLogin(form);
      saveUser({ ...data.user, token: data.token });

      // Merge server progress with local — take the further along one
      if (data.progress) {
        const local = getProgress();
        const serverStage = data.progress.currentStage || 1;
        const localStage = local.currentStage || 1;
        if (serverStage >= localStage) {
          saveProgress(data.progress);
        }
      } else {
        const local = getProgress();
        if (!local.currentStage) saveProgress({ currentStage:1, completedStages:[], finished:false });
      }

      sounds.correct();
      setStatus("success");
      if (!isAmbientPlaying()) startAmbient();
      setTimeout(onSuccess, 900);
    } catch (err) {
      sounds.wrong();
      if (!navigator.onLine || err.message?.includes("fetch") || err.message?.includes("network")) {
        setNetworkError(true); setStatus("error");
        setErrorMsg("Network error. Retrying automatically...");
        setRetryCount(c => c + 1);
        setTimeout(handleSubmit, 3000 + retryCount * 1000);
      } else {
        setStatus("error");
        setErrorMsg(err.message || "Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="register-root">
      <div className="register-card">
        <div className="reg-header">
          <div className="reg-icon">🔐</div>
          <h2 className="reg-title">VAULT REGISTRATION</h2>
          <p className="reg-subtitle">Identify yourself to access the Nexus</p>
          <div className="gold-line-divider" />
        </div>

        {networkError && (
          <div className="net-warning">
            <span className="pulse-dot red-dot" />
            Reconnecting to vault servers...{retryCount > 1 ? ` (attempt ${retryCount})` : ""}
          </div>
        )}

        <div className="reg-form">
          <div className="field-group">
            <label className="field-label">FULL NAME *</label>
            <input className="vault-input" name="name" placeholder="Enter your full name" value={form.name} onChange={handleChange} />
          </div>
          <div className="field-group">
            <label className="field-label">EMAIL ADDRESS *</label>
            <input className="vault-input" name="email" type="email" placeholder="your@email.com" value={form.email} onChange={handleChange} />
          </div>
          <div className="field-row">
            <div className="field-group">
              <label className="field-label">MOBILE *</label>
              <input className="vault-input" name="mobile" placeholder="10-digit number" value={form.mobile} onChange={handleChange} />
            </div>
            <div className="field-group">
              <label className="field-label">COLLEGE *</label>
              <input className="vault-input" name="college" placeholder="Your college" value={form.college} onChange={handleChange} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">TEAM NAME <span className="optional">(optional)</span></label>
            <input className="vault-input" name="teamName" placeholder="Your team name" value={form.teamName} onChange={handleChange} />
          </div>

          {status === "error" && <div className="error-msg">⚠ {errorMsg}</div>}
          {status === "success" && <div className="success-msg">✓ Identity verified. Entering vault...</div>}

          <button
            className={`reg-btn${status === "loading" ? " loading" : ""}`}
            onClick={handleSubmit}
            disabled={status === "loading" || status === "success"}
            onMouseEnter={() => sounds.hover()}
          >
            {status === "loading" ? (
              <span className="loading-text"><span className="spinner" /> VERIFYING IDENTITY...</span>
            ) : status === "success" ? "✓ ACCESS GRANTED" : "ENTER THE VAULT →"}
          </button>
        </div>

        <p className="reg-note">Already registered? Your session will be restored automatically.</p>
      </div>
    </div>
  );
}
