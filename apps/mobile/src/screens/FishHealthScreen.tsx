import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useSocket } from '../hooks/useSocket';
import { useApi } from '../hooks/useApi';
import { FishHealthPanel } from '../components/organisms/FishHealthPanel';

interface HealthReport { phStatus: string; tempStatus: string; doStatus: string; visualStatus: string; behaviorStatus: string; createdAt: string; }

export default function FishHealthScreen() {
  const { on } = useSocket();
  const api = useApi();
  const [fishCount, setFishCount] = useState({ count: 0, confidence: 0, timestamp: '' });
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    const u1 = on('fish:count', (d: any) => setFishCount(d));
    const u2 = on('health:report', (d: HealthReport) => setHealth(d));
    return () => { u1(); u2(); };
  }, [on]);

  const loadData = async () => {
    const [c, h] = await Promise.allSettled([api.getFishCount(), api.getFishHealth()]);
    if (c.status === 'fulfilled' && c.value.data) setFishCount(c.value.data);
    if (h.status === 'fulfilled' && h.value.data) setHealth(h.value.data);
  };

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, []);

  const sc = (s: string) => s === 'critical' ? '#ef4444' : (s === 'warn' || s === 'warning') ? '#fbbf24' : '#34d399';

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" colors={['#38bdf8']} />}
      >
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#f1f5f9', letterSpacing: -1, marginBottom: 4 }}>Fish Health</Text>
        <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>AI-powered monitoring via YOLO + ConvLSTM</Text>

        <FishHealthPanel />

        <Text style={{ fontSize: 18, fontWeight: '800', color: '#e2e8f0', marginBottom: 12 }}>Parameter Status</Text>
        <View style={{
          backgroundColor: '#0f172a', borderRadius: 16, borderCurve: 'continuous',
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
        }}>
          {[
            { label: 'pH', status: health?.phStatus ?? 'ok', icon: '\uD83E\uddEA' },
            { label: 'Temperature', status: health?.tempStatus ?? 'ok', icon: '\uD83C\uDF21\uFE0F' },
            { label: 'Dissolved O\u2082', status: health?.doStatus ?? 'ok', icon: '\uD83D\uDCA8' },
            { label: 'Visual Check', status: health?.visualStatus ?? 'ok', icon: '\uD83D\uDC41\uFE0F' },
            { label: 'Behavior', status: health?.behaviorStatus ?? 'normal', icon: '\uD83E\uDDE0' },
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
          <Text style={{ fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 20 }}>
            Last report: {new Date(health.createdAt).toLocaleString()}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
