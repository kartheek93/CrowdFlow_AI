import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Send, Bot, User, KeyRound } from "lucide-react";

export default function AIAssistant({ stadiumId }: { stadiumId: string }) {
  const [messages, setMessages] = useState<{role: "system"|"user", text: string}[]>([
    { role: "system", text: "Hello! I am CrowdFlow X, powered by Google Gemini. I am fully connected to your selected stadium engine. Ask me about wait times or the fastest routes!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/api/ask-ai", {
        stadium_id: stadiumId,
        query: userMessage
      });

      if (res.data.error) {
        setMessages(prev => [...prev, { role: "system", text: "Gemini API Error: " + res.data.error }]);
      } else {
        setMessages(prev => [...prev, { role: "system", text: res.data.response }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "system", text: "Reaching backend failed." }]);
    }
    
    setLoading(false);
  };

  return (
    <div className="glass-panel flex flex-col h-[calc(100vh-140px)] w-full max-w-4xl mx-auto text-app-primary">
      {/* Header configurations */}
      <div className="p-4 border-b border-app-border bg-app-surface/50 flex justify-between items-center rounded-t-xl">
         <div className="flex items-center gap-2">
            <Bot className="text-blue-500" />
            <h2 className="font-semibold text-lg">Live AI Agent</h2>
         </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, i) => (
           <div key={i} className={`flex gap-4 max-w-[80%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
              <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-emerald-500/20 text-emerald-500" : "bg-blue-500/20 text-blue-500"}`}>
                 {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`p-4 rounded-xl text-[15px] whitespace-pre-wrap leading-relaxed ${msg.role === "user" ? "bg-emerald-600 border border-emerald-500 text-white" : "bg-app-surface border border-app-border"}`}>
                 {msg.text}
              </div>
           </div>
        ))}
        {loading && (
           <div className="flex gap-4 max-w-[80%]">
             <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-500">
                <Bot size={20} />
             </div>
             <div className="p-4 rounded-xl bg-app-surface border border-app-border text-app-muted flex gap-2 items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-app-border bg-app-surface/50 rounded-b-xl">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <button onClick={() => setInput("Best exit?")} className="shrink-0 px-4 py-1.5 rounded-full bg-app-surface border border-app-border text-sm hover:bg-app-surface-hover">Best exit?</button>
            <button onClick={() => setInput("Where should I go for food?")} className="shrink-0 px-4 py-1.5 rounded-full bg-app-surface border border-app-border text-sm hover:bg-app-surface-hover">Where should I go for food?</button>
        </div>
        <div className="flex gap-3 relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask the stadium AI..." 
              className="flex-1 bg-app-bg border border-app-border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-app-primary"
            />
            <button 
              onClick={handleSend}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl transition-colors flex items-center justify-center"
            >
              <Send size={20} />
            </button>
        </div>
      </div>
    </div>
  );
}
