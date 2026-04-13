import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useSocket } from '../../hooks/useSocket';

interface Sensor { value: number; unit: string; status: 'ok' | 'warn' | 'critical'; }
type SensorMap = Record<string, Sensor>;

const SENSORS = [
  { key: 'pH',   label: 'pH Level',         unit: 'pH',   color: '#10b981', icon: '\uD83E\uddEA', safe: '6.8\u20137.5', def: 7.0 },
  { key: 'TEMP', label: 'Temperature',       unit: '\u00B0C',  color: '#38bdf8', icon: '\uD83C\uDF21\uFE0F', safe: '24\u201328',  def: 25.0 },
  { key: 'DO2',  label: 'Dissolved O\u2082', unit: 'mg/L', color: '#a78bfa', icon: '\uD83D\uDCA8', safe: '6\u20139',    def: 7.5 },
  { key: 'CO2',  label: 'CO\u2082',          unit: 'ppm',  color: '#fb923c', icon: '\u2601\uFE0F', safe: '<40',     def: 18.0 },
];

const STATUS_DOT: Record<string, string> = { ok: '#34d399', warn: '#fbbf24', critical: '#ef4444' };

function PulseRing({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true })
    ).start();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', width: 8, height: 8, borderRadius: 4,
      borderWidth: 2, borderColor: color, top: 0, left: 0,
      transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }],
      opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),
    }} />
  );
}

function SensorCard({ cfg, sensor }: { cfg: typeof SENSORS[0]; sensor: Sensor | undefined }) {
  const val = sensor?.value ?? cfg.def;
  const st = sensor?.status ?? 'ok';
  const dotColor = STATUS_DOT[st] ?? '#34d399';
  const hasData = sensor !== undefined && sensor.value > 0;

  return (
    <View style={{
      width: '47%',
      backgroundColor: '#0f172a',
      borderRadius: 20, borderCurve: 'continuous',
      padding: 16, borderWidth: 1, borderColor: cfg.color + '20',
      overflow: 'hidden', position: 'relative',
      boxShadow: `0 2px 12px ${cfg.color}10`,
    }}>
      {/* Glow */}
      <View style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: cfg.color + '08' }} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Text style={{ fontSize: 20 }}>{cfg.icon}</Text>
        <View style={{ position: 'relative' }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
          {hasData && <PulseRing color={dotColor} />}
        </View>
      </View>

      <Text selectable style={{
        fontSize: 36, fontWeight: '900', letterSpacing: -2, lineHeight: 40,
        color: cfg.color, fontVariant: ['tabular-nums'],
      }}>
        {val.toFixed(1)}
      </Text>
      <Text style={{ fontSize: 13, color: '#475569', fontWeight: '600', marginTop: 2, marginBottom: 12 }}>{cfg.unit}</Text>

      <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '600', marginBottom: 2 }}>{cfg.label}</Text>
      <Text selectable style={{ fontSize: 10, fontWeight: '500', color: cfg.color + '80' }}>Safe: {cfg.safe}</Text>
    </View>
  );
}

export const LiveTelemetry: React.FC = () => {
  const { on } = useSocket();
  const [sensors, setSensors] = useState<SensorMap>({});

  useEffect(() => {
    return on('sensor:update', (d: any) => {
      setSensors(prev => ({ ...prev, [d.type]: { value: d.value, unit: d.unit, status: d.status ?? 'ok' } }));
    });
  }, [on]);

  return (
    <View style={{ marginBottom: 28 }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.5, marginBottom: 16 }}>
        Water Parameters
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {SENSORS.map(cfg => <SensorCard key={cfg.key} cfg={cfg} sensor={sensors[cfg.key]} />)}
      </View>
    </View>
  );
};
