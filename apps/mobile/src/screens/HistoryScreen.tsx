/**
 * History Screen
 *
 * Layout:
 *   • Range selector (24h / 7d / 30d)
 *   • Latest readings (2×2 summary cards — one per parameter)
 *   • Timeline — readings grouped by day, every entry shows
 *     time · parameter · value · status
 *
 * Backend returns rows of { type, value, unit, status, timestamp }
 *   type ∈ { 'pH', 'temp_c', 'do_mg_l', 'CO2' }
 * We normalise to display labels (Temperature, Dissolved O₂, CO₂).
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useApi } from '../hooks/useApi';
import AppHeader from '../components/AppHeader';

type Range = '24h' | '1w' | '1m';
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type ParamKey = 'pH' | 'Temperature' | 'Dissolved O₂' | 'CO₂';

interface RawReading { type: string; value: number; unit: string; timestamp: string; status: string; }
interface DisplayReading { paramKey: ParamKey; value: number; unit: string; timestamp: string; status: string; }

const RANGE_LABELS: Record<Range, string> = { '24h': '24h', '1w': '7d', '1m': '30d' };

const PARAM_META: Record<ParamKey, { icon: IoniconName; color: string; label: string; unit: string }> = {
  pH:             { icon: 'flask-outline',       color: '#10b981', label: 'pH Level',     unit: 'pH'   },
  Temperature:    { icon: 'thermometer-outline', color: '#38bdf8', label: 'Temperature',  unit: '°C'   },
  'Dissolved O₂': { icon: 'water-outline',       color: '#a78bfa', label: 'Dissolved O₂', unit: 'mg/L' },
  'CO₂':          { icon: 'cloud-outline',       color: '#fb923c', label: 'CO₂',          unit: 'ppm'  },
};

// Map backend type → display key
function normaliseType(t: string): ParamKey | null {
  if (t === 'pH') return 'pH';
  if (t === 'temp_c' || t === 'Temperature') return 'Temperature';
  if (t === 'do_mg_l' || t === 'Dissolved O₂') return 'Dissolved O₂';
  if (t === 'CO2' || t === 'CO₂') return 'CO₂';
  return null;
}

function statusColor(s: string) {
  return s === 'critical' ? '#ef4444' : (s === 'warn' || s === 'warning') ? '#fbbf24' : '#34d399';
}

// Same-day key (local time)
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayLabel(d: Date): string {
  const today = new Date();
  const yest = new Date(); yest.setDate(yest.getDate() - 1);
  if (dayKey(d) === dayKey(today)) return 'Today';
  if (dayKey(d) === dayKey(yest))  return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

// ── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow({ shimmer, last }: { shimmer: Animated.Value; last?: boolean }) {
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 16,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.03)' }}>
      <Animated.View style={{ width: 44, height: 14, borderRadius: 4, backgroundColor: '#1e293b', opacity }} />
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
  const [readings, setReadings] = useState<DisplayReading[]>([]);
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
      const res = await api.getAllSensorHistory(r);
      const arr: DisplayReading[] = [];
      if (Array.isArray(res.data)) {
        for (const x of res.data as RawReading[]) {
          const key = normaliseType(x.type);
          if (!key) continue;
          arr.push({
            paramKey: key,
            value: typeof x.value === 'number' ? x.value : parseFloat(String(x.value)),
            unit: x.unit ?? PARAM_META[key].unit,
            timestamp: x.timestamp,
            status: x.status ?? 'ok',
          });
        }
      }
      arr.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
      setReadings(arr);
    } catch {
      setError(true);
      setReadings([]);
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

  // Latest reading per parameter (for summary cards)
  const summaryCards = useMemo(() => {
    return (Object.keys(PARAM_META) as ParamKey[]).map(key => {
      const r = readings.find(x => x.paramKey === key);
      const meta = PARAM_META[key];
      return {
        ...meta,
        key,
        value: r ? r.value.toFixed(1) : '--',
        unit: r?.unit ?? meta.unit,
        status: r?.status ?? 'offline',
      };
    });
  }, [readings]);

  // Group readings by day
  const grouped = useMemo(() => {
    const map = new Map<string, { date: Date; rows: DisplayReading[] }>();
    for (const r of readings) {
      const d = new Date(r.timestamp);
      const k = dayKey(d);
      if (!map.has(k)) map.set(k, { date: d, rows: [] });
      map.get(k)!.rows.push(r);
    }
    return Array.from(map.values());
  }, [readings]);

  const lastUpdated = readings[0]?.timestamp;

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <AppHeader title="History" subtitle={`Sensor trends · ${RANGE_LABELS[range]}`} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 18, paddingTop: 16, paddingBottom: Math.max(insets.bottom, 40) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" colors={['#38bdf8']} />}
      >
        {/* Range selector */}
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

        {/* Summary cards */}
        <Text style={sectionTitleStyle}>Latest Readings</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 }}>
          {summaryCards.map(c => {
            const noData = c.value === '--';
            return (
              <View key={c.key} style={{
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

        {/* Timeline header */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={sectionTitleStyle}>Timeline</Text>
          {readings.length > 0 && (
            <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
              {readings.length} readings
            </Text>
          )}
        </View>

        {/* Error */}
        {error ? (
          <View style={{
            backgroundColor: '#0f172a', borderRadius: 14,
            padding: 28, alignItems: 'center', gap: 12,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
          }}>
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
          <View style={{
            backgroundColor: '#0f172a', borderRadius: 14, overflow: 'hidden',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
          }}>
            {[0, 1, 2, 3].map(i => <SkeletonRow key={i} shimmer={shimmer} last={i === 3} />)}
          </View>

        /* Empty */
        ) : grouped.length === 0 ? (
          <View style={{
            backgroundColor: '#0f172a', borderRadius: 14,
            padding: 32, alignItems: 'center', gap: 8,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
          }}>
            <Ionicons name="document-text-outline" size={32} color="#475569" />
            <Text style={{ color: '#94a3b8', fontSize: 15 }}>No data for selected range</Text>
            <Text style={{ color: '#64748b', fontSize: 12 }}>Pull down to refresh</Text>
          </View>

        /* Day sections */
        ) : grouped.map(g => (
          <View key={dayKey(g.date)} style={{ marginBottom: 16 }}>
            {/* Day header */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 8, paddingHorizontal: 4,
            }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.2 }}>
                {dayLabel(g.date)}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>
                {g.rows.length} {g.rows.length === 1 ? 'reading' : 'readings'}
              </Text>
            </View>

            {/* Rows */}
            <View style={{
              backgroundColor: '#0f172a', borderRadius: 14, overflow: 'hidden',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
            }}>
              {g.rows.map((r, i) => {
                const meta = PARAM_META[r.paramKey];
                const time = new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <View key={i} style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingHorizontal: 14, paddingVertical: 12,
                    borderBottomWidth: i < g.rows.length - 1 ? 1 : 0,
                    borderBottomColor: 'rgba(255,255,255,0.04)',
                  }}>
                    {/* Time */}
                    <Text style={{
                      width: 50, fontSize: 12, color: '#94a3b8', fontWeight: '700',
                      fontVariant: ['tabular-nums'], letterSpacing: -0.2,
                    }}>{time}</Text>

                    {/* Param icon */}
                    <View style={{
                      width: 32, height: 32, borderRadius: 10,
                      backgroundColor: meta.color + '20',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ionicons name={meta.icon} size={14} color={meta.color} />
                    </View>

                    {/* Label */}
                    <Text style={{ flex: 1, fontSize: 13, color: '#e2e8f0', fontWeight: '600' }} numberOfLines={1}>
                      {meta.label}
                    </Text>

                    {/* Value */}
                    <Text selectable style={{
                      fontSize: 14, color: '#f1f5f9', fontWeight: '700',
                      fontVariant: ['tabular-nums'], textAlign: 'right',
                    }}>
                      {r.value.toFixed(1)} <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600' }}>{r.unit}</Text>
                    </Text>

                    {/* Status pill */}
                    <View style={{
                      paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
                      backgroundColor: statusColor(r.status) + '18',
                      minWidth: 50, alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: statusColor(r.status), letterSpacing: 0.3 }}>
                        {(r.status ?? 'ok').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {!loading && lastUpdated && (
          <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 12 }}>
            Last updated {new Date(lastUpdated).toLocaleString()}
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
