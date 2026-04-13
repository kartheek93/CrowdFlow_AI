import React from "react";
import { ShieldAlert, Users, LocateFixed, Activity } from "lucide-react";

export default function OrganizerInsights({ data }: { data: any }) {
  if (!data) return <div className="animate-pulse">Connecting to Admin Core...</div>;

  const waitTimes = data.wait_times;
  const allLocations = Object.keys(waitTimes).map(k => ({name: k, ...waitTimes[k]}));
  
  // Sort by time descending to find worst hotspots
  allLocations.sort((a,b) => b.time - a.time);
  
  const hotspots = allLocations.filter(loc => loc.level === "High");
  const clearZones = allLocations.filter(loc => loc.level === "Low");

  return (
    <div className="space-y-6 text-app-primary">
      <div className="flex items-center gap-3 border-b border-app-border pb-4 mb-6">
        <ShieldAlert size={28} className="text-purple-500" />
        <h2 className="text-2xl font-bold">Organizer Command Center</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hotspots Panel */}
        <div className="lg:col-span-2 glass-panel p-6 border-t-4 border-red-500">
          <h3 className="text-lg font-bold flex items-center gap-2 text-red-500 mb-4">
             <Activity size={20} /> Severe Congestion Hotspots
          </h3>
          
          {hotspots.length === 0 ? (
            <div className="text-app-muted py-8 text-center bg-app-surface/50 rounded-lg">All zones are operating within acceptable thresholds.</div>
          ) : (
            <div className="space-y-4">
              {hotspots.map((h, i) => (
                <div key={h.name} className="bg-app-surface border border-red-500/30 p-4 rounded-xl flex items-start justify-between">
                   <div>
                     <div className="flex items-center gap-2">
                       <span className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">{i+1}</span>
                       <h4 className="font-bold text-lg">{h.name}</h4>
                     </div>
                     <p className="text-sm text-app-muted mt-2">Currently at critically high capacity ({h.time}m wait time). {h.trend === 'up' ? 'Continuing to trend upward.' : 'Stabilizing or trending down.'}</p>
                   </div>
                   
                   <div className="flex flex-col items-end gap-2">
                      <span className="text-red-500 font-bold text-xl">{h.time}m</span>
                      <button className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded">Dispatch Staff</button>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Admin Suggestions */}
        <div className="glass-panel p-6 border-purple-500/20">
           <h3 className="text-lg font-bold text-purple-500 mb-4 flex items-center gap-2">
              <LocateFixed size={20} /> Structural Insights
           </h3>

           <div className="space-y-4">
              {hotspots.length > 0 && clearZones.length > 0 ? (
                 <div className="bg-app-surface p-4 rounded-lg border-l-2 border-purple-500">
                    <p className="text-sm">
                      <strong className="block text-app-primary mb-1">AI Recommendation:</strong> 
                      Re-route traffic from <span className="text-red-500">{hotspots[0].name}</span> over to <span className="text-emerald-500">{clearZones[0].name}</span>. Staff should deploy portable signage immediately.
                    </p>
                 </div>
              ) : (
                 <div className="text-app-muted text-sm border border-app-border p-4 bg-app-surface/50 rounded-lg">No critical routing insights generated at this time.</div>
              )}

              {data.active_event && (
                 <div className="bg-app-surface p-4 rounded-lg border-l-2 border-orange-500">
                    <p className="text-sm">
                      <strong className="block text-app-primary mb-1">Event Protocol Active:</strong> 
                      System is running overrides for the "{data.active_event}" condition. Ensure emergency lanes are clear.
                    </p>
                 </div>
              )}
              
              <div className="mt-8 pt-4 border-t border-app-border">
                <p className="text-xs text-app-muted uppercase tracking-wider mb-2 font-bold flex items-center gap-1"><Users size={12}/> Global Occupancy Stats</p>
                <div className="w-full bg-app-surface shadow-inner rounded-full h-2 mb-1 overflow-hidden">
                  <div className="bg-purple-500 h-2 rounded-full shadow-lg" style={{ width: '68%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-app-muted">
                   <span>Stadium Fill Rate</span>
                   <span>68%</span>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
