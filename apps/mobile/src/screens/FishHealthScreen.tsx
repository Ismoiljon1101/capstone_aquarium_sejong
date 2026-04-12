import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSocket } from '../hooks/useSocket';
import { useApi } from '../hooks/useApi';
import FishHealthCard from '../components/molecules/FishHealthCard';

interface HealthReport {
  reportId: number;
  phStatus: string;
  tempStatus: string;
  doStatus: string;
  visualStatus: string;
  behaviorStatus: string;
  createdAt: string;
}

export default function FishHealthScreen() {
  const { on } = useSocket();
  const api = useApi();
  const [fishCount, setFishCount] = useState({ count: 0, confidence: 0, timestamp: '' });
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    const u1 = on('fish:count', (d: any) => setFishCount(d));
    const u2 = on('health:report', (d: HealthReport) => setHealth(d));
    return () => { u1(); u2(); };
  }, [on]);

  const loadData = async () => {
    const [countRes, healthRes] = await Promise.allSettled([
      api.getFishCount(),
      api.getFishHealth(),
    ]);
    if (countRes.status === 'fulfilled' && countRes.value.data) setFishCount(countRes.value.data);
    if (healthRes.status === 'fulfilled' && healthRes.value.data) setHealth(healthRes.value.data);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const statusColor = (s: string) => {
    if (s === 'critical') return '#ef4444';
    if (s === 'warn' || s === 'warning') return '#fbbf24';
    return '#34d399';
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" colors={['#3b82f6']} />
        }
      >
        <Text style={styles.title}>Fish Health</Text>
        <Text style={styles.subtitle}>AI-powered monitoring via YOLO + ConvLSTM</Text>

        <FishHealthCard
          fishCount={fishCount.count}
          confidence={fishCount.confidence}
          healthStatus={health?.visualStatus ?? 'ok'}
          behaviorSummary={health?.behaviorStatus ?? 'Normal schooling behavior detected.'}
          lastUpdated={fishCount.timestamp}
        />

        {/* Parameter Breakdown */}
        <Text style={styles.sectionTitle}>Parameter Status</Text>
        <View style={styles.paramGrid}>
          {[
            { label: 'pH', status: health?.phStatus ?? 'ok', icon: '\uD83E\uddEA' },
            { label: 'Temperature', status: health?.tempStatus ?? 'ok', icon: '\uD83C\uDF21\uFE0F' },
            { label: 'Dissolved O\u2082', status: health?.doStatus ?? 'ok', icon: '\uD83D\uDCA8' },
            { label: 'Visual Check', status: health?.visualStatus ?? 'ok', icon: '\uD83D\uDC41\uFE0F' },
            { label: 'Behavior', status: health?.behaviorStatus ?? 'normal', icon: '\uD83E\uDDE0' },
          ].map(p => (
            <View key={p.label} style={styles.paramRow}>
              <Text style={styles.paramIcon}>{p.icon}</Text>
              <Text style={styles.paramLabel}>{p.label}</Text>
              <View style={[styles.paramBadge, { backgroundColor: statusColor(p.status) + '22' }]}>
                <Text style={[styles.paramStatus, { color: statusColor(p.status) }]}>
                  {p.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {health && (
          <Text style={styles.reportTime}>
            Last report: {new Date(health.createdAt).toLocaleString()}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 16, paddingTop: 12, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0', marginTop: 24, marginBottom: 12 },
  paramGrid: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  paramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  paramIcon: { fontSize: 18, marginRight: 12 },
  paramLabel: { flex: 1, fontSize: 14, color: '#cbd5e1', fontWeight: '500' },
  paramBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  paramStatus: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  reportTime: { fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 20 },
});
