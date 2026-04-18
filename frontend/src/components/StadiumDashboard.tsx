import React, { useMemo, memo } from "react";
import {
  Users,
  DoorOpen,
  Coffee,
  TriangleAlert,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import type { StadiumData } from "../lib/types";

interface Props {
  data: StadiumData | null;
  isDarkMode?: boolean;
}

const isFoodStr = (k: string) => /food|cafe|lounge|snack/i.test(k);

const getStatusColor = (level: string) => {
  if (level === "High")
    return "bg-red-500/20 text-red-500 border-red-500/50";
  if (level === "Medium")
    return "bg-orange-500/20 text-orange-500 border-orange-500/50";
  return "bg-emerald-500/20 text-emerald-500 border-emerald-500/50";
};

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up")
    return (
      <TrendingUp
        size={16}
        className="text-red-500"
        aria-label="Increasing trend"
        role="img"
      />
    );
  if (trend === "down")
    return (
      <TrendingDown
        size={16}
        className="text-emerald-500"
        aria-label="Decreasing trend"
        role="img"
      />
    );
  return (
    <Minus
      size={16}
      className="text-app-muted"
      aria-label="Stable trend"
      role="img"
    />
  );
}

/** Memoized — only re-renders when data or isDarkMode changes. */
const StadiumDashboard = memo(function StadiumDashboard({ data, isDarkMode }: Props) {
  if (!data)
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading stadium data"
        className="animate-pulse"
      >
        Connecting to AI Engine...
      </div>
    );

  const waitTimes = data.wait_times;

  // Efficiency: memoize derived data so it doesn't re-sort on every render tick
  const { gates, food } = useMemo(() => {
    const gatesList = Object.keys(waitTimes)
      .filter((k) => !isFoodStr(k))
      .map((k) => ({ name: k, ...waitTimes[k] }))
      .sort((a, b) => a.time - b.time);

    const foodList = Object.keys(waitTimes)
      .filter((k) => isFoodStr(k))
      .map((k) => ({ name: k, ...waitTimes[k] }))
      .sort((a, b) => a.time - b.time);

    return { gates: gatesList, food: foodList };
  }, [waitTimes]);

  const bestGate = gates[0] ?? null;
  const worstGate = gates[gates.length - 1] ?? null;
  const bestFood = food[0] ?? null;
  const worstFood = food[food.length - 1] ?? null;

  // Memoize alert list derivation
  const alerts = useMemo(
    () =>
      Object.entries(waitTimes).filter(
        ([, v]) => v.level === "High" && v.trend === "up"
      ),
    [waitTimes]
  );

  const hasAlerts = data.active_event || alerts.length > 0;

  if (!bestGate || !bestFood)
    return (
      <div role="alert" className="p-6 text-app-primary">
        Error mapping stadium zone labels.
      </div>
    );

  return (
    <main className="space-y-6 text-app-primary" aria-label="Stadium Dashboard">
      {/* Dynamic Alerts Pane */}
      {hasAlerts && (
        <section
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          aria-label="Live stadium alerts"
          className="glass-panel p-5 bg-red-500/10 border-red-500/30"
        >
          <div className="flex items-center gap-2 text-red-500 font-bold mb-3">
            <TriangleAlert size={20} aria-hidden="true" />
            <h2 id="alerts-heading">LIVE ALERTS</h2>
          </div>
          <ul
            className="list-disc list-inside space-y-1 text-sm text-red-400"
            aria-labelledby="alerts-heading"
          >
            {data.active_event && (
              <li>
                Active Stadium Event:{" "}
                <strong>{data.active_event}</strong>
              </li>
            )}
            {gates.map(
              (g) =>
                g.level === "High" &&
                g.trend === "up" && (
                  <li key={g.name}>
                    WARNING: {g.name} is highly congested and getting worse!
                    Seek alternatives.
                  </li>
                )
            )}
            {food.map(
              (f) =>
                f.level === "High" &&
                f.trend === "up" && (
                  <li key={f.name}>
                    WARNING: {f.name} wait lines are rapidly expanding ({f.time}
                    m).
                  </li>
                )
            )}
          </ul>
        </section>
      )}

      {/* AI Recommendations */}
      <section aria-labelledby="recommendations-heading">
        <h2
          id="recommendations-heading"
          className="text-xl font-bold border-b border-app-border pb-2"
        >
          AI Recommendations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Gate Recommendation */}
          <article
            aria-label={`Fastest exit: ${bestGate.name}, ${bestGate.time} minutes`}
            className="glass-panel p-6 flex flex-col justify-between border-l-4 border-emerald-500"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 text-emerald-500">
                <DoorOpen size={24} aria-hidden="true" />
                <h3 className="font-bold text-lg">Fastest Exit Route</h3>
              </div>
              <span
                className="px-2 py-1 bg-emerald-500/20 text-emerald-500 text-xs font-bold rounded"
                aria-label="Best Option badge"
              >
                Best Option
              </span>
            </div>
            <p className="text-2xl font-bold bg-app-surface p-3 rounded-lg flex items-center justify-between">
              {bestGate.name}
              <span className="text-emerald-500" aria-label={`${bestGate.time} minutes wait`}>
                {bestGate.time} min
              </span>
            </p>
            <div className="mt-4 p-3 bg-app-surface-hover rounded-lg text-sm text-app-muted">
              <span className="font-bold text-app-primary">AI Reason: </span>
              {bestGate.name} is highly recommended because it is significantly
              faster than {worstGate.name} ({worstGate.time}m).
            </div>
          </article>

          {/* Food Recommendation */}
          <article
            aria-label={`Best food stall: ${bestFood.name}, ${bestFood.time} minutes`}
            className="glass-panel p-6 flex flex-col justify-between border-l-4 border-blue-500"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 text-blue-500">
                <Coffee size={24} aria-hidden="true" />
                <h3 className="font-bold text-lg">Optimal Food Stall</h3>
              </div>
              <span
                className="px-2 py-1 bg-emerald-500/20 text-emerald-500 text-xs font-bold rounded"
                aria-label="Best Option badge"
              >
                Best Option
              </span>
            </div>
            <p className="text-2xl font-bold bg-app-surface p-3 rounded-lg flex items-center justify-between">
              {bestFood.name}
              <span className="text-emerald-500" aria-label={`${bestFood.time} minutes wait`}>
                {bestFood.time} min
              </span>
            </p>
            <div className="mt-4 p-3 bg-app-surface-hover rounded-lg text-sm text-app-muted">
              <span className="font-bold text-app-primary">AI Reason: </span>
              Choose {bestFood.name} over {worstFood.name} to save{" "}
              {worstFood.time - bestFood.time} minutes of waiting.
            </div>
          </article>
        </div>
      </section>

      {/* Live Analytics Grid */}
      <section
        aria-labelledby="analytics-heading"
        aria-live="polite"
        aria-atomic="false"
        className="glass-panel p-6"
      >
        <h2 id="analytics-heading" className="text-lg font-bold mb-4">
          Live Analytics Grid
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Exit Gates */}
          <div role="region" aria-label="Exit gate wait times">
            <h3 className="text-sm font-semibold text-app-muted mb-3 uppercase tracking-wide">
              Exit Gates
            </h3>
            <ul className="space-y-3" aria-label="Gate wait time list">
              {gates.map((g) => (
                <li
                  key={g.name}
                  className="flex justify-between items-center bg-app-surface/50 p-3 rounded-lg"
                  aria-label={`${g.name}: ${g.time} minutes, ${g.level} congestion, trend ${g.trend}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-app-primary">{g.name}</span>
                    <TrendIcon trend={g.trend} />
                  </div>
                  <div className="flex items-center gap-3">
                    {g.name === worstGate.name && (
                      <span
                        className="text-xs font-bold text-red-500 px-2 py-0.5 bg-red-500/10 rounded"
                        aria-label="Avoid this gate"
                      >
                        AVOID
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(g.level)}`}
                    >
                      {g.time}m
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Concessions */}
          <div role="region" aria-label="Concession stand wait times">
            <h3 className="text-sm font-semibold text-app-muted mb-3 uppercase tracking-wide">
              Concessions
            </h3>
            <ul className="space-y-3" aria-label="Food stall wait time list">
              {food.map((f) => (
                <li
                  key={f.name}
                  className="flex justify-between items-center bg-app-surface/50 p-3 rounded-lg"
                  aria-label={`${f.name}: ${f.time} minutes, ${f.level} congestion, trend ${f.trend}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-app-primary">{f.name}</span>
                    <TrendIcon trend={f.trend} />
                  </div>
                  <div className="flex items-center gap-3">
                    {f.name === worstFood.name && (
                      <span
                        className="text-xs font-bold text-red-500 px-2 py-0.5 bg-red-500/10 rounded"
                        aria-label="Avoid this stall"
                      >
                        AVOID
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(f.level)}`}
                    >
                      {f.time}m
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
});

export default StadiumDashboard;
