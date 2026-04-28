/**
 * Settings Screen — live service status, persistent config, editable tank ranges.
 * Uses localStorage (web) for cross-screen persistence.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Switch, Platform, ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader';
import { useSocket } from '../hooks/useSocket';

// ── Persistent storage (localStorage on web, fallback to memory) ──────────────
const store = {
  get: (key: string, def: string) => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key) ?? def;
    }
    return def;
  },
  set: (key: string, val: string) => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, val);
    }
  },
};

export const SETTINGS_KEYS = {
  API_URL:     'fishlinic_api_url',
  TTS_ENABLED: 'fishlinic_tts',
  ALERTS:      'fishlinic_alerts',
  PH_MIN:      'fishlinic_ph_min',
  PH_MAX:      'fishlinic_ph_max',
  TEMP_MIN:    'fishlinic_temp_min',
  TEMP_MAX:    'fishlinic_temp_max',
  DO2_MIN:     'fishlinic_do2_min',
  DO2_MAX:     'fishlinic_do2_max',
  CO2_MAX:     'fishlinic_co2_max',
};

// ── Status badge ──────────────────────────────────────────────────────────────
type Status = 'checking' | 'online' | 'offline';
function StatusBadge({ status, label }: { status: Status; label?: string }) {
  if (status === 'checking') return <ActivityIndicator size="small" color="#64748b" />;
  const color = status === 'online' ? '#22c55e' : '#ef4444';
  const text  = label ?? (status === 'online' ? 'Online' : 'Offline');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ fontSize: 12, color, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

// ── Range editor row ──────────────────────────────────────────────────────────
function RangeRow({ icon, label, unit, minKey, maxKey }: {
  icon: string; label: string; unit: string; minKey: string; maxKey: string;
}) {
  const [min, setMin] = useState(store.get(minKey, ''));
  const [max, setMax] = useState(store.get(maxKey, ''));
  const save = (k: string, v: string) => { store.set(k, v); };

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingVertical: 12, paddingHorizontal: 16,
      borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
    }}>
      <Text style={{ fontSize: 16, width: 26, textAlign: 'center' }}>{icon}</Text>
      <Text style={{ flex: 1, fontSize: 13, color: '#cbd5e1', fontWeight: '500' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <TextInput
          value={min} onChangeText={v => { setMin(v); save(minKey, v); }}
          style={{ width: 50, backgroundColor: '#1e293b', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, fontSize: 12, color: '#e2e8f0', textAlign: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
          keyboardType="numeric" placeholder="–" placeholderTextColor="#475569"
        />
        <Text style={{ color: '#475569', fontSize: 12 }}>–</Text>
        <TextInput
          value={max} onChangeText={v => { setMax(v); save(maxKey, v); }}
          style={{ width: 50, backgroundColor: '#1e293b', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, fontSize: 12, color: '#e2e8f0', textAlign: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
          keyboardType="numeric" placeholder="–" placeholderTextColor="#475569"
        />
        <Text style={{ color: '#64748b', fontSize: 11, marginLeft: 2 }}>{unit}</Text>
      </View>
    </View>
  );
}

function SingleRangeRow({ icon, label, unit, maxKey }: {
  icon: string; label: string; unit: string; maxKey: string;
}) {
  const [val, setVal] = useState(store.get(maxKey, ''));
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingVertical: 12, paddingHorizontal: 16,
    }}>
      <Text style={{ fontSize: 16, width: 26, textAlign: 'center' }}>{icon}</Text>
      <Text style={{ flex: 1, fontSize: 13, color: '#cbd5e1', fontWeight: '500' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ color: '#475569', fontSize: 12 }}>Max</Text>
        <TextInput
          value={val} onChangeText={v => { setVal(v); store.set(maxKey, v); }}
          style={{ width: 60, backgroundColor: '#1e293b', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, fontSize: 12, color: '#e2e8f0', textAlign: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
          keyboardType="numeric" placeholder="40" placeholderTextColor="#475569"
        />
        <Text style={{ color: '#64748b', fontSize: 11 }}>{unit}</Text>
      </View>
    </View>
  );
}

// ── Row helpers ───────────────────────────────────────────────────────────────
function Row({ icon, label, right, onPress }: {
  icon: string; label: string; right?: React.ReactNode; onPress?: () => void;
}) {
  const inner = (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingVertical: 14, paddingHorizontal: 16,
      borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
    }}>
      <Text style={{ fontSize: 18, width: 26, textAlign: 'center' }}>{icon}</Text>
      <Text style={{ flex: 1, fontSize: 14, color: '#cbd5e1', fontWeight: '500' }}>{label}</Text>
      {right}
    </View>
  );
  return onPress ? <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{inner}</TouchableOpacity> : inner;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 }}>{title}</Text>
      <View style={{ backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { connected } = useSocket();

  const [apiUrl, setApiUrl]     = useState(store.get(SETTINGS_KEYS.API_URL, 'http://localhost:3000'));
  const [urlDirty, setUrlDirty] = useState(false);
  const [tts, setTts]           = useState(store.get(SETTINGS_KEYS.TTS_ENABLED, 'true') === 'true');
  const [alerts, setAlerts]     = useState(store.get(SETTINGS_KEYS.ALERTS, 'true') === 'true');

  const [backendStatus,   setBackend]   = useState<Status>('checking');
  const [ollamaStatus,    setOllama]    = useState<Status>('checking');
  const [predictorStatus, setPredictor] = useState<Status>('checking');
  const [ollamaModel,     setModel]     = useState('');

  const checkServices = useCallback(async () => {
    const base = store.get(SETTINGS_KEYS.API_URL, 'http://localhost:3000');

    // Backend
    try {
      const r = await fetch(`${base}/sensors/latest`, { signal: AbortSignal.timeout(4000) });
      setBackend(r.ok ? 'online' : 'offline');
    } catch { setBackend('offline'); }

    // Ollama (via backend health or direct)
    try {
      const r = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(4000) });
      if (r.ok) {
        const d = await r.json();
        const name = d.models?.[0]?.name ?? 'unknown';
        setOllama('online');
        setModel(name);
      } else { setOllama('offline'); }
    } catch { setOllama('offline'); setModel(''); }

    // AI Predictor
    try {
      const r = await fetch('http://localhost:8001/health', { signal: AbortSignal.timeout(4000) });
      setPredictor(r.ok ? 'online' : 'offline');
    } catch { setPredictor('offline'); }
  }, []);

  useEffect(() => {
    checkServices();
    const id = setInterval(checkServices, 20000);
    return () => clearInterval(id);
  }, [checkServices]);

  const saveUrl = () => {
    store.set(SETTINGS_KEYS.API_URL, apiUrl);
    setUrlDirty(false);
    setBackend('checking');
    checkServices();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#020617' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader title="Settings" back />
      <ScrollView
        contentContainerStyle={{ padding: 18, paddingTop: 16, paddingBottom: Math.max(insets.bottom, 40) }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Connection ── */}
        <Section title="Connection">
          <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
            <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: '600', marginBottom: 6 }}>Backend URL</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={apiUrl}
                onChangeText={v => { setApiUrl(v); setUrlDirty(true); }}
                style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: '#e2e8f0', borderWidth: 1, borderColor: urlDirty ? '#0891b2' : 'rgba(255,255,255,0.08)' }}
                placeholder="http://localhost:3000"
                placeholderTextColor="#475569"
                autoCapitalize="none" autoCorrect={false}
              />
              {urlDirty && (
                <TouchableOpacity onPress={saveUrl} activeOpacity={0.8}
                  style={{ paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#0891b2', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>Save</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Row icon="🔌" label="Backend (NestJS)" right={<StatusBadge status={backendStatus} />} />
          <Row icon="📡" label="Socket.IO" right={
            <StatusBadge status={connected ? 'online' : 'offline'} label={connected ? 'Connected' : 'Disconnected'} />
          } />
          <Row icon="🤖" label="Ollama LLM" right={
            <StatusBadge status={ollamaStatus} label={ollamaStatus === 'online' ? ollamaModel : 'Offline'} />
          } />
          <Row icon="🧠" label="AI Predictor (RF/YOLO)" right={<StatusBadge status={predictorStatus} />} />
          <Row icon="🔄" label="Refresh Status" onPress={() => { setBackend('checking'); setOllama('checking'); setPredictor('checking'); checkServices(); }}
            right={<Text style={{ fontSize: 18, color: '#475569' }}>›</Text>} />
        </Section>

        {/* ── Veronica AI ── */}
        <Section title="Veronica AI">
          <Row icon="🔊" label="Text-to-Speech" right={
            <Switch value={tts} onValueChange={v => { setTts(v); store.set(SETTINGS_KEYS.TTS_ENABLED, String(v)); }}
              trackColor={{ true: '#0891b2', false: '#1e293b' }} thumbColor="#fff" />
          } />
          <Row icon="🔔" label="Alert Sound" right={
            <Switch value={alerts} onValueChange={v => { setAlerts(v); store.set(SETTINGS_KEYS.ALERTS, String(v)); }}
              trackColor={{ true: '#0891b2', false: '#1e293b' }} thumbColor="#fff" />
          } />
          <Row icon="🌐" label="STT Language" right={<Text style={{ fontSize: 13, color: '#94a3b8' }}>English (US)</Text>} />
          <Row icon="⚡" label="LLM Model" right={<Text style={{ fontSize: 13, color: '#94a3b8' }}>{ollamaModel || 'qwen2.5:3b'}</Text>} />
        </Section>

        {/* ── Tank Safe Ranges ── */}
        <Section title="Tank Safe Ranges">
          <RangeRow  icon="🧪" label="pH"          unit="pH"   minKey={SETTINGS_KEYS.PH_MIN}   maxKey={SETTINGS_KEYS.PH_MAX}   />
          <RangeRow  icon="🌡️" label="Temperature" unit="°C"  minKey={SETTINGS_KEYS.TEMP_MIN} maxKey={SETTINGS_KEYS.TEMP_MAX} />
          <RangeRow  icon="💨" label="Dissolved O₂" unit="mg/L" minKey={SETTINGS_KEYS.DO2_MIN}  maxKey={SETTINGS_KEYS.DO2_MAX}  />
          <SingleRangeRow icon="☁️" label="CO₂" unit="ppm" maxKey={SETTINGS_KEYS.CO2_MAX} />
        </Section>

        {/* ── About ── */}
        <Section title="About">
          <Row icon="🐠" label="Fishlinic Mobile"   right={<Text style={{ fontSize: 13, color: '#94a3b8' }}>v1.0.0</Text>} />
          <Row icon="🎓" label="Sejong University"  right={<Text style={{ fontSize: 13, color: '#94a3b8' }}>Capstone 2026</Text>} />
          <Row icon="🤖" label="AI Models"          right={<Text style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>RF · YOLO · ConvLSTM-VAE</Text>} />
          <Row icon="📊" label="Sensors"            right={<Text style={{ fontSize: 12, color: '#94a3b8' }}>pH · Temp · DO₂ · CO₂</Text>} />
        </Section>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
