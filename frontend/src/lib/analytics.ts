/**
 * Google Analytics event tracking wrapper for CrowdFlow AI.
 * Provides strongly-typed helper functions for key user actions.
 * GA is initialized in layout.tsx via the gtag script.
 */

declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "js" | "set",
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

/** Safe gtag wrapper — no-ops if GA hasn't loaded yet (e.g. in tests). */
function gtag(
  command: "config" | "event" | "js" | "set",
  targetId: string,
  config?: Record<string, unknown>
): void {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(command, targetId, config);
  }
}

/** Fired when a user selects a stadium from the venue picker. */
export function trackStadiumSelect(stadiumId: string): void {
  gtag("event", "stadium_select", {
    event_category: "Navigation",
    event_label: stadiumId,
  });
}

/** Fired when a user submits a query to the AI assistant. */
export function trackAIQuery(stadiumId: string, queryLength: number): void {
  gtag("event", "ai_query", {
    event_category: "AI Assistant",
    event_label: stadiumId,
    value: queryLength,
  });
}

/** Fired when an organizer triggers a crowd management event. */
export function trackEventTrigger(eventName: string, stadiumId: string): void {
  gtag("event", "event_trigger", {
    event_category: "Organizer Control",
    event_label: eventName,
    stadium_id: stadiumId,
  });
}

/** Fired when a user opens a specific dashboard tab. */
export function trackTabChange(tabName: string): void {
  gtag("event", "tab_change", {
    event_category: "Navigation",
    event_label: tabName,
  });
}

/** Fired when auto-locate GPS feature is used. */
export function trackAutoLocate(): void {
  gtag("event", "auto_locate", {
    event_category: "Navigation",
    event_label: "GPS auto-detect",
  });
}

/** Fired when the Live Map tab is viewed (Google Maps integration tracking). */
export function trackMapView(stadiumId: string): void {
  gtag("event", "map_view", {
    event_category: "Google Maps",
    event_label: stadiumId,
  });
}

/** Fired when the user toggles between dark and light mode. */
export function trackThemeToggle(newMode: "dark" | "light"): void {
  gtag("event", "theme_toggle", {
    event_category: "UI Preference",
    event_label: newMode,
  });
}

/** Fired on initial page load / stadium entry to record a page view. */
export function trackPageView(pageName: string): void {
  gtag("event", "page_view", {
    event_category: "Navigation",
    event_label: pageName,
    page_title: pageName,
  });
}
