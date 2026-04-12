import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useApi } from '../../hooks/useApi';
import { useSocket } from '../../hooks/useSocket';

interface ToggleCardProps {
  icon: string;
  label: string;
  sub: string;
  active: boolean;
  loading: boolean;
  color: string;
  onPress: () => void;
}

function ToggleCard({ icon, label, sub, active, loading, color, onPress }: ToggleCardProps) {
  return (
    <TouchableOpacity
      style={[styles.toggleCard, active && { borderColor: color + '60', backgroundColor: color + '12' }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      <View style={[styles.toggleIconWrap, { backgroundColor: active ? color + '25' : 'rgba(255,255,255,0.05)' }]}>
        {loading
          ? <ActivityIndicator size="small" color={color} />
          : <Text style={styles.toggleIcon}>{icon}</Text>
        }
      </View>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Text style={styles.toggleSub}>{sub}</Text>
      <View style={[styles.toggleBadge, { backgroundColor: active ? color + '22' : 'rgba(255,255,255,0.05)' }]}>
        <Text style={[styles.toggleBadgeText, { color: active ? color : '#64748b' }]}>
          {active ? 'ON' : 'OFF'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export const ControlPanel: React.FC = () => {
  const { triggerFeed, togglePump, toggleLed, getActuatorState } = useApi();
  const { on } = useSocket();
  const [pump, setPump] = useState(false);
  const [led, setLed] = useState(false);
  const [feeding, setFeeding] = useState(false);
  const [pumpLoading, setPumpLoading] = useState(false);
  const [ledLoading, setLedLoading] = useState(false);

  useEffect(() => {
    getActuatorState().then(r => {
      if (r.data) { setPump(!!r.data.pump); setLed(!!r.data.led); }
    }).catch(() => null);
  }, []);

  useEffect(() => {
    return on('actuator:state', (d: { type: string; state: boolean }) => {
      if (d.type === 'AIR_PUMP') setPump(d.state);
      if (d.type === 'LED_STRIP') setLed(d.state);
    });
  }, [on]);

  const handleFeed = async () => {
    setFeeding(true);
    await triggerFeed().catch(() => null);
    setTimeout(() => setFeeding(false), 3000);
  };

  const handlePump = async () => {
    setPumpLoading(true);
    await togglePump().catch(() => null);
    setPump(p => !p);
    setPumpLoading(false);
  };

  const handleLed = async () => {
    setLedLoading(true);
    await toggleLed().catch(() => null);
    setLed(l => !l);
    setLedLoading(false);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Quick Controls</Text>

      {/* Feed — full-width CTA */}
      <TouchableOpacity
        style={[styles.feedBtn, feeding && styles.feedActive]}
        onPress={handleFeed}
        disabled={feeding}
        activeOpacity={0.75}
      >
        <View style={styles.feedLeft}>
          <Text style={styles.feedIcon}>{feeding ? '\u23F3' : '\uD83D\uDC1F'}</Text>
          <View>
            <Text style={styles.feedLabel}>{feeding ? 'Dispensing...' : 'Feed Fish'}</Text>
            <Text style={styles.feedSub}>Triggers feeder relay once</Text>
          </View>
        </View>
        {feeding
          ? <ActivityIndicator color="#60a5fa" size="small" />
          : <Text style={styles.feedArrow}>\u203A</Text>
        }
      </TouchableOpacity>

      {/* Toggles */}
      <View style={styles.toggleRow}>
        <ToggleCard icon="\uD83D\uDCA8" label="Air Pump" sub="Oxygenation" active={pump} loading={pumpLoading} color="#06b6d4" onPress={handlePump} />
        <ToggleCard icon="\uD83D\uDCA1" label="LED Strip" sub="12V lighting" active={led}  loading={ledLoading}  color="#f59e0b" onPress={handleLed} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  title: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginBottom: 14, letterSpacing: -0.3 },
  feedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    marginBottom: 12,
  },
  feedActive: { borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)' },
  feedLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  feedIcon: { fontSize: 30 },
  feedLabel: { fontSize: 16, fontWeight: '700', color: '#60a5fa', marginBottom: 2 },
  feedSub: { fontSize: 12, color: '#64748b' },
  feedArrow: { fontSize: 24, color: '#60a5fa', fontWeight: '300' },
  toggleRow: { flexDirection: 'row', gap: 12 },
  toggleCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  toggleIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toggleIcon: { fontSize: 22 },
  toggleLabel: { fontSize: 13, fontWeight: '700', color: '#e2e8f0' },
  toggleSub: { fontSize: 10, color: '#64748b' },
  toggleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  toggleBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
});
