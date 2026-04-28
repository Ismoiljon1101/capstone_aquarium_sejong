import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSocket } from '../hooks/useSocket';
import { useApi } from '../hooks/useApi';

interface Alert { alertId: number; message: string; severity: string; createdAt?: string; }

const SEV: Record<string, { color: string; icon: string }> = {
  CRITICAL: { color: '#ef4444', icon: '\uD83D\uDED1' }, EMERGENCY: { color: '#dc2626', icon: '\u26A0\uFE0F' },
  WARNING: { color: '#fbbf24', icon: '\u26A0\uFE0F' }, INFO: { color: '#60a5fa', icon: '\u2139\uFE0F' },
};

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { on } = useSocket();
  const api = useApi();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadAlerts();
    return on('alert:new', (d: Alert) => setAlerts(prev => [d, ...prev]));
  }, [on]);

  const loadAlerts = async () => {
    try {
      setError(false);
      const res = await api.getActiveAlerts();
      if (Array.isArray(res.data)) setAlerts(res.data);
    } catch { setError(true); }
  };

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadAlerts(); setRefreshing(false); }, []);

  const handleAck = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    api.acknowledgeAlert(id).catch(() => null);
    setAlerts(p => p.filter(a => a.alertId !== id));
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" colors={['#38bdf8']} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#f1f5f9', letterSpacing: -1 }}>Alerts</Text>
          {alerts.length > 0 && (
            <TouchableOpacity onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); alerts.forEach(a => api.acknowledgeAlert(a.alertId).catch(() => null)); setAlerts([]); }}
              style={{ backgroundColor: 'rgba(239,68,68,0.12)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderCurve: 'continuous' }}>
              <Text style={{ color: '#f87171', fontSize: 12, fontWeight: '700' }}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20, fontVariant: ['tabular-nums'] }}>
          {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
        </Text>

        {error ? (
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
            <Text style={{ fontSize: 15, color: '#94a3b8' }}>Couldn't load alerts</Text>
            <TouchableOpacity onPress={loadAlerts} accessibilityLabel="Retry loading alerts" accessibilityRole="button"
              style={{ paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, backgroundColor: 'rgba(56,189,248,0.12)', borderWidth: 1, borderColor: '#38bdf840' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#38bdf8' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : alerts.length > 0 ? alerts.map(a => {
          const sev = a.severity?.toUpperCase() ?? 'INFO';
          const { color, icon } = SEV[sev] ?? SEV.INFO;
          return (
            <View key={a.alertId} style={{
              flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a',
              borderRadius: 14, borderCurve: 'continuous', padding: 14, marginBottom: 8,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderLeftWidth: 3, borderLeftColor: color, gap: 12,
            }}>
              <Text style={{ fontSize: 18 }}>{icon}</Text>
              <View style={{ flex: 1 }}>
                <Text selectable style={{ fontSize: 15, color: '#e2e8f0', lineHeight: 22 }}>{a.message}</Text>
                {a.createdAt && <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{new Date(a.createdAt).toLocaleTimeString()}</Text>}
              </View>
              <TouchableOpacity onPress={() => handleAck(a.alertId)}
                accessibilityLabel="Dismiss alert" accessibilityRole="button"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, minHeight: 44, justifyContent: 'center' }}>
                <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '700' }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          );
        }) : (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>{'\u2705'}</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#f1f5f9', marginBottom: 6 }}>All Clear</Text>
            <Text style={{ fontSize: 15, color: '#94a3b8' }}>No active alerts. All systems nominal.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
