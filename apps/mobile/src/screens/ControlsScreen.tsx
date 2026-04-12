import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSocket } from '../hooks/useSocket';
import { useApi } from '../hooks/useApi';
import ActuatorButton from '../components/molecules/ActuatorButton';
import StatusDot from '../components/atoms/StatusDot';

export default function ControlsScreen() {
  const { connected, on } = useSocket();
  const api = useApi();

  const [pump, setPump] = useState(false);
  const [led, setLed] = useState(false);
  const [feeding, setFeeding] = useState(false);
  const [pumpLoading, setPumpLoading] = useState(false);
  const [ledLoading, setLedLoading] = useState(false);

  useEffect(() => {
    api.getActuatorState().then(res => {
      if (res.data) {
        setPump(!!res.data.pump);
        setLed(!!res.data.led);
      }
    }).catch(() => null);
  }, []);

  useEffect(() => {
    const unsub = on('actuator:state', (data: { type: string; state: boolean }) => {
      if (data.type === 'AIR_PUMP') setPump(data.state);
      if (data.type === 'LED_STRIP') setLed(data.state);
    });
    return unsub;
  }, [on]);

  const handleFeed = async () => {
    setFeeding(true);
    await api.triggerFeed().catch(() => null);
    setTimeout(() => setFeeding(false), 3000);
  };

  const handlePump = async () => {
    setPumpLoading(true);
    await api.togglePump().catch(() => null);
    setPump(p => !p);
    setPumpLoading(false);
  };

  const handleLed = async () => {
    setLedLoading(true);
    await api.toggleLed().catch(() => null);
    setLed(l => !l);
    setLedLoading(false);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Hardware Controls</Text>
          <View style={styles.connectionBadge}>
            <StatusDot status={connected ? 'ok' : 'critical'} size={6} />
            <Text style={[styles.connText, { color: connected ? '#34d399' : '#f87171' }]}>
              {connected ? 'Connected' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Feed Button - prominent */}
        <TouchableOpacity
          style={[styles.feedCard, feeding && styles.feedActive]}
          onPress={handleFeed}
          disabled={feeding}
          activeOpacity={0.7}
        >
          <Text style={styles.feedIcon}>{feeding ? '\u23F3' : '\uD83D\uDC1F'}</Text>
          <View>
            <Text style={styles.feedLabel}>{feeding ? 'Dispensing Feed...' : 'Feed Fish Now'}</Text>
            <Text style={styles.feedSub}>Activates feeder relay for one cycle</Text>
          </View>
        </TouchableOpacity>

        {/* Toggle Controls */}
        <Text style={styles.sectionTitle}>Toggle Devices</Text>
        <View style={styles.toggleRow}>
          <ActuatorButton
            icon="\uD83D\uDCA8"
            label="Air Pump"
            active={pump}
            onPress={handlePump}
            loading={pumpLoading}
            color="#06b6d4"
          />
          <View style={{ width: 12 }} />
          <ActuatorButton
            icon="\uD83D\uDCA1"
            label="LED Strip"
            active={led}
            onPress={handleLed}
            loading={ledLoading}
            color="#f59e0b"
          />
        </View>

        {/* Status Summary */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Relay Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Feeder</Text>
            <Text style={[styles.statusValue, { color: feeding ? '#3b82f6' : '#64748b' }]}>
              {feeding ? 'ACTIVE' : 'IDLE'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Air Pump</Text>
            <Text style={[styles.statusValue, { color: pump ? '#34d399' : '#64748b' }]}>
              {pump ? 'ON' : 'OFF'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>LED Strip</Text>
            <Text style={[styles.statusValue, { color: led ? '#fbbf24' : '#64748b' }]}>
              {led ? 'ON' : 'OFF'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 16, paddingTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#f1f5f9' },
  connectionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
  connText: { fontSize: 11, fontWeight: '600' },
  feedCard: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    marginBottom: 24,
  },
  feedActive: { backgroundColor: 'rgba(59,130,246,0.25)', borderColor: '#3b82f6' },
  feedIcon: { fontSize: 36 },
  feedLabel: { fontSize: 18, fontWeight: '700', color: '#60a5fa', marginBottom: 2 },
  feedSub: { fontSize: 12, color: '#64748b' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0', marginBottom: 12 },
  toggleRow: { flexDirection: 'row', marginBottom: 24 },
  statusCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statusTitle: { fontSize: 14, fontWeight: '700', color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  statusLabel: { fontSize: 14, color: '#cbd5e1' },
  statusValue: { fontSize: 14, fontWeight: '700' },
});
