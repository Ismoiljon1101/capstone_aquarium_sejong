import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Animated, Easing } from 'react-native';
import { useSocket } from '../hooks/useSocket';
import { useApi } from '../hooks/useApi';
import { FishHealthPanel } from '../components/organisms/FishHealthPanel';
import { VeronicaChat, VeronicaCallState } from '../components/organisms/VeronicaChat';

interface HealthReport {
  phStatus: string; tempStatus: string; doStatus: string;
  visualStatus: string; behaviorStatus: string; createdAt: string;
}

function VeronicaStatusBar({ callActive, listening, loading }: VeronicaCallState) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!listening) { pulse.setValue(1); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.08, duration: 500, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,    duration: 500, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [listening]);

  const color = listening ? '#22c55e' : loading ? '#f59e0b' : callActive ? '#34d399' : '#475569';
  const label = listening ? 'LISTENING' : loading ? 'THINKING' : callActive ? 'ON CALL — READY' : 'ALWAYS LISTEN OFF';
  const icon  = listening ? '🎙️' : loading ? '⏳' : callActive ? '📡' : '🔇';

  return (
    <View style={{
      marginHorizontal: 0, marginBottom: 20,
      borderRadius: 18, borderCurve: 'continuous', overflow: 'hidden',
      borderWidth: 1,
      borderColor: callActive ? color + '55' : 'rgba(255,255,255,0.07)',
      backgroundColor: callActive ? color + '11' : 'rgba(15,23,42,0.9)',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
        {/* Animated mic orb */}
        <View style={{ alignItems: 'center', justifyContent: 'center', width: 52, height: 52 }}>
          {callActive && (
            <Animated.View style={{
              position: 'absolute', width: 52, height: 52, borderRadius: 26,
              backgroundColor: color + '22',
              transform: [{ scale: pulse }],
            }} />
          )}
          <View style={{
            width: 44, height: 44, borderRadius: 22, borderCurve: 'continuous',
            backgroundColor: callActive ? color + '33' : 'rgba(255,255,255,0.05)',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1.5, borderColor: callActive ? color + '66' : 'rgba(255,255,255,0.1)',
          }}>
            <Text style={{ fontSize: 20 }}>{icon}</Text>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }} />
            <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color }}>
              {label}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: '500' }}>
            {listening
              ? 'Speak now — Veronica is hearing you'
              : loading
              ? 'Processing your question...'
              : callActive
              ? 'Say anything — Veronica responds instantly'
              : 'Tap the call button below to start'}
          </Text>
        </View>

        {/* Waveform bars (visual when listening) */}
        {listening && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            {[10, 18, 12, 22, 8, 16, 20].map((h, i) => (
              <Animated.View key={i} style={{
                width: 3, height: h, borderRadius: 2,
                backgroundColor: '#22c55e',
                opacity: 0.7 + (i % 3) * 0.1,
              }} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

export default function FishHealthScreen() {
  const { on } = useSocket();
  const api = useApi();
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [veronicaState, setVeronicaState] = useState<VeronicaCallState>({
    callActive: false, listening: false, loading: false,
  });

  useEffect(() => {
    loadData();
    const u1 = on('health:report', (d: HealthReport) => setHealth(d));
    return () => { u1(); };
  }, [on]);

  const loadData = async () => {
    const [, h] = await Promise.allSettled([
      Promise.resolve(),
      api.getFishHealth(),
    ]);
    if (h.status === 'fulfilled' && h.value.data) setHealth(h.value.data);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const sc = (s: string) =>
    s === 'critical' ? '#ef4444' : (s === 'warn' || s === 'warning') ? '#fbbf24' : '#34d399';

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" colors={['#38bdf8']} />}
      >
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#f1f5f9', letterSpacing: -1, marginBottom: 4 }}>
          Fish AI
        </Text>
        <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
          YOLO · ConvLSTM · Veronica Voice
        </Text>

        {/* Veronica always-listen status bar */}
        <VeronicaStatusBar {...veronicaState} />

        <FishHealthPanel />

        {/* Parameter table */}
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#e2e8f0', marginBottom: 12, marginTop: 28 }}>
          Parameter Status
        </Text>
        <View style={{
          backgroundColor: '#0f172a', borderRadius: 16, borderCurve: 'continuous',
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 4,
        }}>
          {[
            { label: 'pH',           status: health?.phStatus       ?? 'ok',     icon: '🧪' },
            { label: 'Temperature',  status: health?.tempStatus      ?? 'ok',     icon: '🌡️' },
            { label: 'Dissolved O₂', status: health?.doStatus        ?? 'ok',     icon: '💨' },
            { label: 'Visual Check', status: health?.visualStatus    ?? 'ok',     icon: '👁️' },
            { label: 'Behavior',     status: health?.behaviorStatus  ?? 'normal', icon: '🧠' },
          ].map(p => (
            <View key={p.label} style={{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: 14, paddingHorizontal: 16,
              borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
            }}>
              <Text style={{ fontSize: 18, marginRight: 12 }}>{p.icon}</Text>
              <Text style={{ flex: 1, fontSize: 14, color: '#cbd5e1', fontWeight: '500' }}>{p.label}</Text>
              <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderCurve: 'continuous', backgroundColor: sc(p.status) + '18' }}>
                <Text selectable style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.3, color: sc(p.status) }}>
                  {p.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {health?.createdAt && (
          <Text style={{ fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 12 }}>
            Last report: {new Date(health.createdAt).toLocaleString()}
          </Text>
        )}

        {/* Veronica AI Chat with state lifting */}
        <VeronicaChat onStateChange={setVeronicaState} />
      </ScrollView>
    </View>
  );
}
