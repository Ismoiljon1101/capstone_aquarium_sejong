import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Animated } from 'react-native';
import { useSocket } from '../hooks/useSocket';
import { useApi } from '../hooks/useApi';
import { useSensors } from '../hooks/useSensors';
import AppHeader from '../components/AppHeader';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Alert { alertId: number; type: string; message: string; severity: string; createdAt: string; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
}

function statusColor(s: string) {
  if (s === 'critical') return '#ef4444';
  if (s === 'warn' || s === 'warning') return '#fbbf24';
  if (s === 'offline') return '#475569';
  return '#34d399';
}

// ─── Sensor pill (inline, horizontal) ────────────────────────────────────────
function SensorPill({ icon, label, value, unit, color, status }: {
  icon: string; label: string; value: string; unit: string; color: string; status: string;
}) {
  const noData = value === '--';
  const dot = statusColor(status);
  const displayColor = noData ? '#334155' : color;
  return (
    <View style={{
      flex: 1, minWidth: '46%',
      backgroundColor: '#0f172a',
      borderRadius: 16, padding: 14,
      borderWidth: 1, borderColor: noData ? 'rgba(255,255,255,0.04)' : color + '25',
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 18, opacity: noData ? 0.4 : 1 }}>{icon}</Text>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot }} />
      </View>
      <Text style={{ fontSize: 24, fontWeight: '900', color: displayColor, letterSpacing: -1, fontVariant: ['tabular-nums'] }}>
        {value}
        {!noData && <Text style={{ fontSize: 12, fontWeight: '600', color: color + '80' }}> {unit}</Text>}
      </Text>
      <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}

// ─── Alert chip ──────────────────────────────────────────────────────────────
function AlertChip({ alert, onAck }: { alert: Alert; onAck: (id: number) => void }) {
  const sev = alert.severity ?? 'info';
  const c = sev === 'critical' ? '#ef4444' : sev === 'warning' ? '#f59e0b' : '#38bdf8';
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: c + '0D', borderRadius: 12,
      borderWidth: 1, borderColor: c + '30',
      padding: 12, marginBottom: 8,
    }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c, flexShrink: 0 }} />
      <Text style={{ flex: 1, fontSize: 14, color: '#e2e8f0', lineHeight: 20 }}>{alert.message}</Text>
      <TouchableOpacity onPress={() => onAck(alert.alertId)} activeOpacity={0.7}
        accessibilityLabel="Acknowledge alert" accessibilityRole="button"
        style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: c + '20', borderRadius: 8, minHeight: 36, justifyContent: 'center' }}>
        <Text style={{ fontSize: 12, color: c, fontWeight: '700' }}>ACK</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { connected, on } = useSocket();
  const api = useApi();
  const sensors = useSensors();

  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [fishCount, setFishCount] = useState<number>(0);
  const [fishStatus, setFishStatus] = useState('ok');
  const [healthScore, setHealthScore] = useState(98);
  const [fade] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    loadData();
    const u1 = on('alert:new', (a: Alert) => setAlerts(p => [a, ...p].slice(0, 5)));
    return () => { u1(); };
  }, []);

  const loadData = async () => {
    const [alertsR, fishR, healthR] = await Promise.allSettled([
      api.getActiveAlerts(),
      api.getFishCount(),
      api.getFishHealth(),
    ]);
    if (alertsR.status === 'fulfilled') setAlerts(alertsR.value.data?.slice(0, 5) ?? []);
    if (fishR.status === 'fulfilled')   setFishCount(fishR.value.data?.count ?? 0);
    if (healthR.status === 'fulfilled') {
      const h = healthR.value.data;
      if (h) {
        const statuses = [h.phStatus, h.tempStatus, h.doStatus, h.visualStatus, h.behaviorStatus];
        const hasCrit  = statuses.some((s: string) => s === 'critical');
        const hasWarn  = statuses.some((s: string) => s === 'warn' || s === 'warning');
        setFishStatus(hasCrit ? 'critical' : hasWarn ? 'warn' : 'ok');
        setHealthScore(hasCrit ? 60 : hasWarn ? 78 : 98);
      }
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const ackAlert = async (id: number) => {
    setAlerts(p => p.filter(a => a.alertId !== id));
    await api.acknowledgeAlert(id).catch(() => null);
  };

  const s = (k: string) => sensors[k];
  const hasData = Object.keys(sensors).length > 0;
  const fmtVal = (k: string) => s(k)?.value != null ? Number(s(k)!.value).toFixed(1) : '--';
  const fmtSt  = (k: string) => s(k)?.status ?? 'offline';

  const scoreColor = !hasData ? '#475569' : healthScore >= 90 ? '#34d399' : healthScore >= 70 ? '#fbbf24' : '#ef4444';
  const scoreLabel = !hasData ? 'No Data' : healthScore >= 90 ? 'Excellent' : healthScore >= 70 ? 'Needs Attention' : 'Critical';

  return (
    <Animated.View style={{ flex: 1, backgroundColor: '#020617', opacity: fade }}>
      <AppHeader title="Fishlinic" subtitle={getGreeting()} branded />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 18, paddingTop: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" colors={['#38bdf8']} />}
      >

        {/* ── Health Score + Fish ── */}
        <View style={{
          borderRadius: 22, overflow: 'hidden', marginBottom: 16,
          borderWidth: 1, borderColor: scoreColor + '25',
          backgroundColor: '#0c1a2e',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 }}>
            {/* Score */}
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 50, fontWeight: '900', color: scoreColor, letterSpacing: -3, lineHeight: 52, fontVariant: ['tabular-nums'] }}>
                {hasData ? healthScore : '--'}
              </Text>
              {hasData && <Text style={{ fontSize: 12, color: scoreColor + 'aa', fontWeight: '700', letterSpacing: 0.5 }}>/100</Text>}
            </View>

            <View style={{ width: 1, height: 56, backgroundColor: 'rgba(255,255,255,0.06)' }} />

            {/* Info */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: scoreColor }} />
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#e2e8f0' }}>{scoreLabel}</Text>
              </View>
              <Text style={{ fontSize: 14, color: '#94a3b8', lineHeight: 20, marginBottom: 10 }}>
                {!hasData ? 'Waiting for sensor data...' : fishStatus === 'ok' ? 'All parameters within safe range' : 'Check alerts below'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Tag label={`🐟 ${fishCount} fish`} color="#60a5fa" />
                <Tag label="💧 Water" color="#34d399" />
                <Tag label="🍽️ Fed" color="#fbbf24" />
              </View>
            </View>
          </View>
        </View>

        {/* ── Water Parameters 2×2 ── */}
        <SectionTitle>Water Parameters</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          <SensorPill icon="🧪" label="pH Level"      value={fmtVal('pH')}      unit="pH"   color="#10b981" status={fmtSt('pH')} />
          <SensorPill icon="🌡️" label="Temperature"  value={fmtVal('temp_c')}  unit="°C"   color="#38bdf8" status={fmtSt('temp_c')} />
          <SensorPill icon="💨" label="Dissolved O₂" value={fmtVal('do_mg_l')} unit="mg/L" color="#a78bfa" status={fmtSt('do_mg_l')} />
          <SensorPill icon="☁️" label="CO₂"          value={fmtVal('CO2')}     unit="ppm"  color="#fb923c" status={fmtSt('CO2')} />
        </View>

        {/* ── Fish Intelligence ── */}
        <SectionTitle>Fish Intelligence</SectionTitle>
        <View style={{
          backgroundColor: '#0f172a', borderRadius: 18,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
          padding: 16, marginBottom: 16,
        }}>
          <View style={{ flexDirection: 'row', gap: 0 }}>
            {[
              { label: 'COUNT',  value: hasData ? String(fishCount) : '--', color: '#60a5fa' },
              { label: 'HEALTH', value: !hasData ? '--' : fishStatus === 'ok' ? 'Good' : fishStatus === 'warn' ? 'Warn' : 'Critical', color: hasData ? statusColor(fishStatus) : '#475569' },
              { label: 'VISION', value: hasData ? 'YOLO v11' : '--', color: hasData ? '#a78bfa' : '#475569' },
            ].map((item, i) => (
              <View key={item.label} style={{ flex: 1, alignItems: 'center', borderRightWidth: i < 2 ? 1 : 0, borderRightColor: 'rgba(255,255,255,0.06)' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: item.color }}>{item.value}</Text>
                <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.5, marginTop: 4 }}>{item.label}</Text>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
            {[
              { icon: '🧪', label: 'pH',           st: fmtSt('pH') },
              { icon: '🌡️', label: 'Temperature',  st: fmtSt('temp_c') },
              { icon: '💨', label: 'Dissolved O₂', st: fmtSt('do_mg_l') },
              { icon: '👁️', label: 'Visual Check', st: hasData ? 'ok' : 'offline' },
              { icon: '🧠', label: 'Behavior',      st: hasData ? 'ok' : 'offline' },
            ].map(p => (
              <View key={p.label} style={{
                flexDirection: 'row', alignItems: 'center',
                paddingVertical: 8,
                borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
              }}>
                <Text style={{ fontSize: 14, marginRight: 10 }}>{p.icon}</Text>
                <Text style={{ flex: 1, fontSize: 13, color: '#94a3b8' }}>{p.label}</Text>
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: statusColor(p.st) + '18' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor(p.st) }}>{p.st.toUpperCase()}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Alerts ── */}
        {alerts.length > 0 && (
          <>
            <SectionTitle>Recent Alerts</SectionTitle>
            {alerts.slice(0, 3).map(a => (
              <AlertChip key={a.alertId} alert={a} onAck={ackAlert} />
            ))}
          </>
        )}

        {/* ── Device quick-status ── */}
        <SectionTitle>Device Status</SectionTitle>
        <View style={{
          backgroundColor: '#0f172a', borderRadius: 16,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
          padding: 14, marginBottom: 4,
        }}>
          <Text style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10 }}>Go to Controls to manage devices</Text>
          {[
            { icon: '💨', label: 'Air Pump', color: '#06b6d4' },
            { icon: '💡', label: 'LED Strip', color: '#f59e0b' },
            { icon: '🐠', label: 'Auto Feeder', color: '#38bdf8' },
          ].map(d => (
            <View key={d.label} style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
            }}>
              <Text style={{ fontSize: 16 }}>{d.icon}</Text>
              <Text style={{ flex: 1, fontSize: 13, color: '#cbd5e1' }}>{d.label}</Text>
              <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(148,163,184,0.1)' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8' }}>AUTO</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={{ fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
      {children}
    </Text>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, backgroundColor: color + '15', borderColor: color + '30' }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color }}>{label}</Text>
    </View>
  );
}
