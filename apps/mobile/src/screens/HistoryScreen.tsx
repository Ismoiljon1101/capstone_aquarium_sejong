import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useApi } from '../hooks/useApi';
import AppHeader from '../components/AppHeader';

type Range = '24h' | '1w' | '1m';
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Reading { type: string; value: number; unit: string; timestamp: string; status: string; }

const RANGE_LABELS: Record<Range, string> = { '24h': '24h', '1w': '7d', '1m': '30d' };

const PARAM_META: Record<string, { icon: IoniconName; color: string; label: string }> = {
  pH:             { icon: 'flask-outline',       color: '#10b981', label: 'pH Level' },
  Temperature:    { icon: 'thermometer-outline', color: '#38bdf8', label: 'Temperature' },
  'Dissolved O₂': { icon: 'water-outline',       color: '#a78bfa', label: 'Dissolved O₂' },
  'CO₂':          { icon: 'cloud-outline',       color: '#fb923c', label: 'CO₂' },
};

function statusColor(s: string) {
  return s === 'critical' ? '#ef4444' : s === 'warn' || s === 'warning' ? '#fbbf24' : '#34d399';
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow({ shimmer, last }: { shimmer: Animated.Value; last?: boolean }) {
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 16,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.03)' }}>
      <Animated.View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#1e293b', opacity }} />
      <Animated.View style={{ flex: 1, height: 14, borderRadius: 7, backgroundColor: '#1e293b', opacity }} />
      <Animated.View style={{ width: 60, height: 20, borderRadius: 10, backgroundColor: '#1e293b', opacity }} />
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

  // Build summary cards from readings
  const summaryCards = useMemo(() => {
    return Object.entries(PARAM_META).map(([type, meta]) => {
      const r = readings.find(x => x.type === type);
      return {
        ...meta,
        type,
        value: r ? r.value.toFixed(1) : '--',
        unit: r?.unit ?? '',
        status: r?.status ?? 'offline',
      };
    });
  }, [readings]);

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <AppHeader title="History" subtitle={`Sensor trends · ${RANGE_LABELS[range]}`} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 18, paddingTop: 16, paddingBottom: Math.max(insets.bottom, 40) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" colors={['#38bdf8']} />}
      >
        {/* ── Segmented control ── */}
        <View style={{
          flexDirection: 'row', gap: 4, marginBottom: 22,
          backgroundColor: '#0f172a', padding: 4, borderRadius: 12,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        }}>
          {(Object.keys(RANGE_LABELS) as Range[]).map(r => {
            const active = range === r;
            return (
              <TouchableOpacity key={r}
                onPress={() => { Haptics.selectionAsync(); setRange(r); }}
                accessibilityLabel={`Show ${RANGE_LABELS[r]} range`} accessibilityRole="button"
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 8,
                  alignItems: 'center', justifyContent: 'center', minHeight: 40,
                  backgroundColor: active ? '#38bdf8' : 'transparent',
                }}>
                <Text style={{
                  fontSize: 13, fontWeight: '700',
                  color: active ? '#0f172a' : '#94a3b8',
                  letterSpacing: 0.3,
                }}>
                  {r === '24h' ? '24 Hours' : r === '1w' ? '7 Days' : '30 Days'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Summary cards (2×2) ── */}
        <Text style={sectionTitleStyle}>Latest Readings</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 }}>
          {summaryCards.map(c => {
            const noData = c.value === '--';
            return (
              <View key={c.type} style={{
                flex: 1, minWidth: '46%',
                backgroundColor: '#0f172a',
                borderRadius: 14, padding: 14,
                borderWidth: 1, borderColor: noData ? 'rgba(255,255,255,0.04)' : c.color + '25',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <View style={{
                    width: 28, height: 28, borderRadius: 8,
                    backgroundColor: noData ? 'rgba(255,255,255,0.04)' : c.color + '20',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name={c.icon} size={14} color={noData ? '#475569' : c.color} />
                  </View>
                  <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '600', flex: 1 }} numberOfLines={1}>{c.label}</Text>
                </View>
                <Text style={{
                  fontSize: 22, fontWeight: '800',
                  color: noData ? '#475569' : '#f1f5f9',
                  letterSpacing: -0.5, fontVariant: ['tabular-nums'],
                }}>
                  {c.value}
                  {!noData && <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8' }}> {c.unit}</Text>}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── Detail table ── */}
        <Text style={sectionTitleStyle}>Detail</Text>
        <View style={{
          backgroundColor: '#0f172a', borderRadius: 14,
          overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12, gap: 12,
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
          }}>
            <View style={{ width: 32 }} />
            <Text style={tableHeaderStyle}>Parameter</Text>
            <Text style={[tableHeaderStyle, { textAlign: 'right', width: 80 }]}>Value</Text>
            <Text style={[tableHeaderStyle, { textAlign: 'right', width: 70 }]}>Status</Text>
          </View>

          {/* Error */}
          {error ? (
            <View style={{ padding: 32, alignItems: 'center', gap: 12 }}>
              <Ionicons name="cloud-offline-outline" size={32} color="#ef4444" />
              <Text style={{ fontSize: 15, color: '#94a3b8', textAlign: 'center' }}>
                Couldn't load history data
              </Text>
              <TouchableOpacity onPress={() => { setLoading(true); loadHistory(range).finally(() => setLoading(false)); }}
                accessibilityLabel="Retry" accessibilityRole="button"
                style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(56,189,248,0.12)', borderWidth: 1, borderColor: '#38bdf840', minHeight: 40, justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#38bdf8' }}>Retry</Text>
              </TouchableOpacity>
            </View>

          /* Skeleton */
          ) : loading ? (
            <>
              {[0, 1, 2, 3].map(i => <SkeletonRow key={i} shimmer={shimmer} last={i === 3} />)}
            </>

          /* Rows */
          ) : readings.length > 0 ? readings.map((r, i) => {
            const meta = PARAM_META[r.type];
            return (
              <View key={i} style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                paddingHorizontal: 14, paddingVertical: 14,
                borderBottomWidth: i < readings.length - 1 ? 1 : 0,
                borderBottomColor: 'rgba(255,255,255,0.04)',
              }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 10,
                  backgroundColor: (meta?.color ?? '#94a3b8') + '20',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name={meta?.icon ?? 'analytics-outline'} size={14} color={meta?.color ?? '#94a3b8'} />
                </View>
                <Text style={{ flex: 1, fontSize: 14, color: '#e2e8f0', fontWeight: '500' }}>{r.type}</Text>
                <Text selectable style={{ width: 80, fontSize: 14, color: '#f1f5f9', fontWeight: '700', fontVariant: ['tabular-nums'], textAlign: 'right' }}>
                  {typeof r.value === 'number' ? r.value.toFixed(1) : r.value} {r.unit}
                </Text>
                <View style={{ width: 70, alignItems: 'flex-end' }}>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: statusColor(r.status) + '18' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor(r.status) }}>
                      {(r.status ?? 'ok').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }) : (
            <View style={{ padding: 32, alignItems: 'center', gap: 8 }}>
              <Ionicons name="document-text-outline" size={32} color="#475569" />
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

const sectionTitleStyle = {
  fontSize: 12, fontWeight: '800' as const, color: '#94a3b8',
  textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10,
};
const tableHeaderStyle = {
  flex: 1, fontSize: 11, fontWeight: '700' as const, color: '#94a3b8',
  textTransform: 'uppercase' as const, letterSpacing: 0.5,
};
