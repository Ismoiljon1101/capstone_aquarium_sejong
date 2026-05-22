import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useApi } from '../hooks/useApi';
import { C, T, S, R } from '../theme';

interface VisionData {
  fishCount: number;
  disease: string;
  confidence: number;
  imagePath: string | null;
  timestamp: string;
}

/**
 * FishVisionCard displays the latest YOLO computer vision model outputs
 * including Neon Tetra count, overall health/disease flags, and allows manual triggers.
 */
export default function FishVisionCard() {
  const api = useApi();
  const [data, setData] = useState<VisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchVision = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.getFishVision();
      if (response.data) {
        setData(response.data);
      }
    } catch (err) {
      console.warn('[FishVisionCard] Error fetching vision details:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const handleRefresh = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setScanning(true);
    try {
      await api.triggerVisionScan();
      // Wait 3 seconds for the model pipeline to run before fetching latest
      setTimeout(() => {
        fetchVision(true).then(() => setScanning(false));
      }, 3000);
    } catch (err) {
      console.warn('[FishVisionCard] Error triggering scan:', err);
      setScanning(false);
    }
  }, [api, fetchVision]);

  useEffect(() => {
    fetchVision();
    intervalRef.current = setInterval(() => {
      fetchVision(true);
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchVision]);

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'never';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'never';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const isHealthy = !data?.disease || data.disease.toLowerCase() === 'healthy' || data.disease.toLowerCase() === 'ok';

  if (loading && !data) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={C.accent} size="small" />
        <Text style={styles.loadingText}>Syncing with FishVision AI...</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.row}>
          <Ionicons name="eye-outline" size={18} color={C.accent} />
          <Text style={styles.title}>FishVision YOLO Neural Net</Text>
        </View>
        {scanning ? (
          <ActivityIndicator color={C.ok} size="small" />
        ) : (
          <TouchableOpacity
            onPress={handleRefresh}
            activeOpacity={0.7}
            style={styles.refreshBtn}
            accessibilityLabel="Refresh vision scan"
          >
            <Ionicons name="refresh" size={16} color={C.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.body}>
        {/* Count Indicator */}
        <View style={styles.metricRow}>
          <View style={styles.badge}>
            <Text style={styles.emoji}>🐠</Text>
            <Text style={styles.metricLabel}>
              {data?.fishCount !== undefined ? `${data.fishCount} fish detected` : 'No fish detected'}
            </Text>
          </View>
          {data?.confidence !== undefined && (
            <Text style={styles.confidenceText}>
              ({Math.round(data.confidence * 100)}% conf)
            </Text>
          )}
        </View>

        {/* Health / Disease Status */}
        <View style={[styles.statusBox, { borderColor: isHealthy ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)' }]}>
          <View style={styles.row}>
            <Ionicons
              name={isHealthy ? 'checkmark-circle-outline' : 'warning-outline'}
              size={18}
              color={isHealthy ? C.ok : C.crit}
            />
            <Text style={[styles.statusText, { color: isHealthy ? C.ok : C.crit }]}>
              {isHealthy ? 'Healthy Tank environment' : `Disease detected: ${data?.disease}`}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.timeText}>Last scanned: {formatTime(data?.timestamp)}</Text>
        {scanning && <Text style={styles.scanningLabel}>Processing tank frame...</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderColor: 'rgba(56,189,248,0.15)',
    borderWidth: 1,
    borderRadius: R.md,
    padding: S.s12,
    marginHorizontal: 14,
    marginTop: S.s8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    ...T.bodySm,
    color: C.textTertiary,
    marginTop: S.s8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    paddingBottom: S.s8,
    marginBottom: S.s8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...T.label,
    color: C.textPrimary,
  },
  refreshBtn: {
    padding: S.s4,
    borderRadius: R.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  body: {
    gap: S.s8,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: S.s8,
    paddingVertical: S.s4,
    borderRadius: R.sm,
    gap: S.s4,
  },
  emoji: {
    fontSize: 14,
  },
  metricLabel: {
    ...T.bodyMd,
    color: C.textPrimary,
  },
  confidenceText: {
    ...T.caption,
    color: C.textTertiary,
  },
  statusBox: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderWidth: 1,
    borderRadius: R.sm,
    paddingHorizontal: S.s8,
    paddingVertical: 6,
    marginTop: S.s2,
  },
  statusText: {
    ...T.bodySm,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: S.s8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: 6,
  },
  timeText: {
    ...T.caption,
    color: C.textTertiary,
  },
  scanningLabel: {
    ...T.micro,
    color: C.ok,
    fontWeight: '700',
  },
});
