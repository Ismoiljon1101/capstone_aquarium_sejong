import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useApi } from '../hooks/useApi';

type Range = '24h' | '1w' | '1m';

interface Reading {
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  status: string;
}

export default function HistoryScreen() {
  const api = useApi();
  const [range, setRange] = useState<Range>('24h');
  const [readings, setReadings] = useState<Reading[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [range]);

  const loadHistory = async () => {
    try {
      const res = await api.getLatest();
      if (Array.isArray(res.data)) {
        setReadings(res.data);
      } else if (res.data) {
        // Convert single object to array of readings
        const d = res.data;
        const arr: Reading[] = [];
        if (d.pH !== undefined) arr.push({ type: 'pH', value: d.pH, unit: 'pH', timestamp: d.timestamp ?? '', status: d.status ?? 'ok' });
        if (d.temp_c !== undefined) arr.push({ type: 'Temperature', value: d.temp_c, unit: '\u00B0C', timestamp: d.timestamp ?? '', status: d.status ?? 'ok' });
        if (d.do_mg_l !== undefined) arr.push({ type: 'Dissolved O\u2082', value: d.do_mg_l, unit: 'mg/L', timestamp: d.timestamp ?? '', status: d.status ?? 'ok' });
        setReadings(arr);
      }
    } catch {
      // noop
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [range]);

  const statusColor = (s: string) => {
    if (s === 'critical') return '#ef4444';
    if (s === 'warn' || s === 'warning') return '#fbbf24';
    return '#34d399';
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" colors={['#3b82f6']} />
        }
      >
        <Text style={styles.title}>Sensor History</Text>

        {/* Range Selector */}
        <View style={styles.rangeRow}>
          {(['24h', '1w', '1m'] as Range[]).map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
              onPress={() => setRange(r)}
            >
              <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>
                {r === '24h' ? '24 Hours' : r === '1w' ? '7 Days' : '30 Days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Latest Readings Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Parameter</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Value</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Status</Text>
          </View>
          {readings.length > 0 ? (
            readings.map((r, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.cellText, { flex: 2 }]}>{r.type}</Text>
                <Text style={[styles.cellValue, { flex: 1 }]}>
                  {typeof r.value === 'number' ? r.value.toFixed(1) : r.value} {r.unit}
                </Text>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor(r.status) }]}>
                    <Text style={[styles.statusText, { color: statusColor(r.status) }]}>
                      {(r.status ?? 'ok').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No data for selected range</Text>
            </View>
          )}
        </View>

        <Text style={styles.hint}>
          Pull down to refresh. Full chart view coming soon.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 16, paddingTop: 12, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#f1f5f9', marginBottom: 16 },
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  rangeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  rangeBtnActive: { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6' },
  rangeText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  rangeTextActive: { color: '#60a5fa' },
  table: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tableHeaderText: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  cellText: { fontSize: 14, color: '#e2e8f0', fontWeight: '500' },
  cellValue: { fontSize: 14, color: '#f1f5f9', fontWeight: '700' },
  statusDot: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: 'rgba(52,211,153,0.15)' },
  statusText: { fontSize: 10, fontWeight: '700' },
  emptyRow: { padding: 30, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 13 },
  hint: { fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
});
