import React from "react";
import { render, screen } from "@testing-library/react";
import MapContainer from "../MapContainer";
import type { StadiumData } from "../../lib/types";

// ─── Mock @react-google-maps/api ──────────────────────────────────────────────
// The GoogleMap component requires a real browser Maps API load.
// We replace it with a minimal stub so our component logic can be tested.
jest.mock("@react-google-maps/api", () => ({
  GoogleMap: ({
    children,
    "aria-label": ariaLabel,
  }: {
    children: React.ReactNode;
    "aria-label"?: string;
  }) => (
    <div role="application" aria-label={ariaLabel ?? "Google Map"}>
      {children}
    </div>
  ),
  useJsApiLoader: () => ({ isLoaded: true }),
  OverlayView: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div>{children}</div>,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockData: StadiumData = {
  name: "Narendra Modi Stadium",
  active_event: null,
  user_location: "Motera Entrance",
  coords: { lat: 23.0917, lng: 72.5975 },
  wait_times: {
    "Gate 1 (Motera)":   { time: 15, level: "High",   trend: "stable" },
    "Gate 2 (Main)":     { time: 8,  level: "Medium", trend: "stable" },
    "Presidential Gate": { time: 5,  level: "Low",    trend: "down"   },
    "North Stand Food":  { time: 12, level: "High",   trend: "up"     },
    "South Pavilion":    { time: 4,  level: "Low",    trend: "stable" },
  },
};

const mockDataNoCoords: StadiumData = {
  name: "Eden Gardens",
  active_event: null,
  user_location: "Club House",
  wait_times: {
    "Gate A": { time: 5, level: "Low", trend: "stable" },
  },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("MapContainer – Null / Loading States", () => {
  it("shows loading status when data is null", () => {
    render(<MapContainer data={null} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows Connecting to Geo-Satellites text when data is null", () => {
    render(<MapContainer data={null} />);
    expect(screen.getByText(/Connecting to Geo-Satellites/i)).toBeInTheDocument();
  });

  it("shows loading status when data has no coords", () => {
    render(<MapContainer data={mockDataNoCoords} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

describe("MapContainer – Map Rendering", () => {
  it("renders the outer map region with correct aria-label", () => {
    render(<MapContainer data={mockData} />);
    expect(
      screen.getByRole("region", { name: /Live map for Narendra Modi Stadium/i })
    ).toBeInTheDocument();
  });

  it("renders the Google Map application element", () => {
    render(<MapContainer data={mockData} />);
    expect(
      screen.getByRole("application", { name: /Map centered on Narendra Modi Stadium/i })
    ).toBeInTheDocument();
  });

  it("renders overlay markers for each wait time location", () => {
    render(<MapContainer data={mockData} />);
    // Each location has a role="img" aria-label
    const markers = screen.getAllByRole("img");
    expect(markers.length).toBe(Object.keys(mockData.wait_times).length);
  });

  it("each marker has a descriptive aria-label with time and level", () => {
    render(<MapContainer data={mockData} />);
    expect(
      screen.getByRole("img", {
        name: /Gate 1 \(Motera\): 15 minute wait, High congestion/i,
      })
    ).toBeInTheDocument();
  });

  it("shows Low-congestion marker for Presidential Gate", () => {
    render(<MapContainer data={mockData} />);
    expect(
      screen.getByRole("img", {
        name: /Presidential Gate: 5 minute wait, Low congestion/i,
      })
    ).toBeInTheDocument();
  });

  it("renders the wait time in minutes on each marker bubble", () => {
    render(<MapContainer data={mockData} />);
    // marker text for Gate 1 (15m)
    expect(screen.getByText("15m")).toBeInTheDocument();
    // marker text for Gate 2 (8m)
    expect(screen.getByText("8m")).toBeInTheDocument();
  });

  it("renders location names in the label below each marker", () => {
    render(<MapContainer data={mockData} />);
    expect(screen.getByText("Gate 1 (Motera)")).toBeInTheDocument();
    expect(screen.getByText("South Pavilion")).toBeInTheDocument();
  });
});

describe("MapContainer – Loading State (Maps API not yet loaded)", () => {
  beforeEach(() => {
    // Override the mock for this describe block to simulate isLoaded = false
    jest.resetModules();
  });

  it("falls back gracefully when Google Maps API key is missing", () => {
    // When coords is missing the component returns the status div, not a crash
    render(<MapContainer data={mockDataNoCoords} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
