import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import AIAssistant from "../AIAssistant";
import axios from "axios";

// ─── Mocks ────────────────────────────────────────────────────────────────────
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../../lib/analytics", () => ({
  trackAIQuery: jest.fn(),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("AIAssistant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders initial greeting from system", () => {
    render(<AIAssistant stadiumId="narendra_modi" />);
    expect(screen.getByText(/Hello! I am CrowdFlow X/i)).toBeInTheDocument();
  });

  it("renders the chat heading", () => {
    render(<AIAssistant stadiumId="narendra_modi" />);
    expect(screen.getByRole("heading", { name: /Live AI Agent/i })).toBeInTheDocument();
  });

  it("has a labeled message input", () => {
    render(<AIAssistant stadiumId="narendra_modi" />);
    expect(screen.getByLabelText(/ask the stadium AI/i)).toBeInTheDocument();
  });

  it("has a labeled send button", () => {
    render(<AIAssistant stadiumId="narendra_modi" />);
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
  });

  it("send button is disabled when input is empty", () => {
    render(<AIAssistant stadiumId="narendra_modi" />);
    expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled();
  });

  it("send button becomes enabled when user types", () => {
    render(<AIAssistant stadiumId="narendra_modi" />);
    const input = screen.getByLabelText(/ask the stadium AI/i);
    fireEvent.change(input, { target: { value: "Which gate?" } });
    expect(screen.getByRole("button", { name: /send message/i })).not.toBeDisabled();
  });

  it("adds user message and AI response on send", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { response: "Use Gate 2 – fastest right now." },
    });

    render(<AIAssistant stadiumId="narendra_modi" />);
    const input = screen.getByLabelText(/ask the stadium AI/i);

    await act(async () => {
      fireEvent.change(input, { target: { value: "Best exit?" } });
      fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    });

    await waitFor(() =>
      expect(screen.getByText(/Use Gate 2/i)).toBeInTheDocument()
    );
    expect(screen.getAllByText("Best exit?").length).toBeGreaterThanOrEqual(1);
  });

  it("shows error message when API call fails", async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error("Network error"));

    render(<AIAssistant stadiumId="narendra_modi" />);
    const input = screen.getByLabelText(/ask the stadium AI/i);

    await act(async () => {
      fireEvent.change(input, { target: { value: "Where is the food?" } });
      fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    });

    await waitFor(() =>
      expect(screen.getByText(/Reaching backend failed/i)).toBeInTheDocument()
    );
  });

  it("submits message on Enter key", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { response: "South Pavilion Cafe has the shortest queue." },
    });

    render(<AIAssistant stadiumId="narendra_modi" />);
    const input = screen.getByLabelText(/ask the stadium AI/i);

    await act(async () => {
      fireEvent.change(input, { target: { value: "Best food stall?" } });
      fireEvent.keyDown(input, { key: "Enter" });
    });

    await waitFor(() =>
      expect(screen.getByText("Best food stall?")).toBeInTheDocument()
    );
  });

  it("clears input after send", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { response: "Take Gate 2." } });

    render(<AIAssistant stadiumId="narendra_modi" />);
    const input = screen.getByLabelText(/ask the stadium AI/i) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { value: "Gate?" } });
      fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    });

    await waitFor(() => expect(input.value).toBe(""));
  });

  it("renders message log with accessible role=log", () => {
    render(<AIAssistant stadiumId="narendra_modi" />);
    expect(screen.getByRole("log")).toBeInTheDocument();
  });

  it("renders suggestion quick-reply buttons", () => {
    render(<AIAssistant stadiumId="narendra_modi" />);
    expect(screen.getByRole("button", { name: /Suggest question: Best exit\?/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Suggest question: Where should I go for food\?/i })
    ).toBeInTheDocument();
  });

  it("suggestion button populates input field", () => {
    render(<AIAssistant stadiumId="narendra_modi" />);
    fireEvent.click(screen.getByRole("button", { name: /Suggest question: Best exit\?/i }));
    const input = screen.getByLabelText(/ask the stadium AI/i) as HTMLInputElement;
    expect(input.value).toBe("Best exit?");
  });

  it("handles Gemini API error response gracefully", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { error: "Gemini quota exceeded" },
    });

    render(<AIAssistant stadiumId="narendra_modi" />);
    const input = screen.getByLabelText(/ask the stadium AI/i);

    await act(async () => {
      fireEvent.change(input, { target: { value: "help" } });
      fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    });

    await waitFor(() =>
      expect(screen.getByText(/Gemini API Error/i)).toBeInTheDocument()
    );
  });
});
