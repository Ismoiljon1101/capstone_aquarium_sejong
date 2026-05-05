"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/app/hooks/useToast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const SESSION_KEY = "veronica_vassistant_session_id";

export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  ts: number;
};

export type PendingAction = {
  tool: string;
  args: Record<string, unknown>;
  reason: string;
};

export function useVoiceSession() {
  const [initiated, setInitiated]   = useState(false);
  const [busy, setBusy]             = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [isTyping, setIsTyping]     = useState(false);
  const [input, setInput]           = useState("");
  const [pendingAction, setPending] = useState<PendingAction | null>(null);
  const [confirming, setConfirming] = useState(false);
  const toast      = useToast();
  const sessionRef = useRef("");
  const abortRef   = useRef<AbortController | null>(null);

  const GREETING = "Hey there! 👋 I'm Veronica, your AI assistant for smart aquarium management.\n\nAsk me anything about your aquarium, or try a quick action.";

  // Init — restore session history or create new session
  useEffect(() => {
    async function init() {
      let sid = "";
      try { sid = localStorage.getItem(SESSION_KEY) ?? ""; } catch {}

      if (sid) {
        sessionRef.current = sid;
        try {
          const r = await fetch(`${API_BASE}/voice/sessions/${sid}/messages`);
          const data = await r.json();
          const history: Message[] = (Array.isArray(data) ? data : []).map((m: any) => ({
            id: String(m.id),
            role: m.role === "user" ? "user" : "assistant",
            text: m.content,
            ts: new Date(m.createdAt).getTime(),
          }));
          if (history.length > 0) {
            setMessages(history);
            setInitiated(true);
            return;
          }
        } catch {}
      }

      try {
        const r = await fetch(`${API_BASE}/voice/sessions/new`, { method: "POST" });
        const data = await r.json();
        sessionRef.current = data.sessionId ?? "";
        if (sessionRef.current) localStorage.setItem(SESSION_KEY, sessionRef.current);
      } catch { sessionRef.current = `local-${Date.now()}`; }
    }
    init();
  }, []);

  const onInitiate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setInitiated(true);
      setMessages([{ id: crypto.randomUUID(), role: "assistant", ts: Date.now(), text: GREETING }]);
    } finally { setBusy(false); }
  }, []);

  const onAsk = useCallback(async (promptOverride?: string) => {
    const prompt = (promptOverride || input).trim();
    if (!prompt || busy) return;

    let waited = 0;
    while (!sessionRef.current && waited < 3000) {
      await new Promise(r => setTimeout(r, 100));
      waited += 100;
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text: prompt, ts: Date.now() };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setBusy(true);
    setIsTyping(true);
    setError(null);
    setPending(null);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const startedFor = sessionRef.current;

    try {
      const res = await fetch(`${API_BASE}/voice/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: prompt, sessionId: sessionRef.current || undefined }),
        signal: ctrl.signal,
      });
      if (sessionRef.current !== startedFor) { setBusy(false); setIsTyping(false); return; }
      const data = await res.json();
      const answer = String(data?.response ?? "I couldn't process that request.");
      if (data?.pendingAction) setPending(data.pendingAction);
      setIsTyping(false);
      setMessages(m => [...m, { id: crypto.randomUUID(), role: "assistant", text: answer, ts: Date.now() }]);
    } catch (err: any) {
      setIsTyping(false);
      if (err?.name === "AbortError") { setBusy(false); return; }
      setError("Veronica is offline — check Ollama is running.");
    }
    setBusy(false);
  }, [input, busy]);

  const onConfirm = useCallback(async () => {
    if (!pendingAction || confirming) return;
    setConfirming(true);
    try {
      const res = await fetch(`${API_BASE}/voice/agent/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: pendingAction.tool, args: pendingAction.args, sessionId: sessionRef.current || undefined }),
      });
      const data = await res.json();
      setMessages(m => [...m, { id: crypto.randomUUID(), role: "assistant", text: `✓ ${data?.message ?? "Done."}`, ts: Date.now() }]);
    } catch {
      setMessages(m => [...m, { id: crypto.randomUUID(), role: "assistant", text: "Couldn't execute — check hardware.", ts: Date.now() }]);
    } finally { setPending(null); setConfirming(false); }
  }, [pendingAction, confirming]);

  const onCancel = useCallback(() => {
    setPending(null);
    setMessages(m => [...m, { id: crypto.randomUUID(), role: "assistant", text: "OK, cancelled.", ts: Date.now() }]);
  }, []);

  const onSpeak = useCallback((text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9; u.pitch = 1.0;
      window.speechSynthesis.speak(u);
    }
  }, []);

  return {
    initiated, busy, error, messages, isTyping, input, setInput,
    toast, pendingAction, confirming,
    onInitiate, onAsk, onConfirm, onCancel, onSpeak, setMessages,
  };
}
