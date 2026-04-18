"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import {
  Activity, MapPin, MessageSquare, ShieldAlert, TriangleAlert,
  Map, Menu, X, Sun, Moon, ArrowLeft,
} from "lucide-react";
import AIAssistant from "../components/AIAssistant";
import StadiumDashboard from "../components/StadiumDashboard";
import MapContainer from "../components/MapContainer";
import OrganizerInsights from "../components/OrganizerInsights";
import StadiumSelector from "../components/StadiumSelector";
import type { StadiumData } from "../lib/types";
import {
  trackStadiumSelect,
  trackEventTrigger,
  trackTabChange,
  trackMapView,
  trackThemeToggle,
  trackPageView,
} from "../lib/analytics";

const TABS = [
  { id: "dashboard", label: "Dashboard",      icon: Activity,       color: "blue"   },
  { id: "map",       label: "Live Map",        icon: MapPin,         color: "blue"   },
  { id: "ai",        label: "AI Assistant",    icon: MessageSquare,  color: "blue"   },
  { id: "admin",     label: "Organizer View",  icon: ShieldAlert,    color: "purple" },
] as const;

type TabId = typeof TABS[number]["id"];

/** Sanitize a string for safe use in API requests — strips control chars and trims. */
function sanitizeInput(value: string, maxLen = 128): string {
  return value.replace(/[\x00-\x1f\x7f]/g, "").trim().slice(0, maxLen);
}

const BASE_URL = "https://crowdflow-backend-79696992591.us-central1.run.app";

export default function Home() {
  const [activeStadiumId, setActiveStadiumId] = useState<string | null>(null);
  const [activeTab, setActiveTab]             = useState<TabId>("dashboard");
  const [stadiumData, setStadiumData]         = useState<StadiumData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen]     = useState(false);
  const [isDarkMode, setIsDarkMode]           = useState(true);

  const locationDebounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef   = useRef<AbortController | null>(null);

  // Apply dark/light mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // ── Adaptive polling: 3s when visible, 10s when tab is hidden ────────────
  useEffect(() => {
    if (!activeStadiumId) return;

    const fetchData = async () => {
      // Cancel any in-flight request before starting a new one
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
<<<<<<< HEAD
        const res = await axios.get(
          `http://localhost:8000/api/stadium-data?stadium_id=${encodeURIComponent(activeStadiumId)}`,
          { signal: controller.signal }
        );
=======
        const res = await axios.get(`${BASE_URL}/api/stadium-data?stadium_id=${activeStadiumId}`);
>>>>>>> 14fc5bc6149bc7fd0a30698a3294216d6f56f66a
        setStadiumData(res.data);
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error("Backend not running or unreachable");
        }
      }
    };

    fetchData();

    // Adaptive interval — slow down when page is not visible
    const getInterval = () =>
      document.visibilityState === "hidden" ? 10000 : 3000;

    let interval = setInterval(fetchData, getInterval());

    const handleVisibilityChange = () => {
      clearInterval(interval);
      interval = setInterval(fetchData, getInterval());
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      abortControllerRef.current?.abort();
    };
  }, [activeStadiumId]);

<<<<<<< HEAD
  // Track page view when entering a stadium dashboard
  useEffect(() => {
    if (activeStadiumId) {
      trackPageView(`Stadium Dashboard: ${activeStadiumId}`);
=======
  const handleEventTrigger = async (eventName: string) => {
    try {
      await axios.post("https://crowdflow-backend-79696992591.us-central1.run.app/api/trigger-event", { stadium_id: activeStadiumId, event_name: eventName });
    } catch (e) {
      console.error(e);
>>>>>>> 14fc5bc6149bc7fd0a30698a3294216d6f56f66a
    }
  }, [activeStadiumId]);

<<<<<<< HEAD
  const handleStadiumSelect = useCallback((id: string) => {
    trackStadiumSelect(id);
    setActiveStadiumId(id);
  }, []);

  const handleTabChange = useCallback(
    (tab: TabId) => {
      trackTabChange(tab);
      if (tab === "map" && activeStadiumId) {
        trackMapView(activeStadiumId);
      }
      setActiveTab(tab);
      setIsSidebarOpen(false);
    },
    [activeStadiumId]
  );

  const handleThemeToggle = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      trackThemeToggle(next ? "dark" : "light");
      return next;
    });
  }, []);

  const handleEventTrigger = useCallback(
    async (eventName: string) => {
      if (!activeStadiumId) return;
      const safeEvent = sanitizeInput(eventName, 64);
      try {
        await axios.post("http://localhost:8000/api/trigger-event", {
          stadium_id: activeStadiumId,
          event_name: safeEvent,
        });
        trackEventTrigger(safeEvent, activeStadiumId);
      } catch (e) {
        console.error(e);
      }
    },
    [activeStadiumId]
  );

  const handleLocationChange = useCallback(
    (loc: string) => {
      const safeLocation = sanitizeInput(loc, 128);
      if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
      setStadiumData((prev) => (prev ? { ...prev, user_location: safeLocation } : prev));
      locationDebounceRef.current = setTimeout(async () => {
        try {
          await axios.post("http://localhost:8000/api/set-location", {
            stadium_id: activeStadiumId,
            location: safeLocation,
          });
        } catch (e) {
          console.error(e);
        }
      }, 400);
    },
    [activeStadiumId]
  );
=======
  const handleLocationChange = async (loc: string) => {
    try {
      await axios.post("https://crowdflow-backend-79696992591.us-central1.run.app/api/set-location", { stadium_id: activeStadiumId, location: loc });
      setStadiumData(prev => prev ? { ...prev, user_location: loc } : prev);
    } catch (e) {
      console.error(e);
    }
  };
>>>>>>> 14fc5bc6149bc7fd0a30698a3294216d6f56f66a

  if (!activeStadiumId) {
    return (
      <StadiumSelector
        onSelect={handleStadiumSelect}
        isDarkMode={isDarkMode}
        onToggleTheme={handleThemeToggle}
      />
    );
  }

  return (
    <>
      {/* Skip navigation for keyboard/screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Skip to main content
      </a>

      <div className={`stadium-bg-motion ${!isDarkMode ? "opacity-30" : ""}`} aria-hidden="true" />
      <div className="flex h-screen bg-app-bg-translucent text-app-primary font-sans relative z-10 overflow-hidden">

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          id="sidebar"
          aria-label="Main navigation"
          className={`fixed md:relative top-0 left-0 h-full w-64 bg-app-surface/95 border-r border-app-border flex flex-col p-6 z-50 backdrop-blur-xl transition-transform duration-300 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-6 text-xl font-bold">
            <div className="flex items-center gap-3">
              <Activity className="text-blue-500" aria-hidden="true" />
              <span>
                CrowdFlow<span className="text-blue-500">X</span>
              </span>
            </div>
            <button
              className="md:hidden text-app-muted hover:text-app-primary"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close navigation menu"
            >
              <X size={24} aria-hidden="true" />
            </button>
          </div>

          <button
            onClick={() => {
              setActiveStadiumId(null);
              setIsSidebarOpen(false);
            }}
            className="flex items-center gap-2 text-sm text-app-muted hover:text-blue-500 transition-colors mb-6 font-semibold bg-app-surface border border-app-border rounded-lg px-3 py-2 border-dashed shadow-sm w-fit"
            aria-label="Return to stadium selection screen"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Select Venue
          </button>

          <nav role="navigation" aria-label="Dashboard sections">
            <ul className="space-y-2" role="tablist" aria-orientation="vertical">
              {TABS.map(({ id, label, icon: Icon, color }) => (
                <li key={id} role="presentation">
                  <button
                    id={`tab-${id}`}
                    role="tab"
                    onClick={() => handleTabChange(id)}
                    aria-selected={activeTab === id}
                    aria-controls={`tabpanel-${id}`}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === id
                        ? `bg-${color}-600/20 text-${color}-500 border-l-4 border-${color}-500 font-semibold`
                        : "text-app-muted hover:bg-app-surface-hover hover:text-app-primary"
                    }`}
                  >
                    <Icon size={18} aria-hidden="true" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-auto space-y-6">
            <button
              onClick={handleThemeToggle}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={isDarkMode}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-app-surface-hover border border-app-border rounded-xl text-app-primary font-semibold hover:bg-app-surface transition-all cursor-pointer shadow-sm"
            >
              {isDarkMode ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </button>

            <div>
              <label
                htmlFor="gps-sim-select"
                className="text-xs text-app-muted mb-2 uppercase tracking-wider font-semibold flex items-center gap-2"
              >
                <Map size={14} aria-hidden="true" /> User GPS Sim
              </label>
              <select
                id="gps-sim-select"
                value={stadiumData?.user_location || ""}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full bg-app-bg border border-app-border rounded px-3 py-2 text-sm text-app-primary focus:outline-none focus:border-blue-500"
                aria-label="Simulate user GPS position within stadium"
              >
                {stadiumData &&
                  Object.keys(stadiumData.wait_times).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <div className="text-xs text-app-muted mb-2 uppercase tracking-wider font-semibold" aria-hidden="true">
                Event Simulator
              </div>
              <div className="space-y-2" role="group" aria-label="Trigger crowd management event scenarios">
                <button
                  onClick={() => handleEventTrigger("Halftime")}
                  className="w-full text-left px-3 py-2 text-sm bg-app-surface-hover rounded hover:bg-orange-500/20 transition-colors"
                  aria-label="Simulate halftime rush event"
                >
                  Halftime Rush
                </button>
                <button
                  onClick={() => handleEventTrigger("Gate 1 Blocked")}
                  className="w-full text-left px-3 py-2 text-sm bg-app-surface-hover rounded hover:bg-red-500/20 transition-colors"
                  aria-label="Simulate Gate 1 blocked event"
                >
                  Block Gate 1
                </button>
                <button
                  onClick={() => handleEventTrigger("Clear")}
                  className="w-full text-left px-3 py-2 text-sm bg-app-surface-hover rounded hover:bg-green-500/20 transition-colors"
                  aria-label="Clear all active crowd events"
                >
                  Clear Events
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main
          id="main-content"
          className="flex-1 flex flex-col p-4 md:p-8 overflow-hidden relative"
          aria-busy={stadiumData === null}
        >
          <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <button
                className="md:hidden p-2.5 bg-app-surface/50 border border-app-border rounded-xl text-app-muted hover:text-app-primary hover:bg-app-surface-hover backdrop-blur-md shadow-sm"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={isSidebarOpen}
                aria-controls="sidebar"
              >
                <Menu size={24} aria-hidden="true" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {stadiumData?.name || "System Terminal"}
                </h1>
                <p className="text-app-muted text-xs md:text-sm mt-1">
                  Real-time stadium analytics powered by Google Cloud
                </p>
              </div>
            </div>

            {stadiumData?.active_event && (
              <div
                role="status"
                aria-live="assertive"
                aria-atomic="true"
                className="animate-pulse flex items-center gap-2 bg-red-500/20 text-red-500 px-4 py-2 rounded-full border border-red-500/30 w-fit"
              >
                <TriangleAlert size={16} aria-hidden="true" />
                <span className="font-semibold text-sm">
                  ACTIVE EVENT: {stadiumData.active_event}
                </span>
              </div>
            )}
          </header>

          {/* Tab panels — each panel has proper tabpanel role and labelled by its tab button */}
          <div className="flex-1 overflow-y-auto pr-1 md:pr-4 custom-scrollbar">
            <div
              id="tabpanel-dashboard"
              role="tabpanel"
              aria-labelledby="tab-dashboard"
              hidden={activeTab !== "dashboard"}
            >
              {activeTab === "dashboard" && <StadiumDashboard data={stadiumData} isDarkMode={isDarkMode} />}
            </div>
            <div
              id="tabpanel-map"
              role="tabpanel"
              aria-labelledby="tab-map"
              hidden={activeTab !== "map"}
            >
              {activeTab === "map" && <MapContainer data={stadiumData} />}
            </div>
            <div
              id="tabpanel-ai"
              role="tabpanel"
              aria-labelledby="tab-ai"
              hidden={activeTab !== "ai"}
            >
              {activeTab === "ai" && <AIAssistant stadiumId={activeStadiumId} />}
            </div>
            <div
              id="tabpanel-admin"
              role="tabpanel"
              aria-labelledby="tab-admin"
              hidden={activeTab !== "admin"}
            >
              {activeTab === "admin" && <OrganizerInsights data={stadiumData} />}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
