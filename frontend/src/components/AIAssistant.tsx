import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import axios from "axios";
import { Send, Bot, User } from "lucide-react";
import type { ChatMessage, AIResponse } from "../lib/types";
import { trackAIQuery } from "../lib/analytics";

const MAX_MESSAGES = 100; // Cap to prevent unbounded memory growth
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** Memoized — re-renders only when stadiumId changes, not on parent polling ticks. */
const AIAssistant = memo(function AIAssistant({ stadiumId }: { stadiumId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "system",
      text: "Hello! I am CrowdFlow X, powered by Google Gemini. I am fully connected to your selected stadium engine. Ask me about wait times or the fastest routes!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(async () => {
    const userMessage = input.trim();
    if (!userMessage || isSendingRef.current) return;

    isSendingRef.current = true;
    trackAIQuery(stadiumId, userMessage.length);

    setMessages((prev) => {
      const updated = [...prev, { role: "user" as const, text: userMessage }];
      return updated.length > MAX_MESSAGES ? updated.slice(-MAX_MESSAGES) : updated;
    });
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post<AIResponse>(
        `${BASE_URL}/api/ask-ai`,
        { stadium_id: stadiumId, query: userMessage }
      );

      const text = res.data.error
        ? `Gemini API Error: ${res.data.error}`
        : res.data.response ?? "No response received.";

      setMessages((prev) => {
        const updated = [...prev, { role: "system" as const, text }];
        return updated.length > MAX_MESSAGES ? updated.slice(-MAX_MESSAGES) : updated;
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "system", text: "Reaching backend failed. Please ensure the server is running." },
      ]);
    } finally {
      setLoading(false);
      isSendingRef.current = false;
    }
  }, [input, stadiumId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleSuggestion = useCallback((text: string) => {
    setInput(text);
  }, []);

  return (
    <div
      className="glass-panel flex flex-col h-[calc(100vh-140px)] w-full max-w-4xl mx-auto text-app-primary"
      role="region"
      aria-label="AI Assistant chat interface"
    >
      <div className="p-4 border-b border-app-border bg-app-surface/50 flex justify-between items-center rounded-t-xl">
        <div className="flex items-center gap-2">
          <Bot className="text-blue-500" aria-hidden="true" />
          <h2 className="font-semibold text-lg" id="ai-chat-heading">
            Live AI Agent
          </h2>
        </div>
      </div>

      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Conversation messages"
        aria-labelledby="ai-chat-heading"
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-4 max-w-[80%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
          >
            <div
              className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
                msg.role === "user"
                  ? "bg-emerald-500/20 text-emerald-500"
                  : "bg-blue-500/20 text-blue-500"
              }`}
              aria-hidden="true"
            >
              {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div
              className={`p-4 rounded-xl text-[15px] whitespace-pre-wrap leading-relaxed ${
                msg.role === "user"
                  ? "bg-emerald-600 border border-emerald-500 text-white"
                  : "bg-app-surface border border-app-border"
              }`}
              aria-label={msg.role === "user" ? "You said" : "AI response"}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-4 max-w-[80%]">
            <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-500" aria-hidden="true">
              <Bot size={20} />
            </div>
            <div
              role="status"
              aria-label="AI is generating a response"
              className="p-4 rounded-xl bg-app-surface border border-app-border text-app-muted flex gap-2 items-center"
            >
              <span className="sr-only">AI is thinking…</span>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" aria-hidden="true" />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} aria-hidden="true" />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} aria-hidden="true" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      <div className="p-4 border-t border-app-border bg-app-surface/50 rounded-b-xl">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2" role="group" aria-label="Suggested questions">
          <button
            onClick={() => handleSuggestion("Best exit?")}
            className="shrink-0 px-4 py-1.5 rounded-full bg-app-surface border border-app-border text-sm hover:bg-app-surface-hover"
            aria-label="Suggest question: Best exit?"
          >
            Best exit?
          </button>
          <button
            onClick={() => handleSuggestion("Where should I go for food?")}
            className="shrink-0 px-4 py-1.5 rounded-full bg-app-surface border border-app-border text-sm hover:bg-app-surface-hover"
            aria-label="Suggest question: Where should I go for food?"
          >
            Where should I go for food?
          </button>
          <button
            onClick={() => handleSuggestion("Which areas should I avoid?")}
            className="shrink-0 px-4 py-1.5 rounded-full bg-app-surface border border-app-border text-sm hover:bg-app-surface-hover"
            aria-label="Suggest question: Which areas should I avoid?"
          >
            Which areas should I avoid?
          </button>
        </div>
        <div className="flex gap-3 relative">
          <label htmlFor="ai-chat-input" className="sr-only">
            Ask the stadium AI a question
          </label>
          <input
            id="ai-chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the stadium AI..."
            aria-label="Type your question"
            disabled={loading}
            className="flex-1 bg-app-bg border border-app-border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-app-primary disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            aria-disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default AIAssistant;
