import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSocket } from '../hooks/useSocket';
import { useApi } from '../hooks/useApi';
import AlertBanner from '../components/molecules/AlertBanner';

interface Alert {
  alertId: string;
  message: string;
  severity: string;
  createdAt: string;
}

export default function AlertsScreen() {
  const { on } = useSocket();
  const api = useApi();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAlerts();
    const unsub = on('alert:new', (data: Alert) => {
      setAlerts(prev => [data, ...prev]);
    });
    return unsub;
  }, [on]);

  const loadAlerts = async () => {
    try {
      const res = await api.getActiveAlerts();
      if (Array.isArray(res.data)) setAlerts(res.data);
    } catch {
      // socket will provide data
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  }, []);

  const handleAcknowledge = (id: string) => {
    api.acknowledgeAlert(id).catch(() => null);
    setAlerts(prev => prev.filter(a => a.alertId !== id));
  };

  const handleAcknowledgeAll = () => {
    alerts.forEach(a => api.acknowledgeAlert(a.alertId).catch(() => null));
    setAlerts([]);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" colors={['#3b82f6']} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Active Alerts</Text>
          {alerts.length > 0 && (
            <TouchableOpacity onPress={handleAcknowledgeAll} style={styles.clearBtn}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.count}>
          {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
        </Text>

        {alerts.length > 0 ? (
          alerts.map(alert => (
            <AlertBanner
              key={alert.alertId}
              message={alert.message}
              severity={alert.severity}
              onAcknowledge={() => handleAcknowledge(alert.alertId)}
            />
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>&#x2705;</Text>
            <Text style={styles.emptyTitle}>All Clear</Text>
            <Text style={styles.emptyText}>No active alerts. All systems nominal.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 16, paddingTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#f1f5f9' },
  clearBtn: { backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  clearText: { color: '#f87171', fontSize: 12, fontWeight: '600' },
  count: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#f1f5f9', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#64748b' },
});
