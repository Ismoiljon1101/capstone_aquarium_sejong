/**
 * Controls Screen
 *
 * Section A — Quick Actions   (manual relay triggers)
 * Section B — Tank Management (cron-driven schedules expressed in plain English)
 *
 * The management section is designed for end users, not engineers. Each
 * schedule reads like a sentence: "Every weekday at 8:00 AM · 3 sec portion".
 * Tap to expand an inline editor; everything persists server-side.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  TextInput, Switch, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import AppHeader from '../components/AppHeader';
import { useSocket } from '../hooks/useSocket';
import { useApi } from '../hooks/useApi';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Types ───────────────────────────────────────────────────────────────────
interface FeedSchedule {
  id: number; time: string; daysMask: number; portionSec: number;
  enabled: boolean; lastFiredAt?: string | null;
}
interface LightSchedule {
  id: number; onTime: string; offTime: string;
  brightness: number; color: string; enabled: boolean;
}
interface TankConfig {
  id: number; cleaningIntervalDays: number; lastCleanedAt: string | null;
  emergencyTempMax: number; emergencyTempMin: number;
  emergencyDoMin: number; emergencyPhMin: number; emergencyPhMax: number;
  pushEnabled: boolean;
}

const DAY_LABELS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLORS = ['#ffffff', '#fef3c7', '#bae6fd', '#a5f3fc', '#bbf7d0', '#fbcfe8', '#c4b5fd'];
const ALL_DAYS = 0b1111111;
const WEEKDAYS = 0b0111110; // M-F (bit 0 Sun … bit 6 Sat)
const WEEKENDS = 0b1000001;

// ─── Schedule → English ──────────────────────────────────────────────────────
function describeDays(mask: number): string {
  if (mask === ALL_DAYS) return 'Every day';
  if (mask === WEEKDAYS) return 'Weekdays';
  if (mask === WEEKENDS) return 'Weekends';
  if (mask === 0) return 'Never';
  const days: string[] = [];
  for (let i = 0; i < 7; i++) if (mask & (1 << i)) days.push(DAY_NAMES[i]);
  return days.join(', ');
}

function formatTime12(t: string): string {
  // t = "HH:MM"
  const [hStr, mStr] = (t || '00:00').split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return t;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function describeFeed(s: FeedSchedule): string {
  return `${describeDays(s.daysMask)} · ${formatTime12(s.time)} · ${s.portionSec}s portion`;
}

// ─── Small UI primitives ─────────────────────────────────────────────────────
const sectionTitleStyle = {
  fontSize: 12, fontWeight: '800' as const, color: '#94a3b8',
  textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12,
};

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{
      backgroundColor: '#0f172a', borderRadius: 16,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
      overflow: 'hidden', marginBottom: 14,
    }, style]}>
      {children}
    </View>
  );
}

function NumField({ value, onChange, suffix, width = 64 }: {
  value: number | string; onChange: (n: number) => void; suffix?: string; width?: number;
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => { setLocal(String(value)); }, [value]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <TextInput
        value={local}
        onChangeText={setLocal}
        onEndEditing={() => { const n = parseFloat(local); if (!isNaN(n)) onChange(n); }}
        keyboardType="numeric"
        style={{
          width, backgroundColor: '#1e293b', borderRadius: 8,
          paddingHorizontal: 8, paddingVertical: 8, fontSize: 13,
          color: '#e2e8f0', textAlign: 'center',
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        }}
      />
      {suffix && <Text style={{ color: '#64748b', fontSize: 11 }}>{suffix}</Text>}
    </View>
  );
}

function TimeField({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);
  return (
    <TextInput
      value={local}
      onChangeText={setLocal}
      onEndEditing={() => onCommit(local)}
      placeholder="08:00" placeholderTextColor="#475569"
      style={{
        width: 84, backgroundColor: '#1e293b', borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 8,
        fontSize: 14, fontWeight: '700', color: '#e2e8f0', textAlign: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
      }}
    />
  );
}

function Btn({ label, onPress, color = '#0891b2', icon, disabled, ghost }: {
  label: string; onPress: () => void; color?: string; icon?: IoniconName;
  disabled?: boolean; ghost?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.85}
      accessibilityRole="button" accessibilityLabel={label}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
        backgroundColor: disabled ? '#1e293b' : (ghost ? 'transparent' : color),
        borderWidth: ghost ? 1 : 0, borderColor: ghost ? color + '40' : 'transparent',
        minHeight: 40,
      }}>
      {icon && <Ionicons name={icon} size={14} color={ghost ? color : '#fff'} />}
      <Text style={{ color: ghost ? color : '#fff', fontWeight: '700', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function ManagementCard({ icon, title, badge, badgeColor, summary, defaultOpen, children, persistKey }: {
  icon: IoniconName; title: string; summary: string;
  badge?: string; badgeColor?: string;
  defaultOpen?: boolean; persistKey?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <View style={{
      backgroundColor: '#0f172a', borderRadius: 16,
      borderWidth: 1, borderColor: open ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.06)',
      marginBottom: 12, overflow: 'hidden',
    }}>
      <TouchableOpacity
        onPress={() => { Haptics.selectionAsync(); setOpen(o => !o); }}
        accessibilityRole="button" accessibilityLabel={`${open ? 'Collapse' : 'Expand'} ${title}`}
        activeOpacity={0.85}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 64 }}>
        <View style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: open ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.04)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={icon} size={20} color={open ? '#38bdf8' : '#94a3b8'} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#f1f5f9' }} numberOfLines={1}>{title}</Text>
          <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 3, lineHeight: 16 }} numberOfLines={2}>{summary}</Text>
        </View>
        {badge && (
          <View style={{
            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
            backgroundColor: (badgeColor ?? '#38bdf8') + '20',
          }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: badgeColor ?? '#38bdf8', letterSpacing: 0.3 }}>{badge}</Text>
          </View>
        )}
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

// ─── Feeding row ─────────────────────────────────────────────────────────────
function FeedRow({ s, onUpdate, onDelete, last }: {
  s: FeedSchedule;
  onUpdate: (patch: Partial<FeedSchedule>) => void;
  onDelete: () => void;
  last?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const toggleDay = (i: number) => onUpdate({ daysMask: s.daysMask ^ (1 << i) });

  return (
    <View style={{
      borderBottomWidth: last ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.04)',
    }}>
      {/* Summary row */}
      <TouchableOpacity onPress={() => setEditing(e => !e)} activeOpacity={0.7}
        accessibilityRole="button" accessibilityLabel={`${editing ? 'Collapse' : 'Edit'} feeding schedule`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 64 }}>
        <View style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: s.enabled ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="restaurant-outline" size={18} color={s.enabled ? '#38bdf8' : '#475569'} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: s.enabled ? '#f1f5f9' : '#64748b', letterSpacing: -0.2 }}>
            {formatTime12(s.time)}
          </Text>
          <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }} numberOfLines={1}>
            {describeDays(s.daysMask)} · {s.portionSec}s portion
          </Text>
        </View>
        <Switch value={s.enabled} onValueChange={v => onUpdate({ enabled: v })}
          trackColor={{ true: '#0891b2', false: '#1e293b' }} thumbColor="#fff" />
        <Ionicons name={editing ? 'chevron-up' : 'chevron-down'} size={18} color="#94a3b8" />
      </TouchableOpacity>

      {/* Inline editor */}
      {editing && (
        <View style={{
          paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14, gap: 12,
          borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
          backgroundColor: 'rgba(56,189,248,0.03)',
        }}>
          {/* Time + portion */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={editorLabelStyle}>Time</Text>
              <TimeField value={s.time} onCommit={t => onUpdate({ time: t })} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={editorLabelStyle}>Portion</Text>
              <NumField value={s.portionSec} onChange={v => onUpdate({ portionSec: Math.max(1, Math.round(v)) })} suffix="seconds" width={56} />
            </View>
          </View>

          {/* Day picker */}
          <View>
            <Text style={editorLabelStyle}>Days</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
              {DAY_LABELS_SHORT.map((d, i) => {
                const active = (s.daysMask & (1 << i)) !== 0;
                return (
                  <TouchableOpacity key={i} onPress={() => toggleDay(i)} activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Toggle ${DAY_NAMES[i]}`}
                    style={{
                      flex: 1, height: 40, borderRadius: 10,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: active ? '#0891b2' : '#1e293b',
                      borderWidth: 1, borderColor: active ? '#0891b2' : 'rgba(255,255,255,0.06)',
                    }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: active ? '#fff' : '#94a3b8' }}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Btn ghost label="Every day"  color="#38bdf8" onPress={() => onUpdate({ daysMask: ALL_DAYS  })} />
              <Btn ghost label="Weekdays"   color="#38bdf8" onPress={() => onUpdate({ daysMask: WEEKDAYS })} />
              <Btn ghost label="Weekends"   color="#38bdf8" onPress={() => onUpdate({ daysMask: WEEKENDS })} />
            </View>
          </View>

          {/* Delete */}
          <TouchableOpacity onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              Alert.alert('Delete schedule?', 'This feeding time will be removed.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: onDelete },
              ]);
            }}
            activeOpacity={0.8}
            accessibilityRole="button" accessibilityLabel="Delete schedule"
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
              paddingVertical: 10, borderRadius: 10,
              backgroundColor: 'rgba(239,68,68,0.08)',
              borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
              marginTop: 4,
            }}>
            <Ionicons name="trash-outline" size={14} color="#f87171" />
            <Text style={{ color: '#f87171', fontWeight: '700', fontSize: 13 }}>Delete schedule</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const editorLabelStyle = {
  fontSize: 11, fontWeight: '700' as const, color: '#94a3b8',
  textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6,
};

// ─── Main ────────────────────────────────────────────────────────────────────
export default function ControlsScreen() {
  const insets = useSafeAreaInsets();
  const { on } = useSocket();
  const api = useApi();

  // Quick toggle state
  const [pump, setPump] = useState(false);
  const [led, setLed] = useState(false);
  const [feeding, setFeeding] = useState(false);
  const [pumpL, setPumpL] = useState(false);
  const [ledL, setLedL] = useState(false);

  // Management state
  const [mgmtLoading, setMgmtLoading] = useState(true);
  const [feeds, setFeeds] = useState<FeedSchedule[]>([]);
  const [light, setLight] = useState<LightSchedule | null>(null);
  const [config, setConfig] = useState<TankConfig | null>(null);

  useEffect(() => {
    api.getActuatorState()
      .then(r => { if (r.data) { setPump(!!r.data.pump); setLed(!!r.data.led); } })
      .catch(() => null);
  }, []);

  useEffect(() => on('actuator:state', (d: { type: string; state: boolean }) => {
    if (d.type === 'AIR_PUMP')  setPump(d.state);
    if (d.type === 'LED_STRIP') setLed(d.state);
  }), [on]);

  const reloadMgmt = useCallback(async () => {
    try {
      const [f, l, c] = await Promise.all([
        api.getFeedSchedules(),
        api.getLightSchedule(),
        api.getTankConfig(),
      ]);
      setFeeds(f.data ?? []);
      setLight(l.data ?? null);
      setConfig(c.data ?? null);
    } catch (e: any) {
      console.warn('Management load failed:', e?.message);
    } finally {
      setMgmtLoading(false);
    }
  }, []);

  useEffect(() => { reloadMgmt(); }, [reloadMgmt]);

  // ── Quick actions ──
  const feed = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFeeding(true);
    await api.triggerFeed().catch(() => null);
    setTimeout(() => setFeeding(false), 3000);
  };
  const pumpToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nextState = !pump;
    setPumpL(true);
    await api.togglePump({ state: nextState }).catch(() => null);
    setPump(nextState);
    setPumpL(false);
  };
  const ledToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextState = !led;
    setLedL(true);
    await api.toggleLed({ state: nextState }).catch(() => null);
    setLed(nextState);
    setLedL(false);
  };

  // ── Feed CRUD ──
  const addFeed = async () => {
    try {
      const r = await api.createFeedSchedule({ time: '08:00', daysMask: ALL_DAYS, portionSec: 3, enabled: true });
      setFeeds(p => [...p, r.data]);
    } catch (e: any) { Alert.alert('Add failed', e?.message ?? 'unknown'); }
  };
  const patchFeed = async (id: number, patch: Partial<FeedSchedule>) => {
    setFeeds(p => p.map(f => f.id === id ? { ...f, ...patch } : f));
    try { await api.updateFeedSchedule(id, patch); }
    catch (e: any) { Alert.alert('Update failed', e?.message ?? 'unknown'); reloadMgmt(); }
  };
  const deleteFeed = async (id: number) => {
    setFeeds(p => p.filter(f => f.id !== id));
    try { await api.deleteFeedSchedule(id); }
    catch (e: any) { Alert.alert('Delete failed', e?.message ?? 'unknown'); reloadMgmt(); }
  };

  // ── Light/Config patches ──
  const patchLight = async (patch: Partial<LightSchedule>) => {
    if (!light) return;
    setLight({ ...light, ...patch });
    try { await api.updateLightSchedule(patch); }
    catch (e: any) { Alert.alert('Light update failed', e?.message ?? 'unknown'); reloadMgmt(); }
  };
  const patchConfig = async (patch: Partial<TankConfig>) => {
    if (!config) return;
    setConfig({ ...config, ...patch });
    try { await api.updateTankConfig(patch); }
    catch (e: any) { Alert.alert('Config update failed', e?.message ?? 'unknown'); reloadMgmt(); }
  };
  const markCleaned = async () => {
    try { const r = await api.markTankCleaned(); setConfig(r.data); }
    catch (e: any) { Alert.alert('Mark cleaned failed', e?.message ?? 'unknown'); }
  };

  // ── Derived summaries (for plain-English headers) ──
  const feedSummary = useMemo(() => {
    if (!feeds.length) return 'No feeding times yet';
    const enabled = feeds.filter(f => f.enabled);
    if (!enabled.length) return `${feeds.length} schedules · all paused`;
    const next = enabled[0];
    return `${enabled.length} active · next ${formatTime12(next.time)}, ${describeDays(next.daysMask).toLowerCase()}`;
  }, [feeds]);

  const lightSummary = useMemo(() => {
    if (!light) return '';
    if (!light.enabled) return `Schedule paused · ${formatTime12(light.onTime)} → ${formatTime12(light.offTime)}`;
    return `On ${formatTime12(light.onTime)} → off ${formatTime12(light.offTime)} · ${light.brightness}%`;
  }, [light]);

  const cleaningInfo = useMemo(() => {
    if (!config) return { summary: '', overdue: false, daysSince: 0 };
    if (!config.lastCleanedAt) {
      return { summary: `Every ${config.cleaningIntervalDays} days · never recorded`, overdue: false, daysSince: 0 };
    }
    const daysSince = Math.floor((Date.now() - new Date(config.lastCleanedAt).getTime()) / 86400000);
    const overdue = daysSince > config.cleaningIntervalDays;
    const overdueDays = daysSince - config.cleaningIntervalDays;
    return {
      summary: overdue
        ? `Overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'} · cleaned ${daysSince}d ago`
        : `Cleaned ${daysSince}d ago · next in ${config.cleaningIntervalDays - daysSince}d`,
      overdue, daysSince,
    };
  }, [config]);

  const safetySummary = useMemo(() => {
    if (!config) return '';
    return `Temp ${config.emergencyTempMin}–${config.emergencyTempMax}°C · pH ${config.emergencyPhMin}–${config.emergencyPhMax}`;
  }, [config]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#020617' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader title="Controls" subtitle="Manual triggers & schedules" />
      <ScrollView contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 18, paddingTop: 16, paddingBottom: Math.max(insets.bottom, 60) }}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ═══ Quick Actions ═══ */}
        <Text style={sectionTitleStyle}>Quick Actions</Text>

        {/* Feed Now */}
        <TouchableOpacity onPress={feed} disabled={feeding} activeOpacity={0.85}
          accessibilityLabel="Feed fish now" accessibilityRole="button"
          style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: feeding ? 'rgba(56,189,248,0.12)' : '#0f172a',
            borderRadius: 16, padding: 18,
            borderWidth: 1, borderColor: feeding ? '#38bdf8' : 'rgba(56,189,248,0.2)',
            marginBottom: 12, gap: 14,
          }}>
          <View style={{
            width: 56, height: 56, borderRadius: 16,
            backgroundColor: feeding ? '#38bdf8' : 'rgba(56,189,248,0.15)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {feeding
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="restaurant" size={26} color="#38bdf8" />
            }
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: feeding ? '#38bdf8' : '#f1f5f9', marginBottom: 3, letterSpacing: -0.3 }}>
              {feeding ? 'Dispensing Feed…' : 'Feed Fish Now'}
            </Text>
            <Text style={{ fontSize: 13, color: '#94a3b8' }}>Activates feeder relay for one cycle</Text>
          </View>
          {!feeding && <Ionicons name="chevron-forward" size={20} color="#64748b" />}
        </TouchableOpacity>

        <Text style={[sectionTitleStyle, { marginTop: 14 }]}>Toggle Devices</Text>

        {[
          { icon: 'water'      as IoniconName, label: 'Air Pump',  desc: 'Oxygenation system', active: pump, loading: pumpL, color: '#06b6d4', onPress: pumpToggle },
          { icon: 'bulb'       as IoniconName, label: 'LED Light', desc: '12V aquarium strip',  active: led,  loading: ledL,  color: '#f59e0b', onPress: ledToggle  },
        ].map(d => (
          <TouchableOpacity key={d.label} onPress={d.onPress} disabled={d.loading} activeOpacity={0.85}
            accessibilityLabel={`Toggle ${d.label}`} accessibilityRole="switch"
            accessibilityState={{ checked: d.active }}
            style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: d.active ? d.color + '0F' : '#0f172a',
              borderRadius: 16, padding: 14, borderWidth: 1,
              borderColor: d.active ? d.color + '40' : 'rgba(255,255,255,0.06)',
              marginBottom: 10, gap: 14,
            }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: d.active ? d.color + '25' : 'rgba(255,255,255,0.04)' }}>
              {d.loading
                ? <ActivityIndicator color={d.color} size="small" />
                : <Ionicons name={d.icon} size={22} color={d.active ? d.color : '#64748b'} />
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#f1f5f9', marginBottom: 2 }}>{d.label}</Text>
              <Text style={{ fontSize: 12, color: '#94a3b8' }}>{d.desc}</Text>
            </View>
            <View style={{ width: 40, height: 24, borderRadius: 12, justifyContent: 'center', backgroundColor: d.active ? d.color : '#1e293b', padding: 2 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', marginLeft: d.active ? 16 : 0 }} />
            </View>
          </TouchableOpacity>
        ))}

        {/* ═══ Tank Management ═══ */}
        <View style={{ marginTop: 26, marginBottom: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.5, marginBottom: 4 }}>
            Tank Management
          </Text>
          <Text style={{ fontSize: 14, color: '#94a3b8', lineHeight: 20 }}>
            Schedules run automatically on the cloud — your tank stays on routine
            even when the app is closed.
          </Text>
        </View>

        {mgmtLoading || !light || !config ? (
          <View style={{ paddingVertical: 30, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0891b2" />
          </View>
        ) : (
          <>
            {/* ── Feeding ── */}
            <ManagementCard
              icon="restaurant-outline"
              title="Feeding schedules"
              summary={feedSummary}
              badge={feeds.filter(f => f.enabled).length > 0 ? `${feeds.filter(f => f.enabled).length} ON` : undefined}
              badgeColor="#22c55e"
            >
              {feeds.length === 0 && (
                <View style={{ padding: 24, alignItems: 'center', gap: 6 }}>
                  <Ionicons name="time-outline" size={28} color="#475569" />
                  <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>
                    No feeding times yet. Add one to start an automatic feed routine.
                  </Text>
                </View>
              )}
              {feeds.map((f, i) => (
                <FeedRow key={f.id} s={f}
                  onUpdate={patch => patchFeed(f.id, patch)}
                  onDelete={() => deleteFeed(f.id)}
                  last={i === feeds.length - 1} />
              ))}
              <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' }}>
                <Btn label="Add feeding time" icon="add-circle-outline" onPress={addFeed} />
              </View>
            </ManagementCard>

            {/* ── Lighting ── */}
            <ManagementCard
              icon="bulb-outline"
              title="Smart lighting"
              summary={lightSummary}
              badge={light.enabled ? 'ON' : 'PAUSED'}
              badgeColor={light.enabled ? '#22c55e' : '#94a3b8'}
            >
              <View style={{ padding: 16, gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#f1f5f9', fontSize: 14, fontWeight: '700' }}>Run schedule</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>Lights follow the on/off times below</Text>
                  </View>
                  <Switch value={light.enabled} onValueChange={v => patchLight({ enabled: v })}
                    trackColor={{ true: '#0891b2', false: '#1e293b' }} thumbColor="#fff" />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={editorLabelStyle}>Turn on at</Text>
                    <TimeField value={light.onTime} onCommit={v => patchLight({ onTime: v })} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={editorLabelStyle}>Turn off at</Text>
                    <TimeField value={light.offTime} onCommit={v => patchLight({ offTime: v })} />
                  </View>
                </View>

                <View>
                  <Text style={editorLabelStyle}>Brightness</Text>
                  <NumField value={light.brightness} onChange={v => patchLight({ brightness: Math.max(0, Math.min(100, Math.round(v))) })} suffix="%" />
                </View>

                <View>
                  <Text style={editorLabelStyle}>Colour</Text>
                  <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                    {COLORS.map(c => {
                      const active = c.toLowerCase() === light.color.toLowerCase();
                      return (
                        <TouchableOpacity key={c} onPress={() => patchLight({ color: c })} activeOpacity={0.7}
                          accessibilityRole="button" accessibilityLabel={`Pick colour ${c}`}
                          style={{
                            width: 36, height: 36, borderRadius: 18,
                            backgroundColor: c,
                            borderWidth: active ? 3 : 1,
                            borderColor: active ? '#38bdf8' : 'rgba(255,255,255,0.15)',
                          }} />
                      );
                    })}
                  </View>
                </View>
              </View>
            </ManagementCard>

            {/* ── Cleaning ── */}
            <ManagementCard
              icon="sparkles-outline"
              title="Cleaning reminder"
              summary={cleaningInfo.summary}
              badge={cleaningInfo.overdue ? 'OVERDUE' : undefined}
              badgeColor="#ef4444"
            >
              <View style={{ padding: 16, gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#f1f5f9', fontSize: 14, fontWeight: '700' }}>Remind me every</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>How often the tank should be cleaned</Text>
                  </View>
                  <NumField value={config.cleaningIntervalDays}
                    onChange={v => patchConfig({ cleaningIntervalDays: Math.max(1, Math.round(v)) })}
                    suffix="days" />
                </View>

                <View style={{
                  backgroundColor: cleaningInfo.overdue ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)',
                  borderRadius: 10, padding: 12,
                  borderWidth: 1, borderColor: cleaningInfo.overdue ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.04)',
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                }}>
                  <Ionicons
                    name={cleaningInfo.overdue ? 'alert-circle' : 'checkmark-circle'}
                    size={20}
                    color={cleaningInfo.overdue ? '#ef4444' : '#22c55e'} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: cleaningInfo.overdue ? '#fca5a5' : '#e2e8f0', fontSize: 13, fontWeight: '700' }}>
                      {config.lastCleanedAt
                        ? `Last cleaned ${new Date(config.lastCleanedAt).toLocaleDateString()}`
                        : 'Never recorded'}
                    </Text>
                    <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>
                      {cleaningInfo.summary}
                    </Text>
                  </View>
                </View>

                <Btn label="Mark as cleaned today" icon="checkmark-done-outline"
                  onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); markCleaned(); }}
                  color="#16a34a" />
              </View>
            </ManagementCard>

            {/* ── Emergency safety ── */}
            <ManagementCard
              icon="shield-checkmark-outline"
              title="Emergency safety"
              summary={safetySummary}
              badge={config.pushEnabled ? 'NOTIFY' : 'SILENT'}
              badgeColor={config.pushEnabled ? '#38bdf8' : '#94a3b8'}
            >
              <View style={{ padding: 16, gap: 14 }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, lineHeight: 17 }}>
                  When sensors leave these limits, an alert fires and (if enabled) a
                  push notification is sent to your phone — even if the app is closed.
                </Text>

                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ flex: 1, color: '#e2e8f0', fontSize: 14, fontWeight: '600' }}>Temperature</Text>
                    <NumField value={config.emergencyTempMin} onChange={v => patchConfig({ emergencyTempMin: v })} suffix="°C" />
                    <Text style={{ color: '#475569', marginHorizontal: 6 }}>–</Text>
                    <NumField value={config.emergencyTempMax} onChange={v => patchConfig({ emergencyTempMax: v })} suffix="°C" />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ flex: 1, color: '#e2e8f0', fontSize: 14, fontWeight: '600' }}>pH</Text>
                    <NumField value={config.emergencyPhMin} onChange={v => patchConfig({ emergencyPhMin: v })} />
                    <Text style={{ color: '#475569', marginHorizontal: 6 }}>–</Text>
                    <NumField value={config.emergencyPhMax} onChange={v => patchConfig({ emergencyPhMax: v })} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ flex: 1, color: '#e2e8f0', fontSize: 14, fontWeight: '600' }}>Min O₂</Text>
                    <NumField value={config.emergencyDoMin} onChange={v => patchConfig({ emergencyDoMin: v })} suffix="mg/L" />
                  </View>
                </View>

                <View style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#f1f5f9', fontSize: 14, fontWeight: '700' }}>Push notifications</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>Get alerts on your phone anywhere</Text>
                  </View>
                  <Switch value={config.pushEnabled} onValueChange={v => { Haptics.selectionAsync(); patchConfig({ pushEnabled: v }); }}
                    trackColor={{ true: '#0891b2', false: '#1e293b' }} thumbColor="#fff" />
                </View>
              </View>
            </ManagementCard>
          </>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
