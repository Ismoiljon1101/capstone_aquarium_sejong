import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Easing,
} from 'react-native';
import { useApi } from '../../hooks/useApi';

interface Msg { role: 'user' | 'veronica'; text: string; ts: Date; }

const WELCOME: Msg = {
  role: 'veronica',
  text: "Hi! I'm Veronica, your AI aquarium advisor. Tap the 📞 button to talk — or type below. I hear you 24/7.",
  ts: new Date(),
};

// Web Speech API typings (available in Expo web / browser)
declare const window: any;

function useSpeechRecognition() {
  const recRef = useRef<any>(null);
  const supported = Platform.OS === 'web' && (typeof window !== 'undefined') &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = (onResult: (t: string) => void, onEnd: () => void) => {
    if (!supported) return false;
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const text = e.results[0]?.[0]?.transcript ?? '';
      if (text) onResult(text);
    };
    rec.onend = onEnd;
    rec.onerror = onEnd;
    rec.start();
    recRef.current = rec;
    return true;
  };

  const stop = () => { try { recRef.current?.stop(); } catch {} };
  return { supported, start, stop };
}

function speak(text: string) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utt = new window.SpeechSynthesisUtterance(text);
  utt.lang = 'en-US';
  utt.rate = 1.05;
  utt.pitch = 1.1;
  // pick a female voice if available
  const voices = window.speechSynthesis.getVoices();
  const female = voices.find((v: any) => /female|zira|samantha|karen/i.test(v.name));
  if (female) utt.voice = female;
  window.speechSynthesis.speak(utt);
}

// Pulsing ring for active call
function PulseRing({ active }: { active: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (!active) { scale.setValue(1); opacity.setValue(0.7); return; }
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale,   { toValue: 1.6, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1,   duration: 0,   useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0,   duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7, duration: 0,   useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active]);

  if (!active) return null;
  return (
    <Animated.View style={{
      position: 'absolute', width: 54, height: 54, borderRadius: 27,
      borderWidth: 2, borderColor: '#22c55e',
      transform: [{ scale }], opacity,
    }} />
  );
}

export const VeronicaChat: React.FC = () => {
  const api = useApi();
  const sr = useSpeechRecognition();
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    api.getVoiceSessions()
      .then(r => {
        if (Array.isArray(r.data) && r.data.length > 0) {
          const recent = r.data.slice(0, 3).reverse();
          const history: Msg[] = [];
          recent.forEach((s: any) => {
            history.push({ role: 'user',     text: s.transcribedText, ts: new Date(s.createdAt) });
            history.push({ role: 'veronica', text: s.aiResponse,      ts: new Date(s.createdAt) });
          });
          setMsgs(p => [...p, ...history]);
        }
      })
      .catch(() => null);
  }, []);

  const scrollBottom = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

  const askVeronica = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    setMsgs(p => [...p, { role: 'user', text, ts: new Date() }]);
    setLoading(true);
    scrollBottom();
    try {
      const r = await api.voiceQuery(text);
      const reply = String(r?.data?.response ?? r?.data ?? 'Unable to process right now.');
      setMsgs(p => [...p, { role: 'veronica', text: reply, ts: new Date() }]);
      if (callActive) speak(reply);
      scrollBottom();
    } catch {
      const err = 'Connection error. Check backend + Ollama.';
      setMsgs(p => [...p, { role: 'veronica', text: err, ts: new Date() }]);
      if (callActive) speak(err);
    }
    setLoading(false);
  }, [loading, callActive]);

  const send = () => { const t = input.trim(); setInput(''); askVeronica(t); };

  // ── Call logic ──────────────────────────────────────────────────────────
  const startListeningCycle = useCallback(() => {
    setListening(true);
    const ok = sr.start(
      (transcript) => {
        setListening(false);
        askVeronica(transcript);
      },
      () => setListening(false),
    );
    if (!ok) {
      setListening(false);
      setCallActive(false);
      setMsgs(p => [...p, {
        role: 'veronica',
        text: 'Voice call not supported in this environment. Try on Chrome/Edge.',
        ts: new Date(),
      }]);
    }
  }, [sr, askVeronica]);

  const toggleCall = () => {
    if (callActive) {
      sr.stop();
      setCallActive(false);
      setListening(false);
      setMsgs(p => [...p, { role: 'veronica', text: 'Call ended. Tap 📞 to talk again anytime.', ts: new Date() }]);
    } else {
      setCallActive(true);
      setMsgs(p => [...p, { role: 'veronica', text: "🎙️ Call started! I'm listening — speak now.", ts: new Date() }]);
      speak("Call started! I'm listening.");
      startListeningCycle();
    }
  };

  // Re-listen after each answer while call is active
  useEffect(() => {
    if (callActive && !listening && !loading) {
      const t = setTimeout(() => startListeningCycle(), 600);
      return () => clearTimeout(t);
    }
  }, [callActive, listening, loading]);

  return (
    <View style={{
      backgroundColor: '#0f172a', borderRadius: 20, borderCurve: 'continuous',
      borderWidth: 1, borderColor: callActive ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)',
      overflow: 'hidden', marginTop: 24,
      boxShadow: callActive ? '0 0 32px rgba(34,197,94,0.12)' : '0 4px 32px rgba(0,0,0,0.4)',
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
        backgroundColor: callActive ? 'rgba(34,197,94,0.06)' : 'rgba(6,182,212,0.05)',
      }}>
        <View style={{
          width: 38, height: 38, borderRadius: 19, borderCurve: 'continuous',
          backgroundColor: '#0891b2', alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 18 }}>🧠</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#f1f5f9' }}>Veronica AI</Text>
          <Text style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
            {callActive
              ? listening ? '🎙️ Listening…' : loading ? '⏳ Thinking…' : '📡 On Call'
              : 'AI Aquarium Advisor · Ollama qwen2.5:3b'}
          </Text>
        </View>

        {/* Call button */}
        <TouchableOpacity onPress={toggleCall} activeOpacity={0.8} style={{ alignItems: 'center', justifyContent: 'center' }}>
          <PulseRing active={listening} />
          <View style={{
            width: 42, height: 42, borderRadius: 21, borderCurve: 'continuous',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: callActive ? '#22c55e' : '#1e3a2f',
            borderWidth: 1.5,
            borderColor: callActive ? '#22c55e' : 'rgba(34,197,94,0.3)',
          }}>
            <Text style={{ fontSize: 18 }}>{callActive ? '📵' : '📞'}</Text>
          </View>
        </TouchableOpacity>

        {/* Status badge */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 5,
          backgroundColor: callActive ? 'rgba(34,197,94,0.12)' : 'rgba(6,182,212,0.12)',
          paddingHorizontal: 10, paddingVertical: 4,
          borderRadius: 20, borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: callActive ? 'rgba(34,197,94,0.3)' : 'rgba(6,182,212,0.25)',
        }}>
          <View style={{
            width: 6, height: 6, borderRadius: 3,
            backgroundColor: callActive ? '#22c55e' : '#22d3ee',
          }} />
          <Text style={{ fontSize: 10, fontWeight: '700', color: callActive ? '#22c55e' : '#22d3ee' }}>
            {callActive ? 'On Call' : 'AI Online'}
          </Text>
        </View>
      </View>

      {/* Call active banner */}
      {callActive && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingHorizontal: 16, paddingVertical: 8,
          backgroundColor: 'rgba(34,197,94,0.08)',
          borderBottomWidth: 1, borderBottomColor: 'rgba(34,197,94,0.12)',
        }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
          <Text style={{ fontSize: 12, color: '#86efac', fontWeight: '600', flex: 1 }}>
            {listening ? 'Listening to you…' : loading ? 'Veronica is thinking…' : 'Ready — speak anytime'}
          </Text>
          <Text style={{ fontSize: 11, color: '#4ade80', fontWeight: '700' }}>LIVE</Text>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ maxHeight: 280 }}
        contentContainerStyle={{ padding: 14, gap: 10 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {msgs.map((m, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 8 }}>
            {m.role === 'veronica' && (
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#0891b2', alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 }}>
                <Text style={{ fontSize: 12 }}>🧠</Text>
              </View>
            )}
            <View style={{
              maxWidth: '78%',
              backgroundColor: m.role === 'user' ? '#1d4ed8' : 'rgba(255,255,255,0.07)',
              borderRadius: 18, borderCurve: 'continuous',
              borderTopRightRadius: m.role === 'user' ? 4 : 18,
              borderTopLeftRadius: m.role === 'veronica' ? 4 : 18,
              paddingHorizontal: 14, paddingVertical: 10,
              borderWidth: 1,
              borderColor: m.role === 'user' ? 'rgba(29,78,216,0.5)' : 'rgba(255,255,255,0.07)',
            }}>
              <Text selectable style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 19 }}>{m.text}</Text>
              <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4, textAlign: 'right', fontVariant: ['tabular-nums'] }}>
                {m.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#0891b2', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Text style={{ fontSize: 12 }}>🧠</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 18, borderCurve: 'continuous', borderTopLeftRadius: 4, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}>
              <ActivityIndicator size="small" color="#22d3ee" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{
          flexDirection: 'row', gap: 10, padding: 14,
          borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
        }}>
          <TextInput
            style={{
              flex: 1, backgroundColor: 'rgba(255,255,255,0.06)',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: 14, borderCurve: 'continuous',
              paddingHorizontal: 14, paddingVertical: 10,
              fontSize: 14, color: '#e2e8f0',
            }}
            placeholder={callActive ? 'Or type here while on call…' : 'Ask about pH, fish behavior, feeding…'}
            placeholderTextColor="#475569"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            returnKeyType="send"
            multiline={false}
          />
          <TouchableOpacity
            onPress={send}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
            style={{
              backgroundColor: input.trim() && !loading ? '#0891b2' : '#1e293b',
              borderRadius: 14, borderCurve: 'continuous',
              paddingHorizontal: 18, justifyContent: 'center',
              borderWidth: 1, borderColor: input.trim() && !loading ? '#0891b2' : 'rgba(255,255,255,0.06)',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: input.trim() && !loading ? '#fff' : '#475569' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};
