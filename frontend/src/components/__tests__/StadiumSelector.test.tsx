import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import StadiumSelector from "../StadiumSelector";
import axios from "axios";

// ─── Mocks ───────────────────────────────────────────────────────────────────
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../../lib/analytics", () => ({
  trackAutoLocate: jest.fn(),
  trackStadiumSelect: jest.fn(),
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
};
Object.defineProperty(global.navigator, "geolocation", {
  value: mockGeolocation,
  writable: true,
});

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("StadiumSelector", () => {
  const onSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Rendering ─────────────────────────────────────────────────────────────

  it("renders the page heading", () => {
    render(<StadiumSelector onSelect={onSelect} />);
    expect(screen.getByRole("heading", { name: /Select Active Venue/i })).toBeInTheDocument();
  });

  it("renders the CrowdFlowX logo label", () => {
    render(<StadiumSelector onSelect={onSelect} />);
    expect(screen.getByLabelText(/CrowdFlowX logo/i)).toBeInTheDocument();
  });

  it("renders the stadium grid with 22 stadiums initially", () => {
    render(<StadiumSelector onSelect={onSelect} />);
    // 22 stadium buttons should each have a connect aria-label
    const connectButtons = screen.getAllByRole("button", {
      name: /Connect to .+/i,
    });
    expect(connectButtons.length).toBe(22);
  });

  it("renders stadium list with accessible aria-label showing count", () => {
    render(<StadiumSelector onSelect={onSelect} />);
    expect(screen.getByRole("list", { name: /22 stadiums available/i })).toBeInTheDocument();
  });

  it("renders the auto-locate button", () => {
    render(<StadiumSelector onSelect={onSelect} />);
    expect(
      screen.getByRole("button", { name: /Auto-Detect Nearest Stadium/i })
    ).toBeInTheDocument();
  });

  it("renders a labeled search input", () => {
    render(<StadiumSelector onSelect={onSelect} />);
    expect(screen.getByLabelText(/Search stadiums by name or city/i)).toBeInTheDocument();
  });

  // ─── Search ────────────────────────────────────────────────────────────────

  it("filters stadiums by name (case-insensitive)", () => {
    render(<StadiumSelector onSelect={onSelect} />);
    const input = screen.getByLabelText(/Search stadiums by name or city/i);
    fireEvent.change(input, { target: { value: "Wankhede" } });
    const buttons = screen.getAllByRole("button", { name: /Connect to .+/i });
    expect(buttons.length).toBe(1);
    expect(screen.getByRole("button", { name: /Connect to Wankhede Stadium/i })).toBeInTheDocument();
  });

  it("filters stadiums by city", () => {
    render(<StadiumSelector onSelect={onSelect} />);
    const input = screen.getByLabelText(/Search stadiums by name or city/i);
    fireEvent.change(input, { target: { value: "Mumbai" } });
    // Wankhede, Brabourne, DY Patil are all in Maharashtra/Mumbai
    const buttons = screen.getAllByRole("button", { name: /Connect to .+/i });
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it("shows empty-state message when search yields no results", () => {
    render(<StadiumSelector onSelect={onSelect} />);
    const input = screen.getByLabelText(/Search stadiums by name or city/i);
    fireEvent.change(input, { target: { value: "ZZZ_NO_MATCH_XYZ" } });
    expect(screen.getByText(/No stadiums found matching your search/i)).toBeInTheDocument();
  });

  it("updates aria-label on grid to reflect filtered count", () => {
    render(<StadiumSelector onSelect={onSelect} />);
    const input = screen.getByLabelText(/Search stadiums by name or city/i);
    fireEvent.change(input, { target: { value: "Eden" } });
    expect(screen.getByRole("list", { name: /1 stadiums available/i })).toBeInTheDocument();
  });

  it("clearing search restores all 22 stadiums", () => {
    render(<StadiumSelector onSelect={onSelect} />);
    const input = screen.getByLabelText(/Search stadiums by name or city/i);
    fireEvent.change(input, { target: { value: "Wankhede" } });
    fireEvent.change(input, { target: { value: "" } });
    const buttons = screen.getAllByRole("button", { name: /Connect to .+/i });
    expect(buttons.length).toBe(22);
  });

  // ─── Stadium Selection ──────────────────────────────────────────────────────

  it("calls onSelect with correct id when a stadium card is clicked", () => {
    render(<StadiumSelector onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /Connect to Narendra Modi Stadium/i }));
    expect(onSelect).toHaveBeenCalledWith("narendra_modi");
  });

  it("calls onSelect with 'wankhede' when Wankhede is clicked", () => {
    render(<StadiumSelector onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /Connect to Wankhede Stadium/i }));
    expect(onSelect).toHaveBeenCalledWith("wankhede");
  });

  it("calls onSelect with 'eden_gardens' when Eden Gardens is clicked", () => {
    render(<StadiumSelector onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /Connect to Eden Gardens/i }));
    expect(onSelect).toHaveBeenCalledWith("eden_gardens");
  });

  // ─── Theme Toggle ───────────────────────────────────────────────────────────

  it("renders theme toggle button when onToggleTheme is provided", () => {
    const toggleFn = jest.fn();
    render(<StadiumSelector onSelect={onSelect} onToggleTheme={toggleFn} isDarkMode={true} />);
    expect(screen.getByRole("button", { name: /Switch to light mode/i })).toBeInTheDocument();
  });

  it("renders correct label when light mode is active", () => {
    const toggleFn = jest.fn();
    render(<StadiumSelector onSelect={onSelect} onToggleTheme={toggleFn} isDarkMode={false} />);
    expect(screen.getByRole("button", { name: /Switch to dark mode/i })).toBeInTheDocument();
  });

  it("calls onToggleTheme when theme button is clicked", () => {
    const toggleFn = jest.fn();
    render(<StadiumSelector onSelect={onSelect} onToggleTheme={toggleFn} isDarkMode={true} />);
    fireEvent.click(screen.getByRole("button", { name: /Switch to light mode/i }));
    expect(toggleFn).toHaveBeenCalledTimes(1);
  });

  it("does not render theme toggle button when onToggleTheme is not provided", () => {
    render(<StadiumSelector onSelect={onSelect} />);
    expect(screen.queryByLabelText(/Switch to/i)).not.toBeInTheDocument();
  });

  // ─── Auto-Locate ────────────────────────────────────────────────────────────

  it("auto-locate button is enabled initially", () => {
    render(<StadiumSelector onSelect={onSelect} />);
    const btn = screen.getByRole("button", { name: /Auto-Detect Nearest Stadium/i });
    expect(btn).not.toBeDisabled();
  });

  it("auto-locate calls navigator.geolocation.getCurrentPosition", async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({ coords: { latitude: 23.09, longitude: 72.59 } });
    });
    mockedAxios.post.mockResolvedValueOnce({
      data: { stadium_id: "narendra_modi", name: "Narendra Modi Stadium", distance_km: 1.2 },
    });

    // Suppress window.alert in jsdom
    window.alert = jest.fn();

    render(<StadiumSelector onSelect={onSelect} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Auto-Detect Nearest Stadium/i }));
    });

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith("narendra_modi"));
  });

  it("shows accessible skip link to stadium grid", () => {
    render(<StadiumSelector onSelect={onSelect} />);
    const skipLink = screen.getByText(/Skip to stadium list/i);
    expect(skipLink).toBeInTheDocument();
    expect(skipLink.getAttribute("href")).toBe("#stadium-grid");
  });

  // ─── Accessibility Landmarks ────────────────────────────────────────────────

  it("has a main landmark wrapping the selector", () => {
    render(<StadiumSelector onSelect={onSelect} />);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("each stadium card button has a descriptive aria-label", () => {
    render(<StadiumSelector onSelect={onSelect} />);
    const narendra = screen.getByRole("button", {
      name: /Connect to Narendra Modi Stadium, Ahmedabad/i,
    });
    expect(narendra).toBeInTheDocument();
  });
});
