import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSocket } from '../../hooks/useSocket';
import FishCountBadge from '../molecules/FishCountBadge';

const STATUS_COLOR: Record<string, string> = {
  ok: '#34d399', good: '#34d399',
  warn: '#fbbf24', warning: '#fbbf24',
  critical: '#ef4444',
};

export const FishHealthPanel: React.FC = () => {
  const { on } = useSocket();
  const [fishCount, setFishCount] = useState<{ count: number; confidence: number; timestamp: string } | null>(null);
  const [health, setHealth] = useState<{ visualStatus: string; behaviorStatus: string } | null>(null);

  useEffect(() => {
    const u1 = on('fish:count', (data: any) => setFishCount(data));
    const u2 = on('health:report', (data: any) => setHealth(data));
    return () => { u1(); u2(); };
  }, [on]);

  const status = health?.visualStatus ?? 'ok';
  const color = STATUS_COLOR[status] ?? '#34d399';

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>❤️  AI Health Insights</Text>
        <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
          <Text style={[styles.badgeText, { color }]}>{status.toUpperCase()}</Text>
        </View>
      </View>

      <FishCountBadge
        count={fishCount?.count ?? 0}
        confidence={fishCount?.confidence ?? 0.95}
        timestamp={fishCount?.timestamp ?? new Date().toISOString()}
      />

      <View style={styles.behavior}>
        <Text style={styles.behaviorLabel}>BEHAVIOR SUMMARY</Text>
        <Text style={styles.behaviorText}>
          {health?.behaviorStatus ?? 'Fish are showing normal schooling behavior. No anomalies detected.'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 24,
    gap: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  behavior: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  behaviorLabel: { color: '#64748b', fontSize: 10, fontWeight: '600', letterSpacing: 0.8, marginBottom: 6 },
  behaviorText: { color: '#cbd5e1', fontSize: 13, lineHeight: 20 },
});
