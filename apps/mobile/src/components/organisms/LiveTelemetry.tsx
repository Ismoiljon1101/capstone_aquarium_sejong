import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSocket } from '../../hooks/useSocket';
import SensorReading from '../molecules/SensorReading';

const SENSOR_CONFIG = [
  { key: 'pH',      label: 'pH Level',        unit: 'pH',   color: '#10b981', defaultVal: 7.0 },
  { key: 'temp_c',  label: 'Temperature',      unit: '°C',   color: '#3b82f6', defaultVal: 25.0 },
  { key: 'do_mg_l', label: 'Dissolved Oxygen', unit: 'mg/L', color: '#6366f1', defaultVal: 7.5 },
];

export const LiveTelemetry: React.FC = () => {
  const { connected, on } = useSocket();
  const [sensors, setSensors] = useState<Record<string, { value: number }>>({});

  useEffect(() => {
    const unsub = on('sensor:update', (data: { type: string; value: number }) => {
      setSensors(prev => ({ ...prev, [data.type]: data }));
    });
    return unsub;
  }, [on]);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Telemetry</Text>
        <Text style={[styles.badge, { color: connected ? '#34d399' : '#f87171' }]}>
          {connected ? '● Live' : '○ Offline'}
        </Text>
      </View>
      <View style={styles.grid}>
        {SENSOR_CONFIG.map(s => (
          <SensorReading
            key={s.key}
            label={s.label}
            value={`${(sensors[s.key]?.value ?? s.defaultVal).toFixed(1)} ${s.unit}`}
            color={s.color}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
  badge: { fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
