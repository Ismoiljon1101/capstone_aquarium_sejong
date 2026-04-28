/**
 * Settings Screen — profile, services, persistent config, tank ranges, danger zone.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Switch, Platform, ActivityIndicator,
  KeyboardAvoidingView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import AppHeader from '../components/AppHeader';
import { useSocket } from '../hooks/useSocket';
import { useProfile, getInitials } from '../hooks/useProfile';

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
  if (status === 'checking') return <ActivityIndicator size="small" color="#94a3b8" />;
  const color = status === 'online' ? '#22c55e' : '#ef4444';
  const text  = label ?? (status === 'online' ? 'Online' : 'Offline');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontSize: 13, color, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

// ── Range editor row ──────────────────────────────────────────────────────────
function RangeRow({ icon, label, unit, minKey, maxKey, last }: {
  icon: keyof typeof IONICON_MAP; label: string; unit: string; minKey: string; maxKey: string; last?: boolean;
}) {
  const [min, setMin] = useState(store.get(minKey, ''));
  const [max, setMax] = useState(store.get(maxKey, ''));
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 14, paddingHorizontal: 16,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.04)',
    }}>
      <View style={iconBoxStyle}>
        <Ionicons name={IONICON_MAP[icon]} size={18} color="#38bdf8" />
      </View>
      <Text style={{ flex: 1, fontSize: 14, color: '#e2e8f0', fontWeight: '500' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <TextInput
          value={min} onChangeText={v => { setMin(v); store.set(minKey, v); }}
          style={inputStyle}
          keyboardType="numeric" placeholder="–" placeholderTextColor="#475569"
        />
        <Text style={{ color: '#475569', fontSize: 14 }}>–</Text>
        <TextInput
          value={max} onChangeText={v => { setMax(v); store.set(maxKey, v); }}
          style={inputStyle}
          keyboardType="numeric" placeholder="–" placeholderTextColor="#475569"
        />
        <Text style={{ color: '#94a3b8', fontSize: 12, marginLeft: 4, minWidth: 28 }}>{unit}</Text>
      </View>
    </View>
  );
}

function SingleRangeRow({ icon, label, unit, maxKey }: {
  icon: keyof typeof IONICON_MAP; label: string; unit: string; maxKey: string;
}) {
  const [val, setVal] = useState(store.get(maxKey, ''));
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 14, paddingHorizontal: 16,
    }}>
      <View style={iconBoxStyle}>
        <Ionicons name={IONICON_MAP[icon]} size={18} color="#38bdf8" />
      </View>
      <Text style={{ flex: 1, fontSize: 14, color: '#e2e8f0', fontWeight: '500' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ color: '#94a3b8', fontSize: 12 }}>Max</Text>
        <TextInput
          value={val} onChangeText={v => { setVal(v); store.set(maxKey, v); }}
          style={[inputStyle, { width: 64 }]}
          keyboardType="numeric" placeholder="40" placeholderTextColor="#475569"
        />
        <Text style={{ color: '#94a3b8', fontSize: 12, minWidth: 28 }}>{unit}</Text>
      </View>
    </View>
  );
}

// ── Row helpers ───────────────────────────────────────────────────────────────
function Row({ icon, iconColor, label, sub, right, onPress, last, danger }: {
  icon: keyof typeof IONICON_MAP; iconColor?: string; label: string; sub?: string;
  right?: React.ReactNode; onPress?: () => void; last?: boolean; danger?: boolean;
}) {
  const inner = (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 14, paddingHorizontal: 16,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.04)',
      minHeight: 56,
    }}>
      <View style={[iconBoxStyle, danger && { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
        <Ionicons name={IONICON_MAP[icon]} size={18} color={iconColor ?? (danger ? '#ef4444' : '#38bdf8')} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 14, color: danger ? '#ef4444' : '#e2e8f0', fontWeight: '600' }} numberOfLines={1}>{label}</Text>
        {sub && <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }} numberOfLines={1}>{sub}</Text>}
      </View>
      {right}
    </View>
  );
  return onPress
    ? <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={label}>{inner}</TouchableOpacity>
    : inner;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={{
        fontSize: 12, fontWeight: '800', color: '#94a3b8',
        letterSpacing: 1, textTransform: 'uppercase',
        marginBottom: 8, marginLeft: 4,
      }}>{title}</Text>
      <View style={{
        backgroundColor: '#0f172a', borderRadius: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        {children}
      </View>
    </View>
  );
}

// ── Ionicons map (vector icons replace emoji) ─────────────────────────────────
const IONICON_MAP = {
  plug:        'flash-outline',
  signal:      'wifi-outline',
  bot:         'sparkles-outline',
  brain:       'analytics-outline',
  refresh:     'refresh-outline',
  speaker:     'volume-high-outline',
  bell:        'notifications-outline',
  globe:       'globe-outline',
  bolt:        'flash-outline',
  flask:       'flask-outline',
  thermo:      'thermometer-outline',
  bubbles:     'water-outline',
  cloud:       'cloud-outline',
  fish:        'fish-outline',
  school:      'school-outline',
  cpu:         'hardware-chip-outline',
  chart:       'bar-chart-outline',
  trash:       'trash-outline',
  edit:        'create-outline',
  user:        'person-outline',
  mail:        'mail-outline',
  tank:        'cube-outline',
  info:        'information-circle-outline',
} as const;

// ── Shared styles ─────────────────────────────────────────────────────────────
const iconBoxStyle = {
  width: 36, height: 36, borderRadius: 10,
  backgroundColor: 'rgba(56,189,248,0.1)',
  alignItems: 'center' as const, justifyContent: 'center' as const,
};
const inputStyle = {
  width: 56, backgroundColor: '#1e293b', borderRadius: 8,
  paddingHorizontal: 8, paddingVertical: 8, fontSize: 13,
  color: '#e2e8f0', textAlign: 'center' as const,
  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
};

// ── Profile card (top of screen) ──────────────────────────────────────────────
function ProfileCard() {
  const { profile, update } = useProfile();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [tankName, setTankName] = useState(profile.tankName);

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
    setTankName(profile.tankName);
  }, [profile]);

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    update({ name: name.trim() || 'Aquarist', email: email.trim(), tankName: tankName.trim() || 'My Tank' });
    setEditing(false);
  };

  if (editing) {
    return (
      <View style={{
        backgroundColor: '#0f172a', borderRadius: 16,
        borderWidth: 1, borderColor: '#0891b240',
        padding: 18, marginBottom: 22, gap: 14,
      }}>
        <View>
          <Text style={fieldLabel}>Display Name</Text>
          <TextInput value={name} onChangeText={setName}
            style={fieldInput} placeholder="Your name" placeholderTextColor="#475569"
            autoCapitalize="words" />
        </View>
        <View>
          <Text style={fieldLabel}>Email</Text>
          <TextInput value={email} onChangeText={setEmail}
            style={fieldInput} placeholder="you@example.com" placeholderTextColor="#475569"
            autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
        </View>
        <View>
          <Text style={fieldLabel}>Tank Name</Text>
          <TextInput value={tankName} onChangeText={setTankName}
            style={fieldInput} placeholder="e.g. Living Room Reef" placeholderTextColor="#475569"
            autoCapitalize="words" />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <TouchableOpacity onPress={() => setEditing(false)} activeOpacity={0.8}
            accessibilityLabel="Cancel" accessibilityRole="button"
            style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#94a3b8' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.8}
            accessibilityLabel="Save profile" accessibilityRole="button"
            style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#0891b2', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.85}
      accessibilityLabel="Edit profile" accessibilityRole="button"
      style={{
        backgroundColor: '#0f172a', borderRadius: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        padding: 18, marginBottom: 22,
        flexDirection: 'row', alignItems: 'center', gap: 14,
      }}>
      <View style={{
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: '#0891b2',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>{getInitials(profile.name)}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#f1f5f9' }} numberOfLines={1}>{profile.name}</Text>
        <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }} numberOfLines={1}>
          {profile.email || 'Tap to add email'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <Ionicons name="cube-outline" size={12} color="#64748b" />
          <Text style={{ fontSize: 12, color: '#64748b' }} numberOfLines={1}>{profile.tankName}</Text>
        </View>
      </View>
      <Ionicons name="create-outline" size={20} color="#64748b" />
    </TouchableOpacity>
  );
}

const fieldLabel = {
  fontSize: 12, fontWeight: '700' as const, color: '#94a3b8',
  textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6,
};
const fieldInput = {
  backgroundColor: '#1e293b', borderRadius: 10,
  paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
  color: '#e2e8f0',
  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { connected } = useSocket();

  const [apiUrl, setApiUrl]     = useState(store.get(SETTINGS_KEYS.API_URL, 'http://localhost:3000'));
  const [urlDirty, setUrlDirty] = useState(false);
  const [tts, setTts]           = useState(store.get(SETTINGS_KEYS.TTS_ENABLED, 'true') === 'true');
  const [alertSnd, setAlertSnd] = useState(store.get(SETTINGS_KEYS.ALERTS, 'true') === 'true');

  const [backendStatus,   setBackend]   = useState<Status>('checking');
  const [ollamaStatus,    setOllama]    = useState<Status>('checking');
  const [predictorStatus, setPredictor] = useState<Status>('checking');
  const [ollamaModel,     setModel]     = useState('');

  const checkServices = useCallback(async () => {
    const base = store.get(SETTINGS_KEYS.API_URL, 'http://localhost:3000');

    try {
      const r = await fetch(`${base}/sensors/latest`, { signal: AbortSignal.timeout(4000) });
      setBackend(r.ok ? 'online' : 'offline');
    } catch { setBackend('offline'); }

    try {
      const r = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(4000) });
      if (r.ok) {
        const d = await r.json();
        setOllama('online');
        setModel(d.models?.[0]?.name ?? 'unknown');
      } else { setOllama('offline'); }
    } catch { setOllama('offline'); setModel(''); }

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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    store.set(SETTINGS_KEYS.API_URL, apiUrl);
    setUrlDirty(false);
    setBackend('checking');
    checkServices();
  };

  const handleResetRanges = () => {
    Alert.alert(
      'Reset tank ranges?',
      'All custom safe ranges will be cleared.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive', onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            [SETTINGS_KEYS.PH_MIN, SETTINGS_KEYS.PH_MAX, SETTINGS_KEYS.TEMP_MIN,
             SETTINGS_KEYS.TEMP_MAX, SETTINGS_KEYS.DO2_MIN, SETTINGS_KEYS.DO2_MAX,
             SETTINGS_KEYS.CO2_MAX].forEach(k => store.set(k, ''));
          },
        },
      ]
    );
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

        {/* Profile card */}
        <ProfileCard />

        {/* Connection */}
        <Section title="Connection">
          <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
            <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: '600', marginBottom: 8 }}>Backend URL</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={apiUrl}
                onChangeText={v => { setApiUrl(v); setUrlDirty(true); }}
                style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#e2e8f0', borderWidth: 1, borderColor: urlDirty ? '#0891b2' : 'rgba(255,255,255,0.08)' }}
                placeholder="http://localhost:3000"
                placeholderTextColor="#475569"
                autoCapitalize="none" autoCorrect={false}
              />
              {urlDirty && (
                <TouchableOpacity onPress={saveUrl} activeOpacity={0.8}
                  accessibilityLabel="Save backend URL" accessibilityRole="button"
                  style={{ paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#0891b2', justifyContent: 'center', minHeight: 44 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>Save</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Row icon="plug" label="Backend" sub="NestJS · port 3000" right={<StatusBadge status={backendStatus} />} />
          <Row icon="signal" label="Socket.IO" sub="Real-time telemetry" right={
            <StatusBadge status={connected ? 'online' : 'offline'} label={connected ? 'Connected' : 'Disconnected'} />
          } />
          <Row icon="bot" label="Ollama LLM" sub={ollamaModel || 'Local language model'} right={<StatusBadge status={ollamaStatus} />} />
          <Row icon="brain" label="AI Predictor" sub="RF · YOLO · ConvLSTM-VAE" right={<StatusBadge status={predictorStatus} />} />
          <Row icon="refresh" label="Refresh status" last
            onPress={() => { Haptics.selectionAsync(); setBackend('checking'); setOllama('checking'); setPredictor('checking'); checkServices(); }}
            right={<Ionicons name="chevron-forward" size={18} color="#64748b" />} />
        </Section>

        {/* Veronica AI */}
        <Section title="Veronica AI">
          <Row icon="speaker" label="Text-to-Speech" sub="Veronica speaks her replies" right={
            <Switch value={tts} onValueChange={v => { Haptics.selectionAsync(); setTts(v); store.set(SETTINGS_KEYS.TTS_ENABLED, String(v)); }}
              trackColor={{ true: '#0891b2', false: '#1e293b' }} thumbColor="#fff" />
          } />
          <Row icon="bell" label="Alert sound" sub="Audible chime on critical alerts" right={
            <Switch value={alertSnd} onValueChange={v => { Haptics.selectionAsync(); setAlertSnd(v); store.set(SETTINGS_KEYS.ALERTS, String(v)); }}
              trackColor={{ true: '#0891b2', false: '#1e293b' }} thumbColor="#fff" />
          } />
          <Row icon="globe" label="STT Language" right={<Text style={{ fontSize: 13, color: '#94a3b8' }}>English (US)</Text>} />
          <Row icon="bolt" label="LLM Model" last right={<Text style={{ fontSize: 13, color: '#94a3b8' }}>{ollamaModel || 'qwen2.5:3b'}</Text>} />
        </Section>

        {/* Tank Safe Ranges */}
        <Section title="Tank Safe Ranges">
          <RangeRow icon="flask" label="pH"           unit="pH"   minKey={SETTINGS_KEYS.PH_MIN}   maxKey={SETTINGS_KEYS.PH_MAX}   />
          <RangeRow icon="thermo" label="Temperature" unit="°C"   minKey={SETTINGS_KEYS.TEMP_MIN} maxKey={SETTINGS_KEYS.TEMP_MAX} />
          <RangeRow icon="bubbles" label="Dissolved O₂" unit="mg/L" minKey={SETTINGS_KEYS.DO2_MIN}  maxKey={SETTINGS_KEYS.DO2_MAX}  />
          <SingleRangeRow icon="cloud" label="CO₂" unit="ppm" maxKey={SETTINGS_KEYS.CO2_MAX} />
        </Section>

        {/* About */}
        <Section title="About">
          <Row icon="fish"   label="Fishlinic Mobile" right={<Text style={{ fontSize: 13, color: '#94a3b8' }}>v1.0.0</Text>} />
          <Row icon="school" label="Sejong University" right={<Text style={{ fontSize: 13, color: '#94a3b8' }}>Capstone 2026</Text>} />
          <Row icon="cpu"    label="AI Models" sub="RF · YOLO · ConvLSTM-VAE" />
          <Row icon="chart"  label="Sensors" sub="pH · Temp · DO₂ · CO₂" last />
        </Section>

        {/* Danger zone */}
        <Section title="Danger Zone">
          <Row icon="trash" danger label="Reset tank safe ranges" sub="Restore defaults" last
            onPress={handleResetRanges}
            right={<Ionicons name="chevron-forward" size={18} color="#ef4444" />} />
        </Section>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
