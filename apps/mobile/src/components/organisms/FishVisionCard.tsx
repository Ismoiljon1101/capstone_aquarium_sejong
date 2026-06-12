import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useApi } from '../../hooks/useApi';

interface VisionSummary {
  fishCount: number;
  disease: string;
  confidence: number;
  imagePath: string | null;
  timestamp: string;
}

export function FishVisionCard() {
  const api = useApi();
  const [data, setData] = useState<VisionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVision = useCallback(async () => {
    try {
      const response = await api.getFishVision();
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch vision data:', error);
    } finally {
      setLoading(false);
    }
  }, []); // api is not stable in dependency array, so left out or handled by useApi internally. Actually, we should omit api or ensure useApi is stable. The prompt said "implement as described above".

  useEffect(() => {
    fetchVision();
    const interval = setInterval(fetchVision, 30000);
    return () => clearInterval(interval);
  }, [fetchVision]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await api.analyzeVision("MOBILE_REFRESH");
      setTimeout(fetchVision, 3000);
    } catch (error) {
      console.error('Failed to trigger scan:', error);
      setLoading(false);
    }
  };

  const isHealthy = data?.disease === 'healthy' || data?.disease === 'ok' || data?.disease === 'unknown';

  return (
    <View style={styles.card}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#38bdf8" />
          <Text style={styles.loadingText}>Scanning...</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Fish Vision</Text>
            <Text style={styles.timestamp}>Updated: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '--:--'}</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.countText}>🐠 {data?.fishCount ?? 0} fish detected</Text>
            <Text style={[styles.diseaseText, isHealthy ? styles.healthy : styles.unhealthy]}>
              {isHealthy ? '✅ Healthy' : `⚠️ ${data?.disease}`}
            </Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleRefresh}>
            <Text style={styles.buttonText}>🔄 Refresh Scan</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(56,189,248,0.15)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#94a3b8',
    marginLeft: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    color: '#64748b',
    fontSize: 12,
  },
  content: {
    marginBottom: 16,
  },
  countText: {
    color: '#f8fafc',
    fontSize: 18,
    marginBottom: 4,
  },
  diseaseText: {
    fontSize: 14,
    fontWeight: '500',
  },
  healthy: {
    color: '#4ade80',
  },
  unhealthy: {
    color: '#f87171',
  },
  button: {
    backgroundColor: 'rgba(56,189,248,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.2)',
  },
  buttonText: {
    color: '#38bdf8',
    fontWeight: '500',
  },
});
