import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
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

export default function DashboardScreen() {
  const { connected } = useSocket();
  const api = useApi();
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([api.getLatest(), api.getActiveAlerts(), api.getFishCount(), api.getFishHealth()]);
    setRefreshing(false);
  }, []);

  return (
    <Animated.View style={{ flex: 1, backgroundColor: '#020617', opacity: fadeAnim }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 30, gap: 0 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" colors={['#38bdf8']} />}
      >
        {/* Brand Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <View>
            <Text style={{ fontSize: 14, color: '#64748b', fontWeight: '500', marginBottom: 2 }}>Good {getTimeOfDay()}</Text>
            <Text selectable style={{ fontSize: 30, fontWeight: '900', color: '#f8fafc', letterSpacing: -1 }}>Fishlinic</Text>
          </View>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: 'rgba(255,255,255,0.04)',
            paddingHorizontal: 12, paddingVertical: 8,
            borderRadius: 20, borderCurve: 'continuous',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
            marginTop: 6,
          }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: connected ? '#34d399' : '#64748b' }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: connected ? '#34d399' : '#64748b' }}>
              {connected ? 'System Online' : 'Connecting\u2026'}
            </Text>
          </View>
        </View>

        {/* Hero Health Card */}
        <View style={{
          borderRadius: 24, borderCurve: 'continuous',
          overflow: 'hidden', marginBottom: 28,
          borderWidth: 1, borderColor: 'rgba(56,189,248,0.15)',
          backgroundColor: '#0c1a2e',
          boxShadow: '0 4px 24px rgba(56,189,248,0.08)',
        }}>
          {/* Subtle glow */}
          <View style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(56,189,248,0.06)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 24, gap: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text selectable style={{ fontSize: 56, fontWeight: '900', color: '#38bdf8', letterSpacing: -3, lineHeight: 58, fontVariant: ['tabular-nums'] }}>98</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#38bdf880', marginLeft: 2 }}>/100</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#e2e8f0', marginBottom: 4 }}>Aquarium Health</Text>
              <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 10, lineHeight: 18 }}>All parameters within safe range</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Tag label="💧 Water" color="#34d399" />
                <Tag label="🐟 Fish" color="#60a5fa" />
                <Tag label="🍽️ Feed" color="#fbbf24" />
              </View>
            </View>
          </View>
        </View>

        <AlertFeed />
        <LiveTelemetry />
        <ControlPanel />
        <FishHealthPanel />
      </ScrollView>
    </Animated.View>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <View style={{
      paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: 8, borderCurve: 'continuous',
      borderWidth: 1, backgroundColor: color + '15', borderColor: color + '30',
    }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color }}>{label}</Text>
    </View>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}
