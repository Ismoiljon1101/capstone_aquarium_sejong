import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FishCountBadgeProps {
  count: number;
  confidence: number;
  timestamp: string;
}

const FishCountBadge: React.FC<FishCountBadgeProps> = ({ count, confidence, timestamp }) => (
  <View style={styles.container}>
    <View style={styles.iconBox}>
      <Text style={styles.icon}>🐟</Text>
    </View>
    <View style={styles.info}>
      <Text style={styles.label}>Fish Count</Text>
      <Text style={styles.count}>{count} Individuals</Text>
    </View>
    <View style={styles.right}>
      <Text style={styles.confidence}>✓ {(confidence * 100).toFixed(0)}% conf</Text>
      <Text style={styles.time}>{new Date(timestamp).toLocaleTimeString()}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  iconBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 8,
    padding: 8,
  },
  icon: { fontSize: 18 },
  info: { flex: 1 },
  label: { color: '#94a3b8', fontSize: 11 },
  count: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  right: { alignItems: 'flex-end' },
  confidence: { color: '#34d399', fontSize: 10, fontWeight: '600' },
  time: { color: '#64748b', fontSize: 10, marginTop: 2 },
});

export default FishCountBadge;
