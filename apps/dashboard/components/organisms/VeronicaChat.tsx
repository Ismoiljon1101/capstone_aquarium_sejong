"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useApi } from "../../hooks/useApi";

const SESSION_KEY = "veronica_session_id";

interface Msg { role: "user" | "veronica"; text: string; ts: Date; }
interface PendingAction { tool: string; args: Record<string, unknown>; reason: string; }

export const VeronicaChat: React.FC = () => {
  const api = useApi();
  const [msgs, setMsgs]       = useState<Msg[]>([]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSession] = useState("");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [confirming, setConf] = useState(false);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const abortRef   = useRef<AbortController | null>(null);
  const sessionRef = useRef("");
  sessionRef.current = sessionId;

  const GREETING = "Hi! I'm Veronica, your AI aquarium advisor. I have live access to your tank sensors. Ask me anything.";

  useEffect(() => {
    async function init() {
      let sid = "";
      try { sid = localStorage.getItem(SESSION_KEY) ?? ""; } catch {}

      if (sid) {
        setSession(sid);
        try {
          const r = await api.getSessionMessages(sid);
          const history: Msg[] = (r.data ?? []).map((m: any) => ({
            role: (m.role === "user" ? "user" : "veronica") as Msg["role"],
            text: m.content,
            ts: new Date(m.createdAt),
          }));
          setMsgs(history.length > 0 ? history : [{ role: "veronica", text: GREETING, ts: new Date() }]);
        } catch {
          setMsgs([{ role: "veronica", text: GREETING, ts: new Date() }]);
        }
      } else {
        try {
          const r = await api.newChatSession();
          const newSid: string = r.data.sessionId;
          setSession(newSid);
          localStorage.setItem(SESSION_KEY, newSid);
        } catch { setSession(`local-${Date.now()}`); }
        setMsgs([{ role: "veronica", text: GREETING, ts: new Date() }]);
      }
    }
    init();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, loading]);

  const startNew = useCallback(async () => {
    abortRef.current?.abort();
    setLoading(false);
    try {
      const r = await api.newChatSession();
      const newSid: string = r.data.sessionId;
      setSession(newSid);
      localStorage.setItem(SESSION_KEY, newSid);
    } catch { setSession(`local-${Date.now()}`); }
    setMsgs([{ role: "veronica", text: "New conversation started. What would you like to know?", ts: new Date() }]);
    setPending(null);
  }, []);

  const ask = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    let waited = 0;
    while (!sessionRef.current && waited < 3000) {
      await new Promise(r => setTimeout(r, 100));
      waited += 100;
    }
    setMsgs(p => [...p, { role: "user", text, ts: new Date() }]);
    setPending(null);
    setLoading(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const startedFor = sessionRef.current;
    try {
      const r = await api.agentQuery(text, sessionRef.current || undefined, ctrl.signal);
      if (sessionRef.current !== startedFor) { setLoading(false); return; }
      const reply = String(r?.data?.response ?? "Connection error.");
      if (r?.data?.pendingAction) setPending(r.data.pendingAction);
      setMsgs(p => [...p, { role: "veronica", text: reply, ts: new Date() }]);
    } catch (err: any) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") { setLoading(false); return; }
      setMsgs(p => [...p, { role: "veronica", text: "Veronica is offline — check Ollama.", ts: new Date() }]);
    }
    setLoading(false);
  }, [loading]);

  const confirmAction = useCallback(async () => {
    if (!pending || confirming) return;
    setConf(true);
    try {
      const r = await api.agentConfirm(pending.tool, pending.args, sessionRef.current || undefined);
      const msg = r?.data?.message ?? "Done.";
      setMsgs(p => [...p, { role: "veronica", text: `✓ ${msg}`, ts: new Date() }]);
    } catch {
      setMsgs(p => [...p, { role: "veronica", text: "Couldn't execute — check hardware.", ts: new Date() }]);
    } finally { setPending(null); setConf(false); }
  }, [pending, confirming]);

  const send = () => {
    const t = input.trim();
    if (!t) return;
    setInput("");
    ask(t);
  };

  return (
    <section className="bg-slate-900/80 border border-white/[0.07] rounded-2xl flex flex-col overflow-hidden" style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.3)", height: 460 }}>
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm">🧠</div>
        <div className="flex-1">
          <h2 className="text-sm font-black text-slate-100">Veronica</h2>
          <p className="text-[10px] text-slate-500">AI aquarium agent · tool-calling</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] text-cyan-400 font-semibold">LIVE</span>
        </div>
        <button onClick={startNew} className="ml-1 p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors" title="New chat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "veronica" && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs mr-2 mt-1 shrink-0">🧠</div>
            )}
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-blue-600/80 text-white rounded-tr-sm"
                : "bg-white/[0.06] text-slate-300 rounded-tl-sm border border-white/[0.07]"
            }`}>
              {m.text}
              <p className="text-[9px] opacity-40 mt-1 text-right">{m.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs mr-2 mt-1 shrink-0">🧠</div>
            <div className="bg-white/[0.06] border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
      </div>

      {pending && (
        <div className="mx-3 mb-2 rounded-xl border border-cyan-500/25 bg-cyan-500/[0.06] overflow-hidden shrink-0">
          <div className="px-3 py-2.5">
            <p className="text-[10px] font-bold text-cyan-400 tracking-widest mb-1">ACTION REQUIRED</p>
            <p className="text-xs text-slate-300">{pending.reason}</p>
          </div>
          <div className="flex border-t border-cyan-500/15">
            <button onClick={() => { setPending(null); setMsgs(p => [...p, { role: "veronica", text: "OK, cancelled.", ts: new Date() }]); }}
              className="flex-1 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors border-r border-cyan-500/15">Cancel</button>
            <button onClick={confirmAction} disabled={confirming}
              className="flex-1 py-2 text-xs text-cyan-400 font-bold hover:text-cyan-300 transition-colors disabled:opacity-50">
              {confirming ? "…" : "Confirm"}
            </button>
          </div>
        </div>
      )}

      <div className="px-4 pb-4 pt-2 shrink-0 border-t border-white/[0.05]">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all"
            placeholder="Ask about pH, temperature, fish health…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
          />
          <button onClick={send} disabled={!input.trim() || loading}
            className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold px-4 rounded-xl text-sm transition-colors shrink-0">
            {loading ? "…" : "Send"}
          </button>
        </div>
      </div>
    </section>
  );
};
