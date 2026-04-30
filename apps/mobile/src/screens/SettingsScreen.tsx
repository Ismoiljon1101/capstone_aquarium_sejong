/**
 * Settings Screen — redesigned for the cloud/remote model.
 *
 * Information architecture (top → bottom, by frequency of use):
 *   1. Profile + subscription tier (identity & plan)
 *   2. Tank — name, device pairing, cloud sync   (the "remote app" essentials)
 *   3. Notifications — push, sounds, TTS
 *   4. Tank Safe Ranges (collapsible — most users won't tweak)
 *   5. Advanced (collapsible — backend URL, service health) — hidden by default
 *   6. About + Danger zone
 *
 * Marketing/UX principles applied:
 *   • Subscription card up top with clear value tagline + upgrade CTA (not nag).
 *   • Big tappable rows with vector icons, no walls of text.
 *   • Sane defaults, low cognitive load — advanced toggles hidden behind a row.
 *   • Cloud sync is *opt-out* (default ON) so the remote use-case Just Works.
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
import { useProfile, getInitials, TIER_META, SubscriptionTier } from '../hooks/useProfile';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ── Persistent storage (web localStorage / fallback memory) ──────────────────
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
  PUSH:        'fishlinic_push',
  PH_MIN:      'fishlinic_ph_min',
  PH_MAX:      'fishlinic_ph_max',
  TEMP_MIN:    'fishlinic_temp_min',
  TEMP_MAX:    'fishlinic_temp_max',
  DO2_MIN:     'fishlinic_do2_min',
  DO2_MAX:     'fishlinic_do2_max',
  CO2_MAX:     'fishlinic_co2_max',
  ADVANCED_OPEN: 'fishlinic_advanced_open',
};

// ── Status badge ─────────────────────────────────────────────────────────────
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

// ── Common row ───────────────────────────────────────────────────────────────
function Row({ icon, iconColor, label, sub, right, onPress, last, danger }: {
  icon: IoniconName; iconColor?: string; label: string; sub?: string;
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
        <Ionicons name={icon} size={18} color={iconColor ?? (danger ? '#ef4444' : '#38bdf8')} />
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

function Section({ title, footer, children }: { title?: string; footer?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 22 }}>
      {title && (
        <Text style={{
          fontSize: 12, fontWeight: '800', color: '#94a3b8',
          letterSpacing: 1, textTransform: 'uppercase',
          marginBottom: 8, marginLeft: 4,
        }}>{title}</Text>
      )}
      <View style={{
        backgroundColor: '#0f172a', borderRadius: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        {children}
      </View>
      {footer && (
        <Text style={{ fontSize: 12, color: '#64748b', marginTop: 8, marginLeft: 4, lineHeight: 17 }}>
          {footer}
        </Text>
      )}
    </View>
  );
}

// ── Collapsible group (used for Ranges + Advanced) ───────────────────────────
function CollapseGroup({ icon, title, sub, defaultOpen, persistKey, children }: {
  icon: IoniconName; title: string; sub?: string;
  defaultOpen?: boolean; persistKey?: string;
  children: React.ReactNode;
}) {
  const init = persistKey
    ? store.get(persistKey, defaultOpen ? '1' : '0') === '1'
    : !!defaultOpen;
  const [open, setOpen] = useState(init);
  return (
    <View style={{
      backgroundColor: '#0f172a', borderRadius: 16,
      borderWidth: 1, borderColor: open ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.06)',
      marginBottom: 22, overflow: 'hidden',
    }}>
      <TouchableOpacity
        onPress={() => {
          Haptics.selectionAsync();
          const next = !open;
          setOpen(next);
          if (persistKey) store.set(persistKey, next ? '1' : '0');
        }}
        activeOpacity={0.85}
        accessibilityRole="button" accessibilityLabel={`${open ? 'Collapse' : 'Expand'} ${title}`}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          paddingHorizontal: 16, paddingVertical: 14, minHeight: 60,
        }}>
        <View style={[iconBoxStyle, open && { backgroundColor: 'rgba(56,189,248,0.18)' }]}>
          <Ionicons name={icon} size={18} color={open ? '#38bdf8' : '#94a3b8'} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#e2e8f0' }}>{title}</Text>
          {sub && <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }} numberOfLines={1}>{sub}</Text>}
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#94a3b8" />
      </TouchableOpacity>
      {open && (
        <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' }}>
          {children}
        </View>
      )}
    </View>
  );
}

// ── Range editor row ─────────────────────────────────────────────────────────
function RangeRow({ icon, label, unit, minKey, maxKey, last }: {
  icon: IoniconName; label: string; unit: string; minKey: string; maxKey: string; last?: boolean;
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
        <Ionicons name={icon} size={18} color="#38bdf8" />
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

function SingleRangeRow({ icon, label, unit, maxKey, last }: {
  icon: IoniconName; label: string; unit: string; maxKey: string; last?: boolean;
}) {
  const [val, setVal] = useState(store.get(maxKey, ''));
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 14, paddingHorizontal: 16,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.04)',
    }}>
      <View style={iconBoxStyle}>
        <Ionicons name={icon} size={18} color="#38bdf8" />
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

// ── Shared styles ────────────────────────────────────────────────────────────
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

// ── Profile + Subscription card (top) ────────────────────────────────────────
function ProfileSubscriptionCard() {
  const { profile, update } = useProfile();
  const [editing, setEditing] = useState(false);
  const [name, setName]   = useState(profile.name);
  const [email, setEmail] = useState(profile.email);

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
  }, [profile]);

  const save = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    update({ name: name.trim() || 'Aquarist', email: email.trim() });
    setEditing(false);
  };

  const tier = TIER_META[profile.tier];

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
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <TouchableOpacity onPress={() => setEditing(false)} activeOpacity={0.8}
            accessibilityRole="button" accessibilityLabel="Cancel"
            style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#94a3b8' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={save} activeOpacity={0.8}
            accessibilityRole="button" accessibilityLabel="Save profile"
            style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#0891b2', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{
      backgroundColor: '#0f172a', borderRadius: 16,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
      marginBottom: 22, overflow: 'hidden',
    }}>
      {/* Profile row */}
      <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.85}
        accessibilityRole="button" accessibilityLabel="Edit profile"
        style={{
          padding: 18,
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
        </View>
        <Ionicons name="create-outline" size={20} color="#64748b" />
      </TouchableOpacity>

      {/* Plan strip */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 18, paddingVertical: 14,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
        backgroundColor: 'rgba(56,189,248,0.04)',
      }}>
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: tier.color + '20',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={tier.icon} size={18} color={tier.color} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: tier.color, letterSpacing: 0.3 }}>
              {tier.label.toUpperCase()} PLAN
            </Text>
            {profile.trialEndsAt && (
              <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(251,191,36,0.18)' }}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#fbbf24', letterSpacing: 0.3 }}>TRIAL</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }} numberOfLines={1}>{tier.tagline}</Text>
        </View>
        {profile.tier !== 'premium' && (
          <TouchableOpacity onPress={() => Alert.alert('Upgrade', 'Plans & billing will open here.')}
            activeOpacity={0.85}
            accessibilityRole="button" accessibilityLabel="Upgrade plan"
            style={{
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
              backgroundColor: '#38bdf8',
              minHeight: 36, justifyContent: 'center',
            }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#0f172a', letterSpacing: 0.3 }}>UPGRADE</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Tank pairing editor ──────────────────────────────────────────────────────
function TankCard() {
  const { profile, update } = useProfile();
  const [editing, setEditing] = useState(false);
  const [tankName, setTankName] = useState(profile.tankName);
  const [deviceId, setDeviceId] = useState(profile.deviceId);

  useEffect(() => {
    setTankName(profile.tankName);
    setDeviceId(profile.deviceId);
  }, [profile]);

  const save = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    update({
      tankName: tankName.trim() || 'My Tank',
      deviceId: deviceId.trim().toUpperCase(),
    });
    setEditing(false);
  };

  const paired = !!profile.deviceId;

  if (editing) {
    return (
      <Section title="Tank">
        <View style={{ padding: 16, gap: 14 }}>
          <View>
            <Text style={fieldLabel}>Tank Name</Text>
            <TextInput value={tankName} onChangeText={setTankName}
              style={fieldInput} placeholder="e.g. Living Room Reef" placeholderTextColor="#475569"
              autoCapitalize="words" />
          </View>
          <View>
            <Text style={fieldLabel}>Device Pairing Code</Text>
            <TextInput value={deviceId} onChangeText={setDeviceId}
              style={[fieldInput, { fontVariant: ['tabular-nums'], letterSpacing: 2 }]}
              placeholder="FL-XXXXXX" placeholderTextColor="#475569"
              autoCapitalize="characters" autoCorrect={false} />
            <Text style={{ fontSize: 11, color: '#64748b', marginTop: 6, lineHeight: 16 }}>
              Found on the bottom of the Fishlinic gateway box. Required to receive
              live data from your tank's hardware.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={() => setEditing(false)} activeOpacity={0.8}
              accessibilityRole="button" accessibilityLabel="Cancel"
              style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#94a3b8' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} activeOpacity={0.8}
              accessibilityRole="button" accessibilityLabel="Save tank"
              style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#0891b2', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Section>
    );
  }

  return (
    <Section title="Tank">
      <Row icon="cube-outline" label={profile.tankName || 'My Tank'} sub="Tap to rename" onPress={() => setEditing(true)}
        right={<Ionicons name="chevron-forward" size={18} color="#64748b" />} />
      <Row icon="hardware-chip-outline"
        label={paired ? `Paired · ${profile.deviceId}` : 'Pair Fishlinic gateway'}
        sub={paired ? 'Hardware is linked to this account' : 'Required to control hardware remotely'}
        iconColor={paired ? '#22c55e' : '#fbbf24'}
        onPress={() => setEditing(true)}
        right={<Ionicons name="chevron-forward" size={18} color="#64748b" />} />
      <Row icon="cloud-upload-outline" label="Cloud sync"
        sub="Schedules + alerts available from anywhere" last
        right={
          <Switch value={profile.cloudSync}
            onValueChange={v => { Haptics.selectionAsync(); update({ cloudSync: v }); }}
            trackColor={{ true: '#0891b2', false: '#1e293b' }} thumbColor="#fff" />
        } />
    </Section>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { connected } = useSocket();

  const [apiUrl, setApiUrl]     = useState(store.get(SETTINGS_KEYS.API_URL, 'http://localhost:3000'));
  const [urlDirty, setUrlDirty] = useState(false);
  const [tts, setTts]           = useState(store.get(SETTINGS_KEYS.TTS_ENABLED, 'true') === 'true');
  const [alertSnd, setAlertSnd] = useState(store.get(SETTINGS_KEYS.ALERTS, 'true') === 'true');
  const [push, setPush]         = useState(store.get(SETTINGS_KEYS.PUSH, 'true') === 'true');

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
        {/* 1. Profile + plan */}
        <ProfileSubscriptionCard />

        {/* 2. Tank pairing + cloud sync */}
        <TankCard />

        {/* 3. Notifications */}
        <Section title="Notifications">
          <Row icon="notifications-outline" label="Push notifications"
            sub="Critical alerts on your phone, anywhere"
            right={
              <Switch value={push}
                onValueChange={v => { Haptics.selectionAsync(); setPush(v); store.set(SETTINGS_KEYS.PUSH, String(v)); }}
                trackColor={{ true: '#0891b2', false: '#1e293b' }} thumbColor="#fff" />
            } />
          <Row icon="notifications-circle-outline" label="Alert sound"
            sub="Audible chime when an alert arrives"
            right={
              <Switch value={alertSnd}
                onValueChange={v => { Haptics.selectionAsync(); setAlertSnd(v); store.set(SETTINGS_KEYS.ALERTS, String(v)); }}
                trackColor={{ true: '#0891b2', false: '#1e293b' }} thumbColor="#fff" />
            } />
          <Row icon="volume-high-outline" label="Veronica voice"
            sub="AI assistant speaks her replies aloud" last
            right={
              <Switch value={tts}
                onValueChange={v => { Haptics.selectionAsync(); setTts(v); store.set(SETTINGS_KEYS.TTS_ENABLED, String(v)); }}
                trackColor={{ true: '#0891b2', false: '#1e293b' }} thumbColor="#fff" />
            } />
        </Section>

        {/* 4. Tank Safe Ranges (collapsible) */}
        <CollapseGroup icon="speedometer-outline" title="Tank safe ranges"
          sub="Trigger alerts outside these limits"
          persistKey="fishlinic_ranges_open">
          <RangeRow icon="flask-outline"        label="pH"           unit="pH"   minKey={SETTINGS_KEYS.PH_MIN}   maxKey={SETTINGS_KEYS.PH_MAX}   />
          <RangeRow icon="thermometer-outline"  label="Temperature"  unit="°C"   minKey={SETTINGS_KEYS.TEMP_MIN} maxKey={SETTINGS_KEYS.TEMP_MAX} />
          <RangeRow icon="water-outline"        label="Dissolved O₂" unit="mg/L" minKey={SETTINGS_KEYS.DO2_MIN}  maxKey={SETTINGS_KEYS.DO2_MAX}  />
          <SingleRangeRow icon="cloud-outline"  label="CO₂"          unit="ppm"  maxKey={SETTINGS_KEYS.CO2_MAX} last />
          <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' }}>
            <TouchableOpacity onPress={handleResetRanges} activeOpacity={0.8}
              accessibilityRole="button" accessibilityLabel="Reset ranges"
              style={{ paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#f87171' }}>Reset to defaults</Text>
            </TouchableOpacity>
          </View>
        </CollapseGroup>

        {/* 5. Advanced (collapsible — backend, services) */}
        <CollapseGroup icon="construct-outline" title="Advanced"
          sub="Backend URL, service status, AI predictor"
          persistKey={SETTINGS_KEYS.ADVANCED_OPEN}>
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
                  accessibilityRole="button" accessibilityLabel="Save backend URL"
                  style={{ paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#0891b2', justifyContent: 'center', minHeight: 44 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>Save</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Row icon="cloud-outline" label="Backend" sub="NestJS · port 3000" right={<StatusBadge status={backendStatus} />} />
          <Row icon="wifi-outline"  label="Realtime socket" sub="Live telemetry"
            right={<StatusBadge status={connected ? 'online' : 'offline'} label={connected ? 'Connected' : 'Disconnected'} />} />
          <Row icon="sparkles-outline" label="Veronica LLM" sub={ollamaModel || 'Local language model'} right={<StatusBadge status={ollamaStatus} />} />
          <Row icon="analytics-outline" label="AI Predictor" sub="RF · YOLO · ConvLSTM-VAE" right={<StatusBadge status={predictorStatus} />} />
          <Row icon="refresh-outline" label="Refresh status" last
            onPress={() => { Haptics.selectionAsync(); setBackend('checking'); setOllama('checking'); setPredictor('checking'); checkServices(); }}
            right={<Ionicons name="chevron-forward" size={18} color="#64748b" />} />
        </CollapseGroup>

        {/* 6. About */}
        <Section title="About">
          <Row icon="fish-outline"   label="Fishlinic Mobile" right={<Text style={{ fontSize: 13, color: '#94a3b8' }}>v1.0.0</Text>} />
          <Row icon="school-outline" label="Sejong University" right={<Text style={{ fontSize: 13, color: '#94a3b8' }}>Capstone 2026</Text>} />
          <Row icon="document-text-outline" label="Privacy & Terms"
            onPress={() => Alert.alert('Privacy & Terms', 'Coming soon.')}
            right={<Ionicons name="chevron-forward" size={18} color="#64748b" />} last />
        </Section>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
