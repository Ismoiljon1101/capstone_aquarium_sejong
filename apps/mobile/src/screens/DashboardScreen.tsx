import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import { useSocket } from '../hooks/useSocket';
import { useApi } from '../hooks/useApi';
import { LiveTelemetry } from '../components/organisms/LiveTelemetry';
import { ControlPanel } from '../components/organisms/ControlPanel';
import { AlertFeed } from '../components/organisms/AlertFeed';
import { FishHealthPanel } from '../components/organisms/FishHealthPanel';
import StatusDot from '../components/atoms/StatusDot';

export default function DashboardScreen() {
  const { connected } = useSocket();
  const api = useApi();
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        api.getLatest(),
        api.getActiveAlerts(),
        api.getFishCount(),
        api.getFishHealth(),
      ]);
    } catch {
      // data comes via socket
    }
    setRefreshing(false);
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" colors={['#3b82f6']} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandText}>Fishlinic</Text>
            <Text style={styles.subtitle}>Smart Aquaculture Monitor</Text>
          </View>
          <View style={styles.connectionBadge}>
            <StatusDot status={connected ? 'ok' : 'critical'} size={6} />
            <Text style={[styles.connText, { color: connected ? '#34d399' : '#f87171' }]}>
              {connected ? 'Live' : 'Offline'}
            </Text>
          </View>
        </View>

        <AlertFeed />
        <LiveTelemetry />
        <ControlPanel />
        <FishHealthPanel />

        <View style={{ height: 40 }} />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 30 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  brandText: { fontSize: 26, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  connText: { fontSize: 12, fontWeight: '600' },
});
