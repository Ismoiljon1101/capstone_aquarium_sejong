"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/app/hooks/useToast";

export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  ts: number;
};

async function callApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || `${res.status}`);
  }
  return (await res.json()) as T;
}

/**
 * Hook: manages Veronica voice session state — initiation, ask, speak, status poll.
 */
export function useVoiceSession() {
  const [initiated, setInitiated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState("");
  const toast = useToast();

  useEffect(() => {
    const fetch = () => callApi<{ initiated: boolean }>("/assistant/status")
      .then(s => setInitiated(s.initiated))
      .catch(() => {});
    fetch();
    const id = setInterval(fetch, 5000);
    return () => clearInterval(id);
  }, []);

  const onInitiate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await callApi<{ ok: boolean }>("/assistant/initiate", { method: "POST" });
      setInitiated(true);
      setMessages([{
        id: crypto.randomUUID(), role: "assistant", ts: Date.now(),
        text: "Hey there! 👋 I'm Veronica, your AI assistant for smart aquarium management.\n\nAsk me anything about your aquarium, or try a quick action.",
      }]);
    } catch { setError("Failed to initiate assistant"); }
    finally { setBusy(false); }
  }, []);

  const onAsk = useCallback(async (promptOverride?: string) => {
    const prompt = (promptOverride || input).trim();
    if (!prompt || busy) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text: prompt, ts: Date.now() };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setBusy(true);
    setIsTyping(true);
    setError(null);
    try {
      const historyForApi = messages.slice(-10).map(m => ({ role: m.role, text: m.text }));
      const res = await callApi<{ ok: boolean; answer?: string }>("/assistant/ask", {
        method: "POST",
        body: JSON.stringify({ prompt, history: historyForApi }),
      });
      setIsTyping(false);
      setMessages(m => [...m, { id: crypto.randomUUID(), role: "assistant", text: res.answer || "I couldn't process that request.", ts: Date.now() }]);
    } catch { setIsTyping(false); setError("Failed to get response"); }
    finally { setBusy(false); }
  }, [input, busy, messages]);

  const onSpeak = useCallback(async (text: string) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9; u.pitch = 1.0; u.volume = 1.0;
      window.speechSynthesis.speak(u);
    }
    try { await callApi<{ ok: boolean }>("/assistant/say", { method: "POST", body: JSON.stringify({ text }) }); }
    catch { /* browser TTS already fired */ }
  }, []);

  return { initiated, busy, error, messages, isTyping, input, setInput, toast, onInitiate, onAsk, onSpeak, setMessages };
}
