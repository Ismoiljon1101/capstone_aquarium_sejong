import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import StatusBadge from '../atoms/StatusBadge';

interface FishHealthCardProps {
  fishCount: number;
  confidence: number;
  healthStatus: string;
  behaviorSummary: string;
  lastUpdated: string;
}

const FishHealthCard: React.FC<FishHealthCardProps> = ({
  fishCount,
  confidence,
  healthStatus,
  behaviorSummary,
  lastUpdated,
}) => {
  const confidencePct = Math.round(confidence * 100);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Fish Health</Text>
        <StatusBadge status={healthStatus} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statIcon}>🐟</Text>
          <Text style={styles.statValue}>{fishCount}</Text>
          <Text style={styles.statLabel}>Fish Count</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statIcon}>🎯</Text>
          <Text style={styles.statValue}>{confidencePct}%</Text>
          <Text style={styles.statLabel}>Confidence</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statIcon}>🧠</Text>
          <Text style={[styles.statValue, { fontSize: 16 }]}>AI</Text>
          <Text style={styles.statLabel}>Powered</Text>
        </View>
      </View>

      {behaviorSummary ? (
        <View style={styles.behaviorBox}>
          <Text style={styles.behaviorLabel}>Behavior Analysis</Text>
          <Text style={styles.behaviorText}>{behaviorSummary}</Text>
        </View>
      ) : null}

      <Text style={styles.timestamp}>
        Updated {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '--'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  behaviorBox: {
    backgroundColor: 'rgba(99,102,241,0.08)',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
    marginBottom: 12,
  },
  behaviorLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#818cf8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  behaviorText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'right',
  },
});

export default FishHealthCard;
