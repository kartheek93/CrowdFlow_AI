import React from "react";
import { render, screen } from "@testing-library/react";
import OrganizerInsights from "../OrganizerInsights";
import type { StadiumData } from "../../lib/types";

// Hotspots sorted by time DESC: North Stand Food (22m) > Gate 1 Motera (20m)
const mockDataWithHotspots: StadiumData = {
  name: "Narendra Modi Stadium",
  active_event: null,
  user_location: "Motera Entrance",
  coords: { lat: 23.0917, lng: 72.5975 },
  wait_times: {
    "Gate 1 (Motera)":     { time: 20, level: "High",   trend: "up"     },
    "Gate 2 (Main)":       { time: 8,  level: "Medium", trend: "stable" },
    "Presidential Gate":   { time: 2,  level: "Low",    trend: "down"   },
    "North Stand Food":    { time: 22, level: "High",   trend: "stable" },
    "South Pavilion Cafe": { time: 3,  level: "Low",    trend: "stable" },
  },
};

const mockDataAllClear: StadiumData = {
  name: "Eden Gardens",
  active_event: null,
  user_location: "Club House",
  wait_times: {
    "Gate A":    { time: 2, level: "Low", trend: "stable" },
    "Gate B":    { time: 3, level: "Low", trend: "stable" },
    "Food Stall":{ time: 1, level: "Low", trend: "stable" },
  },
};

const mockDataWithEvent: StadiumData = {
  ...mockDataWithHotspots,
  active_event: "Halftime",
};

describe("OrganizerInsights", () => {
  it("shows loading state when data is null", () => {
    render(<OrganizerInsights data={null} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Connecting to Admin Core/i)).toBeInTheDocument();
  });

  it("renders the Command Center heading", () => {
    render(<OrganizerInsights data={mockDataWithHotspots} />);
    expect(
      screen.getByRole("heading", { name: /Organizer Command Center/i })
    ).toBeInTheDocument();
  });

  it("renders Severe Congestion Hotspots heading", () => {
    render(<OrganizerInsights data={mockDataWithHotspots} />);
    expect(
      screen.getByRole("heading", { name: /Severe Congestion Hotspots/i })
    ).toBeInTheDocument();
  });

  it("shows hotspot zone names when high-density zones exist", () => {
    render(<OrganizerInsights data={mockDataWithHotspots} />);
    expect(screen.getByText("Gate 1 (Motera)")).toBeInTheDocument();
    // North Stand Food appears in both Hotspots and AI Recommendation
    expect(screen.getAllByText("North Stand Food").length).toBeGreaterThanOrEqual(1);
  });

  it("shows all-clear message when no hotspots", () => {
    render(<OrganizerInsights data={mockDataAllClear} />);
    expect(
      screen.getByText(/All zones are operating within acceptable thresholds/i)
    ).toBeInTheDocument();
  });

  it("renders one Dispatch Staff button per hotspot", () => {
    render(<OrganizerInsights data={mockDataWithHotspots} />);
    const dispatchBtns = screen.getAllByRole("button", { name: /Dispatch staff to/i });
    // Gate 1 (Motera) and North Stand Food are both "High"
    expect(dispatchBtns.length).toBe(2);
  });

  it("Dispatch Staff buttons have accessible labels that include the zone name", () => {
    render(<OrganizerInsights data={mockDataWithHotspots} />);
    // Sorted by time DESC: North Stand Food (22m) is rank 1
    expect(
      screen.getByRole("button", { name: /Dispatch staff to North Stand Food/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Dispatch staff to Gate 1 \(Motera\)/i })
    ).toBeInTheDocument();
  });

  it("shows AI routing recommendation when both hotspots and clear zones present", () => {
    render(<OrganizerInsights data={mockDataWithHotspots} />);
    expect(screen.getByText(/AI Recommendation/i)).toBeInTheDocument();
    expect(screen.getByText(/Re-route traffic/i)).toBeInTheDocument();
  });

  it("shows event protocol alert when active_event is set", () => {
    render(<OrganizerInsights data={mockDataWithEvent} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Event Protocol Active/i)).toBeInTheDocument();
    expect(screen.getByText(/Halftime/i)).toBeInTheDocument();
  });

  it("does not render event alert when no active event", () => {
    render(<OrganizerInsights data={mockDataWithHotspots} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders fill rate progress bar with correct aria attributes", () => {
    render(<OrganizerInsights data={mockDataWithHotspots} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute("aria-valuenow", "68");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("hotspot list is sorted by wait time descending (highest first)", () => {
    render(<OrganizerInsights data={mockDataWithHotspots} />);
    const hotspotList = screen.getByRole("list", { name: /List of congested zones/i });
    const items = hotspotList.querySelectorAll("li");
    // North Stand Food (22m) comes before Gate 1 (Motera) (20m)
    expect(items[0].textContent).toContain("North Stand Food");
    expect(items[1].textContent).toContain("Gate 1 (Motera)");
  });

  it("the outer region landmark is accessible", () => {
    render(<OrganizerInsights data={mockDataWithHotspots} />);
    expect(
      screen.getByRole("region", { name: /Organizer Command Center/i })
    ).toBeInTheDocument();
  });

  it("hotspot section has aria-live polite region", () => {
    render(<OrganizerInsights data={mockDataWithHotspots} />);
    const hotspotSection = screen.getByRole("region", {
      name: /Severe Congestion Hotspots/i,
    });
    expect(hotspotSection).toHaveAttribute("aria-live", "polite");
  });
});
