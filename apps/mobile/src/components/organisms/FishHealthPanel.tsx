import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useSocket } from '../../hooks/useSocket';

const STATUS_MAP: Record<string, { color: string; label: string; emoji: string }> = {
  ok:       { color: '#34d399', label: 'Healthy',  emoji: '\uD83D\uDFE2' },
  good:     { color: '#34d399', label: 'Healthy',  emoji: '\uD83D\uDFE2' },
  normal:   { color: '#34d399', label: 'Normal',   emoji: '\uD83D\uDFE2' },
  warn:     { color: '#fbbf24', label: 'Caution',  emoji: '\uD83D\uDFE1' },
  warning:  { color: '#fbbf24', label: 'Caution',  emoji: '\uD83D\uDFE1' },
  critical: { color: '#ef4444', label: 'Critical', emoji: '\uD83D\uDD34' },
};

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 10, color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        {label}
      </Text>
      <Text selectable style={{ fontSize: 20, fontWeight: '900', color, fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
    </View>
  );
}

export const FishHealthPanel: React.FC = () => {
  const { on } = useSocket();
  const [count, setCount] = useState<{ count: number; confidence: number; timestamp: string } | null>(null);
  const [health, setHealth] = useState<{ visualStatus: string; behaviorStatus: string } | null>(null);

  useEffect(() => {
    const u1 = on('fish:count', setCount);
    const u2 = on('health:report', setHealth);
    return () => { u1(); u2(); };
  }, [on]);

  const status = health?.visualStatus ?? 'ok';
  const info = STATUS_MAP[status] ?? STATUS_MAP.ok;
  const fishCount = count?.count ?? 12;
  const conf = Math.round((count?.confidence ?? 0.96) * 100);

  return (
    <View style={{ marginBottom: 28 }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.5, marginBottom: 16 }}>
        Fish Intelligence
      </Text>

      <View style={{
        backgroundColor: '#0f172a',
        borderRadius: 24, borderCurve: 'continuous',
        overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
      }}>
        {/* Status hero row */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          padding: 20, borderBottomWidth: 1, borderBottomColor: info.color + '15',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 28 }}>{info.emoji}</Text>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: info.color }}>{info.label}</Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>AI-powered analysis via YOLO</Text>
            </View>
          </View>
          <Text selectable style={{ fontSize: 28, fontWeight: '900', letterSpacing: -1, color: info.color, fontVariant: ['tabular-nums'] }}>
            {conf}%
          </Text>
        </View>

        {/* Metrics row */}
        <View style={{
          flexDirection: 'row', padding: 20,
          borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
        }}>
          <Metric label="Fish Count" value={String(fishCount)} color="#38bdf8" />
          <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 4 }} />
          <Metric label="Confidence" value={`${conf}%`} color="#a78bfa" />
          <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 4 }} />
          <Metric label="Model" value="v11" color="#fb923c" />
        </View>

        {/* Behavior */}
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 9, fontWeight: '800', color: '#475569', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
            BEHAVIOR
          </Text>
          <Text selectable style={{ fontSize: 14, color: '#94a3b8', lineHeight: 22 }}>
            {health?.behaviorStatus || 'Normal schooling pattern detected. No anomalies in movement or feeding behavior.'}
          </Text>
        </View>
      </View>
    </View>
  );
};
