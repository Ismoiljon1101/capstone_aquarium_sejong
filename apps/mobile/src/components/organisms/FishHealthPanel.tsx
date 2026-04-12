import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSocket } from '../../hooks/useSocket';

const STATUS_COLOR: Record<string, string> = {
  ok: '#34d399', good: '#34d399', normal: '#34d399',
  warn: '#fbbf24', warning: '#fbbf24',
  critical: '#ef4444',
};

const STATUS_BG: Record<string, string> = {
  ok: 'rgba(52,211,153,0.1)', good: 'rgba(52,211,153,0.1)', normal: 'rgba(52,211,153,0.1)',
  warn: 'rgba(251,191,36,0.1)', warning: 'rgba(251,191,36,0.1)',
  critical: 'rgba(239,68,68,0.1)',
};

function StatBox({ icon, value, label, color }: { icon: string; value: string; label: string; color?: string }) {
  return (
    <View style={statStyles.wrap}>
      <Text style={statStyles.icon}>{icon}</Text>
      <Text style={[statStyles.value, color ? { color } : {}]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: 4 },
  icon: { fontSize: 22 },
  value: { fontSize: 22, fontWeight: '800', color: '#f1f5f9' },
  label: { fontSize: 10, color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
});

export const FishHealthPanel: React.FC = () => {
  const { on } = useSocket();
  const [count, setCount] = useState<{ count: number; confidence: number; timestamp: string } | null>(null);
  const [health, setHealth] = useState<{ visualStatus: string; behaviorStatus: string } | null>(null);

  useEffect(() => {
    const u1 = on('fish:count',    (d: any) => setCount(d));
    const u2 = on('health:report', (d: any) => setHealth(d));
    return () => { u1(); u2(); };
  }, [on]);

  const status = health?.visualStatus ?? 'ok';
  const sc = STATUS_COLOR[status] ?? '#34d399';
  const bg = STATUS_BG[status] ?? 'rgba(52,211,153,0.1)';
  const pct = Math.round((count?.confidence ?? 0.95) * 100);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Fish Analysis</Text>
        <View style={[styles.statusChip, { backgroundColor: bg, borderColor: sc + '50' }]}>
          <View style={[styles.dot, { backgroundColor: sc }]} />
          <Text style={[styles.statusText, { color: sc }]}>{status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatBox icon="\uD83D\uDC1F" value={count?.count ? String(count.count) : '--'} label="Fish Count" color="#3b82f6" />
        <View style={styles.divider} />
        <StatBox icon="\uD83C\uDFAF" value={count?.count ? `${pct}%` : '--'} label="Confidence" color="#8b5cf6" />
        <View style={styles.divider} />
        <StatBox icon="\uD83E\uDDE0" value="YOLO" label="Model" color="#f59e0b" />
      </View>

      {/* Behavior */}
      <View style={[styles.behaviorBox, { borderLeftColor: sc }]}>
        <Text style={styles.behaviorHeading}>BEHAVIOR ANALYSIS</Text>
        <Text style={styles.behaviorText}>
          {health?.behaviorStatus || 'Awaiting next vision cycle\u2026 Fish data updates every 5 minutes.'}
        </Text>
      </View>

      {count?.timestamp ? (
        <Text style={styles.ts}>Last updated {new Date(count.timestamp).toLocaleTimeString()}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 24,
    gap: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', letterSpacing: -0.3 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 8 },
  behaviorBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderLeftWidth: 3,
  },
  behaviorHeading: { fontSize: 9, fontWeight: '800', color: '#64748b', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  behaviorText: { fontSize: 13, color: '#cbd5e1', lineHeight: 20 },
  ts: { fontSize: 11, color: '#475569', textAlign: 'center' },
});
