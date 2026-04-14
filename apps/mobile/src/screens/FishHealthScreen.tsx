/**
 * Fish AI Screen — Veronica voice/chat assistant with live tank context.
 * Full-screen Grok/ChatGPT-style voice interface.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, Easing, StatusBar,
} from 'react-native';
import { useApi } from '../hooks/useApi';
import { useSensors, sensorContext } from '../hooks/useSensors';
import { useSocket } from '../hooks/useSocket';

declare const window: any;

// ─── Types ───────────────────────────────────────────────────────────────────
interface Msg { role: 'user' | 'veronica'; text: string; ts: Date; }

// ─── TTS ─────────────────────────────────────────────────────────────────────
function speak(text: string, onDone?: () => void) {
  if (Platform.OS !== 'web' || !('speechSynthesis' in window)) { onDone?.(); return; }
  window.speechSynthesis.cancel();
  const utt = new window.SpeechSynthesisUtterance(text);
  utt.lang = 'en-US'; utt.rate = 1.05; utt.pitch = 1.1;
  const voices = window.speechSynthesis.getVoices();
  const female = voices.find((v: any) => /female|zira|samantha|karen|google uk english female/i.test(v.name));
  if (female) utt.voice = female;
  let keepAlive: any;
  utt.onend = () => { clearInterval(keepAlive); onDone?.(); };
  utt.onerror = () => { clearInterval(keepAlive); onDone?.(); };
  window.speechSynthesis.speak(utt);
  keepAlive = setInterval(() => {
    if (!window.speechSynthesis.speaking) { clearInterval(keepAlive); return; }
    window.speechSynthesis.pause(); window.speechSynthesis.resume();
  }, 10000);
}

function stopSpeaking() {
  if (Platform.OS === 'web' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}

// ─── STT hook ────────────────────────────────────────────────────────────────
function useSpeechRecognition() {
  const recRef = useRef<any>(null);
  const supported = Platform.OS === 'web' && typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = useCallback((onResult: (t: string) => void, onEnd: (got: boolean) => void) => {
    if (!supported) return false;
    try { recRef.current?.abort(); } catch {}
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-US'; rec.continuous = false; rec.interimResults = false; rec.maxAlternatives = 1;
    let got = false;
    rec.onresult = (e: any) => { const t = e.results[0]?.[0]?.transcript?.trim() ?? ''; if (t) { got = true; onResult(t); } };
    rec.onend = () => onEnd(got);
    rec.onerror = (e: any) => { if (e.error !== 'no-speech') console.warn('STT:', e.error); onEnd(got); };
    rec.start();
    recRef.current = rec;
    return true;
  }, [supported]);

  const stop  = useCallback(() => { try { recRef.current?.stop(); }  catch {} }, []);
  const abort = useCallback(() => { try { recRef.current?.abort(); } catch {} }, []);
  return { supported, start, stop, abort };
}

// ─── Voice Orb (big animated circle when listening/speaking) ─────────────────
function VoiceOrb({ state }: { state: 'idle' | 'listening' | 'thinking' | 'speaking' }) {
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const scale3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animations = [scale1, scale2, scale3].map((s, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 200),
        Animated.timing(s, { toValue: state === 'idle' ? 1 : 1.4 + i * 0.15, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(s, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]))
    );
    if (state !== 'idle') { animations.forEach(a => a.start()); return () => animations.forEach(a => a.stop()); }
    else { [scale1, scale2, scale3].forEach(s => s.setValue(1)); }
  }, [state]);

  const baseColor = state === 'listening' ? '#22c55e'
    : state === 'thinking' ? '#38bdf8'
    : state === 'speaking' ? '#f59e0b'
    : '#1e293b';

  const icon = state === 'listening' ? '🎙️'
    : state === 'thinking' ? '⏳'
    : state === 'speaking' ? '🔊'
    : '🧠';

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 160, height: 160 }}>
      {/* Outer rings */}
      {[scale3, scale2].map((s, i) => (
        <Animated.View key={i} style={{
          position: 'absolute',
          width: 140 - i * 20, height: 140 - i * 20,
          borderRadius: 70 - i * 10,
          backgroundColor: baseColor + (i === 0 ? '10' : '18'),
          transform: [{ scale: s }],
        }} />
      ))}
      {/* Core */}
      <Animated.View style={{
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: baseColor + '30',
        borderWidth: 2, borderColor: baseColor + '80',
        alignItems: 'center', justifyContent: 'center',
        transform: [{ scale: scale1 }],
      }}>
        <Text style={{ fontSize: 28 }}>{icon}</Text>
      </Animated.View>
    </View>
  );
}

// ─── Waveform bars ───────────────────────────────────────────────────────────
function Waveform({ active }: { active: boolean }) {
  const anims = useRef([0,1,2,3,4,5,6].map(() => new Animated.Value(3))).current;
  useEffect(() => {
    if (!active) { anims.forEach(a => a.setValue(3)); return; }
    const loops = anims.map((a, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 70),
        Animated.timing(a, { toValue: 18 + (i % 3) * 5, duration: 300 + i * 30, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(a, { toValue: 3, duration: 300 + i * 30, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]))
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [active]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, height: 24, marginLeft: 8 }}>
      {anims.map((a, i) => (
        <Animated.View key={i} style={{ width: 3, height: a, borderRadius: 2, backgroundColor: '#22c55e', opacity: 0.8 }} />
      ))}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function FishHealthScreen() {
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
  const [mode, setMode]         = useState<'chat' | 'voice'>('chat');

  const scrollRef     = useRef<ScrollView>(null);
  const callRef       = useRef(callActive);
  const loadingRef    = useRef(loading);
  callRef.current     = callActive;
  loadingRef.current  = loading;

  const orbState: 'idle' | 'listening' | 'thinking' | 'speaking' =
    listening ? 'listening' : loading ? 'thinking' : speaking ? 'speaking' : 'idle';

  useEffect(() => {
    // Greeting
    setMsgs([{
      role: 'veronica',
      text: "Hi! I'm Veronica, your AI aquarium advisor. I have access to your live tank data. Ask me anything about your fish or water quality.",
      ts: new Date(),
    }]);
    api.getFishCount().then(r => setFishCount(r.data?.count ?? 0)).catch(() => null);
    const u = on('fish:count', (d: any) => setFishCount(d?.count ?? 0));
    return () => u();
  }, []);

  const scrollBottom = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

  const askVeronica = useCallback(async (rawText: string) => {
    if (!rawText.trim() || loadingRef.current) return;
    const text = rawText.trim();
    setMsgs(p => [...p, { role: 'user', text, ts: new Date() }]);
    setLoading(true); scrollBottom();

    // Inject live context so Veronica can answer "is my fish ok?" accurately
    const ctx = sensorContext(sensors, fishCount);
    const fullQuery = `[Live tank data — ${ctx}] User: ${text}`;

    let reply = '';
    try {
      const r = await api.voiceQuery(fullQuery);
      reply = String(r?.data?.response ?? r?.data ?? 'Connection error.');
    } catch {
      reply = 'Could not reach Veronica. Make sure the backend and Ollama are running.';
    }

    setMsgs(p => [...p, { role: 'veronica', text: reply, ts: new Date() }]);
    setLoading(false); scrollBottom();

    if (callRef.current) {
      setSpeaking(true);
      speak(reply, () => { setSpeaking(false); if (callRef.current) startListening(); });
    }
  }, [sensors, fishCount]);

  const startListening = useCallback(() => {
    if (!callRef.current) return;
    setListen(true);
    const ok = sr.start(
      (t) => { setListen(false); stopSpeaking(); setSpeaking(false); askVeronica(t); },
      (got) => {
        setListen(false);
        if (!got && callRef.current && !loadingRef.current)
          setTimeout(() => { if (callRef.current) startListening(); }, 500);
      },
    );
    if (!ok) {
      setListen(false); setCall(false);
      setMsgs(p => [...p, { role: 'veronica', text: 'Voice not supported. Use Chrome or Edge.', ts: new Date() }]);
    }
  }, [sr, askVeronica]);

  const toggleCall = useCallback(() => {
    if (callActive) {
      sr.abort(); stopSpeaking();
      setCall(false); setListen(false); setSpeaking(false);
    } else {
      setCall(true); setMode('voice');
      setTimeout(() => startListening(), 200);
    }
  }, [callActive, sr, startListening]);

  const forceListen = useCallback(() => {
    if (!callActive) return;
    stopSpeaking(); setSpeaking(false); sr.abort(); setListen(false);
    setTimeout(() => startListening(), 150);
  }, [callActive, sr, startListening]);

  const sendText = () => {
    const t = input.trim(); if (!t) return;
    setInput('');
    if (listening) { sr.abort(); setListen(false); }
    askVeronica(t);
  };

  // ── Status pill ──
  const statusLabel = listening ? 'Listening...' : loading ? 'Thinking...' : speaking ? 'Speaking...' : callActive ? 'Ready' : 'Tap 📞 to start voice call';
  const statusColor = listening ? '#22c55e' : loading ? '#38bdf8' : speaking ? '#f59e0b' : callActive ? '#34d399' : '#64748b';

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <StatusBar barStyle="light-content" />

      {/* ── Top bar ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
        backgroundColor: '#020617',
      }}>
        {/* Avatar */}
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#0891b2', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>🧠</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#f1f5f9' }}>Veronica AI</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 }}>
            {listening && <Waveform active />}
            {!listening && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />}
            <Text style={{ fontSize: 11, color: statusColor, fontWeight: '600' }}>{statusLabel}</Text>
          </View>
        </View>

        {/* Mode toggle */}
        <View style={{
          flexDirection: 'row', backgroundColor: '#0f172a',
          borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
        }}>
          {(['chat', 'voice'] as const).map(m => (
            <TouchableOpacity key={m} onPress={() => setMode(m)} activeOpacity={0.8}
              style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: mode === m ? '#1e3a5f' : 'transparent' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: mode === m ? '#38bdf8' : '#475569' }}>
                {m === 'chat' ? '💬' : '🎙️'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Call button */}
        <TouchableOpacity onPress={toggleCall} activeOpacity={0.8} style={{
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: callActive ? '#dc2626' : '#16a34a',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 18 }}>{callActive ? '📵' : '📞'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Voice orb (shown in voice mode or when call active) ── */}
      {(mode === 'voice' || callActive) && (
        <View style={{ alignItems: 'center', paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
          <VoiceOrb state={orbState} />
          <Text style={{ fontSize: 13, color: '#64748b', marginTop: 12 }}>
            {callActive ? (listening ? 'Speak now' : speaking ? 'Veronica is speaking...' : 'Say something') : 'Tap 📞 to start'}
          </Text>
          {callActive && (
            <TouchableOpacity onPress={forceListen} activeOpacity={0.8} style={{
              marginTop: 12, paddingHorizontal: 16, paddingVertical: 7,
              borderRadius: 20, borderWidth: 1,
              borderColor: listening ? '#22c55e55' : 'rgba(255,255,255,0.1)',
              backgroundColor: listening ? '#22c55e12' : 'rgba(255,255,255,0.04)',
            }}>
              <Text style={{ fontSize: 12, color: listening ? '#22c55e' : '#64748b', fontWeight: '600' }}>
                {listening ? '🎙️ Listening' : '🎙️ Tap to speak'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Chat messages ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {msgs.map((m, i) => (
          <View key={i} style={{
            flexDirection: 'row',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            gap: 8, alignItems: 'flex-end',
          }}>
            {m.role === 'veronica' && (
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#0891b2', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Text style={{ fontSize: 13 }}>🧠</Text>
              </View>
            )}
            <View style={{
              maxWidth: '80%',
              backgroundColor: m.role === 'user' ? '#1d4ed8' : '#0f172a',
              borderRadius: 20,
              borderTopRightRadius: m.role === 'user' ? 4 : 20,
              borderTopLeftRadius: m.role === 'veronica' ? 4 : 20,
              paddingHorizontal: 16, paddingVertical: 12,
              borderWidth: 1,
              borderColor: m.role === 'user' ? '#2563eb55' : 'rgba(255,255,255,0.07)',
            }}>
              <Text selectable style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 20 }}>{m.text}</Text>
              <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 5, textAlign: m.role === 'user' ? 'right' : 'left' }}>
                {m.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#0891b2', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 13 }}>🧠</Text>
            </View>
            <View style={{ backgroundColor: '#0f172a', borderRadius: 20, borderTopLeftRadius: 4, paddingHorizontal: 18, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}>
              <ActivityIndicator size="small" color="#22d3ee" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Input bar ── */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{
          flexDirection: 'row', gap: 10, padding: 14,
          borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
          backgroundColor: '#020617',
        }}>
          <TextInput
            style={{
              flex: 1, backgroundColor: '#0f172a',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12,
              fontSize: 14, color: '#e2e8f0',
            }}
            placeholder="Ask about your tank..."
            placeholderTextColor="#334155"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendText}
            returnKeyType="send"
            blurOnSubmit={false}
            multiline
          />
          <TouchableOpacity
            onPress={sendText}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
            style={{
              width: 48, height: 48, borderRadius: 24,
              backgroundColor: input.trim() && !loading ? '#0891b2' : '#0f172a',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: input.trim() && !loading ? '#0891b2' : 'rgba(255,255,255,0.06)',
            }}
          >
            <Text style={{ fontSize: 18 }}>{loading ? '⏳' : '➤'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
