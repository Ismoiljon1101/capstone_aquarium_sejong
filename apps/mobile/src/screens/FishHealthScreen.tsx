import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import AppHeader from '../components/AppHeader';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

declare const window: any;

// ─── Types ───────────────────────────────────────────────────────────────────
interface Msg { role: 'user' | 'veronica'; text: string; ts: Date; }

// ─── Web-only STT ─────────────────────────────────────────────────────────────
function useSpeechRecognition() {
  const recRef = useRef<any>(null);
  const supported = Platform.OS === 'web' && typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = useCallback((onResult: (t: string) => void, onEnd: (got: boolean) => void) => {
    if (!supported) return false;
    try { recRef.current?.abort(); } catch {}
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-US'; rec.continuous = false; rec.interimResults = false;
    let got = false;
    rec.onresult = (e: any) => { const t = e.results[0]?.[0]?.transcript?.trim() ?? ''; if (t) { got = true; onResult(t); } };
    rec.onend   = () => onEnd(got);
    rec.onerror = (e: any) => { if (e.error !== 'no-speech') console.warn('STT:', e.error); onEnd(got); };
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
  // Three morphing blobs, each animated on its own phase
  const blobs = useRef(
    [0, 1, 2].map(() => ({
      t: new Animated.Value(0),       // 0..1 phase
    }))
  ).current;
  const breath = useRef(new Animated.Value(0)).current;
  const haloOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const cfg = ORB_STATES[state];

    // stop previous
    blobs.forEach(b => b.t.stopAnimation());
    breath.stopAnimation();
    haloOpacity.stopAnimation();

    // Each blob loops 0→1→0 at slightly different speeds for organic motion
    const blobAnims = blobs.map((b, i) => {
      const dur = cfg.speed * (0.85 + i * 0.18);
      return Animated.loop(Animated.sequence([
        Animated.timing(b.t, { toValue: 1, duration: dur,        easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(b.t, { toValue: 0, duration: dur * 1.05, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]));
    });

    // Breath = global scale pulse
    const breathAnim = Animated.loop(Animated.sequence([
      Animated.timing(breath, { toValue: 1, duration: cfg.speed * 0.55, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breath, { toValue: 0, duration: cfg.speed * 0.55, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));

    // Halo opacity = state intensity
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

  const cfg = ORB_STATES[state];

  // Master scale
  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [1 - cfg.amp / 2, 1 + cfg.amp / 2] });

  // Each blob: translate on small ellipse, scale slightly, color cycles via opacity
  const blobStyles = blobs.map((b, i) => {
    const a = (i / 3) * Math.PI * 2; // base angle
    const r = size * 0.12;
    const tx = b.t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [Math.cos(a) * r, Math.cos(a + Math.PI) * r, Math.cos(a) * r] });
    const ty = b.t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [Math.sin(a) * r, Math.sin(a + Math.PI) * r, Math.sin(a) * r] });
    const blobScale = b.t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.85, 1.15, 0.85] });
    return { transform: [{ translateX: tx }, { translateY: ty }, { scale: blobScale }] };
  });

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
        transform: [{ scale }],
      }} />

      {/* Inner clipped orb (rounded square so blobs blend like a gradient ball) */}
      <Animated.View style={{
        width: size * 0.78, height: size * 0.78, borderRadius: size * 0.39,
        backgroundColor: '#0a1426',
        borderWidth: 1, borderColor: cfg.palette[0] + '60',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        transform: [{ scale }],
        shadowColor: cfg.palette[0],
        shadowOpacity: 0.55,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 0 },
        elevation: 16,
      }}>
        {/* Three morphing colored blobs */}
        {blobs.map((_, i) => (
          <Animated.View key={i} style={[{
            position: 'absolute',
            width: blobSize, height: blobSize, borderRadius: blobSize / 2,
            backgroundColor: cfg.palette[i % cfg.palette.length],
            opacity: 0.55,
          }, blobStyles[i]]} />
        ))}

        {/* Soft white center highlight */}
        <View style={{
          position: 'absolute',
          width: size * 0.22, height: size * 0.22, borderRadius: size * 0.11,
          backgroundColor: '#ffffff', opacity: 0.10,
          top: size * 0.18, left: size * 0.20,
        }} />

        {/* State icon (subtle, only shown idle) */}
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

// ─── Message bubble ───────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'user';
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      alignItems: 'flex-end',
      marginBottom: 10,
      paddingHorizontal: 4,
    }}>
      {!isUser && (
        <View style={{
          width: 32, height: 32, borderRadius: 16,
          backgroundColor: '#0891b2',
          alignItems: 'center', justifyContent: 'center',
          marginRight: 8, marginBottom: 2, flexShrink: 0,
        }}>
          <Ionicons name="fish" size={16} color="#fff" />
        </View>
      )}

      <View style={{ maxWidth: '75%' }}>
        <View style={{
          backgroundColor: isUser ? '#1d4ed8' : '#0f172a',
          borderRadius: 20,
          borderTopRightRadius: isUser ? 5 : 20,
          borderTopLeftRadius:  isUser ? 20 : 5,
          paddingHorizontal: 15, paddingVertical: 11,
          borderWidth: 1,
          borderColor: isUser ? '#2563eb40' : 'rgba(255,255,255,0.07)',
        }}>
          <Text selectable style={{ fontSize: 15, color: '#e2e8f0', lineHeight: 22 }}>
            {msg.text}
          </Text>
        </View>
        <Text style={{
          fontSize: 11, color: '#64748b', marginTop: 4,
          textAlign: isUser ? 'right' : 'left',
          marginHorizontal: 4,
        }}>
          {msg.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      {isUser && (
        <View style={{
          width: 32, height: 32, borderRadius: 16,
          backgroundColor: '#1e3a5f',
          alignItems: 'center', justifyContent: 'center',
          marginLeft: 8, marginBottom: 2, flexShrink: 0,
        }}>
          <Ionicons name="person" size={16} color="#cbd5e1" />
        </View>
      )}
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
  const [ttsEnabled, setTts]    = useState(true);
  const [llmOffline, setLlmOffline] = useState(false);

  const scrollRef    = useRef<ScrollView>(null);
  const callRef      = useRef(callActive);
  const loadingRef   = useRef(loading);
  const errorStreak  = useRef(0);
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
      reply = String(r?.data?.response ?? r?.data ?? 'Connection error.');
      errorStreak.current = 0;
      setLlmOffline(false);
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
    setListen(true);
    const ok = sr.start(
      (t) => { setListen(false); stopSpeaking(); setSpeaking(false); askVeronica(t); },
      (got) => {
        setListen(false);
        if (!got && callRef.current && !loadingRef.current)
          setTimeout(() => { if (callRef.current) startListening(); }, 500);
      },
    );
    if (!ok) setListen(false);
  }, [sr, askVeronica]);

  const toggleCall = useCallback(() => {
    if (callActive) {
      sr.abort(); stopSpeaking();
      setCall(false); setListen(false); setSpeaking(false);
    } else {
      setCall(true);
      if (sr.supported) setTimeout(() => startListening(), 200);
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
      <AppHeader title="Fish AI" subtitle="Veronica — your aquarium assistant" />

      {/* LLM offline banner */}
      {llmOffline && (
        <View style={{
          marginHorizontal: 14, marginTop: 8,
          flexDirection: 'row', alignItems: 'center', gap: 10,
          paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
          backgroundColor: 'rgba(251,191,36,0.10)',
          borderWidth: 1, borderColor: 'rgba(251,191,36,0.30)',
        }}>
          <Ionicons name="warning-outline" size={16} color="#fbbf24" />
          <Text style={{ flex: 1, fontSize: 12, color: '#fde68a', lineHeight: 16 }}>
            AI service unreachable. Check Ollama / backend. You can keep typing.
          </Text>
        </View>
      )}

      {/* Status pill (shown only when active) */}
      {(listening || loading || speaking) && (
        <View style={{
          alignItems: 'center', paddingTop: 8, paddingBottom: 6,
          backgroundColor: '#020617',
        }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
            backgroundColor: statusColor + '15',
            borderWidth: 1, borderColor: statusColor + '30',
          }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
            <Text style={{ fontSize: 11, color: statusColor, fontWeight: '700', letterSpacing: 0.3 }}>{statusLabel}</Text>
          </View>
        </View>
      )}

      {/* ── Orb (voice mode) ── */}
      {callActive && (
        <View style={{
          alignItems: 'center', paddingTop: 18, paddingBottom: 22,
          borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
        }}>
          <VoiceOrb state={orbState} size={200} />
          <Text style={{ fontSize: 14, color: statusColor, fontWeight: '700', marginTop: 12, letterSpacing: -0.2 }}>
            {listening ? 'Listening — speak now' : speaking ? 'Veronica speaking…' : loading ? 'Thinking…' : Platform.OS === 'web' ? 'Tap and speak' : 'Type below or wait'}
          </Text>
          {Platform.OS !== 'web' && !sr.supported && (
            <Text style={{ fontSize: 11, color: '#475569', marginTop: 6, textAlign: 'center', paddingHorizontal: 32 }}>
              Voice input not available on this device — type your question. TTS will read replies aloud.
            </Text>
          )}
        </View>
      )}

      {/* ── Messages ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 16, paddingBottom: 8 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {msgs.map((m, i) => <Bubble key={i} msg={m} />)}

        {loading && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, paddingHorizontal: 4 }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#0891b2', alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 2 }}>
              <Text style={{ fontSize: 14 }}>🐟</Text>
            </View>
            <View style={{ backgroundColor: '#0f172a', borderRadius: 20, borderTopLeftRadius: 5, paddingHorizontal: 16, paddingVertical: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}>
              <TypingDots />
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Input bar ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={{
          flexDirection: 'row', alignItems: 'flex-end', gap: 8,
          paddingHorizontal: 14, paddingTop: 10,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 16,
          borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
          backgroundColor: '#020617',
        }}>
          {/* TTS toggle */}
          <Pressable onPress={() => setTts(v => !v)}
            accessibilityLabel={ttsEnabled ? 'Mute Veronica' : 'Unmute Veronica'} accessibilityRole="button"
            style={{
              width: 46, height: 46, borderRadius: 23,
              backgroundColor: ttsEnabled ? 'rgba(8,145,178,0.12)' : '#0f172a',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: ttsEnabled ? '#0891b240' : 'rgba(255,255,255,0.08)',
            }}>
            <Ionicons name={ttsEnabled ? 'volume-high' : 'volume-mute'} size={18} color={ttsEnabled ? '#38bdf8' : '#94a3b8'} />
          </Pressable>

          {/* Call button */}
          <Pressable onPress={toggleCall}
            accessibilityLabel={callActive ? 'End voice call' : 'Start voice call'} accessibilityRole="button"
            style={{
              width: 46, height: 46, borderRadius: 23,
              backgroundColor: callActive ? '#dc2626' : '#16a34a',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: callActive ? '#dc2626' : '#16a34a',
              shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
              elevation: 4,
            }}>
            <Ionicons name="call" size={18} color="#fff" style={callActive ? { transform: [{ rotate: '135deg' }] } : undefined} />
          </Pressable>

          <TextInput
            style={{
              flex: 1, minHeight: 46, maxHeight: 120,
              backgroundColor: '#0f172a',
              borderWidth: 1,
              borderColor: input ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.08)',
              borderRadius: 24, paddingHorizontal: 18,
              paddingTop: Platform.OS === 'ios' ? 13 : 11,
              paddingBottom: Platform.OS === 'ios' ? 13 : 11,
              fontSize: 15, color: '#e2e8f0', lineHeight: 22,
            }}
            placeholder="Message Veronica..."
            placeholderTextColor="#64748b"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendText}
            returnKeyType="send"
            blurOnSubmit={false}
            multiline
          />

          <Pressable
            onPress={sendText}
            disabled={!input.trim() || loading}
            android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 22, borderless: true }}
            style={({ pressed }) => ({
              width: 46, height: 46, borderRadius: 23,
              backgroundColor: input.trim() && !loading ? '#0891b2' : '#0f172a',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1,
              borderColor: input.trim() && !loading ? '#0891b240' : 'rgba(255,255,255,0.06)',
              opacity: pressed ? 0.75 : 1,
              shadowColor: '#0891b2',
              shadowOpacity: input.trim() && !loading ? 0.4 : 0,
              shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
              elevation: input.trim() && !loading ? 4 : 0,
            })}
          >
            {loading
              ? <ActivityIndicator size="small" color="#94a3b8" />
              : <Ionicons name="arrow-up" size={20} color={input.trim() ? '#fff' : '#475569'} />
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
