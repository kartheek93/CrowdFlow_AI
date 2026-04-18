import React, { memo, useMemo } from "react";
import { ShieldAlert, Users, LocateFixed, Activity } from "lucide-react";
import type { StadiumData } from "../lib/types";

interface Props {
  data: StadiumData | null;
}

/** Memoized — only re-renders when stadium data changes (not on parent polling ticks). */
const OrganizerInsights = memo(function OrganizerInsights({ data }: Props) {
  if (!data)
    return (
      <div role="status" aria-live="polite" aria-label="Loading organizer data" className="animate-pulse p-6">
        Connecting to Admin Core...
      </div>
    );

  const waitTimes = data.wait_times;

  // Memoize derived hotspot/clear-zone lists so sorting doesn't run on every render
  const { allLocations, hotspots, clearZones } = useMemo(() => {
    const locs = Object.keys(waitTimes)
      .map((k) => ({ name: k, ...waitTimes[k] }))
      .sort((a, b) => b.time - a.time); // Sort by time descending to find worst hotspots

    return {
      allLocations: locs,
      hotspots: locs.filter((loc) => loc.level === "High"),
      clearZones: locs.filter((loc) => loc.level === "Low"),
    };
  }, [waitTimes]);

  return (
    <div className="space-y-6 text-app-primary" role="region" aria-label="Organizer Command Center">
      <div className="flex items-center gap-3 border-b border-app-border pb-4 mb-6">
        <ShieldAlert size={28} className="text-purple-500" aria-hidden="true" />
        <h2 className="text-2xl font-bold">Organizer Command Center</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hotspots Panel */}
        <section
          className="lg:col-span-2 glass-panel p-6 border-t-4 border-red-500"
          aria-labelledby="hotspots-heading"
          aria-live="polite"
          aria-atomic="false"
        >
          <h3
            id="hotspots-heading"
            className="text-lg font-bold flex items-center gap-2 text-red-500 mb-4"
          >
            <Activity size={20} aria-hidden="true" /> Severe Congestion Hotspots
          </h3>

          {hotspots.length === 0 ? (
            <div
              role="status"
              className="text-app-muted py-8 text-center bg-app-surface/50 rounded-lg"
            >
              All zones are operating within acceptable thresholds.
            </div>
          ) : (
            <ul className="space-y-4" aria-label="List of congested zones">
              {hotspots.map((h, i) => (
                <li
                  key={h.name}
                  className="bg-app-surface border border-red-500/30 p-4 rounded-xl flex items-start justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
                        aria-label={`Rank ${i + 1}`}
                      >
                        {i + 1}
                      </span>
                      <h4 className="font-bold text-lg">{h.name}</h4>
                    </div>
                    <p className="text-sm text-app-muted mt-2">
                      Currently at critically high capacity ({h.time}m wait time).{" "}
                      {h.trend === "up"
                        ? "Continuing to trend upward."
                        : "Stabilizing or trending down."}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-red-500 font-bold text-xl" aria-label={`${h.time} minute wait`}>
                      {h.time}m
                    </span>
                    <button
                      className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                      aria-label={`Dispatch staff to ${h.name}`}
                    >
                      Dispatch Staff
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* AI Admin Suggestions */}
        <section className="glass-panel p-6 border-purple-500/20" aria-labelledby="insights-heading">
          <h3
            id="insights-heading"
            className="text-lg font-bold text-purple-500 mb-4 flex items-center gap-2"
          >
            <LocateFixed size={20} aria-hidden="true" /> Structural Insights
          </h3>

          <div className="space-y-4">
            {hotspots.length > 0 && clearZones.length > 0 ? (
              <div className="bg-app-surface p-4 rounded-lg border-l-2 border-purple-500">
                <p className="text-sm">
                  <strong className="block text-app-primary mb-1">AI Recommendation:</strong>
                  Re-route traffic from{" "}
                  <span className="text-red-500">{hotspots[0].name}</span> over to{" "}
                  <span className="text-emerald-500">{clearZones[0].name}</span>. Staff should
                  deploy portable signage immediately.
                </p>
              </div>
            ) : (
              <div className="text-app-muted text-sm border border-app-border p-4 bg-app-surface/50 rounded-lg">
                No critical routing insights generated at this time.
              </div>
            )}

            {data.active_event && (
              <div className="bg-app-surface p-4 rounded-lg border-l-2 border-orange-500" role="alert" aria-live="assertive">
                <p className="text-sm">
                  <strong className="block text-app-primary mb-1">Event Protocol Active:</strong>
                  System is running overrides for the &quot;{data.active_event}&quot; condition. Ensure
                  emergency lanes are clear.
                </p>
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-app-border">
              <p className="text-xs text-app-muted uppercase tracking-wider mb-2 font-bold flex items-center gap-1">
                <Users size={12} aria-hidden="true" /> Global Occupancy Stats
              </p>
              <div
                className="w-full bg-app-surface shadow-inner rounded-full h-2 mb-1 overflow-hidden"
                role="progressbar"
                aria-valuenow={68}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Stadium fill rate: 68%"
              >
                <div
                  className="bg-purple-500 h-2 rounded-full shadow-lg"
                  style={{ width: "68%" }}
                />
              </div>
              <div className="flex justify-between text-xs text-app-muted">
                <span>Stadium Fill Rate</span>
                <span aria-hidden="true">68%</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
});

export default OrganizerInsights;
