"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Activity, MapPin, MessageSquare, ShieldAlert, TriangleAlert, Map, Menu, X, Sun, Moon, ArrowLeft } from "lucide-react";
import AIAssistant from "../components/AIAssistant";
import StadiumDashboard from "../components/StadiumDashboard";
import MapContainer from "../components/MapContainer";
import OrganizerInsights from "../components/OrganizerInsights";
import StadiumSelector from "../components/StadiumSelector";

const BASE_URL = "https://crowdflow-backend-79696992591.us-central1.run.app";

export default function Home() {
  const [activeStadiumId, setActiveStadiumId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stadiumData, setStadiumData] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Apply dark mode class to HTML element
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!activeStadiumId) return;
    
    const fetchData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/stadium-data?stadium_id=${activeStadiumId}`);
        setStadiumData(res.data);
      } catch (e) {
        console.error("Backend not running or unreachable");
      }
    };
    fetchData(); // initial
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [activeStadiumId]);

  const handleEventTrigger = async (eventName: string) => {
    try {
      await axios.post("https://crowdflow-backend-79696992591.us-central1.run.app/api/trigger-event", { stadium_id: activeStadiumId, event_name: eventName });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLocationChange = async (loc: string) => {
    try {
      await axios.post("https://crowdflow-backend-79696992591.us-central1.run.app/api/set-location", { stadium_id: activeStadiumId, location: loc });
      setStadiumData(prev => prev ? { ...prev, user_location: loc } : prev);
    } catch (e) {
      console.error(e);
    }
  };

  if (!activeStadiumId) {
    return <StadiumSelector 
             onSelect={(id) => setActiveStadiumId(id)} 
             isDarkMode={isDarkMode} 
             onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
           />;
  }

  return (
    <>
    <div className={`stadium-bg-motion ${!isDarkMode ? 'opacity-30' : ''}`}></div>
    <div className="flex h-screen bg-app-bg-translucent text-app-primary font-sans relative z-10 overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative top-0 left-0 h-full w-64 bg-app-surface/95 border-r border-app-border flex flex-col p-6 z-50 backdrop-blur-xl transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex items-center justify-between gap-3 mb-6 text-xl font-bold">
          <div className="flex items-center gap-3">
            <Activity className="text-blue-500" />
            <span>CrowdFlow<span className="text-blue-500">X</span></span>
          </div>
          <button className="md:hidden text-app-muted hover:text-app-primary" onClick={() => setIsSidebarOpen(false)}>
             <X size={24} />
          </button>
        </div>
        
        <button 
          onClick={() => { setActiveStadiumId(null); setIsSidebarOpen(false); }}
          className="flex items-center gap-2 text-sm text-app-muted hover:text-blue-500 transition-colors mb-6 font-semibold bg-app-surface border border-app-border rounded-lg px-3 py-2 border-dashed shadow-sm w-fit"
        >
          <ArrowLeft size={16} /> Select Venue
        </button>
        
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => { setActiveTab("dashboard"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "dashboard" ? "bg-blue-600/20 text-blue-500 border-l-4 border-blue-500 font-semibold" : "text-app-muted hover:bg-app-surface-hover hover:text-app-primary"}`}
          >
            <Activity size={18} /> Dashboard
          </button>
          <button 
            onClick={() => { setActiveTab("map"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "map" ? "bg-blue-600/20 text-blue-500 border-l-4 border-blue-500 font-semibold" : "text-app-muted hover:bg-app-surface-hover hover:text-app-primary"}`}
          >
            <MapPin size={18} /> Live Map
          </button>
          <button 
            onClick={() => { setActiveTab("ai"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "ai" ? "bg-blue-600/20 text-blue-500 border-l-4 border-blue-500 font-semibold" : "text-app-muted hover:bg-app-surface-hover hover:text-app-primary"}`}
          >
            <MessageSquare size={18} /> AI Assistant
          </button>
          <button 
            onClick={() => { setActiveTab("admin"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "admin" ? "bg-purple-600/20 text-purple-500 border-l-4 border-purple-500 font-semibold" : "text-app-muted hover:bg-app-surface-hover hover:text-app-primary"}`}
          >
            <ShieldAlert size={18} /> Organizer View
          </button>
        </nav>

        <div className="mt-auto space-y-6">
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-app-surface-hover border border-app-border rounded-xl text-app-primary font-semibold hover:bg-app-surface transition-all cursor-pointer shadow-sm"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>

          <div>
             <div className="text-xs text-app-muted mb-2 uppercase tracking-wider font-semibold flex items-center gap-2"><Map size={14}/> User GPS Sim</div>
             <select 
                value={stadiumData?.user_location || ""}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full bg-app-bg border border-app-border rounded px-3 py-2 text-sm text-app-primary focus:outline-none focus:border-blue-500"
             >
                {stadiumData && Object.keys(stadiumData.wait_times).map(k => (
                   <option key={k} value={k}>{k}</option>
                ))}
             </select>
          </div>

          <div>
            <div className="text-xs text-app-muted mb-2 uppercase tracking-wider font-semibold">Event Simulator</div>
            <div className="space-y-2">
              <button onClick={() => handleEventTrigger("Halftime")} className="w-full text-left px-3 py-2 text-sm bg-app-surface-hover rounded hover:bg-orange-500/20 transition-colors">Halftime Rush</button>
              <button onClick={() => handleEventTrigger("Gate 1 Blocked")} className="w-full text-left px-3 py-2 text-sm bg-app-surface-hover rounded hover:bg-red-500/20 transition-colors">Block Gate 1</button>
              <button onClick={() => handleEventTrigger("Clear")} className="w-full text-left px-3 py-2 text-sm bg-app-surface-hover rounded hover:bg-green-500/20 transition-colors">Clear Events</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-hidden relative">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2.5 bg-app-surface/50 border border-app-border rounded-xl text-app-muted hover:text-app-primary hover:bg-app-surface-hover backdrop-blur-md shadow-sm" 
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{stadiumData?.name || "System Terminal"}</h1>
              <p className="text-app-muted text-xs md:text-sm mt-1">Real-time stadium analytics powered by Google Cloud</p>
            </div>
          </div>

          {stadiumData?.active_event && (
             <div className="animate-pulse flex items-center gap-2 bg-red-500/20 text-red-500 px-4 py-2 rounded-full border border-red-500/30 w-fit">
               <TriangleAlert size={16} />
               <span className="font-semibold text-sm">ACTIVE EVENT: {stadiumData.active_event}</span>
             </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto pr-1 md:pr-4 custom-scrollbar">
          {activeTab === "dashboard" && <StadiumDashboard data={stadiumData} isDarkMode={isDarkMode} />}
          {activeTab === "map" && <MapContainer data={stadiumData} />}
          {activeTab === "ai" && <AIAssistant stadiumId={activeStadiumId} />}
          {activeTab === "admin" && <OrganizerInsights data={stadiumData} />}
        </div>
      </main>
    </div>
    </>
  );
}
