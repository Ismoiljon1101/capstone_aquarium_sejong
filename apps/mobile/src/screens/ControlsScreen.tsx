import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSocket } from '../hooks/useSocket';
import { useApi } from '../hooks/useApi';

export default function ControlsScreen() {
  const { connected, on } = useSocket();
  const api = useApi();
  const [pump, setPump] = useState(false);
  const [led, setLed] = useState(false);
  const [feeding, setFeeding] = useState(false);
  const [pumpL, setPumpL] = useState(false);
  const [ledL, setLedL] = useState(false);

  useEffect(() => {
    api.getActuatorState().then(r => { if (r.data) { setPump(!!r.data.pump); setLed(!!r.data.led); } }).catch(() => null);
  }, []);

  useEffect(() => {
    return on('actuator:state', (d: { type: string; state: boolean }) => {
      if (d.type === 'AIR_PUMP') setPump(d.state);
      if (d.type === 'LED_STRIP') setLed(d.state);
    });
  }, [on]);

  const feed = async () => { setFeeding(true); await api.triggerFeed().catch(() => null); setTimeout(() => setFeeding(false), 3000); };
  const pumpToggle = async () => { setPumpL(true); await api.togglePump().catch(() => null); setPump(p => !p); setPumpL(false); };
  const ledToggle = async () => { setLedL(true); await api.toggleLed().catch(() => null); setLed(l => !l); setLedL(false); };

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20, paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: '#f1f5f9', letterSpacing: -1 }}>Controls</Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 10, paddingVertical: 5,
            borderRadius: 16, borderCurve: 'continuous',
          }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: connected ? '#34d399' : '#f87171' }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: connected ? '#34d399' : '#f87171' }}>
              {connected ? 'Connected' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Feed button */}
        <TouchableOpacity onPress={feed} disabled={feeding} activeOpacity={0.8}
          style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: feeding ? 'rgba(56,189,248,0.08)' : '#0f172a',
            borderRadius: 20, borderCurve: 'continuous', padding: 20,
            borderWidth: 1, borderColor: feeding ? '#38bdf8' : 'rgba(56,189,248,0.15)',
            marginBottom: 16, gap: 16,
            boxShadow: '0 2px 16px rgba(56,189,248,0.08)',
          }}>
          <Text style={{ fontSize: 36 }}>{feeding ? '\u23F3' : '\uD83D\uDC1F'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#38bdf8', marginBottom: 2 }}>{feeding ? 'Dispensing Feed...' : 'Feed Fish Now'}</Text>
            <Text style={{ fontSize: 12, color: '#64748b' }}>Activates feeder relay for one cycle</Text>
          </View>
        </TouchableOpacity>

        <Text style={{ fontSize: 16, fontWeight: '700', color: '#e2e8f0', marginBottom: 12 }}>Toggle Devices</Text>

        {/* Device rows */}
        {[
          { icon: '\uD83D\uDCA8', label: 'Air Pump', desc: 'Oxygenation system', active: pump, loading: pumpL, color: '#06b6d4', onPress: pumpToggle },
          { icon: '\uD83D\uDCA1', label: 'LED Light', desc: '12V aquarium strip', active: led, loading: ledL, color: '#f59e0b', onPress: ledToggle },
        ].map(d => (
          <TouchableOpacity key={d.label} onPress={d.onPress} disabled={d.loading} activeOpacity={0.8}
            style={{
              flexDirection: 'row', alignItems: 'center', backgroundColor: d.active ? d.color + '0A' : '#0f172a',
              borderRadius: 16, borderCurve: 'continuous', padding: 14, borderWidth: 1,
              borderColor: d.active ? d.color + '40' : 'rgba(255,255,255,0.06)', marginBottom: 10, gap: 12,
            }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', backgroundColor: d.active ? d.color + '20' : 'rgba(255,255,255,0.04)' }}>
              {d.loading ? <ActivityIndicator color={d.color} size="small" /> : <Text style={{ fontSize: 20 }}>{d.icon}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#e2e8f0', marginBottom: 2 }}>{d.label}</Text>
              <Text style={{ fontSize: 11, color: '#64748b' }}>{d.desc}</Text>
            </View>
            <View style={{ width: 36, height: 20, borderRadius: 10, justifyContent: 'center', backgroundColor: d.active ? d.color : '#1e293b' }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', marginLeft: d.active ? 18 : 2 }} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Status summary */}
        <View style={{
          backgroundColor: '#0f172a', borderRadius: 16, borderCurve: 'continuous',
          padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginTop: 12,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Relay Status</Text>
          {[
            { label: 'Feeder', active: feeding, color: '#3b82f6' },
            { label: 'Air Pump', active: pump, color: '#06b6d4' },
            { label: 'LED Strip', active: led, color: '#f59e0b' },
          ].map(s => (
            <View key={s.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
              <Text style={{ fontSize: 14, color: '#cbd5e1' }}>{s.label}</Text>
              <Text selectable style={{ fontSize: 14, fontWeight: '700', color: s.active ? s.color : '#64748b' }}>{s.active ? 'ON' : 'OFF'}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
