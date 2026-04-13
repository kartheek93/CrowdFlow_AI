import React, { useState } from "react";
import { MapPin, LocateFixed, Activity, ChevronRight, Loader2, Search, Sun, Moon } from "lucide-react";
import axios from "axios";

export default function StadiumSelector({ onSelect, isDarkMode = true, onToggleTheme }: { onSelect: (id: string) => void, isDarkMode?: boolean, onToggleTheme?: () => void }) {
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const stadiums = [
    { id: "narendra_modi", name: "Narendra Modi Stadium", city: "Ahmedabad, Gujarat", img: "" },
    { id: "wankhede", name: "Wankhede Stadium", city: "Mumbai, Maharashtra", img: "" },
    { id: "eden_gardens", name: "Eden Gardens", city: "Kolkata, West Bengal", img: "" },
    { id: "chinnaswamy", name: "M. Chinnaswamy Stadium", city: "Bengaluru, Karnataka", img: "" },
    { id: "ma_chidambaram", name: "M. A. Chidambaram", city: "Chennai, Tamil Nadu", img: "" },
    { id: "rajiv_gandhi_hyd", name: "Rajiv Gandhi Stadium", city: "Hyderabad, Telangana", img: "" },
    { id: "arun_jaitley", name: "Arun Jaitley Stadium", city: "New Delhi, Delhi", img: "" },
    { id: "dharamshala", name: "HPCA Stadium", city: "Dharamshala, HP", img: "" },
    { id: "punjab_pca", name: "IS Bindra Stadium", city: "Mohali, Punjab", img: "" },
    { id: "sawai_mansingh", name: "Sawai Mansingh Stadium", city: "Jaipur, Rajasthan", img: "" },
    { id: "ekana", name: "Ekana Cricket Stadium", city: "Lucknow, UP", img: "" },
    { id: "green_park", name: "Green Park Stadium", city: "Kanpur, UP", img: "" },
    { id: "brabourne", name: "Brabourne Stadium", city: "Mumbai, Maharashtra", img: "" },
    { id: "barabati", name: "Barabati Stadium", city: "Cuttack, Odisha", img: "" },
    { id: "aca_vdca", name: "ACA-VDCA Stadium", city: "Visakhapatnam, AP", img: "" },
    { id: "dy_patil", name: "DY Patil Stadium", city: "Navi Mumbai, Maharashtra", img: "" },
    { id: "kalinga", name: "Kalinga Stadium", city: "Bhubaneswar, Odisha", img: "" },
    { id: "jln_delhi", name: "JLN Stadium Delhi", city: "New Delhi, Delhi", img: "" },
    { id: "jln_kochi", name: "JLN Stadium Kochi", city: "Kochi, Kerala", img: "" },
    { id: "salt_lake", name: "Salt Lake Stadium", city: "Kolkata, West Bengal", img: "" },
    { id: "bale_wadi", name: "Shree Shiv Chhatrapati", city: "Pune, Maharashtra", img: "" },
    { id: "fatorda", name: "Fatorda Stadium", city: "Margao, Goa", img: "" },
  ];

  const filteredStadiums = stadiums.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAutoLocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await axios.post("http://localhost:8000/api/find-nearest", {
          lat: latitude,
          lng: longitude
        });
        
        if (res.data && res.data.stadium_id) {
          alert(`GPS matched your location to nearest stadium:\n\n${res.data.name}\n(Distance: ${res.data.distance_km} km)`);
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
    }, (error) => {
      alert("Unable to retrieve your location. Please check browser permissions.");
      setIsLocating(false);
    });
  };

  return (
    <>
    <div className={`stadium-bg-motion ${!isDarkMode ? 'opacity-30' : ''}`}></div>
    <div className="min-h-screen bg-app-bg-translucent text-app-primary flex flex-col items-center p-6 lg:p-10 relative z-10 transition-colors duration-300">
      
      {/* Decorative branding and Controls */}
      <div className="flex items-center justify-between w-full max-w-6xl mb-8">
        <div className="flex items-center gap-3 text-xl font-bold">
          <Activity className="text-blue-500" />
          <span>CrowdFlow<span className="text-blue-500">X</span></span>
        </div>
        
        {onToggleTheme && (
          <button 
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl border border-app-border bg-app-surface/50 hover:bg-app-surface text-app-muted hover:text-app-primary backdrop-blur-md shadow-sm transition-all"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}
      </div>

      <div className="max-w-5xl w-full">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Select Active Venue</h1>
          <p className="text-app-muted text-lg">Connect to a live stadium data engine in India.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
          <button 
            onClick={handleAutoLocate}
            disabled={isLocating}
            className="w-full md:w-auto glass-panel hover:bg-app-surface-hover hover:border-blue-500/50 transition-all px-8 py-3 flex items-center justify-center gap-3 text-blue-500 font-bold rounded-xl cursor-pointer shadow-lg shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLocating ? <Loader2 className="animate-spin" size={20} /> : <LocateFixed size={20} />}
            {isLocating ? "Locating..." : "Auto-Detect Nearest Stadium"}
          </button>
          
          <div className="w-full md:w-80 relative">
             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted" />
             <input 
               type="text" 
               placeholder="Search stadiums or cities..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-app-surface/60 border border-app-border rounded-xl pl-11 pr-4 py-3 text-app-primary focus:outline-none focus:border-blue-500 transition-colors"
             />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-10">
          {filteredStadiums.map((stad) => (
            <div 
              key={stad.id}
              onClick={() => onSelect(stad.id)}
              className="glass-panel p-5 cursor-pointer hover:bg-app-surface-hover transition-all border border-app-border hover:border-app-muted group relative overflow-hidden flex flex-col justify-between h-40"
            >
              <div className="absolute -top-4 -right-4 p-6 opacity-5 text-7xl group-hover:scale-110 transition-transform text-black dark:text-inherit">
                {stad.img}
              </div>
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                 <div>
                   <h2 className="text-lg font-bold text-app-primary mb-1 leading-tight">{stad.name}</h2>
                   <div className="flex items-center gap-1.5 text-app-muted text-xs font-semibold uppercase tracking-wider">
                     <MapPin size={12} /> {stad.city}
                   </div>
                 </div>
                 
                 <div className="flex items-center text-blue-500 font-semibold text-xs group-hover:text-blue-400">
                    Connect <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform"/>
                 </div>
              </div>
            </div>
          ))}
          
          {filteredStadiums.length === 0 && (
             <div className="col-span-full py-12 text-center text-app-muted glass-panel flex justify-center w-full border border-app-border">
                No stadiums found matching your search.
             </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
