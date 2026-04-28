import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useSocket } from '../hooks/useSocket';
import { useApi } from '../hooks/useApi';
import { useSensors } from '../hooks/useSensors';
import { useProfile } from '../hooks/useProfile';
import AppHeader from '../components/AppHeader';

interface Alert { alertId: number; type: string; message: string; severity: string; createdAt: string; }

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function statusColor(s: string) {
  if (s === 'critical') return '#ef4444';
  if (s === 'warn' || s === 'warning') return '#fbbf24';
  if (s === 'offline') return '#475569';
  return '#34d399';
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ── Sensor card (2×2 grid) ───────────────────────────────────────────────────
function SensorCard({ icon, label, value, unit, color, status }: {
  icon: IoniconName; label: string; value: string; unit: string; color: string; status: string;
}) {
  const noData = value === '--';
  const dot = statusColor(status);
  return (
    <View style={{
      flex: 1, minWidth: '46%',
      backgroundColor: '#0f172a',
      borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: noData ? 'rgba(255,255,255,0.04)' : color + '25',
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View style={{
          width: 32, height: 32, borderRadius: 10,
          backgroundColor: noData ? 'rgba(255,255,255,0.04)' : color + '20',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={icon} size={16} color={noData ? '#475569' : color} />
        </View>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot }} />
      </View>
      <Text style={{
        fontSize: 26, fontWeight: '800',
        color: noData ? '#475569' : '#f1f5f9',
        letterSpacing: -1, fontVariant: ['tabular-nums'],
      }}>
        {value}
        {!noData && <Text style={{ fontSize: 13, fontWeight: '600', color: '#94a3b8' }}> {unit}</Text>}
      </Text>
      <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}

// ── Quick action chip ────────────────────────────────────────────────────────
function QuickAction({ icon, label, color, onPress }: {
  icon: IoniconName; label: string; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}
      accessibilityLabel={label} accessibilityRole="button"
      style={{
        flex: 1, backgroundColor: '#0f172a', borderRadius: 14,
        padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center', gap: 8, minHeight: 88, justifyContent: 'center',
      }}>
      <View style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: color + '20',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#e2e8f0' }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { on } = useSocket();
  const api = useApi();
  const sensors = useSensors();
  const nav = useNavigation<any>();
  const { profile } = useProfile();

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAlerts(p => p.filter(a => a.alertId !== id));
    await api.acknowledgeAlert(id).catch(() => null);
  };

  const triggerFeed = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await api.triggerFeed().catch(() => null);
  };

  const s = (k: string) => sensors[k];
  const hasData = Object.keys(sensors).length > 0;
  const fmtVal = (k: string) => s(k)?.value != null ? Number(s(k)!.value).toFixed(1) : '--';
  const fmtSt  = (k: string) => s(k)?.status ?? 'offline';

  const scoreColor = !hasData ? '#475569' : healthScore >= 90 ? '#34d399' : healthScore >= 70 ? '#fbbf24' : '#ef4444';
  const scoreLabel = !hasData ? 'No Data' : healthScore >= 90 ? 'Excellent' : healthScore >= 70 ? 'Needs Attention' : 'Critical';
  const firstName = profile.name.split(/\s+/)[0] || 'there';

  return (
    <Animated.View style={{ flex: 1, backgroundColor: '#020617', opacity: fade }}>
      <AppHeader title={profile.tankName} subtitle={`${getGreeting()}, ${firstName}`} branded />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 18, paddingTop: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" colors={['#38bdf8']} />}
      >
        {/* ── Hero: Health Score ── */}
        <View style={{
          borderRadius: 20, overflow: 'hidden', marginBottom: 18,
          borderWidth: 1, borderColor: scoreColor + '25',
          backgroundColor: '#0c1a2e',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 22, gap: 18 }}>
            {/* Score circle */}
            <View style={{
              width: 96, height: 96, borderRadius: 48,
              backgroundColor: scoreColor + '15',
              borderWidth: 2, borderColor: scoreColor + '40',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 32, fontWeight: '900', color: scoreColor, letterSpacing: -1.5, fontVariant: ['tabular-nums'], lineHeight: 36 }}>
                {hasData ? healthScore : '--'}
              </Text>
              {hasData && <Text style={{ fontSize: 10, color: scoreColor + 'cc', fontWeight: '700', letterSpacing: 0.5 }}>/100</Text>}
            </View>

            {/* Info */}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
                Tank Health
              </Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#f1f5f9', marginBottom: 6, letterSpacing: -0.5 }}>
                {scoreLabel}
              </Text>
              <Text style={{ fontSize: 13, color: '#94a3b8', lineHeight: 18 }}>
                {!hasData
                  ? 'Waiting for sensor data'
                  : fishStatus === 'ok'
                    ? `${fishCount} fish · all parameters safe`
                    : 'Check alerts for details'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <Text style={sectionTitleStyle}>Quick Actions</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 22 }}>
          <QuickAction icon="restaurant-outline" label="Feed Now" color="#38bdf8" onPress={triggerFeed} />
          <QuickAction icon="flash-outline" label="Controls" color="#fbbf24" onPress={() => { Haptics.selectionAsync(); nav.navigate('Controls'); }} />
          <QuickAction icon="chatbubble-ellipses-outline" label="Ask AI" color="#a78bfa" onPress={() => { Haptics.selectionAsync(); nav.navigate('Fish AI'); }} />
        </View>

        {/* ── Water Parameters ── */}
        <Text style={sectionTitleStyle}>Water Parameters</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 }}>
          <SensorCard icon="flask-outline"      label="pH Level"      value={fmtVal('pH')}      unit="pH"   color="#10b981" status={fmtSt('pH')} />
          <SensorCard icon="thermometer-outline" label="Temperature"  value={fmtVal('temp_c')}  unit="°C"   color="#38bdf8" status={fmtSt('temp_c')} />
          <SensorCard icon="water-outline"      label="Dissolved O₂" value={fmtVal('do_mg_l')} unit="mg/L" color="#a78bfa" status={fmtSt('do_mg_l')} />
          <SensorCard icon="cloud-outline"      label="CO₂"          value={fmtVal('CO2')}     unit="ppm"  color="#fb923c" status={fmtSt('CO2')} />
        </View>

        {/* ── Recent Alerts (only when present) ── */}
        {alerts.length > 0 && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={[sectionTitleStyle, { marginBottom: 0 }]}>Recent Alerts</Text>
              <TouchableOpacity onPress={() => { Haptics.selectionAsync(); nav.navigate('Alerts'); }}
                accessibilityLabel="See all alerts" accessibilityRole="button"
                style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#38bdf8' }}>See all →</Text>
              </TouchableOpacity>
            </View>
            <View style={{
              backgroundColor: '#0f172a', borderRadius: 14,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
              overflow: 'hidden', marginBottom: 22,
            }}>
              {alerts.slice(0, 3).map((a, i) => {
                const sev = a.severity ?? 'info';
                const c = sev === 'critical' ? '#ef4444' : sev === 'warning' ? '#f59e0b' : '#38bdf8';
                return (
                  <View key={a.alertId} style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    padding: 14,
                    borderBottomWidth: i < Math.min(alerts.length - 1, 2) ? 1 : 0,
                    borderBottomColor: 'rgba(255,255,255,0.04)',
                  }}>
                    <View style={{ width: 4, height: 28, borderRadius: 2, backgroundColor: c }} />
                    <Text style={{ flex: 1, fontSize: 14, color: '#e2e8f0', lineHeight: 19 }} numberOfLines={2}>
                      {a.message}
                    </Text>
                    <TouchableOpacity onPress={() => ackAlert(a.alertId)} activeOpacity={0.7}
                      accessibilityLabel="Acknowledge alert" accessibilityRole="button"
                      style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: c + '20', borderRadius: 8, minHeight: 36, justifyContent: 'center' }}>
                      <Text style={{ fontSize: 12, color: c, fontWeight: '700' }}>ACK</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── Fish Intelligence ── */}
        <Text style={sectionTitleStyle}>Fish Intelligence</Text>
        <View style={{
          backgroundColor: '#0f172a', borderRadius: 16,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
          padding: 16, marginBottom: 22,
        }}>
          <View style={{ flexDirection: 'row', gap: 0 }}>
            {[
              { label: 'COUNT',  value: hasData ? String(fishCount) : '--', color: '#60a5fa' },
              { label: 'HEALTH', value: !hasData ? '--' : fishStatus === 'ok' ? 'Good' : fishStatus === 'warn' ? 'Warn' : 'Critical', color: hasData ? statusColor(fishStatus) : '#475569' },
              { label: 'VISION', value: hasData ? 'YOLOv11' : '--', color: hasData ? '#a78bfa' : '#475569' },
            ].map((item, i) => (
              <View key={item.label} style={{ flex: 1, alignItems: 'center', borderRightWidth: i < 2 ? 1 : 0, borderRightColor: 'rgba(255,255,255,0.06)' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: item.color }}>{item.value}</Text>
                <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.5, marginTop: 4 }}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Device Status (read-only summary) ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={[sectionTitleStyle, { marginBottom: 0 }]}>Device Status</Text>
          <TouchableOpacity onPress={() => { Haptics.selectionAsync(); nav.navigate('Controls'); }}
            accessibilityLabel="Manage devices" accessibilityRole="button"
            style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#38bdf8' }}>Manage →</Text>
          </TouchableOpacity>
        </View>
        <View style={{
          backgroundColor: '#0f172a', borderRadius: 14,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          {[
            { icon: 'water-outline'      as IoniconName, label: 'Air Pump',    color: '#06b6d4' },
            { icon: 'bulb-outline'       as IoniconName, label: 'LED Strip',   color: '#f59e0b' },
            { icon: 'restaurant-outline' as IoniconName, label: 'Auto Feeder', color: '#38bdf8' },
          ].map((d, i, arr) => (
            <View key={d.label} style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              paddingVertical: 13, paddingHorizontal: 14,
              borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.04)',
            }}>
              <View style={{
                width: 32, height: 32, borderRadius: 10,
                backgroundColor: d.color + '20',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name={d.icon} size={16} color={d.color} />
              </View>
              <Text style={{ flex: 1, fontSize: 14, color: '#e2e8f0', fontWeight: '500' }}>{d.label}</Text>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(148,163,184,0.1)' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8' }}>AUTO</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const sectionTitleStyle = {
  fontSize: 12, fontWeight: '800' as const, color: '#94a3b8',
  textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10,
};
