import React, { useState } from "react";
import { MapPin, LocateFixed, Activity, ChevronRight, Loader2, Search, Sun, Moon } from "lucide-react";
import axios from "axios";
import type { NearestStadiumResponse } from "../lib/types";
import { trackAutoLocate, trackStadiumSelect } from "../lib/analytics";

interface Props {
  onSelect: (id: string) => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

const STADIUMS = [
  { id: "narendra_modi", name: "Narendra Modi Stadium", city: "Ahmedabad, Gujarat" },
  { id: "wankhede", name: "Wankhede Stadium", city: "Mumbai, Maharashtra" },
  { id: "eden_gardens", name: "Eden Gardens", city: "Kolkata, West Bengal" },
  { id: "chinnaswamy", name: "M. Chinnaswamy Stadium", city: "Bengaluru, Karnataka" },
  { id: "ma_chidambaram", name: "M. A. Chidambaram", city: "Chennai, Tamil Nadu" },
  { id: "rajiv_gandhi_hyd", name: "Rajiv Gandhi Stadium", city: "Hyderabad, Telangana" },
  { id: "arun_jaitley", name: "Arun Jaitley Stadium", city: "New Delhi, Delhi" },
  { id: "dharamshala", name: "HPCA Stadium", city: "Dharamshala, HP" },
  { id: "punjab_pca", name: "IS Bindra Stadium", city: "Mohali, Punjab" },
  { id: "sawai_mansingh", name: "Sawai Mansingh Stadium", city: "Jaipur, Rajasthan" },
  { id: "ekana", name: "Ekana Cricket Stadium", city: "Lucknow, UP" },
  { id: "green_park", name: "Green Park Stadium", city: "Kanpur, UP" },
  { id: "brabourne", name: "Brabourne Stadium", city: "Mumbai, Maharashtra" },
  { id: "barabati", name: "Barabati Stadium", city: "Cuttack, Odisha" },
  { id: "aca_vdca", name: "ACA-VDCA Stadium", city: "Visakhapatnam, AP" },
  { id: "dy_patil", name: "DY Patil Stadium", city: "Navi Mumbai, Maharashtra" },
  { id: "kalinga", name: "Kalinga Stadium", city: "Bhubaneswar, Odisha" },
  { id: "jln_delhi", name: "JLN Stadium Delhi", city: "New Delhi, Delhi" },
  { id: "jln_kochi", name: "JLN Stadium Kochi", city: "Kochi, Kerala" },
  { id: "salt_lake", name: "Salt Lake Stadium", city: "Kolkata, West Bengal" },
  { id: "bale_wadi", name: "Shree Shiv Chhatrapati", city: "Pune, Maharashtra" },
  { id: "fatorda", name: "Fatorda Stadium", city: "Margao, Goa" },
] as const;

export default function StadiumSelector({ onSelect, isDarkMode = true, onToggleTheme }: Props) {
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStadiums = STADIUMS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAutoLocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    trackAutoLocate();

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await axios.post<NearestStadiumResponse>(
            "http://localhost:8000/api/find-nearest",
            { lat: latitude, lng: longitude }
          );
          if (res.data?.stadium_id) {
            alert(
              `GPS matched your location to nearest stadium:\n\n${res.data.name}\n(Distance: ${res.data.distance_km} km)`
            );
            trackStadiumSelect(res.data.stadium_id);
            onSelect(res.data.stadium_id);
          } else {
            alert("Could not find a stadium nearby.");
            setIsLocating(false);
          }
        } catch (err) {
          console.error(err);
          alert("Failed to connect to the stadium engine.");
          setIsLocating(false);
        }
      },
      () => {
        alert("Unable to retrieve your location. Please check browser permissions.");
        setIsLocating(false);
      }
    );
  };

  return (
    <>
      <div className={`stadium-bg-motion ${!isDarkMode ? "opacity-30" : ""}`} aria-hidden="true" />
      <div
        className="min-h-screen bg-app-bg-translucent text-app-primary flex flex-col items-center p-6 lg:p-10 relative z-10 transition-colors duration-300"
        role="main"
      >
        {/* Skip to content */}
        <a
          href="#stadium-grid"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:font-semibold focus:outline-none"
        >
          Skip to stadium list
        </a>

        {/* Header row */}
        <div className="flex items-center justify-between w-full max-w-6xl mb-8">
          <div className="flex items-center gap-3 text-xl font-bold" aria-label="CrowdFlowX logo">
            <Activity className="text-blue-500" aria-hidden="true" />
            <span>
              CrowdFlow<span className="text-blue-500">X</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={async () => {
                const { signInWithGoogle } = await import("../lib/firebase");
                try {
                  const user = await signInWithGoogle();
                  alert(`Successfully signed in as: ${user.displayName}`);
                } catch (err) {
                  console.error(err);
                }
              }}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all shadow-sm"
              aria-label="Sign in with Google"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="" />
              Sign in with Google
            </button>

            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                aria-pressed={isDarkMode}
                className="p-2.5 rounded-xl border border-app-border bg-app-surface/50 hover:bg-app-surface text-app-muted hover:text-app-primary backdrop-blur-md shadow-sm transition-all"
              >
                {isDarkMode ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
              </button>
            )}
          </div>
        </div>

        <div className="max-w-5xl w-full">
          <div className="mb-10 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Select Active Venue
            </h1>
            <p className="text-app-muted text-lg">
              Connect to a live stadium data engine in India.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8" role="search">
            <button
              onClick={handleAutoLocate}
              disabled={isLocating}
              aria-label="Auto-detect nearest stadium using your GPS location"
              aria-busy={isLocating}
              className="w-full md:w-auto glass-panel hover:bg-app-surface-hover hover:border-blue-500/50 transition-all px-8 py-3 flex items-center justify-center gap-3 text-blue-500 font-bold rounded-xl cursor-pointer shadow-lg shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLocating ? (
                <Loader2 className="animate-spin" size={20} aria-hidden="true" />
              ) : (
                <LocateFixed size={20} aria-hidden="true" />
              )}
              {isLocating ? "Locating..." : "Auto-Detect Nearest Stadium"}
            </button>

            <div className="w-full md:w-80 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted" aria-hidden="true" />
              <label htmlFor="stadium-search" className="sr-only">
                Search stadiums or cities
              </label>
              <input
                id="stadium-search"
                type="search"
                placeholder="Search stadiums or cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search stadiums by name or city"
                className="w-full bg-app-surface/60 border border-app-border rounded-xl pl-11 pr-4 py-3 text-app-primary focus:outline-none focus:border-blue-500 transition-colors"
                aria-controls="stadium-grid"
              />
              {/* Invisible live region for search result announcements */}
              <div role="status" aria-live="polite" className="sr-only">
                {searchQuery && `${filteredStadiums.length} stadiums found.`}
              </div>
            </div>
          </div>

          <div
            id="stadium-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-10"
            role="list"
            aria-label={`${filteredStadiums.length} stadiums available`}
          >
            {filteredStadiums.map((stad) => (
              <div
                key={stad.id}
                role="listitem"
              >
                <button
                  onClick={() => {
                    trackStadiumSelect(stad.id);
                    onSelect(stad.id);
                  }}
                  aria-label={`Connect to ${stad.name}, ${stad.city}`}
                  className="w-full h-40 glass-panel p-5 cursor-pointer hover:bg-app-surface-hover transition-all border border-app-border hover:border-app-muted group relative overflow-hidden flex flex-col justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-app-primary mb-1 leading-tight">
                        {stad.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-app-muted text-xs font-semibold uppercase tracking-wider">
                        <MapPin size={12} aria-hidden="true" /> {stad.city}
                      </div>
                    </div>
                    <div className="flex items-center text-blue-500 font-semibold text-xs group-hover:text-blue-400">
                      Connect <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    </div>
                  </div>
                </button>
              </div>
            ))}

            {filteredStadiums.length === 0 && (
              <div
                role="status"
                className="col-span-full py-12 text-center text-app-muted glass-panel flex justify-center w-full border border-app-border"
              >
                No stadiums found matching your search.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
