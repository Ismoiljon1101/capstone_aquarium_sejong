import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApi } from '../hooks/useApi';

type Range = '24h' | '1w' | '1m';

interface Reading { type: string; value: number; unit: string; timestamp: string; status: string; }

const RANGE_LABELS: Record<Range, string> = { '24h': '24 Hours', '1w': '7 Days', '1m': '30 Days' };

function statusColor(s: string) {
  return s === 'critical' ? '#ef4444' : s === 'warn' || s === 'warning' ? '#fbbf24' : '#34d399';
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const api = useApi();
  const [range, setRange] = useState<Range>('24h');
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async (r: Range) => {
    try {
      // Try range-based history endpoint first, fall back to latest snapshot
      const res = await api.getAllSensorHistory(r).catch(() => api.getLatest());
      const data = res.data;
      if (Array.isArray(data) && data.length > 0) {
        setReadings(data);
        return;
      }
      // Flatten object snapshot to rows
      if (data && typeof data === 'object') {
        const arr: Reading[] = [];
        if (data.pH      !== undefined) arr.push({ type: 'pH',           value: data.pH,      unit: 'pH',   timestamp: data.timestamp ?? '', status: data.phStatus   ?? 'ok' });
        if (data.temp_c  !== undefined) arr.push({ type: 'Temperature',  value: data.temp_c,  unit: '°C',   timestamp: data.timestamp ?? '', status: data.tempStatus ?? 'ok' });
        if (data.do_mg_l !== undefined) arr.push({ type: 'Dissolved O₂', value: data.do_mg_l, unit: 'mg/L', timestamp: data.timestamp ?? '', status: data.doStatus   ?? 'ok' });
        if (data.CO2     !== undefined) arr.push({ type: 'CO₂',          value: data.CO2,     unit: 'ppm',  timestamp: data.timestamp ?? '', status: data.co2Status  ?? 'ok' });
        setReadings(arr);
      }
    } catch {}
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
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 40) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" colors={['#38bdf8']} />}
      >
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#f1f5f9', letterSpacing: -1, marginBottom: 16 }}>History</Text>

        {/* Range selector */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {(Object.keys(RANGE_LABELS) as Range[]).map(r => (
            <TouchableOpacity key={r} onPress={() => setRange(r)} style={{
              flex: 1, paddingVertical: 10, borderRadius: 12,
              alignItems: 'center', borderWidth: 1,
              backgroundColor: range === r ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.04)',
              borderColor: range === r ? '#38bdf8' : 'rgba(255,255,255,0.06)',
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: range === r ? '#38bdf8' : '#64748b' }}>
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
            flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10,
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
          }}>
            {['Parameter', 'Value', 'Status'].map((h, i) => (
              <Text key={h} style={{
                flex: i === 0 ? 2 : 1,
                fontSize: 11, fontWeight: '700', color: '#64748b',
                textTransform: 'uppercase', letterSpacing: 0.5,
                textAlign: i === 2 ? 'right' : 'left',
              }}>{h}</Text>
            ))}
          </View>

          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator color="#38bdf8" />
            </View>
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
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: statusColor(r.status) + '18' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: statusColor(r.status) }}>
                    {(r.status ?? 'ok').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          )) : (
            <View style={{ padding: 30, alignItems: 'center' }}>
              <Text style={{ color: '#64748b', fontSize: 13 }}>No data for selected range</Text>
            </View>
          )}
        </View>

        {readings.length > 0 && (
          <Text style={{ fontSize: 11, color: '#334155', textAlign: 'center', marginTop: 16 }}>
            {readings[0]?.timestamp ? `Last updated ${new Date(readings[0].timestamp).toLocaleString()}` : 'Pull down to refresh'}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
