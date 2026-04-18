import React from "react";
import { render, screen, within } from "@testing-library/react";
import StadiumDashboard from "../StadiumDashboard";

const mockData = {
  name: "Narendra Modi Stadium",
  active_event: null,
  user_location: "Motera Entrance",
  wait_times: {
    "Gate 1 (Motera)":    { time: 15, level: "High"   as const, trend: "stable" as const },
    "Gate 2 (Main)":      { time: 8,  level: "Medium" as const, trend: "stable" as const },
    "Presidential Gate":  { time: 5,  level: "Low"    as const, trend: "down"   as const },
    "North Stand Food":   { time: 12, level: "High"   as const, trend: "up"     as const },
    "South Pavilion Cafe":{ time: 4,  level: "Low"    as const, trend: "stable" as const },
  },
};

// ─── Loading State ─────────────────────────────────────────────────────────

describe("StadiumDashboard – Loading State", () => {
  it("shows loading status when data is null", () => {
    render(<StadiumDashboard data={null} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows Connecting to AI Engine text when data is null", () => {
    render(<StadiumDashboard data={null} />);
    expect(screen.getByText(/Connecting to AI Engine/i)).toBeInTheDocument();
  });
});

// ─── AI Recommendations ───────────────────────────────────────────────────

describe("StadiumDashboard – AI Recommendations", () => {
  it("renders AI Recommendations heading", () => {
    render(<StadiumDashboard data={mockData} />);
    expect(screen.getByRole("heading", { name: /AI Recommendations/i })).toBeInTheDocument();
  });

  it("renders Fastest Exit Route card heading", () => {
    render(<StadiumDashboard data={mockData} />);
    expect(screen.getByRole("heading", { name: /Fastest Exit Route/i })).toBeInTheDocument();
  });

  it("renders Optimal Food Stall card heading", () => {
    render(<StadiumDashboard data={mockData} />);
    expect(screen.getByRole("heading", { name: /Optimal Food Stall/i })).toBeInTheDocument();
  });

  it("shows fastest exit gate (Presidential Gate, 5m)", () => {
    render(<StadiumDashboard data={mockData} />);
    expect(screen.getAllByText("Presidential Gate").length).toBeGreaterThan(0);
  });

  it("shows optimal food stall (South Pavilion Cafe, 4m)", () => {
    render(<StadiumDashboard data={mockData} />);
    expect(screen.getAllByText("South Pavilion Cafe").length).toBeGreaterThan(0);
  });

  it("recommendation card has accessible label with name and time", () => {
    render(<StadiumDashboard data={mockData} />);
    expect(
      screen.getByRole("article", { name: /Fastest exit: Presidential Gate, 5 minutes/i })
    ).toBeInTheDocument();
  });

  it("food recommendation card has accessible label", () => {
    render(<StadiumDashboard data={mockData} />);
    expect(
      screen.getByRole("article", { name: /Best food stall: South Pavilion Cafe, 4 minutes/i })
    ).toBeInTheDocument();
  });
});

// ─── Live Analytics Grid ──────────────────────────────────────────────────

describe("StadiumDashboard – Live Analytics Grid", () => {
  it("renders Live Analytics Grid heading", () => {
    render(<StadiumDashboard data={mockData} />);
    expect(screen.getByRole("heading", { name: /Live Analytics Grid/i })).toBeInTheDocument();
  });

  it("has accessible aria-live region for analytics updates", () => {
    render(<StadiumDashboard data={mockData} />);
    const liveRegion = screen.getByRole("region", { name: /Live Analytics Grid/i });
    expect(liveRegion).toBeInTheDocument();
  });

  it("renders AVOID badge on worst gate", () => {
    render(<StadiumDashboard data={mockData} />);
    const avoidBadges = screen.getAllByText("AVOID");
    expect(avoidBadges.length).toBeGreaterThan(0);
  });

  it("renders Exit Gates sub-section", () => {
    render(<StadiumDashboard data={mockData} />);
    expect(screen.getByRole("region", { name: /Exit gate wait times/i })).toBeInTheDocument();
  });

  it("renders Concessions sub-section", () => {
    render(<StadiumDashboard data={mockData} />);
    expect(screen.getByRole("region", { name: /Concession stand wait times/i })).toBeInTheDocument();
  });

  it("all gate items have accessible aria-labels", () => {
    render(<StadiumDashboard data={mockData} />);
    // Presidential Gate should have a descriptive aria-label in the list
    const gateItem = screen.getByRole("listitem", {
      name: /Presidential Gate.*minutes.*Low.*down/i,
    });
    expect(gateItem).toBeInTheDocument();
  });
});

// ─── Alerts ──────────────────────────────────────────────────────────────────

describe("StadiumDashboard – Alerts", () => {
  it("shows live alert when active_event is set", () => {
    const dataWithEvent = { ...mockData, active_event: "Halftime" };
    render(<StadiumDashboard data={dataWithEvent} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/LIVE ALERTS/i)).toBeInTheDocument();
    expect(screen.getByText(/Halftime/i)).toBeInTheDocument();
  });

  it("shows crowding warning inside alert section for High+up trend zone", () => {
    render(<StadiumDashboard data={mockData} />);
    // North Stand Food is High+up → alert section renders
    const alertSection = screen.getByRole("alert");
    expect(alertSection).toBeInTheDocument();
    // The warning text for North Stand Food is inside the alert section
    expect(within(alertSection).getByText(/North Stand Food/i)).toBeInTheDocument();
  });

  it("does not render alert section when no active events or high+up trends", () => {
    const quietData = {
      ...mockData,
      active_event: null,
      wait_times: {
        "Gate 1":  { time: 5, level: "Low" as const, trend: "down"   as const },
        "Gate 2":  { time: 3, level: "Low" as const, trend: "stable" as const },
        "Cafe A":  { time: 2, level: "Low" as const, trend: "stable" as const },
        "Cafe B":  { time: 1, level: "Low" as const, trend: "stable" as const },
      },
    };
    render(<StadiumDashboard data={quietData} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

// ─── Edge Cases ───────────────────────────────────────────────────────────────

describe("StadiumDashboard – Edge Cases", () => {
  it("handles all gates having equal wait times (still picks one as best)", () => {
    const equalData = {
      ...mockData,
      wait_times: {
        "Gate A": { time: 10, level: "Medium" as const, trend: "stable" as const },
        "Gate B": { time: 10, level: "Medium" as const, trend: "stable" as const },
        "Gate C": { time: 10, level: "Medium" as const, trend: "stable" as const },
        // ✅ "Main Cafe" matches the food regex (/food|cafe|lounge|snack/i)
        "Main Cafe": { time: 5, level: "Low" as const, trend: "stable" as const },
      },
    };
    render(<StadiumDashboard data={equalData} />);
    // Should render without crash and show recommendations
    expect(screen.getByRole("heading", { name: /Fastest Exit Route/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Optimal Food Stall/i })).toBeInTheDocument();
  });

  it("shows error state when no gate zones exist (all food)", () => {
    const noGatesData = {
      ...mockData,
      wait_times: {
        "Main Food Court": { time: 5, level: "Low" as const, trend: "stable" as const },
        "Snack Zone A":    { time: 3, level: "Low" as const, trend: "stable" as const },
      },
    };
    render(<StadiumDashboard data={noGatesData} />);
    // bestGate is null → error state renders with role="alert"
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Error mapping stadium zone labels/i)).toBeInTheDocument();
  });

  it("shows 0m in badges when wait time is zero", () => {
    const zeroData = {
      ...mockData,
      wait_times: {
        "Open Gate":   { time: 0, level: "Low" as const, trend: "down"   as const },
        "Another Gate":{ time: 5, level: "Low" as const, trend: "stable" as const },
        "Main Cafe":   { time: 0, level: "Low" as const, trend: "stable" as const },
      },
    };
    render(<StadiumDashboard data={zeroData} />);
    // Wait times of 0 should display as "0m"
    expect(screen.getAllByText("0m").length).toBeGreaterThan(0);
  });

  it("renders accessibility landmark for the whole dashboard", () => {
    render(<StadiumDashboard data={mockData} />);
    expect(screen.getByRole("main", { name: /Stadium Dashboard/i })).toBeInTheDocument();
  });
});
