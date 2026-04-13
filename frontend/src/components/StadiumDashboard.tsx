import React from "react";
import { Users, DoorOpen, Coffee, TriangleAlert, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StadiumDashboard({ data, isDarkMode }: { data: any, isDarkMode?: boolean }) {
  if (!data) return <div className="animate-pulse">Connecting to AI Engine...</div>;

  const waitTimes = data.wait_times;
  const isFoodStr = (k: string) => /food|cafe|lounge|snack/i.test(k);
  const gates = Object.keys(waitTimes).filter(k => !isFoodStr(k)).map(k => ({name: k, ...waitTimes[k]}));
  const food = Object.keys(waitTimes).filter(k => isFoodStr(k)).map(k => ({name: k, ...waitTimes[k]}));

  gates.sort((a,b) => a.time - b.time);
  food.sort((a,b) => a.time - b.time);

  const bestGate = gates.length > 0 ? gates[0] : null;
  const worstGate = gates.length > 0 ? gates[gates.length - 1] : null;
  const bestFood = food.length > 0 ? food[0] : null;
  const worstFood = food.length > 0 ? food[food.length - 1] : null;

  if (!bestGate || !bestFood) return <div className="p-6 text-app-primary">Error mapping stadium zone labels.</div>;

  const getStatusColor = (level: string) => {
    if (level === "High") return "bg-red-500/20 text-red-500 border-red-500/50";
    if (level === "Medium") return "bg-orange-500/20 text-orange-500 border-orange-500/50";
    return "bg-emerald-500/20 text-emerald-500 border-emerald-500/50";
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <TrendingUp size={16} className="text-red-500" />;
    if (trend === 'down') return <TrendingDown size={16} className="text-emerald-500" />;
    return <Minus size={16} className="text-app-muted" />;
  };

  const alerts = Object.values(waitTimes).filter((v: any) => v.level === "High" && v.trend === "up");

  return (
    <div className="space-y-6 text-app-primary">
      {/* Dynamic Alerts Pane */}
      {(data.active_event || alerts.length > 0) && (
        <div className="glass-panel p-5 bg-red-500/10 border-red-500/30">
          <div className="flex items-center gap-2 text-red-500 font-bold mb-3">
             <TriangleAlert size={20} /> LIVE ALERTS
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-400">
             {data.active_event && <li>Active Stadium Event: <span className="font-bold">{data.active_event}</span></li>}
             {gates.map(g => g.level === "High" && g.trend === "up" && (
                <li key={g.name}>WARNING: {g.name} is highly congested and getting worse! Seek alternatives.</li>
             ))}
             {food.map(f => f.level === "High" && f.trend === "up" && (
                <li key={f.name}>WARNING: {f.name} wait lines are rapidly expanding ({f.time}m).</li>
             ))}
          </ul>
        </div>
      )}

      {/* Intelligent AI Recommendation Cards */}
      <h2 className="text-xl font-bold border-b border-app-border pb-2">AI Recommendations</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gate Recommendation */}
        <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-emerald-500">
          <div className="flex items-start justify-between mb-4">
             <div className="flex items-center gap-3 text-emerald-500">
               <DoorOpen size={24} />
               <h3 className="font-bold text-lg">Fastest Exit Route</h3>
             </div>
             <span className="px-2 py-1 bg-emerald-500/20 text-emerald-500 text-xs font-bold rounded">Best Option</span>
          </div>
          <p className="text-2xl font-bold bg-app-surface p-3 rounded-lg flex items-center justify-between">
            {bestGate.name} 
            <span className="text-emerald-500">{bestGate.time} min</span>
          </p>
          <div className="mt-4 p-3 bg-app-surface-hover rounded-lg text-sm text-app-muted">
             <span className="font-bold text-app-primary">AI Reason:</span> {bestGate.name} is highly recommended because it is significantly faster than {worstGate.name} ({worstGate.time}m).
          </div>
        </div>

        {/* Food Recommendation */}
        <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-emerald-500">
          <div className="flex items-start justify-between mb-4">
             <div className="flex items-center gap-3 text-blue-500">
               <Coffee size={24} />
               <h3 className="font-bold text-lg">Optimal Food Stall</h3>
             </div>
             <span className="px-2 py-1 bg-emerald-500/20 text-emerald-500 text-xs font-bold rounded">Best Option</span>
          </div>
          <p className="text-2xl font-bold bg-app-surface p-3 rounded-lg flex items-center justify-between">
            {bestFood.name} 
            <span className="text-emerald-500">{bestFood.time} min</span>
          </p>
          <div className="mt-4 p-3 bg-app-surface-hover rounded-lg text-sm text-app-muted">
             <span className="font-bold text-app-primary">AI Reason:</span> Choose {bestFood.name} over {worstFood.name} to save {worstFood.time - bestFood.time} minutes of waiting.
          </div>
        </div>
      </div>

      {/* Real-time Data Tracker */}
      <div className="glass-panel p-6">
        <h2 className="text-lg font-bold mb-4">Live Analytics Grid</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-app-muted mb-3 uppercase tracking-wide">Exit Gates</h3>
            <div className="space-y-3">
              {gates.map((g) => (
                <div key={g.name} className="flex justify-between items-center bg-app-surface/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-app-primary">{g.name}</span>
                    <TrendIcon trend={g.trend} />
                  </div>
                  <div className="flex items-center gap-3">
                     {g.name === worstGate.name && <span className="text-xs font-bold text-red-500 px-2 py-0.5 bg-red-500/10 rounded">AVOID</span>}
                     <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(g.level)}`}>
                       {g.time}m
                     </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-app-muted mb-3 uppercase tracking-wide">Concessions</h3>
            <div className="space-y-3">
              {food.map((f) => (
                <div key={f.name} className="flex justify-between items-center bg-app-surface/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-app-primary">{f.name}</span>
                    <TrendIcon trend={f.trend} />
                  </div>
                  <div className="flex items-center gap-3">
                     {f.name === worstFood.name && <span className="text-xs font-bold text-red-500 px-2 py-0.5 bg-red-500/10 rounded">AVOID</span>}
                     <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(f.level)}`}>
                       {f.time}m
                     </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
