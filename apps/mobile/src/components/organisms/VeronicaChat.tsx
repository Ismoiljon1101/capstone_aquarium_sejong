import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Easing,
} from 'react-native';
import { useApi } from '../../hooks/useApi';

interface Msg { role: 'user' | 'veronica'; text: string; ts: Date; }

export interface VeronicaCallState {
  callActive: boolean;
  listening: boolean;
  loading: boolean;
}

interface Props {
  onStateChange?: (state: VeronicaCallState) => void;
}

const WELCOME: Msg = {
  role: 'veronica',
  text: "Hi! I'm Veronica. Tap the mic to start a voice call, or type below.",
  ts: new Date(),
};

declare const window: any;

// ─── TTS ────────────────────────────────────────────────────────────────────
function speak(text: string, onDone?: () => void) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') { onDone?.(); return; }
  if (!('speechSynthesis' in window)) { onDone?.(); return; }
  window.speechSynthesis.cancel();
  const utt = new window.SpeechSynthesisUtterance(text);
  utt.lang = 'en-US'; utt.rate = 1.05; utt.pitch = 1.1;
  const pick = () => {
    const voices = window.speechSynthesis.getVoices();
    const female = voices.find((v: any) => /female|zira|samantha|karen|google uk english female/i.test(v.name));
    if (female) utt.voice = female;
  };
  pick();
  utt.onend = () => onDone?.();
  utt.onerror = () => onDone?.();
  window.speechSynthesis.speak(utt);
  // Chrome bug: speechSynthesis pauses after ~15s — keep alive
  const keepAlive = setInterval(() => {
    if (!window.speechSynthesis.speaking) { clearInterval(keepAlive); return; }
    window.speechSynthesis.pause();
    window.speechSynthesis.resume();
  }, 10000);
  utt.onend = () => { clearInterval(keepAlive); onDone?.(); };
}

function stopSpeaking() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// ─── STT ────────────────────────────────────────────────────────────────────
function useSpeechRecognition() {
  const recRef = useRef<any>(null);
  const supported = Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = useCallback((
    onResult: (t: string) => void,
    onEnd: (gotResult: boolean) => void,
  ): boolean => {
    if (!supported) return false;
    try { recRef.current?.abort(); } catch {}
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    let gotResult = false;
    rec.onresult = (e: any) => {
      const text = e.results[0]?.[0]?.transcript?.trim() ?? '';
      if (text) { gotResult = true; onResult(text); }
    };
    rec.onend = () => onEnd(gotResult);
    rec.onerror = (e: any) => {
      // 'no-speech' is normal — treat as empty end, not error
      if (e.error !== 'no-speech') console.warn('STT error:', e.error);
      onEnd(gotResult);
    };
    rec.start();
    recRef.current = rec;
    return true;
  }, [supported]);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch {}
  }, []);

  const abort = useCallback(() => {
    try { recRef.current?.abort(); } catch {}
  }, []);

  return { supported, start, stop, abort };
}

// ─── Animated waveform ───────────────────────────────────────────────────────
function Waveform({ active }: { active: boolean }) {
  const bars = [0, 1, 2, 3, 4, 5, 6];
  const anims = useRef(bars.map(() => new Animated.Value(4))).current;

  useEffect(() => {
    if (!active) {
      anims.forEach(a => a.setValue(4));
      return;
    }
    const loops = anims.map((a, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 80),
        Animated.timing(a, { toValue: 20 + Math.random() * 8, duration: 300 + i * 40, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(a, { toValue: 4 + Math.random() * 4,  duration: 300 + i * 40, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]))
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [active]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, height: 28 }}>
      {anims.map((a, i) => (
        <Animated.View key={i} style={{
          width: 3.5, height: a, borderRadius: 2,
          backgroundColor: '#22c55e', opacity: 0.85,
        }} />
      ))}
    </View>
  );
}

// ─── Pulse ring ──────────────────────────────────────────────────────────────
function PulseRing({ active, color = '#22c55e' }: { active: boolean; color?: string }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!active) { scale.setValue(1); opacity.setValue(0); return; }
    const loop = Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(scale,   { toValue: 1.8, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale,   { toValue: 1,   duration: 0, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0,   duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
      ]),
    ]));
    loop.start();
    return () => loop.stop();
  }, [active]);

  return (
    <Animated.View style={{
      position: 'absolute',
      width: 56, height: 56, borderRadius: 28,
      borderWidth: 2, borderColor: color,
      transform: [{ scale }], opacity,
    }} />
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export const VeronicaChat: React.FC<Props> = ({ onStateChange }) => {
  const api = useApi();
  const sr  = useSpeechRecognition();

  const [msgs, setMsgs]           = useState<Msg[]>([WELCOME]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking]   = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Stable refs to avoid stale closures in callbacks
  const callActiveRef = useRef(callActive);
  const loadingRef    = useRef(loading);
  callActiveRef.current = callActive;
  loadingRef.current    = loading;

  useEffect(() => {
    onStateChange?.({ callActive, listening, loading });
  }, [callActive, listening, loading]);

  // Load history
  useEffect(() => {
    api.getVoiceSessions()
      .then(r => {
        if (Array.isArray(r.data) && r.data.length > 0) {
          const history: Msg[] = [];
          r.data.slice(0, 3).reverse().forEach((s: any) => {
            history.push({ role: 'user',     text: s.transcribedText, ts: new Date(s.createdAt) });
            history.push({ role: 'veronica', text: s.aiResponse,      ts: new Date(s.createdAt) });
          });
          setMsgs(p => [...p, ...history]);
        }
      })
      .catch(() => null);
  }, []);

  const scrollBottom = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

  // ── Core: ask Veronica, then speak, then re-listen (if call active) ─────
  const askVeronica = useCallback(async (text: string) => {
    if (!text.trim() || loadingRef.current) return;
    setMsgs(p => [...p, { role: 'user', text, ts: new Date() }]);
    setLoading(true);
    scrollBottom();

    let reply = '';
    try {
      const r = await api.voiceQuery(text);
      reply = String(r?.data?.response ?? r?.data ?? 'Unable to process right now.');
    } catch {
      reply = 'Connection error. Check backend is running.';
    }

    setMsgs(p => [...p, { role: 'veronica', text: reply, ts: new Date() }]);
    setLoading(false);
    scrollBottom();

    // If call is active: speak → then re-listen when done
    if (callActiveRef.current) {
      setSpeaking(true);
      speak(reply, () => {
        setSpeaking(false);
        // Only re-listen if call is still active
        if (callActiveRef.current) {
          startListening();
        }
      });
    }
  }, []);

  // ── Start one STT round ──────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!callActiveRef.current) return;
    setListening(true);
    const ok = sr.start(
      (transcript) => {
        setListening(false);
        // Stop any ongoing TTS (user interrupted)
        stopSpeaking();
        setSpeaking(false);
        askVeronica(transcript);
      },
      (gotResult) => {
        setListening(false);
        // No speech detected → re-listen after brief pause (only if call active + not loading)
        if (!gotResult && callActiveRef.current && !loadingRef.current) {
          setTimeout(() => {
            if (callActiveRef.current && !loadingRef.current) startListening();
          }, 400);
        }
      },
    );
    if (!ok) {
      setListening(false);
      setCallActive(false);
      setMsgs(p => [...p, {
        role: 'veronica',
        text: 'Voice not supported. Use Chrome or Edge browser.',
        ts: new Date(),
      }]);
    }
  }, [sr, askVeronica]);

  // ── Toggle call ──────────────────────────────────────────────────────────
  const toggleCall = useCallback(() => {
    if (callActive) {
      // End call
      sr.abort();
      stopSpeaking();
      setCallActive(false);
      setListening(false);
      setSpeaking(false);
      setMsgs(p => [...p, { role: 'veronica', text: 'Call ended.', ts: new Date() }]);
    } else {
      // Start call
      setCallActive(true);
      setMsgs(p => [...p, { role: 'veronica', text: "Listening — speak anytime.", ts: new Date() }]);
      // Small delay so setCallActive propagates to ref
      setTimeout(() => startListening(), 200);
    }
  }, [callActive, sr, startListening]);

  // ── Manual mic tap (force-start listening, interrupt TTS) ───────────────
  const forceListen = useCallback(() => {
    if (!callActive) return;
    stopSpeaking();
    setSpeaking(false);
    sr.abort();
    setListening(false);
    setTimeout(() => startListening(), 150);
  }, [callActive, sr, startListening]);

  // ── Send text ────────────────────────────────────────────────────────────
  const send = () => {
    const t = input.trim();
    if (!t) return;
    setInput('');
    // Interrupt if listening
    if (listening) { sr.abort(); setListening(false); }
    askVeronica(t);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const borderColor = callActive
    ? listening ? '#22c55e55' : speaking ? '#f59e0b55' : '#34d39955'
    : 'rgba(255,255,255,0.08)';

  const statusText = listening ? 'Listening...'
    : speaking ? 'Veronica speaking...'
    : loading  ? 'Thinking...'
    : callActive ? 'Tap mic or speak'
    : 'AI Aquarium Advisor';

  const statusColor = listening ? '#22c55e'
    : speaking ? '#f59e0b'
    : loading  ? '#38bdf8'
    : callActive ? '#34d399'
    : '#64748b';

  return (
    <View style={{
      backgroundColor: '#0f172a',
      borderRadius: 20,
      borderWidth: 1,
      borderColor,
      overflow: 'hidden',
      marginTop: 24,
    }}>
      {/* ── Header ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 13,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
        backgroundColor: callActive ? 'rgba(34,197,94,0.05)' : 'rgba(6,182,212,0.04)',
      }}>
        {/* Avatar */}
        <View style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: '#0891b2', alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 17 }}>🧠</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#f1f5f9' }}>Veronica AI</Text>
          <Text style={{ fontSize: 11, color: statusColor, marginTop: 1, fontWeight: '600' }}>
            {statusText}
          </Text>
        </View>

        {/* Manual mic (interrupt) — only shown during call */}
        {callActive && (
          <TouchableOpacity
            onPress={forceListen}
            activeOpacity={0.7}
            style={{
              width: 36, height: 36, borderRadius: 18,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: listening ? '#22c55e22' : 'rgba(255,255,255,0.06)',
              borderWidth: 1, borderColor: listening ? '#22c55e66' : 'rgba(255,255,255,0.1)',
            }}
          >
            <Text style={{ fontSize: 16 }}>🎙️</Text>
          </TouchableOpacity>
        )}

        {/* Call button */}
        <TouchableOpacity onPress={toggleCall} activeOpacity={0.8} style={{ alignItems: 'center', justifyContent: 'center' }}>
          <PulseRing active={listening} color="#22c55e" />
          <View style={{
            width: 44, height: 44, borderRadius: 22,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: callActive ? '#dc2626' : '#16a34a',
            borderWidth: 1.5,
            borderColor: callActive ? '#dc262699' : '#16a34a99',
          }}>
            <Text style={{ fontSize: 18 }}>{callActive ? '📵' : '📞'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Live status strip (only when call active) ── */}
      {callActive && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          paddingHorizontal: 16, paddingVertical: 9,
          backgroundColor: listening ? 'rgba(34,197,94,0.08)' : speaking ? 'rgba(245,158,11,0.08)' : 'rgba(52,211,153,0.06)',
          borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
        }}>
          {listening
            ? <Waveform active />
            : <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor }} />
          }
          <Text style={{ flex: 1, fontSize: 12, color: statusColor, fontWeight: '600' }}>
            {listening ? 'Listening — speak now'
              : speaking ? 'Veronica is speaking — tap 🎙️ to interrupt'
              : loading  ? 'Processing...'
              : 'Ready — speak or tap 🎙️'}
          </Text>
          <Text style={{ fontSize: 10, color: statusColor, fontWeight: '800', letterSpacing: 1 }}>LIVE</Text>
        </View>
      )}

      {/* ── Messages ── */}
      <ScrollView
        ref={scrollRef}
        style={{ maxHeight: 300 }}
        contentContainerStyle={{ padding: 14, gap: 10 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {msgs.map((m, i) => (
          <View key={i} style={{
            flexDirection: 'row',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            gap: 8,
          }}>
            {m.role === 'veronica' && (
              <View style={{
                width: 24, height: 24, borderRadius: 12,
                backgroundColor: '#0891b2', alignItems: 'center', justifyContent: 'center',
                marginTop: 2, flexShrink: 0,
              }}>
                <Text style={{ fontSize: 11 }}>🧠</Text>
              </View>
            )}
            <View style={{
              maxWidth: '78%',
              backgroundColor: m.role === 'user' ? '#1d4ed8' : 'rgba(255,255,255,0.07)',
              borderRadius: 18,
              borderTopRightRadius: m.role === 'user' ? 4 : 18,
              borderTopLeftRadius:  m.role === 'veronica' ? 4 : 18,
              paddingHorizontal: 14, paddingVertical: 10,
              borderWidth: 1,
              borderColor: m.role === 'user' ? 'rgba(29,78,216,0.5)' : 'rgba(255,255,255,0.07)',
            }}>
              <Text selectable style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 19 }}>
                {m.text}
              </Text>
              <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4, textAlign: 'right' }}>
                {m.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{
              width: 24, height: 24, borderRadius: 12,
              backgroundColor: '#0891b2', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Text style={{ fontSize: 11 }}>🧠</Text>
            </View>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 18,
              borderTopLeftRadius: 4, paddingHorizontal: 18, paddingVertical: 13,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
            }}>
              <ActivityIndicator size="small" color="#22d3ee" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Input ── */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{
          flexDirection: 'row', gap: 10, padding: 14,
          borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
        }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
              fontSize: 14, color: '#e2e8f0',
            }}
            placeholder={callActive ? 'Type while on call...' : 'Ask about pH, fish behavior...'}
            placeholderTextColor="#475569"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={send}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
            style={{
              backgroundColor: input.trim() && !loading ? '#0891b2' : '#1e293b',
              borderRadius: 14, paddingHorizontal: 18, justifyContent: 'center',
              borderWidth: 1,
              borderColor: input.trim() && !loading ? '#0891b2' : 'rgba(255,255,255,0.06)',
            }}
          >
            <Text style={{
              fontSize: 14, fontWeight: '700',
              color: input.trim() && !loading ? '#fff' : '#475569',
            }}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};
