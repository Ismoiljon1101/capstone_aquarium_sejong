import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useApi } from '../hooks/useApi';

type Range = '24h' | '1w' | '1m';

interface Reading { type: string; value: number; unit: string; timestamp: string; status: string; }

export default function HistoryScreen() {
  const api = useApi();
  const [range, setRange] = useState<Range>('24h');
  const [readings, setReadings] = useState<Reading[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadHistory(); }, [range]);

  const loadHistory = async () => {
    try {
      const res = await api.getLatest();
      if (Array.isArray(res.data)) { setReadings(res.data); return; }
      if (res.data) {
        const d = res.data;
        const arr: Reading[] = [];
        if (d.pH !== undefined) arr.push({ type: 'pH', value: d.pH, unit: 'pH', timestamp: d.timestamp ?? '', status: d.status ?? 'ok' });
        if (d.temp_c !== undefined) arr.push({ type: 'Temperature', value: d.temp_c, unit: '\u00B0C', timestamp: d.timestamp ?? '', status: d.status ?? 'ok' });
        if (d.do_mg_l !== undefined) arr.push({ type: 'Dissolved O\u2082', value: d.do_mg_l, unit: 'mg/L', timestamp: d.timestamp ?? '', status: d.status ?? 'ok' });
        setReadings(arr);
      }
    } catch {}
  };

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadHistory(); setRefreshing(false); }, [range]);
  const sc = (s: string) => s === 'critical' ? '#ef4444' : (s === 'warn' || s === 'warning') ? '#fbbf24' : '#34d399';

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" colors={['#38bdf8']} />}
      >
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#f1f5f9', letterSpacing: -1, marginBottom: 16 }}>History</Text>

        {/* Range selector */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {(['24h', '1w', '1m'] as Range[]).map(r => (
            <TouchableOpacity key={r} onPress={() => setRange(r)} style={{
              flex: 1, paddingVertical: 10, borderRadius: 12, borderCurve: 'continuous',
              alignItems: 'center', borderWidth: 1,
              backgroundColor: range === r ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.04)',
              borderColor: range === r ? '#38bdf8' : 'rgba(255,255,255,0.06)',
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: range === r ? '#38bdf8' : '#64748b' }}>
                {r === '24h' ? '24 Hours' : r === '1w' ? '7 Days' : '30 Days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Data table */}
        <View style={{
          backgroundColor: '#0f172a', borderRadius: 16, borderCurve: 'continuous',
          overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        }}>
          <View style={{
            flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10,
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
          }}>
            <Text style={{ flex: 2, fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Parameter</Text>
            <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Value</Text>
            <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' }}>Status</Text>
          </View>
          {readings.length > 0 ? readings.map((r, i) => (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14,
              borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)',
            }}>
              <Text style={{ flex: 2, fontSize: 14, color: '#e2e8f0', fontWeight: '500' }}>{r.type}</Text>
              <Text selectable style={{ flex: 1, fontSize: 14, color: '#f1f5f9', fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                {typeof r.value === 'number' ? r.value.toFixed(1) : r.value} {r.unit}
              </Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderCurve: 'continuous', backgroundColor: sc(r.status) + '18' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: sc(r.status) }}>{(r.status ?? 'ok').toUpperCase()}</Text>
                </View>
              </View>
            </View>
          )) : (
            <View style={{ padding: 30, alignItems: 'center' }}>
              <Text style={{ color: '#64748b', fontSize: 13 }}>No data for selected range</Text>
            </View>
          )}
        </View>

        <Text style={{ fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 20, fontStyle: 'italic' }}>
          Pull down to refresh. Full chart view coming soon.
        </Text>
      </ScrollView>
    </View>
  );
}
