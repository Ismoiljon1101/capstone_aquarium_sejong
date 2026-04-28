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
      backgroundColor: '#0f172a', borderRadius: 18,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
      overflow: 'hidden', marginBottom: 18,
    }}>
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
  const { connected, on } = useSocket();
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
      <ScrollView contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 60) }}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#f1f5f9', letterSpacing: -1 }}>Controls</Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 10, paddingVertical: 5,
            borderRadius: 16,
          }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: connected ? '#34d399' : '#f87171' }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: connected ? '#34d399' : '#f87171' }}>
              {connected ? 'Connected' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* ── Quick: Feed button ── */}
        <TouchableOpacity onPress={feed} disabled={feeding} activeOpacity={0.8}
          accessibilityLabel="Feed fish now" accessibilityRole="button"
          style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: feeding ? 'rgba(56,189,248,0.08)' : '#0f172a',
            borderRadius: 20, padding: 20,
            borderWidth: 1, borderColor: feeding ? '#38bdf8' : 'rgba(56,189,248,0.15)',
            marginBottom: 16, gap: 16,
          }}>
          <Text style={{ fontSize: 36 }}>{feeding ? '⏳' : '🐟'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#38bdf8', marginBottom: 2 }}>
              {feeding ? 'Dispensing Feed...' : 'Feed Fish Now'}
            </Text>
            <Text style={{ fontSize: 12, color: '#64748b' }}>Activates feeder relay for one cycle</Text>
          </View>
        </TouchableOpacity>

        <Text style={{ fontSize: 16, fontWeight: '700', color: '#e2e8f0', marginBottom: 12 }}>Toggle Devices</Text>

        {[
          { icon: '💨', label: 'Air Pump', desc: 'Oxygenation system', active: pump, loading: pumpL, color: '#06b6d4', onPress: pumpToggle },
          { icon: '💡', label: 'LED Light', desc: '12V aquarium strip',  active: led,  loading: ledL,  color: '#f59e0b', onPress: ledToggle },
        ].map(d => (
          <TouchableOpacity key={d.label} onPress={d.onPress} disabled={d.loading} activeOpacity={0.8}
            accessibilityLabel={`Toggle ${d.label}`} accessibilityRole="switch"
            style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: d.active ? d.color + '0A' : '#0f172a',
              borderRadius: 16, padding: 14, borderWidth: 1,
              borderColor: d.active ? d.color + '40' : 'rgba(255,255,255,0.06)',
              marginBottom: 10, gap: 12,
            }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: d.active ? d.color + '20' : 'rgba(255,255,255,0.04)' }}>
              {d.loading ? <ActivityIndicator color={d.color} size="small" /> : <Text style={{ fontSize: 20 }}>{d.icon}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#e2e8f0', marginBottom: 2 }}>{d.label}</Text>
              <Text style={{ fontSize: 11, color: '#64748b' }}>{d.desc}</Text>
            </View>
            <View style={{ width: 36, height: 20, borderRadius: 10, justifyContent: 'center', backgroundColor: d.active ? d.color : '#1e293b' }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', marginLeft: d.active ? 18 : 2 }} />
            </View>
          </TouchableOpacity>
        ))}

        {/* ── Relay status summary ── */}
        <View style={{
          backgroundColor: '#0f172a', borderRadius: 16, padding: 16,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginTop: 12, marginBottom: 28,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Relay Status</Text>
          {[
            { label: 'Feeder',    active: feeding, color: '#3b82f6' },
            { label: 'Air Pump',  active: pump,    color: '#06b6d4' },
            { label: 'LED Strip', active: led,     color: '#f59e0b' },
          ].map(s => (
            <View key={s.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
              <Text style={{ fontSize: 14, color: '#cbd5e1' }}>{s.label}</Text>
              <Text selectable style={{ fontSize: 14, fontWeight: '700', color: s.active ? s.color : '#64748b' }}>{s.active ? 'ON' : 'OFF'}</Text>
            </View>
          ))}
        </View>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/*                          MANAGEMENT                               */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 22 }} />
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.5, marginBottom: 2 }}>
          Tank Management
        </Text>
        <Text style={{ fontSize: 14, color: '#94a3b8', marginBottom: 18, lineHeight: 20 }}>
          Schedules &amp; thresholds. Active even before hardware is plugged in.
        </Text>

        {mgmtLoading || !light || !config ? (
          <View style={{ paddingVertical: 30, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0891b2" />
          </View>
        ) : (
          <>
            {/* Feeding schedules */}
            <SectionTitle title="Feeding schedules" subtitle="Backend fires the feeder at each enabled time on selected days." />
            <Card>
              {feeds.length === 0 && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#64748b', fontSize: 12 }}>No feeding times configured.</Text>
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
            </Card>

            {/* Smart lighting */}
            <SectionTitle title="Smart lighting" subtitle="Scheduler toggles LED inside the on/off window." />
            <Card>
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
            </Card>

            {/* Cleaning reminder */}
            <SectionTitle title="Cleaning reminder" subtitle="Alert is created when overdue." />
            <Card>
              <View style={{ padding: 16, gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '600', flex: 1 }}>Interval</Text>
                  <NumField value={config.cleaningIntervalDays}
                    onChange={v => patchConfig({ cleaningIntervalDays: Math.max(1, Math.round(v)) })}
                    suffix="days" />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '600' }}>Last cleaned</Text>
                    <Text style={{ color: cleaningOverdue ? '#ef4444' : '#64748b', fontSize: 11, marginTop: 2 }}>
                      {config.lastCleanedAt ? new Date(config.lastCleanedAt).toLocaleDateString() : 'Never recorded'}
                      {cleaningOverdue ? '  •  OVERDUE' : ''}
                    </Text>
                  </View>
                  <Btn label="Mark cleaned" onPress={markCleaned} color="#16a34a" />
                </View>
              </View>
            </Card>

            {/* Emergency safety */}
            <SectionTitle title="Emergency safety" subtitle="Readings outside these bounds trigger a critical alert." />
            <Card>
              <View style={{ padding: 16, gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ flex: 1, color: '#cbd5e1', fontSize: 13, fontWeight: '600' }}>Temperature</Text>
                  <NumField value={config.emergencyTempMin} onChange={v => patchConfig({ emergencyTempMin: v })} suffix="°C" />
                  <Text style={{ color: '#475569', marginHorizontal: 6 }}>–</Text>
                  <NumField value={config.emergencyTempMax} onChange={v => patchConfig({ emergencyTempMax: v })} suffix="°C" />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ flex: 1, color: '#cbd5e1', fontSize: 13, fontWeight: '600' }}>pH</Text>
                  <NumField value={config.emergencyPhMin} onChange={v => patchConfig({ emergencyPhMin: v })} />
                  <Text style={{ color: '#475569', marginHorizontal: 6 }}>–</Text>
                  <NumField value={config.emergencyPhMax} onChange={v => patchConfig({ emergencyPhMax: v })} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ flex: 1, color: '#cbd5e1', fontSize: 13, fontWeight: '600' }}>Min dissolved O₂</Text>
                  <NumField value={config.emergencyDoMin} onChange={v => patchConfig({ emergencyDoMin: v })} suffix="mg/L" />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '600' }}>Push notifications</Text>
                  <Switch value={config.pushEnabled} onValueChange={v => patchConfig({ pushEnabled: v })}
                    trackColor={{ true: '#0891b2', false: '#1e293b' }} thumbColor="#fff" />
                </View>
              </View>
            </Card>
          </>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
