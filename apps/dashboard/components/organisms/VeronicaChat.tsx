"use client";

import React, { useEffect, useRef, useState } from "react";
import { useApi } from "../../hooks/useApi";

interface Msg { role: "user" | "veronica"; text: string; ts: Date; }

export const VeronicaChat: React.FC = () => {
  const { sendVoiceQuery, getSessions } = useApi() as any;
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "veronica", text: "Hi! I'm Veronica, your AI aquarium advisor. Ask me anything about your tank — pH, fish health, feeding schedules, or water quality.", ts: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load recent sessions on mount
  useEffect(() => {
    if (!getSessions) return;
    getSessions?.()
      ?.then?.((r: any) => {
        if (Array.isArray(r?.data) && r.data.length > 0) {
          const recent = r.data.slice(0, 3).reverse();
          const history: Msg[] = [];
          recent.forEach((s: any) => {
            history.push({ role: "user",     text: s.transcribedText, ts: new Date(s.createdAt) });
            history.push({ role: "veronica", text: s.aiResponse,      ts: new Date(s.createdAt) });
          });
          setMsgs((p) => [...p, ...history]);
        }
      })
      ?.catch?.(() => null);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMsgs((p) => [...p, { role: "user", text, ts: new Date() }]);
    setLoading(true);
    try {
      const r = await sendVoiceQuery(text);
      const reply = r?.data?.response ?? r?.data ?? "I couldn't process that right now.";
      setMsgs((p) => [...p, { role: "veronica", text: String(reply), ts: new Date() }]);
    } catch {
      setMsgs((p) => [...p, { role: "veronica", text: "Connection error. Please check if Ollama is running.", ts: new Date() }]);
    }
    setLoading(false);
  };

  return (
    <section className="bg-slate-900/80 border border-white/[0.07] rounded-2xl flex flex-col overflow-hidden" style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.3)", height: 420 }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] shrink-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg">
          🧠
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-100">Ask Veronica</h2>
          <p className="text-[10px] text-slate-500">Powered by Ollama · qwen2.5:3b</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] text-cyan-400 font-semibold">AI Online</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "veronica" && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs mr-2 mt-1 shrink-0">
                🧠
              </div>
            )}
            <div
              className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-blue-600/80 text-white rounded-tr-sm"
                  : "bg-white/[0.06] text-slate-300 rounded-tl-sm border border-white/[0.07]"
              }`}
            >
              {m.text}
              <p className="text-[9px] opacity-40 mt-1 text-right tabular-nums">
                {m.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs mr-2 mt-1 shrink-0">🧠</div>
            <div className="bg-white/[0.06] border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 shrink-0 border-t border-white/[0.05]">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.08] transition-all"
            placeholder="Ask about pH, temperature, fish health…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold px-4 rounded-xl text-sm transition-colors shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
};
