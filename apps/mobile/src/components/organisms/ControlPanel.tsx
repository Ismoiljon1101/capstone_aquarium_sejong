import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useApi } from '../../hooks/useApi';
import { useSocket } from '../../hooks/useSocket';

function DeviceCard({ icon, label, desc, active, loading, color, onPress }: {
  icon: string; label: string; desc: string;
  active: boolean; loading: boolean; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress} disabled={loading} activeOpacity={0.8}
      style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: active ? color + '0A' : '#0f172a',
        borderRadius: 16, borderCurve: 'continuous',
        padding: 14, borderWidth: 1,
        borderColor: active ? color + '40' : 'rgba(255,255,255,0.06)',
        marginBottom: 10, gap: 12,
        boxShadow: active ? `0 2px 12px ${color}15` : 'none',
      }}
    >
      <View style={{
        width: 44, height: 44, borderRadius: 14, borderCurve: 'continuous',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: active ? color + '20' : 'rgba(255,255,255,0.04)',
      }}>
        {loading ? <ActivityIndicator color={color} size="small" /> : <Text style={{ fontSize: 20 }}>{icon}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#e2e8f0', marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 11, color: '#64748b' }}>{desc}</Text>
      </View>
      {/* Toggle switch */}
      <View style={{
        width: 36, height: 20, borderRadius: 10,
        justifyContent: 'center', backgroundColor: active ? color : '#1e293b',
      }}>
        <View style={{
          width: 16, height: 16, borderRadius: 8,
          backgroundColor: '#fff',
          marginLeft: active ? 18 : 2,
        }} />
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
  const [pumpL, setPumpL] = useState(false);
  const [ledL, setLedL] = useState(false);

  useEffect(() => {
    getActuatorState().then(r => { if (r.data) { setPump(!!r.data.pump); setLed(!!r.data.led); } }).catch(() => null);
  }, []);

  useEffect(() => {
    return on('actuator:state', (d: { type: string; state: boolean }) => {
      if (d.type === 'AIR_PUMP') setPump(d.state);
      if (d.type === 'LED_STRIP') setLed(d.state);
    });
  }, [on]);

  const feed = async () => { setFeeding(true); await triggerFeed().catch(() => null); setTimeout(() => setFeeding(false), 3000); };
  const pumpToggle = async () => { setPumpL(true); await togglePump().catch(() => null); setPump(p => !p); setPumpL(false); };
  const ledToggle = async () => { setLedL(true); await toggleLed().catch(() => null); setLed(l => !l); setLedL(false); };

  return (
    <View style={{ marginBottom: 28 }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.5, marginBottom: 16 }}>
        Device Controls
      </Text>

      {/* Feed CTA */}
      <TouchableOpacity
        onPress={feed} disabled={feeding} activeOpacity={0.8}
        style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: feeding ? 'rgba(56,189,248,0.08)' : '#0f172a',
          borderRadius: 20, borderCurve: 'continuous',
          padding: 18, borderWidth: 1,
          borderColor: feeding ? '#38bdf8' : 'rgba(56,189,248,0.15)',
          marginBottom: 12, gap: 14,
          boxShadow: '0 2px 16px rgba(56,189,248,0.08)',
        }}
      >
        <Text style={{ fontSize: 28 }}>{feeding ? '\u23F3' : '\uD83C\uDF7D\uFE0F'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#38bdf8' }}>
            {feeding ? 'Dispensing feed\u2026' : 'Feed Now'}
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Automatic feeder \u2022 one cycle</Text>
        </View>
        {!feeding && <Text style={{ fontSize: 28, color: '#38bdf850', fontWeight: '300' }}>{'\u203A'}</Text>}
      </TouchableOpacity>

      <DeviceCard icon="\uD83D\uDCA8" label="Air Pump" desc="Oxygenation system" active={pump} loading={pumpL} color="#06b6d4" onPress={pumpToggle} />
      <DeviceCard icon="\uD83D\uDCA1" label="LED Light" desc="12V aquarium strip" active={led}  loading={ledL}  color="#f59e0b" onPress={ledToggle} />
    </View>
  );
};
