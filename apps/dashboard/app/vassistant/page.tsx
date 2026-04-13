"use client";

import { useEffect, useRef } from "react";
import { Bot, Send, Volume2, User, Trash2, MessageSquare, BarChart3, Zap, Heart, Lightbulb, Camera, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ProtectedPage } from "@/app/components/ProtectedPage";
import { getToastFromUrl } from "@/app/lib/toast-server";
import { useVoiceSession } from "@/app/hooks/useVoiceSession";

const QUICK_ACTIONS = [
  { label: "Water Report", prompt: "Give me a detailed water quality report", icon: BarChart3 },
  { label: "System Status", prompt: "What's the current system status?", icon: Zap },
  { label: "Fish Health", prompt: "How are my fish doing?", icon: Heart },
  { label: "Recommendations", prompt: "Any recommendations for my aquarium?", icon: Lightbulb },
];

function VAssistantContent() {
  const { initiated, busy, error, messages, isTyping, input, setInput, toast, onInitiate, onAsk, onSpeak, setMessages } = useVoiceSession();
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hasCheckedToast = useRef(false);
  const cameraUrl = process.env.NEXT_PUBLIC_CAM_URL;

  useEffect(() => {
    if (!hasCheckedToast.current) {
      hasCheckedToast.current = true;
      const t = getToastFromUrl();
      if (t) toast.show(t.type as "success" | "error" | "info" | "warning" | "alert" | "update", t.message);
    }
  }, [toast]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isTyping]);

  return (
    <div className="bg-gradient-main min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <header className="mb-8 animate-fade-in">
          <div className="glass-strong p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gradient mb-2">Virtual Assistant</h1>
              <p className="text-sm" style={{ color: "rgb(var(--text-secondary))" }}>Powered by AI • Smart Aquaculture Management</p>
            </div>
            <div className={`badge ${initiated ? "status-good" : "status-neutral"}`}>
              <div className={`w-2 h-2 rounded-full ${initiated ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
              Assistant: {initiated ? "Ready" : "Idle"}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="card-glass animate-slide-in">
              <h3 className="text-lg font-semibold mb-4" style={{ color: "rgb(var(--text-primary))" }}>Assistant Controls</h3>
              <button className={`btn w-full ${initiated ? "btn-secondary" : "btn-primary animate-glow"}`} onClick={onInitiate} disabled={busy}>
                {busy ? <div className="animate-pulse">Initializing...</div> : initiated ? <><Bot className="w-4 h-4" />Veronica Ready</> : <><Zap className="w-4 h-4" />Initiate Veronica</>}
              </button>
              {error && <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm mt-3">{error}</div>}
            </div>

            <div className="card-glass animate-slide-in" style={{ animationDelay: "100ms" }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: "rgb(var(--text-primary))" }}>Live Camera</h3>
              <Link href="/dashboard" className="btn btn-secondary btn-sm w-full"><Camera className="w-4 h-4" />View in Dashboard</Link>
              {cameraUrl && <a href={cameraUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm w-full mt-2"><ExternalLink className="w-4 h-4" />Open Direct Stream</a>}
            </div>

            <div className="card-glass animate-slide-in" style={{ animationDelay: "200ms" }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: "rgb(var(--text-primary))" }}>Quick Actions</h3>
              <div className="space-y-2">
                {QUICK_ACTIONS.map(a => <button key={a.label} className="btn btn-ghost btn-sm w-full text-left justify-start hover:bg-white/10"
                  onClick={() => { if (!initiated) { toast.show("info", "Please initiate Veronica first"); return; } onAsk(a.prompt); }} disabled={busy || !initiated}>
                  <a.icon className="w-4 h-4" />{a.label}
                </button>)}
              </div>
            </div>
          </aside>

          {/* Chat */}
          <main className="lg:col-span-8">
            <div className="card-glass h-[70vh] flex flex-col animate-fade-in" style={{ animationDelay: "300ms" }}>
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"><Bot className="w-5 h-5 text-white" /></div>
                  <div>
                    <h3 className="font-semibold" style={{ color: "rgb(var(--text-primary))" }}>Veronica AI</h3>
                    <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>{initiated ? "Online • Ready to help" : "Offline • Click initiate to start"}</p>
                  </div>
                </div>
                {messages.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setMessages([])}><Trash2 className="w-4 h-4" />Clear</button>}
              </div>

              <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !initiated && (
                  <div className="text-center py-12">
                    <Bot className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                    <h3 className="text-xl font-semibold mb-2" style={{ color: "rgb(var(--text-primary))" }}>Welcome to Your Smart Aquarium Assistant</h3>
                    <p style={{ color: "rgb(var(--text-muted))" }}>Click &quot;Initiate Veronica&quot; to start.</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={msg.id} className={`animate-fade-in ${msg.role === "user" ? "flex justify-end" : "flex justify-start"}`} style={{ animationDelay: `${i * 50}ms` }}>
                    <div className={`max-w-[80%] ${msg.role === "user" ? "message-user" : "message-assistant"}`}>
                      <div className="flex items-start gap-3">
                        {msg.role === "assistant" && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1"><Bot className="w-4 h-4 text-white" /></div>}
                        <div className="flex-1">
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs opacity-60">{new Date(msg.ts).toLocaleTimeString()}</span>
                            {msg.role === "assistant" && <button className="btn btn-ghost btn-sm" onClick={() => onSpeak(msg.text)}><Volume2 className="w-4 h-4" /></button>}
                          </div>
                        </div>
                        {msg.role === "user" && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1"><User className="w-4 h-4 text-white" /></div>}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start"><div className="message-assistant max-w-[80%]"><div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center"><Bot className="w-4 h-4 text-white" /></div>
                    <div className="flex gap-1">{[0, 0.2, 0.4].map(d => <div key={d} className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: `${d}s` }} />)}</div>
                  </div></div></div>
                )}
              </div>

              <div className="p-4 border-t border-white/10">
                <div className="flex gap-3">
                  <input ref={inputRef} type="text" className="input-glass flex-1 focus-ring"
                    placeholder={initiated ? "Ask Veronica anything about your aquarium..." : "Initiate assistant first"}
                    value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAsk(); } }}
                    disabled={!initiated || busy} />
                  <button className="btn btn-primary" onClick={() => onAsk()} disabled={!initiated || busy || !input.trim()}>
                    {busy ? <MessageSquare className="w-4 h-4 animate-pulse" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs mt-2" style={{ color: "rgb(var(--text-muted))" }}>Press Enter to send • Shift+Enter for new line</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function VAssistantPage() {
  return <ProtectedPage><VAssistantContent /></ProtectedPage>;
}