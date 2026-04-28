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

// ─── ChatGPT-style orb ───────────────────────────────────────────────────────
const ORB_STATES = {
  idle:      { color: '#94a3b8', speed: 2400, intensity: 0.08 },
  listening: { color: '#22c55e', speed: 700,  intensity: 0.55 },
  thinking:  { color: '#38bdf8', speed: 1100, intensity: 0.35 },
  speaking:  { color: '#ffffff', speed: 500,  intensity: 0.65 },
};

function VoiceOrb({ state }: { state: keyof typeof ORB_STATES }) {
  const rings = useRef(
    [0, 1, 2, 3].map(() => ({
      scale:   new Animated.Value(1),
      opacity: new Animated.Value(0),
    }))
  ).current;
  const coreScale = useRef(new Animated.Value(1)).current;
  const coreGlow  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const cfg = ORB_STATES[state];

    // Stop previous
    rings.forEach(r => { r.scale.stopAnimation(); r.opacity.stopAnimation(); });
    coreScale.stopAnimation(); coreGlow.stopAnimation();

    if (state === 'idle') {
      rings.forEach(r => { r.scale.setValue(1); r.opacity.setValue(0); });
      Animated.loop(Animated.sequence([
        Animated.timing(coreScale, { toValue: 1.04, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(coreScale, { toValue: 1,    duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])).start();
      return;
    }

    // Animate each ring with stagger
    const anims = rings.map((r, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * (cfg.speed / 4)),
        Animated.parallel([
          Animated.timing(r.scale,   { toValue: 1 + 0.35 + i * 0.18, duration: cfg.speed * 0.7, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(r.opacity, { toValue: cfg.intensity - i * 0.06, duration: cfg.speed * 0.25, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.timing(r.opacity,   { toValue: 0, duration: cfg.speed * 0.45, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.timing(r.scale,     { toValue: 1, duration: 0, useNativeDriver: true }),
      ]))
    );

    // Core pulse
    const corePulse = Animated.loop(Animated.sequence([
      Animated.timing(coreScale, { toValue: 1.08, duration: cfg.speed * 0.5, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(coreScale, { toValue: 1,    duration: cfg.speed * 0.5, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    const glowPulse = Animated.loop(Animated.sequence([
      Animated.timing(coreGlow, { toValue: 1, duration: cfg.speed * 0.5, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(coreGlow, { toValue: 0, duration: cfg.speed * 0.5, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));

    anims.forEach(a => a.start());
    corePulse.start();
    glowPulse.start();

    return () => { anims.forEach(a => a.stop()); corePulse.stop(); glowPulse.stop(); };
  }, [state]);

  const cfg   = ORB_STATES[state];
  const color = cfg.color;

  return (
    <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
      {/* Expanding rings */}
      {rings.map((r, i) => (
        <Animated.View key={i} style={{
          position: 'absolute',
          width: 100 + i * 8, height: 100 + i * 8,
          borderRadius: 60 + i * 4,
          borderWidth: 1.5,
          borderColor: color,
          opacity: r.opacity,
          transform: [{ scale: r.scale }],
        }} />
      ))}

      {/* Glow halo */}
      <Animated.View style={{
        position: 'absolute',
        width: 110, height: 110, borderRadius: 55,
        backgroundColor: color,
        opacity: Animated.multiply(coreGlow, new Animated.Value(0.12)),
        transform: [{ scale: coreScale }],
      }} />

      {/* Core orb */}
      <Animated.View style={{
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: '#0f172a',
        borderWidth: 2,
        borderColor: color,
        alignItems: 'center', justifyContent: 'center',
        transform: [{ scale: coreScale }],
        shadowColor: color,
        shadowOpacity: 0.6,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 0 },
        elevation: 12,
      }}>
        {/* Inner gradient layers */}
        <View style={{ position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: color, opacity: 0.06 }} />
        <View style={{ position: 'absolute', width: 50, height: 50, borderRadius: 25, backgroundColor: color, opacity: 0.10 }} />
        <Ionicons
          name={
            state === 'listening' ? 'mic' :
            state === 'thinking'  ? 'sparkles' :
            state === 'speaking'  ? 'volume-high' :
            'fish'
          }
          size={32}
          color={color}
        />
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
  const [online, setOnline]     = useState<boolean | null>(null);
  const [ttsEnabled, setTts]    = useState(true);

  const scrollRef    = useRef<ScrollView>(null);
  const callRef      = useRef(callActive);
  const loadingRef   = useRef(loading);
  callRef.current    = callActive;
  loadingRef.current = loading;

  const orbState: keyof typeof ORB_STATES =
    listening ? 'listening' : loading ? 'thinking' : speaking ? 'speaking' : 'idle';

  // Backend ping
  useEffect(() => {
    const check = () => api.getLatest().then(() => setOnline(true)).catch(() => setOnline(false));
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, []);

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
    try {
      const r = await api.voiceQuery(`[Live tank: ${ctx}] User: ${text}`);
      reply = String(r?.data?.response ?? r?.data ?? 'Connection error.');
    } catch {
      reply = 'Could not reach Veronica. Make sure backend and Ollama are running.';
    }

    setMsgs(p => [...p, { role: 'veronica', text: reply, ts: new Date() }]);
    setLoading(false);
    scrollBottom();

    if (ttsEnabled && (callRef.current || Platform.OS !== 'web')) {
      setSpeaking(true);
      await speakText(reply, () => {
        setSpeaking(false);
        if (callRef.current && sr.supported) startListening();
      });
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

      {/* ── Veronica controls bar ── */}
      <View style={{
        paddingTop: 10,
        paddingBottom: 12, paddingHorizontal: 18,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
        backgroundColor: '#020617',
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        {/* Avatar */}
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#0891b2', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="fish" size={20} color="#fff" />
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.2 }}>Veronica</Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
              backgroundColor: online === true ? '#16a34a18' : online === false ? '#dc262618' : 'rgba(148,163,184,0.1)',
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: online === true ? '#22c55e' : online === false ? '#ef4444' : '#94a3b8' }} />
              <Text style={{ fontSize: 10, fontWeight: '800', color: online === true ? '#22c55e' : online === false ? '#ef4444' : '#94a3b8', letterSpacing: 0.5 }}>
                {online === true ? 'ONLINE' : online === false ? 'OFFLINE' : '···'}
              </Text>
            </View>
          </View>
          {/* Status line */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
            {(listening || speaking) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                {[0, 1, 2, 3].map(i => (
                  <View key={i} style={{ width: 2.5, height: 8 + i * 3, borderRadius: 2, backgroundColor: statusColor, opacity: 0.7 + i * 0.07 }} />
                ))}
              </View>
            )}
            {!listening && !speaking && (
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
            )}
            <Text style={{ fontSize: 12, color: statusColor, fontWeight: '600' }}>{statusLabel}</Text>
          </View>
        </View>

        {/* TTS toggle */}
        <Pressable onPress={() => setTts(v => !v)}
          accessibilityLabel={ttsEnabled ? 'Mute Veronica' : 'Unmute Veronica'} accessibilityRole="button"
          style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: ttsEnabled ? '#0891b218' : 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: ttsEnabled ? '#0891b240' : 'rgba(255,255,255,0.08)' }}>
          <Ionicons name={ttsEnabled ? 'volume-high' : 'volume-mute'} size={18} color={ttsEnabled ? '#38bdf8' : '#94a3b8'} />
        </Pressable>

        {/* Call button */}
        <Pressable onPress={toggleCall}
          accessibilityLabel={callActive ? 'End voice call' : 'Start voice call'} accessibilityRole="button"
          style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: callActive ? '#dc2626' : '#16a34a',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: callActive ? '#dc2626' : '#16a34a',
            shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
            elevation: 6,
          }}>
          <Ionicons name={callActive ? 'call' : 'call'} size={20} color="#fff" style={callActive ? { transform: [{ rotate: '135deg' }] } : undefined} />
        </Pressable>
      </View>

      {/* ── Orb (voice mode) ── */}
      {callActive && (
        <View style={{
          alignItems: 'center', paddingVertical: 24,
          borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
        }}>
          <VoiceOrb state={orbState} />
          <Text style={{ fontSize: 13, color: statusColor, fontWeight: '600', marginTop: 4 }}>
            {listening ? 'Speak now...' : speaking ? 'Veronica is speaking...' : loading ? 'Thinking...' : Platform.OS === 'web' ? 'Listening' : 'Type below or wait for response'}
          </Text>
          {Platform.OS !== 'web' && !sr.supported && (
            <Text style={{ fontSize: 11, color: '#475569', marginTop: 6, textAlign: 'center', paddingHorizontal: 32 }}>
              Voice input not available — type your question below. TTS will read responses aloud.
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
          flexDirection: 'row', alignItems: 'flex-end', gap: 10,
          paddingHorizontal: 14, paddingTop: 10,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 16,
          borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
          backgroundColor: '#020617',
        }}>
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
