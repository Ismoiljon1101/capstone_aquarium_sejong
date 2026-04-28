/**
 * Controls Screen
 * - Quick manual actuator triggers (feed, pump, LED)
 * - Tank Management: feeding schedules, smart lighting, cleaning reminder,
 *   emergency safety thresholds.
 * All schedule/threshold edits persist to the backend so once the serial
 * bridge connects to real hardware everything Just Works.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  TextInput, Switch, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import AppHeader from '../components/AppHeader';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
import { useSocket } from '../hooks/useSocket';
import { useApi } from '../hooks/useApi';

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

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const COLORS = ['#ffffff', '#fef3c7', '#bae6fd', '#a5f3fc', '#bbf7d0', '#fbcfe8', '#c4b5fd'];

const sectionTitleStyle = {
  fontSize: 12, fontWeight: '800' as const, color: '#94a3b8',
  textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12,
};

// ─── Small UI primitives ─────────────────────────────────────────────────────
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginTop: 8, marginBottom: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' }}>{title}</Text>
      {subtitle && <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 3, lineHeight: 18 }}>{subtitle}</Text>}
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: '#0f172a', borderRadius: 16,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
      overflow: 'hidden', marginBottom: 14,
    }}>
      {children}
    </View>
  );
}

function Collapsible({ icon, title, subtitle, defaultOpen, badge, children }: {
  icon: IoniconName; title: string; subtitle?: string;
  defaultOpen?: boolean; badge?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <View style={{
      backgroundColor: '#0f172a', borderRadius: 16,
      borderWidth: 1, borderColor: open ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)',
      overflow: 'hidden', marginBottom: 14,
    }}>
      <TouchableOpacity
        onPress={() => { Haptics.selectionAsync(); setOpen(o => !o); }}
        accessibilityLabel={`${open ? 'Collapse' : 'Expand'} ${title}`}
        accessibilityRole="button"
        activeOpacity={0.85}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          paddingHorizontal: 16, paddingVertical: 14, minHeight: 60,
        }}>
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: open ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={icon} size={18} color={open ? '#38bdf8' : '#94a3b8'} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#e2e8f0' }}>{title}</Text>
          {subtitle && <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }} numberOfLines={1}>{subtitle}</Text>}
        </View>
        {badge && (
          <View style={{ backgroundColor: 'rgba(56,189,248,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#38bdf8' }}>{badge}</Text>
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
        width: 72, backgroundColor: '#1e293b', borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 6,
        fontSize: 14, fontWeight: '700', color: '#e2e8f0', textAlign: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
      }}
    />
  );
}

function Btn({ label, onPress, color = '#0891b2', disabled }: {
  label: string; onPress: () => void; color?: string; disabled?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.8}
      accessibilityRole="button"
      style={{
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
        backgroundColor: disabled ? '#1e293b' : color,
        minHeight: 44, justifyContent: 'center',
      }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Feeding row ─────────────────────────────────────────────────────────────
function FeedRow({ s, onUpdate, onDelete }: {
  s: FeedSchedule;
  onUpdate: (patch: Partial<FeedSchedule>) => void;
  onDelete: () => void;
}) {
  const toggleDay = (i: number) => onUpdate({ daysMask: s.daysMask ^ (1 << i) });
  return (
    <View style={{
      paddingVertical: 12, paddingHorizontal: 16, gap: 10,
      borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 18 }}>🍽️</Text>
        <TimeField value={s.time} onCommit={t => onUpdate({ time: t })} />
        <View style={{ flex: 1 }} />
        <NumField value={s.portionSec} onChange={v => onUpdate({ portionSec: v })} suffix="s" width={48} />
        <Switch value={s.enabled} onValueChange={v => onUpdate({ enabled: v })}
          trackColor={{ true: '#0891b2', false: '#1e293b' }} thumbColor="#fff" />
        <TouchableOpacity onPress={onDelete} activeOpacity={0.7}
          accessibilityLabel="Delete feeding schedule" accessibilityRole="button"
          style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#7f1d1d22', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16, color: '#ef4444' }}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {DAY_LABELS.map((d, i) => {
          const active = (s.daysMask & (1 << i)) !== 0;
          return (
            <TouchableOpacity key={i} onPress={() => toggleDay(i)} activeOpacity={0.7}
              accessibilityLabel={`Toggle ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][i]}`}
              accessibilityRole="button"
              style={{
                width: 40, height: 40, borderRadius: 12,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: active ? '#0891b2' : '#1e293b',
                borderWidth: 1, borderColor: active ? '#0891b2' : 'rgba(255,255,255,0.06)',
              }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: active ? '#fff' : '#94a3b8' }}>{d}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

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

  // ── Initial load + sockets ─────────────────────────────────────────────────
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

  // ── Quick actions ──────────────────────────────────────────────────────────
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

  // ── Feed CRUD ──────────────────────────────────────────────────────────────
  const addFeed = async () => {
    try {
      const r = await api.createFeedSchedule({ time: '08:00', daysMask: 127, portionSec: 3, enabled: true });
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

  // ── Light/Config patches ───────────────────────────────────────────────────
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

  const cleaningOverdue = config?.lastCleanedAt
    ? (Date.now() - new Date(config.lastCleanedAt).getTime()) / 86400000 > config.cleaningIntervalDays
    : false;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#020617' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader title="Controls" subtitle="Manual triggers & schedules" />
      <ScrollView contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: Math.max(insets.bottom, 60) }}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── Quick: Feed button ── */}
        <Text style={sectionTitleStyle}>Quick Actions</Text>
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

        {/* ── Relay status summary ── */}
        <View style={{
          backgroundColor: '#0f172a', borderRadius: 16, padding: 16,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginTop: 8, marginBottom: 24,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Relay Status</Text>
          {[
            { label: 'Feeder',    active: feeding, color: '#3b82f6' },
            { label: 'Air Pump',  active: pump,    color: '#06b6d4' },
            { label: 'LED Strip', active: led,     color: '#f59e0b' },
          ].map((s, i, arr) => (
            <View key={s.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
              <Text style={{ fontSize: 14, color: '#e2e8f0', fontWeight: '500' }}>{s.label}</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
                backgroundColor: s.active ? s.color + '20' : 'rgba(148,163,184,0.1)',
              }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.active ? s.color : '#64748b' }} />
                <Text selectable style={{ fontSize: 12, fontWeight: '700', color: s.active ? s.color : '#94a3b8' }}>{s.active ? 'ON' : 'OFF'}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/*                          MANAGEMENT                               */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.5, marginBottom: 4 }}>
          Tank Management
        </Text>
        <Text style={{ fontSize: 14, color: '#94a3b8', marginBottom: 18, lineHeight: 20 }}>
          Tap to expand. Schedules and thresholds run server-side.
        </Text>

        {mgmtLoading || !light || !config ? (
          <View style={{ paddingVertical: 30, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0891b2" />
          </View>
        ) : (
          <>
            {/* Feeding schedules */}
            <Collapsible icon="time-outline" title="Feeding schedules"
              subtitle={feeds.length > 0 ? `${feeds.length} configured` : 'No times configured'}
              badge={feeds.length > 0 ? String(feeds.length) : undefined}>
              {feeds.length === 0 && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#94a3b8', fontSize: 13 }}>No feeding times configured.</Text>
                </View>
              )}
              {feeds.map(f => (
                <FeedRow key={f.id} s={f}
                  onUpdate={patch => patchFeed(f.id, patch)}
                  onDelete={() => deleteFeed(f.id)} />
              ))}
              <View style={{ padding: 12 }}>
                <Btn label="+ Add feed time" onPress={addFeed} />
              </View>
            </Collapsible>

            {/* Smart lighting */}
            <Collapsible icon="bulb-outline" title="Smart lighting"
              subtitle={`${light.onTime} – ${light.offTime} · ${light.brightness}%`}
              badge={light.enabled ? 'ON' : 'OFF'}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '600' }}>Schedule enabled</Text>
                  <Switch value={light.enabled} onValueChange={v => patchLight({ enabled: v })}
                    trackColor={{ true: '#0891b2', false: '#1e293b' }} thumbColor="#fff" />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '600', flex: 1 }}>On at</Text>
                  <TimeField value={light.onTime} onCommit={v => patchLight({ onTime: v })} />
                  <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '600' }}>Off at</Text>
                  <TimeField value={light.offTime} onCommit={v => patchLight({ offTime: v })} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '600', flex: 1 }}>Brightness</Text>
                  <NumField value={light.brightness} onChange={v => patchLight({ brightness: Math.max(0, Math.min(100, v)) })} suffix="%" />
                </View>
                <View style={{ gap: 8 }}>
                  <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '600' }}>Color</Text>
                  <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                    {COLORS.map(c => {
                      const active = c.toLowerCase() === light.color.toLowerCase();
                      return (
                        <TouchableOpacity key={c} onPress={() => patchLight({ color: c })} activeOpacity={0.7}
                          style={{
                            width: 34, height: 34, borderRadius: 17,
                            backgroundColor: c,
                            borderWidth: active ? 3 : 1,
                            borderColor: active ? '#38bdf8' : 'rgba(255,255,255,0.15)',
                          }} />
                      );
                    })}
                  </View>
                </View>
              </View>
            </Collapsible>

            {/* Cleaning reminder */}
            <Collapsible icon="sparkles-outline" title="Cleaning reminder"
              subtitle={config.lastCleanedAt ? `Last: ${new Date(config.lastCleanedAt).toLocaleDateString()}` : 'Never recorded'}
              badge={cleaningOverdue ? 'OVERDUE' : undefined}>
              <View style={{ padding: 16, gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '500', flex: 1 }}>Interval</Text>
                  <NumField value={config.cleaningIntervalDays}
                    onChange={v => patchConfig({ cleaningIntervalDays: Math.max(1, Math.round(v)) })}
                    suffix="days" />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '500' }}>Last cleaned</Text>
                    <Text style={{ color: cleaningOverdue ? '#ef4444' : '#94a3b8', fontSize: 12, marginTop: 2 }}>
                      {config.lastCleanedAt ? new Date(config.lastCleanedAt).toLocaleDateString() : 'Never recorded'}
                      {cleaningOverdue ? '  •  OVERDUE' : ''}
                    </Text>
                  </View>
                  <Btn label="Mark cleaned" onPress={markCleaned} color="#16a34a" />
                </View>
              </View>
            </Collapsible>

            {/* Emergency safety */}
            <Collapsible icon="shield-checkmark-outline" title="Emergency safety"
              subtitle="Critical alert thresholds">
              <View style={{ padding: 16, gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ flex: 1, color: '#e2e8f0', fontSize: 14, fontWeight: '500' }}>Temperature</Text>
                  <NumField value={config.emergencyTempMin} onChange={v => patchConfig({ emergencyTempMin: v })} suffix="°C" />
                  <Text style={{ color: '#475569', marginHorizontal: 6 }}>–</Text>
                  <NumField value={config.emergencyTempMax} onChange={v => patchConfig({ emergencyTempMax: v })} suffix="°C" />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ flex: 1, color: '#e2e8f0', fontSize: 14, fontWeight: '500' }}>pH</Text>
                  <NumField value={config.emergencyPhMin} onChange={v => patchConfig({ emergencyPhMin: v })} />
                  <Text style={{ color: '#475569', marginHorizontal: 6 }}>–</Text>
                  <NumField value={config.emergencyPhMax} onChange={v => patchConfig({ emergencyPhMax: v })} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ flex: 1, color: '#e2e8f0', fontSize: 14, fontWeight: '500' }}>Min O₂</Text>
                  <NumField value={config.emergencyDoMin} onChange={v => patchConfig({ emergencyDoMin: v })} suffix="mg/L" />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '500' }}>Push notifications</Text>
                  <Switch value={config.pushEnabled} onValueChange={v => { Haptics.selectionAsync(); patchConfig({ pushEnabled: v }); }}
                    trackColor={{ true: '#0891b2', false: '#1e293b' }} thumbColor="#fff" />
                </View>
              </View>
            </Collapsible>
          </>
        )}

        {/* Section title style helper */}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
