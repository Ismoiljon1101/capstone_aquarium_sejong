import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, Easing, StatusBar, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApi } from '../hooks/useApi';
import { useSensors, sensorContext } from '../hooks/useSensors';
import { useSocket } from '../hooks/useSocket';
// AppHeader not used — custom minimal header below

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

declare const window: any;

// ─── Types ───────────────────────────────────────────────────────────────────
interface Msg { role: 'user' | 'veronica'; text: string; ts: Date; }

// ─── Web-only STT ─────────────────────────────────────────────────────────────
function useSpeechRecognition() {
  const recRef = useRef<any>(null);
  const supported = Platform.OS === 'web' && typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = useCallback((
    onResult:   (t: string) => void,
    onEnd:      (got: boolean, err?: string) => void,
    onInterim?: (t: string) => void,
  ) => {
    if (!supported) return false;
    try { recRef.current?.abort(); } catch {}
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-US'; rec.continuous = false; rec.interimResults = true;
    let got = false;
    let errCode = '';
    rec.onresult = (e: any) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0]?.transcript ?? '';
        if (e.results[i].isFinal) { final += t; got = true; }
        else interim += t;
      }
      if (interim.trim()) onInterim?.(interim.trim());
      if (final.trim()) onResult(final.trim());
    };
    rec.onerror = (e: any) => { errCode = e.error; if (e.error !== 'no-speech') console.warn('STT:', e.error); };
    rec.onend   = () => onEnd(got, errCode || undefined);
    rec.start();
    recRef.current = rec;
    return true;
  }, [supported]);

  const stop  = useCallback(() => { try { recRef.current?.stop(); }  catch {} }, []);
  const abort = useCallback(() => { try { recRef.current?.abort(); } catch {} }, []);
  return { supported, start, stop, abort };
}

// ─── TTS (cross-platform via expo-speech, web falls back to browser) ──────────
async function speakText(text: string, onDone?: () => void) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utt = new window.SpeechSynthesisUtterance(text);
    utt.lang = 'en-US'; utt.rate = 1.05; utt.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const female = voices.find((v: any) => /female|zira|samantha|karen|google uk english female/i.test(v.name));
    if (female) utt.voice = female;
    utt.onend   = () => onDone?.();
    utt.onerror = () => onDone?.();
    window.speechSynthesis.speak(utt);
  } else {
    try {
      await Speech.stop();
      Speech.speak(text, {
        language: 'en-US', pitch: 1.1, rate: 1.0,
        onDone: onDone,
        onError: onDone,
      });
    } catch { onDone?.(); }
  }
}

async function stopSpeaking() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  } else {
    try { await Speech.stop(); } catch {}
  }
}

// ─── Siri/ChatGPT-style morphing voice orb ───────────────────────────────────
// Multiple semi-transparent blobs translate + scale on offset sine cycles to
// create an organic "breathing/thinking" gradient — no Skia needed.
//
// Color palettes per state shift dominant hue:
//   idle      → faint cyan-grey (low amplitude, slow)
//   listening → emerald + cyan, sharp pulse
//   thinking  → cyan + violet, smooth morph (the "AI is reasoning" look)
//   speaking  → cyan + white highlight, fast bouncy pulse
const ORB_STATES = {
  idle:      { palette: ['#1e293b', '#334155', '#475569'], speed: 5000, amp: 0.05, glow: 0.10 },
  listening: { palette: ['#22c55e', '#10b981', '#06b6d4'], speed: 1400, amp: 0.18, glow: 0.55 },
  thinking:  { palette: ['#38bdf8', '#8b5cf6', '#0ea5e9'], speed: 2200, amp: 0.14, glow: 0.45 },
  speaking:  { palette: ['#e0f2fe', '#38bdf8', '#0ea5e9'], speed: 1100, amp: 0.20, glow: 0.65 },
};

function VoiceOrb({ state, size = 200 }: { state: keyof typeof ORB_STATES; size?: number }) {
  const blobs = useRef(
    [0, 1, 2].map(() => ({ t: new Animated.Value(0) }))
  ).current;
  const breath      = useRef(new Animated.Value(0)).current;
  const haloOpacity = useRef(new Animated.Value(0)).current;

  // Stable interpolations — created once from stable refs, no new nodes on re-render
  const blobStyles = useMemo(() => blobs.map((b, i) => {
    const a  = (i / 3) * Math.PI * 2;
    const r  = size * 0.12;
    const tx = b.t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [Math.cos(a) * r, Math.cos(a + Math.PI) * r, Math.cos(a) * r] });
    const ty = b.t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [Math.sin(a) * r, Math.sin(a + Math.PI) * r, Math.sin(a) * r] });
    const sc = b.t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.85, 1.15, 0.85] });
    return { transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }] } as const;
  }), [size]);

  // Fixed-range master scale; state speed/color communicate urgency, amplitude is subtle
  const masterScale = useMemo(
    () => breath.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] }),
    [],
  );

  useEffect(() => {
    const cfg = ORB_STATES[state];

    // Hard-reset before starting new cycle — prevents mid-cycle visual jump
    blobs.forEach(b => { b.t.stopAnimation(); b.t.setValue(0); });
    breath.stopAnimation(); breath.setValue(0);
    haloOpacity.stopAnimation();

    const blobAnims = blobs.map((b, i) => {
      const dur = cfg.speed * (0.85 + i * 0.18);
      return Animated.loop(Animated.sequence([
        Animated.timing(b.t, { toValue: 1, duration: dur,        easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(b.t, { toValue: 0, duration: dur * 1.05, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]));
    });

    const breathAnim = Animated.loop(Animated.sequence([
      Animated.timing(breath, { toValue: 1, duration: cfg.speed * 0.55, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breath, { toValue: 0, duration: cfg.speed * 0.55, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));

    const haloAnim = Animated.timing(haloOpacity, {
      toValue: cfg.glow, duration: 600,
      easing: Easing.out(Easing.ease), useNativeDriver: true,
    });

    blobAnims.forEach(a => a.start());
    breathAnim.start();
    haloAnim.start();

    return () => {
      blobAnims.forEach(a => a.stop());
      breathAnim.stop();
      haloAnim.stop();
    };
  }, [state]);

  const cfg      = ORB_STATES[state];
  const blobSize = size * 0.62;
  const haloSize = size * 1.05;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer glow halo */}
      <Animated.View style={{
        position: 'absolute',
        width: haloSize, height: haloSize, borderRadius: haloSize / 2,
        backgroundColor: cfg.palette[0],
        opacity: haloOpacity,
        transform: [{ scale: masterScale }],
      }} />

      {/* Inner orb */}
      <Animated.View style={{
        width: size * 0.78, height: size * 0.78, borderRadius: size * 0.39,
        backgroundColor: '#0a1426',
        borderWidth: 1, borderColor: cfg.palette[0] + '60',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        transform: [{ scale: masterScale }],
        shadowColor: cfg.palette[0],
        shadowOpacity: 0.55,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 0 },
        elevation: 16,
      }}>
        {blobs.map((_, i) => (
          <Animated.View key={i} style={[{
            position: 'absolute',
            width: blobSize, height: blobSize, borderRadius: blobSize / 2,
            backgroundColor: cfg.palette[i % cfg.palette.length],
            opacity: 0.55,
          }, blobStyles[i]]} />
        ))}

        <View style={{
          position: 'absolute',
          width: size * 0.22, height: size * 0.22, borderRadius: size * 0.11,
          backgroundColor: '#ffffff', opacity: 0.10,
          top: size * 0.18, left: size * 0.20,
        }} />

        {state === 'idle' && (
          <Ionicons name="fish" size={size * 0.18} color="#94a3b8" style={{ opacity: 0.45 }} />
        )}
      </Animated.View>
    </View>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 160),
        Animated.timing(d, { toValue: -7, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(d, { toValue:  0, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(400),
      ]))
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 }}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={{
          width: 7, height: 7, borderRadius: 3.5,
          backgroundColor: '#64748b',
          transform: [{ translateY: d }],
        }} />
      ))}
    </View>
  );
}

// ─── Message bubble — Claude.ai/ChatGPT style ─────────────────────────────────
// User: right-aligned with subtle blue tint, no avatar
// Veronica: full-width, no hard bubble, small avatar + name header
function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'user';
  const time = msg.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isUser) {
    return (
      <View style={{ paddingHorizontal: 16, marginBottom: 16, alignItems: 'flex-end' }}>
        <View style={{
          maxWidth: '80%',
          backgroundColor: 'rgba(29,78,216,0.20)',
          borderRadius: 18, borderTopRightRadius: 4,
          paddingHorizontal: 16, paddingVertical: 10,
          borderWidth: 1, borderColor: 'rgba(37,99,235,0.28)',
        }}>
          <Text selectable style={{ fontSize: 15, color: '#e2e8f0', lineHeight: 23 }}>
            {msg.text}
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: '#334155', marginTop: 4 }}>{time}</Text>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 }}>
        <View style={{
          width: 22, height: 22, borderRadius: 11,
          backgroundColor: '#0c4a6e',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="fish" size={11} color="#38bdf8" />
        </View>
        <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600', letterSpacing: 0.2 }}>
          Veronica
        </Text>
        <Text style={{ fontSize: 11, color: '#1e293b' }}>{time}</Text>
      </View>
      <Text selectable style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 26 }}>
        {msg.text}
      </Text>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function FishHealthScreen() {
  const insets  = useSafeAreaInsets();
  const api     = useApi();
  const sr      = useSpeechRecognition();
  const sensors = useSensors();
  const { on }  = useSocket();

  const [msgs, setMsgs]         = useState<Msg[]>([]);
  const [input, setInput]       = useState('');
  const [callActive, setCall]   = useState(false);
  const [listening, setListen]  = useState(false);
  const [loading, setLoading]   = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [fishCount, setFishCount] = useState(0);
  const [ttsEnabled, setTts]      = useState(true);
  const [llmOffline, setLlmOffline] = useState(false);
  const [interimText, setInterim] = useState('');
  const [micDenied, setMicDenied] = useState(false);

  const scrollRef    = useRef<ScrollView>(null);
  const callRef      = useRef(callActive);
  const loadingRef   = useRef(loading);
  const errorStreak    = useRef(0);
  const listenRetryRef = useRef(0);   // cap rapid blink when STT fires onend with no result
  callRef.current    = callActive;
  loadingRef.current = loading;

  const orbState: keyof typeof ORB_STATES =
    listening ? 'listening' : loading ? 'thinking' : speaking ? 'speaking' : 'idle';

  // Greeting + fish count
  useEffect(() => {
    setMsgs([{
      role: 'veronica',
      text: "Hi! I'm Veronica, your AI aquarium advisor. I have live access to your tank. Ask me anything — water quality, fish health, feeding advice.",
      ts: new Date(),
    }]);
    api.getFishCount().then(r => setFishCount(r.data?.count ?? 0)).catch(() => null);
    return on('fish:count', (d: any) => setFishCount(d?.count ?? 0));
  }, []);

  const scrollBottom = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

  const askVeronica = useCallback(async (rawText: string) => {
    if (!rawText.trim() || loadingRef.current) return;
    const text = rawText.trim();
    setMsgs(p => [...p, { role: 'user', text, ts: new Date() }]);
    setLoading(true);
    scrollBottom();

    const ctx = sensorContext(sensors, fishCount);
    let reply = '';
    let errored = false;
    try {
      const r = await api.voiceQuery(`[Live tank: ${ctx}] User: ${text}`);
      // Backend returns { response, aiOffline } — aiOffline=true when Ollama is unreachable
      const aiOffline = r?.data?.aiOffline === true;
      reply = String(r?.data?.response ?? r?.data ?? 'Connection error.');
      if (aiOffline) {
        errored = true;
        errorStreak.current += 1;
        if (errorStreak.current >= 2) setLlmOffline(true);
      } else {
        errorStreak.current = 0;
        setLlmOffline(false);
      }
    } catch {
      reply = "I can't reach my brain right now. The AI service may be offline — try again in a moment, or keep typing and I'll catch up.";
      errored = true;
      errorStreak.current += 1;
      if (errorStreak.current >= 2) setLlmOffline(true);
    }

    setMsgs(p => [...p, { role: 'veronica', text: reply, ts: new Date() }]);
    setLoading(false);
    scrollBottom();

    // Speak only when in call mode (or always on native if TTS enabled).
    // After speech ends, if call is still active and STT is available, resume
    // listening so the conversation keeps flowing — even if the request errored.
    const shouldSpeak = ttsEnabled && (callRef.current || Platform.OS !== 'web');
    if (shouldSpeak) {
      setSpeaking(true);
      await speakText(reply, () => {
        setSpeaking(false);
        if (callRef.current && sr.supported) {
          // small debounce so the mic doesn't pick up the tail of TTS
          setTimeout(() => { if (callRef.current && !loadingRef.current) startListening(); }, 250);
        }
      });
    } else if (callRef.current && sr.supported && !errored) {
      // No TTS but still in call — resume listening anyway.
      setTimeout(() => { if (callRef.current && !loadingRef.current) startListening(); }, 200);
    }
  }, [sensors, fishCount, ttsEnabled]);

  const startListening = useCallback(() => {
    if (!callRef.current || !sr.supported) return;
    setMicDenied(false);
    setListen(true);
    const ok = sr.start(
      (t) => {
        listenRetryRef.current = 0;
        setInterim('');
        setListen(false); stopSpeaking(); setSpeaking(false); askVeronica(t);
      },
      (got, err) => {
        setInterim('');
        setListen(false);
        if (err === 'not-allowed') { setMicDenied(true); return; }
        if (got) { listenRetryRef.current = 0; return; }
        listenRetryRef.current += 1;
        if (listenRetryRef.current <= 4 && callRef.current && !loadingRef.current)
          setTimeout(() => { if (callRef.current) startListening(); }, 600);
      },
      (interim) => setInterim(interim),
    );
    if (!ok) setListen(false);
  }, [sr, askVeronica]);

  const toggleCall = useCallback(() => {
    if (callActive) {
      sr.abort(); stopSpeaking();
      callRef.current = false;           // update ref immediately
      setCall(false); setListen(false); setSpeaking(false);
      setInterim(''); setMicDenied(false);
      listenRetryRef.current = 0;
    } else {
      listenRetryRef.current = 0;
      setInterim(''); setMicDenied(false);
      callRef.current = true;            // update ref before timeout fires
      setCall(true);
      if (sr.supported) setTimeout(startListening, 300);
    }
  }, [callActive, sr, startListening]);

  const sendText = () => {
    const t = input.trim(); if (!t) return;
    setInput('');
    if (listening) { sr.abort(); setListen(false); }
    askVeronica(t);
  };

  const statusLabel = listening ? 'Listening...'
    : loading   ? 'Thinking...'
    : speaking  ? 'Speaking...'
    : callActive ? (Platform.OS === 'web' ? 'Ready — speak or type' : 'Voice mode active')
    : 'Tap call to start voice';

  const statusColor = listening ? '#22c55e' : loading ? '#38bdf8' : speaking ? '#f8fafc' : callActive ? '#34d399' : '#94a3b8';

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />

      {/* ── Minimal header ── */}
      <View style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
      }}>
        <View style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: '#0c4a6e',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="fish" size={18} color="#38bdf8" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#f1f5f9', letterSpacing: -0.3 }}>
            Veronica
          </Text>
          <Text style={{ fontSize: 11, color: '#475569' }}>AI aquarium assistant</Text>
        </View>
        {fishCount > 0 && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            paddingHorizontal: 8, paddingVertical: 4,
            borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.08)',
            borderWidth: 1, borderColor: 'rgba(16,185,129,0.18)',
          }}>
            <Ionicons name="fish-outline" size={11} color="#10b981" />
            <Text style={{ fontSize: 11, color: '#10b981', fontWeight: '600' }}>{fishCount} fish</Text>
          </View>
        )}
      </View>

      {/* ── Offline banner ── */}
      {llmOffline && (
        <View style={{
          marginHorizontal: 14, marginTop: 8,
          flexDirection: 'row', alignItems: 'center', gap: 10,
          paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
          backgroundColor: 'rgba(251,191,36,0.08)',
          borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)',
        }}>
          <Ionicons name="warning-outline" size={16} color="#fbbf24" />
          <Text style={{ flex: 1, fontSize: 12, color: '#fde68a', lineHeight: 16 }}>
            AI (Ollama) unreachable — sensor-only responses until it's back.
          </Text>
        </View>
      )}

      {/* ── Messages ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 12 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {msgs.map((m, i) => <Bubble key={i} msg={m} />)}

        {/* Live transcription ghost — right-aligned, italic */}
        {listening && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16, alignItems: 'flex-end' }}>
            <View style={{
              maxWidth: '80%',
              backgroundColor: 'rgba(29,78,216,0.15)',
              borderRadius: 18, borderTopRightRadius: 4,
              paddingHorizontal: 16, paddingVertical: 10,
              borderWidth: 1, borderColor: 'rgba(37,99,235,0.22)',
              opacity: 0.85,
            }}>
              {interimText ? (
                <Text style={{ fontSize: 15, color: '#94a3b8', fontStyle: 'italic', lineHeight: 22 }}>
                  {interimText}
                </Text>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="mic" size={12} color="#22c55e" />
                  <Text style={{ fontSize: 13, color: '#475569', fontStyle: 'italic' }}>listening…</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Veronica typing */}
        {loading && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#0c4a6e', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="fish" size={11} color="#38bdf8" />
              </View>
              <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600' }}>Veronica</Text>
            </View>
            <TypingDots />
          </View>
        )}
      </ScrollView>

      {/* ── Input bar ── */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{
          flexDirection: 'row', alignItems: 'flex-end', gap: 8,
          paddingHorizontal: 14, paddingTop: 10,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 16,
          borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
          backgroundColor: '#020617',
        }}>
          <TextInput
            style={{
              flex: 1, minHeight: 46, maxHeight: 120,
              backgroundColor: '#0f172a',
              borderWidth: 1,
              borderColor: input ? 'rgba(56,189,248,0.22)' : 'rgba(255,255,255,0.07)',
              borderRadius: 24, paddingHorizontal: 18,
              paddingTop: Platform.OS === 'ios' ? 13 : 11,
              paddingBottom: Platform.OS === 'ios' ? 13 : 11,
              fontSize: 15, color: '#e2e8f0', lineHeight: 22,
            }}
            placeholder="Message Veronica…"
            placeholderTextColor="#475569"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendText}
            returnKeyType="send"
            blurOnSubmit={false}
            multiline
          />

          {/* Mic — opens full-screen voice */}
          {!input.trim() && (
            <Pressable
              onPress={toggleCall}
              style={({ pressed }) => ({
                width: 46, height: 46, borderRadius: 23,
                backgroundColor: '#0f172a',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="mic-outline" size={20} color="#64748b" />
            </Pressable>
          )}

          {/* Send */}
          {(input.trim() || loading) && (
            <Pressable
              onPress={sendText}
              disabled={!input.trim() || loading}
              style={({ pressed }) => ({
                width: 46, height: 46, borderRadius: 23,
                backgroundColor: input.trim() && !loading ? '#0891b2' : '#0f172a',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1,
                borderColor: input.trim() && !loading ? 'rgba(8,145,178,0.35)' : 'rgba(255,255,255,0.06)',
                opacity: pressed ? 0.75 : 1,
              })}
            >
              {loading
                ? <ActivityIndicator size="small" color="#94a3b8" />
                : <Ionicons name="arrow-up" size={20} color={input.trim() ? '#fff' : '#475569'} />
              }
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* ── Full-screen voice overlay — ChatGPT Advanced Voice style ── */}
      {callActive && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#020617',
          zIndex: 50,
        }}>
          {/* Top row */}
          <View style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 11, color: '#334155', fontWeight: '700', letterSpacing: 1.2 }}>
              VOICE MODE
            </Text>
            <Pressable
              onPress={toggleCall}
              style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={18} color="#64748b" />
            </Pressable>
          </View>

          {/* Centered orb — tappable to manually restart listening */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <Pressable
              onPress={() => {
                if (!listening && !loading && !speaking) {
                  listenRetryRef.current = 0;
                  startListening();
                }
              }}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              accessibilityLabel="Tap to speak"
            >
              <VoiceOrb state={orbState} size={200} />
            </Pressable>

            <Text style={{ fontSize: 18, color: statusColor, fontWeight: '600', letterSpacing: -0.3 }}>
              {listening ? 'Listening…' : speaking ? 'Speaking…' : loading ? 'Thinking…' : 'Tap orb to speak'}
            </Text>

            {micDenied && (
              <View style={{
                marginHorizontal: 32, paddingHorizontal: 16, paddingVertical: 10,
                borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.10)',
                borderWidth: 1, borderColor: 'rgba(239,68,68,0.28)',
                flexDirection: 'row', alignItems: 'center', gap: 8,
              }}>
                <Ionicons name="mic-off-outline" size={15} color="#f87171" />
                <Text style={{ flex: 1, fontSize: 12, color: '#fca5a5', lineHeight: 18 }}>
                  Microphone access denied. Allow mic in browser settings, then tap the orb.
                </Text>
              </View>
            )}

            {/* Transcript / last message preview */}
            <View style={{ marginHorizontal: 40, minHeight: 52, alignItems: 'center', justifyContent: 'center' }}>
              {(interimText || msgs.length > 0) && (
                <Text
                  numberOfLines={3}
                  style={{
                    fontSize: 14, color: '#475569', textAlign: 'center', lineHeight: 22,
                    fontStyle: interimText ? 'italic' : 'normal',
                  }}
                >
                  {interimText
                    ? interimText
                    : (msgs[msgs.length - 1]?.text ?? '').slice(0, 130) +
                      ((msgs[msgs.length - 1]?.text?.length ?? 0) > 130 ? '…' : '')}
                </Text>
              )}
            </View>
          </View>

          {/* Bottom controls */}
          <View style={{
            paddingBottom: insets.bottom + 32,
            paddingHorizontal: 48,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            {/* TTS mute */}
            <Pressable
              onPress={() => setTts(v => !v)}
              style={{
                width: 58, height: 58, borderRadius: 29,
                backgroundColor: ttsEnabled ? 'rgba(8,145,178,0.10)' : 'rgba(255,255,255,0.05)',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: ttsEnabled ? 'rgba(8,145,178,0.28)' : 'rgba(255,255,255,0.08)',
              }}
            >
              <Ionicons
                name={ttsEnabled ? 'volume-high' : 'volume-mute'}
                size={22}
                color={ttsEnabled ? '#38bdf8' : '#475569'}
              />
            </Pressable>

            {/* End call */}
            <Pressable
              onPress={toggleCall}
              style={{
                width: 72, height: 72, borderRadius: 36,
                backgroundColor: '#dc2626',
                alignItems: 'center', justifyContent: 'center',
                shadowColor: '#dc2626', shadowOpacity: 0.45,
                shadowRadius: 20, shadowOffset: { width: 0, height: 4 },
                elevation: 10,
              }}
            >
              <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            </Pressable>

            {/* Back to chat */}
            <Pressable
              onPress={toggleCall}
              style={{
                width: 58, height: 58, borderRadius: 29,
                backgroundColor: 'rgba(255,255,255,0.05)',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Ionicons name="chatbubble-outline" size={22} color="#475569" />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
