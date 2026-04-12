import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSocket } from '../../hooks/useSocket';

interface Sensor {
  value: number;
  unit: string;
  status: 'ok' | 'warn' | 'critical';
}

type SensorMap = Record<string, Sensor>;

const SENSORS = [
  { key: 'pH',      label: 'pH Level',         unit: 'pH',   color: '#10b981', icon: '\uD83E\uddEA', min: 6.5, max: 8.5 },
  { key: 'TEMP',    label: 'Temperature',       unit: '\u00B0C',  color: '#3b82f6', icon: '\uD83C\uDF21\uFE0F', min: 20, max: 32 },
  { key: 'DO2',     label: 'Dissolved O\u2082', unit: 'mg/L', color: '#8b5cf6', icon: '\uD83D\uDCA8', min: 5,   max: 10 },
  { key: 'CO2',     label: 'CO\u2082',          unit: 'ppm',  color: '#f59e0b', icon: '\u2601\uFE0F', min: 0,   max: 50 },
];

const STATUS_COLOR = { ok: '#34d399', warn: '#fbbf24', critical: '#ef4444' };

const DEFAULT: Sensor = { value: 0, unit: '', status: 'ok' };

function PulseDot({ active }: { active: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.5, duration: 800, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [active]);
  return (
    <Animated.View style={[styles.pulse, { transform: [{ scale }], backgroundColor: active ? '#34d399' : '#475569' }]} />
  );
}

function MetricCard({ cfg, sensor }: { cfg: typeof SENSORS[0]; sensor: Sensor }) {
  const sc = STATUS_COLOR[sensor.status] ?? '#34d399';
  const pct = Math.min(1, Math.max(0, (sensor.value - cfg.min) / (cfg.max - cfg.min)));
  return (
    <View style={[styles.card, { borderLeftColor: cfg.color }]}>
      <View style={styles.cardTop}>
        <Text style={styles.cardIcon}>{cfg.icon}</Text>
        <View style={[styles.statusPill, { backgroundColor: sc + '22' }]}>
          <Text style={[styles.statusText, { color: sc }]}>{sensor.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={[styles.value, { color: cfg.color }]}>
        {sensor.value > 0 ? sensor.value.toFixed(1) : '--'}
      </Text>
      <Text style={styles.unit}>{cfg.unit}</Text>
      <Text style={styles.label}>{cfg.label}</Text>
      {/* range bar */}
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${pct * 100}%` as any, backgroundColor: cfg.color }]} />
      </View>
      <View style={styles.barLabels}>
        <Text style={styles.barLabel}>{cfg.min}</Text>
        <Text style={styles.barLabel}>{cfg.max}</Text>
      </View>
    </View>
  );
}

export const LiveTelemetry: React.FC = () => {
  const { connected, on } = useSocket();
  const [sensors, setSensors] = useState<SensorMap>({});

  useEffect(() => {
    const unsub = on('sensor:update', (d: any) => {
      setSensors(prev => ({ ...prev, [d.type]: { value: d.value, unit: d.unit, status: d.status ?? 'ok' } }));
    });
    return unsub;
  }, [on]);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Telemetry</Text>
        <View style={styles.liveRow}>
          <PulseDot active={connected} />
          <Text style={[styles.liveText, { color: connected ? '#34d399' : '#64748b' }]}>
            {connected ? 'Live' : 'Offline'}
          </Text>
        </View>
      </View>
      <View style={styles.grid}>
        {SENSORS.map(cfg => (
          <MetricCard key={cfg.key} cfg={cfg} sensor={sensors[cfg.key] ?? DEFAULT} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', letterSpacing: -0.3 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulse: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '47.5%',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderLeftWidth: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardIcon: { fontSize: 18 },
  statusPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  value: { fontSize: 32, fontWeight: '800', letterSpacing: -1, lineHeight: 36 },
  unit: { fontSize: 12, color: '#64748b', fontWeight: '500', marginTop: 2, marginBottom: 4 },
  label: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 10 },
  bar: { height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 3, borderRadius: 2 },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  barLabel: { fontSize: 9, color: '#475569' },
});
