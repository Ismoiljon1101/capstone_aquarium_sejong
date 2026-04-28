import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApi } from '../hooks/useApi';
import AppHeader from '../components/AppHeader';

type Range = '24h' | '1w' | '1m';

interface Reading { type: string; value: number; unit: string; timestamp: string; status: string; }

const RANGE_LABELS: Record<Range, string> = { '24h': '24 Hours', '1w': '7 Days', '1m': '30 Days' };

function statusColor(s: string) {
  return s === 'critical' ? '#ef4444' : s === 'warn' || s === 'warning' ? '#fbbf24' : '#34d399';
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow({ shimmer }: { shimmer: Animated.Value }) {
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 16,
      borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' }}>
      <Animated.View style={{ flex: 2, height: 14, borderRadius: 7, backgroundColor: '#1e293b', opacity, marginRight: 8 }} />
      <Animated.View style={{ flex: 1, height: 14, borderRadius: 7, backgroundColor: '#1e293b', opacity, marginRight: 8 }} />
      <Animated.View style={{ flex: 1, height: 20, borderRadius: 10, backgroundColor: '#1e293b', opacity }} />
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const api = useApi();
  const [range, setRange] = useState<Range>('24h');
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [shimmer] = useState(new Animated.Value(0));

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [loading]);

  const loadHistory = useCallback(async (r: Range) => {
    setError(false);
    try {
      const res = await api.getAllSensorHistory(r).catch(() => api.getLatest());
      const data = res.data;
      if (Array.isArray(data) && data.length > 0) {
        setReadings(data);
        return;
      }
      if (data && typeof data === 'object') {
        const arr: Reading[] = [];
        if (data.pH      !== undefined) arr.push({ type: 'pH',           value: data.pH,      unit: 'pH',   timestamp: data.timestamp ?? '', status: data.phStatus   ?? 'ok' });
        if (data.temp_c  !== undefined) arr.push({ type: 'Temperature',  value: data.temp_c,  unit: '°C',   timestamp: data.timestamp ?? '', status: data.tempStatus ?? 'ok' });
        if (data.do_mg_l !== undefined) arr.push({ type: 'Dissolved O₂', value: data.do_mg_l, unit: 'mg/L', timestamp: data.timestamp ?? '', status: data.doStatus   ?? 'ok' });
        if (data.CO2     !== undefined) arr.push({ type: 'CO₂',          value: data.CO2,     unit: 'ppm',  timestamp: data.timestamp ?? '', status: data.co2Status  ?? 'ok' });
        setReadings(arr);
      }
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadHistory(range).finally(() => setLoading(false));
  }, [range]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory(range);
    setRefreshing(false);
  }, [range, loadHistory]);

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <AppHeader title="History" subtitle="Sensor readings over time" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: Math.max(insets.bottom, 40) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" colors={['#38bdf8']} />}
      >

        {/* Range selector */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {(Object.keys(RANGE_LABELS) as Range[]).map(r => (
            <TouchableOpacity key={r} onPress={() => setRange(r)}
              accessibilityLabel={`Show ${RANGE_LABELS[r]}`} accessibilityRole="button"
              style={{
                flex: 1, paddingVertical: 12, borderRadius: 12,
                alignItems: 'center', borderWidth: 1, minHeight: 44, justifyContent: 'center',
                backgroundColor: range === r ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.04)',
                borderColor: range === r ? '#38bdf8' : 'rgba(255,255,255,0.06)',
              }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: range === r ? '#38bdf8' : '#94a3b8' }}>
                {RANGE_LABELS[r]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Table */}
        <View style={{
          backgroundColor: '#0f172a', borderRadius: 16,
          overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12,
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
          }}>
            {['Parameter', 'Value', 'Status'].map((h, i) => (
              <Text key={h} style={{
                flex: i === 0 ? 2 : 1,
                fontSize: 12, fontWeight: '700', color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: 0.5,
                textAlign: i === 2 ? 'right' : 'left',
              }}>{h}</Text>
            ))}
          </View>

          {/* Error state */}
          {error ? (
            <View style={{ padding: 32, alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 15, color: '#94a3b8', textAlign: 'center' }}>
                Couldn't load history data
              </Text>
              <TouchableOpacity onPress={() => { setLoading(true); loadHistory(range).finally(() => setLoading(false)); }}
                accessibilityLabel="Retry loading history" accessibilityRole="button"
                style={{ paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, backgroundColor: 'rgba(56,189,248,0.12)', borderWidth: 1, borderColor: '#38bdf840' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#38bdf8' }}>Retry</Text>
              </TouchableOpacity>
            </View>

          /* Skeleton loading */
          ) : loading ? (
            <>
              {[0, 1, 2, 3].map(i => <SkeletonRow key={i} shimmer={shimmer} />)}
            </>

          /* Data rows */
          ) : readings.length > 0 ? readings.map((r, i) => (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 14, paddingVertical: 14,
              borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)',
            }}>
              <Text style={{ flex: 2, fontSize: 14, color: '#e2e8f0', fontWeight: '500' }}>{r.type}</Text>
              <Text selectable style={{ flex: 1, fontSize: 14, color: '#f1f5f9', fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                {typeof r.value === 'number' ? r.value.toFixed(1) : r.value} {r.unit}
              </Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: statusColor(r.status) + '18' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor(r.status) }}>
                    {(r.status ?? 'ok').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          )) : (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ color: '#94a3b8', fontSize: 15 }}>No data for selected range</Text>
            </View>
          )}
        </View>

        {readings.length > 0 && !loading && (
          <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 16 }}>
            {readings[0]?.timestamp ? `Last updated ${new Date(readings[0].timestamp).toLocaleString()}` : 'Pull down to refresh'}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
