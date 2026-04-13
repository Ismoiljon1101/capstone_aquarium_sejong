import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSocket } from '../hooks/useSocket';

const C = {
  bg: '#020617', card: '#0f172a', border: '#1e293b',
  text: '#f1f5f9', muted: '#64748b', good: '#10b981', warn: '#f59e0b', bad: '#ef4444',
  ph: '#10b981', temp: '#f59e0b', do2: '#3b82f6',
};

type MetricProps = { label: string; value: string; unit: string; color: string; status: 'ok' | 'warn' | 'critical' };

const MetricCard = ({ label, value, unit, color, status }: MetricProps) => {
  const dot = status === 'ok' ? C.good : status === 'warn' ? C.warn : C.bad;
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>{label}</Text>
        <View style={[styles.dot, { backgroundColor: dot }]} />
      </View>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
      <Text style={styles.cardUnit}>{unit}</Text>
    </View>
  );
};

const phStatus = (v: number): 'ok' | 'warn' | 'critical' =>
  v >= 6.5 && v <= 8.0 ? 'ok' : v >= 6.0 && v <= 8.5 ? 'warn' : 'critical';
const tempStatus = (v: number): 'ok' | 'warn' | 'critical' =>
  v >= 20 && v <= 30 ? 'ok' : v >= 18 && v <= 32 ? 'warn' : 'critical';
const doStatus = (v: number): 'ok' | 'warn' | 'critical' =>
  v >= 5.0 ? 'ok' : v >= 3.5 ? 'warn' : 'critical';

/**
 * HomeScreen — live sensor cards from WebSocket sensor:update event.
 */
export default function HomeScreen() {
  const { connected, telemetry, fishCount } = useSocket();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Live Monitor</Text>
        <View style={styles.connRow}>
          <View style={[styles.connDot, { backgroundColor: connected ? C.good : C.bad }]} />
          <Text style={styles.connText}>{connected ? 'Live' : 'Offline'}</Text>
        </View>
      </View>

      {!telemetry ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.ph} size="large" />
          <Text style={styles.muted}>Waiting for sensor data...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.section}>Water Parameters</Text>
          <View style={styles.grid}>
            <MetricCard label="pH Level" value={telemetry.pH.toFixed(2)} unit="pH" color={C.ph} status={phStatus(telemetry.pH)} />
            <MetricCard label="Temperature" value={telemetry.temp_c.toFixed(1)} unit="°C" color={C.temp} status={tempStatus(telemetry.temp_c)} />
            <MetricCard label="Dissolved O₂" value={telemetry.do_mg_l.toFixed(2)} unit="mg/L" color={C.do2} status={doStatus(telemetry.do_mg_l)} />
            {fishCount && <MetricCard label="Fish Count" value={fishCount.count.toString()} unit="fish" color="#a855f7" status="ok" />}
          </View>

          <Text style={styles.section}>Last Update</Text>
          <View style={styles.tsCard}>
            <Text style={styles.tsText}>{new Date(telemetry.timestamp).toLocaleString()}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', color: C.text },
  connRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  connDot: { width: 8, height: 8, borderRadius: 4 },
  connText: { fontSize: 12, color: C.muted },
  section: { fontSize: 13, fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  card: { width: '47%', backgroundColor: C.card, borderRadius: 14, padding: 16, borderLeftWidth: 4 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardLabel: { color: C.muted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  cardValue: { fontSize: 24, fontWeight: '700' },
  cardUnit: { fontSize: 11, color: C.muted, marginTop: 2 },
  center: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  muted: { color: C.muted, fontSize: 14 },
  tsCard: { backgroundColor: C.card, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: C.border },
  tsText: { color: C.muted, fontSize: 13, textAlign: 'center' },
});
