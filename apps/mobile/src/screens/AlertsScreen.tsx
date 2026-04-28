import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSocket } from '../hooks/useSocket';
import { useApi } from '../hooks/useApi';
import AppHeader from '../components/AppHeader';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Alert { alertId: number; message: string; severity: string; createdAt?: string; }

const SEV_INFO: Record<string, { color: string; icon: IoniconName; label: string; rank: number }> = {
  CRITICAL:  { color: '#ef4444', icon: 'alert-circle',     label: 'Critical',  rank: 0 },
  EMERGENCY: { color: '#dc2626', icon: 'warning',          label: 'Emergency', rank: 0 },
  WARNING:   { color: '#fbbf24', icon: 'warning-outline',  label: 'Warning',   rank: 1 },
  INFO:      { color: '#60a5fa', icon: 'information-circle-outline', label: 'Info', rank: 2 },
};

function getSev(s: string) {
  return SEV_INFO[s?.toUpperCase()] ?? SEV_INFO.INFO;
}

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { on } = useSocket();
  const api = useApi();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadAlerts();
    return on('alert:new', (d: Alert) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setAlerts(prev => [d, ...prev]);
    });
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

  const handleClearAll = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    alerts.forEach(a => api.acknowledgeAlert(a.alertId).catch(() => null));
    setAlerts([]);
  };

  // Group by severity rank
  const grouped = useMemo(() => {
    const groups: Record<string, Alert[]> = { critical: [], warning: [], info: [] };
    alerts.forEach(a => {
      const sev = (a.severity ?? 'INFO').toUpperCase();
      if (sev === 'CRITICAL' || sev === 'EMERGENCY') groups.critical.push(a);
      else if (sev === 'WARNING') groups.warning.push(a);
      else groups.info.push(a);
    });
    return groups;
  }, [alerts]);

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <AppHeader title="Alerts" subtitle={alerts.length > 0 ? `${alerts.length} active` : 'All clear'} back />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 18, paddingTop: 16, paddingBottom: Math.max(insets.bottom, 40) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" colors={['#38bdf8']} />}
      >
        {/* Clear all action */}
        {alerts.length > 0 && (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 }}>
            <TouchableOpacity onPress={handleClearAll}
              accessibilityLabel="Clear all alerts" accessibilityRole="button"
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: 'rgba(239,68,68,0.1)',
                paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
                borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
                minHeight: 40,
              }}>
              <Ionicons name="trash-outline" size={14} color="#f87171" />
              <Text style={{ color: '#f87171', fontSize: 13, fontWeight: '700' }}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error state */}
        {error ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: 'rgba(239,68,68,0.1)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="cloud-offline-outline" size={28} color="#ef4444" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#f1f5f9' }}>Couldn't load alerts</Text>
            <Text style={{ fontSize: 14, color: '#94a3b8' }}>Check your connection</Text>
            <TouchableOpacity onPress={loadAlerts}
              accessibilityLabel="Retry loading alerts" accessibilityRole="button"
              style={{ marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, backgroundColor: 'rgba(56,189,248,0.12)', borderWidth: 1, borderColor: '#38bdf840', minHeight: 44, justifyContent: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#38bdf8' }}>Retry</Text>
            </TouchableOpacity>
          </View>

        /* Empty state */
        ) : alerts.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 80 }}>
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: 'rgba(52,211,153,0.12)',
              alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)',
            }}>
              <Ionicons name="checkmark-circle" size={40} color="#34d399" />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#f1f5f9', marginBottom: 6 }}>All Clear</Text>
            <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', maxWidth: 260, lineHeight: 20 }}>
              No active alerts. All systems nominal.
            </Text>
          </View>

        /* Severity-grouped list */
        ) : (
          <>
            {grouped.critical.length > 0 && (
              <AlertGroup title="Critical" alerts={grouped.critical} onAck={handleAck} />
            )}
            {grouped.warning.length > 0 && (
              <AlertGroup title="Warnings" alerts={grouped.warning} onAck={handleAck} />
            )}
            {grouped.info.length > 0 && (
              <AlertGroup title="Info" alerts={grouped.info} onAck={handleAck} />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Alert group section ──────────────────────────────────────────────────────
function AlertGroup({ title, alerts, onAck }: {
  title: string; alerts: Alert[]; onAck: (id: number) => void;
}) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={{
        fontSize: 12, fontWeight: '800', color: '#94a3b8',
        letterSpacing: 1, textTransform: 'uppercase',
        marginBottom: 8, marginLeft: 4,
      }}>
        {title} · {alerts.length}
      </Text>
      <View style={{
        backgroundColor: '#0f172a', borderRadius: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        {alerts.map((a, i) => {
          const { color, icon } = getSev(a.severity);
          return (
            <View key={a.alertId} style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              padding: 14,
              borderBottomWidth: i < alerts.length - 1 ? 1 : 0,
              borderBottomColor: 'rgba(255,255,255,0.04)',
            }}>
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: color + '20',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name={icon} size={18} color={color} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text selectable style={{ fontSize: 15, color: '#e2e8f0', lineHeight: 22 }}>{a.message}</Text>
                {a.createdAt && (
                  <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                    {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => onAck(a.alertId)}
                accessibilityLabel="Dismiss alert" accessibilityRole="button"
                style={{
                  paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  minHeight: 40, justifyContent: 'center',
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                }}>
                <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '700' }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}
