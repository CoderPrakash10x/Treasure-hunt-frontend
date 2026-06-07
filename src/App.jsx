import { useState, useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import WaitingRoom from "./pages/WaitingRoom";
import GamePage from "./pages/GamePage";
import VictoryPage from "./pages/VictoryPage";
import AdminPage from "./pages/AdminPage";
import { getUser, getProgress, getEventState, saveEventState } from "./utils/storage";
import { fetchEventState } from "./utils/api";
import Particles from "./components/Particles";
import SplashScreen from "./components/SplashScreen";
import { Analytics } from "@vercel/analytics/react"

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [page, setPage] = useState(null);
  const [eventState, setEventState] = useState({ status: "waiting" });
  const [showSplash, setShowSplash] = useState(true);


  useEffect(() => {
    if (!splashDone) return;

    const path = window.location.pathname;
    if (path === "/admin" || path.startsWith("/admin")) {
      setPage("admin");
      return;
    }

    // Fetch live event state; fall back to cached
    fetchEventState()
      .then((data) => { setEventState(data); saveEventState(data); })
      .catch(() => { setEventState(getEventState()); });

    const user = getUser();
    if (!user?.token) { setPage("landing"); return; }

    // Session recovery
    const progress = getProgress();
    if (progress.finished) { setPage("victory"); return; }
    setPage("waiting"); // WaitingRoom auto-proceeds to game if event active
  }, [splashDone]);

  // Lightweight poll every 10s
  useEffect(() => {
    if (!splashDone) return;
    if (page === "admin" || page === "loading" || page === "victory") return;
    const id = setInterval(() => {
      fetchEventState()
        .then((data) => { setEventState(data); saveEventState(data); })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(id);
  }, [splashDone,page]);

  const nav = (p) => setPage(p);

  if (!splashDone) {
    return <SplashScreen onDone={() => setSplashDone(true)} />;
  }

  if (page === "loading") {
    return (
      <div className="loading-screen">
        <div className="vault-loader">
          <div className="loader-ring" />
          <p className="loader-text">INITIALIZING NEXUS...</p>
        </div>
      </div>
    );
  }

  return (

    <div className="app-root">

      <Particles />
      {page === "landing"   && <LandingPage onStart={() => nav("register")} />}
      {page === "register"  && <RegisterPage onSuccess={() => nav("waiting")} />}
      {page === "waiting"   && <WaitingRoom eventState={eventState} onEventStart={() => nav("game")} />}
      {page === "game"      && <GamePage onFinish={() => nav("victory")} onEventEnd={() => nav("waiting")} />}
      {page === "victory"   && <VictoryPage />}
      {page === "admin"     && <AdminPage />}
    </div>
  );
}
