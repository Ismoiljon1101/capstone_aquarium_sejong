import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { useSocket } from '../hooks/useSocket';
import { useApi } from '../hooks/useApi';
import SensorCard from '../components/molecules/SensorCard';
import ActuatorButton from '../components/molecules/ActuatorButton';
import AlertBanner from '../components/molecules/AlertBanner';
import FishHealthCard from '../components/molecules/FishHealthCard';
import StatusDot from '../components/atoms/StatusDot';

interface SensorData {
  value: number;
  unit: string;
  status: string;
}

interface Alert {
  alertId: string;
  message: string;
  severity: string;
}

interface FishData {
  count: number;
  confidence: number;
  timestamp: string;
}

interface HealthData {
  visualStatus: string;
  behaviorStatus: string;
}

const DashboardScreen = () => {
  const { connected, on, emit } = useSocket();
  const api = useApi();

  // Sensor state
  const [sensors, setSensors] = useState<Record<string, SensorData>>({
    temp_c: { value: 0, unit: '\u00B0C', status: 'ok' },
    pH: { value: 0, unit: 'pH', status: 'ok' },
    do_mg_l: { value: 0, unit: 'mg/L', status: 'ok' },
  });

  // Actuator state
  const [pump, setPump] = useState(false);
  const [led, setLed] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);
  const [pumpLoading, setPumpLoading] = useState(false);
  const [ledLoading, setLedLoading] = useState(false);

  // Alerts
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Fish health
  const [fishData, setFishData] = useState<FishData>({ count: 0, confidence: 0, timestamp: '' });
  const [healthData, setHealthData] = useState<HealthData>({
    visualStatus: 'good',
    behaviorStatus: '',
  });

  // Pull to refresh
  const [refreshing, setRefreshing] = useState(false);

  // Fade-in animation
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Socket.IO event listeners
  useEffect(() => {
    const unsubs = [
      on('sensor:update', (data: { type: string; value: number; unit: string; status: string }) => {
        setSensors((prev) => ({
          ...prev,
          [data.type]: { value: data.value, unit: data.unit, status: data.status },
        }));
      }),
      on('alert:new', (data: Alert) => {
        setAlerts((prev) => [data, ...prev].slice(0, 5));
      }),
      on('fish:count', (data: FishData) => {
        setFishData(data);
      }),
      on('health:report', (data: HealthData) => {
        setHealthData(data);
      }),
      on('actuator:state', (data: { pump?: boolean; led?: boolean }) => {
        if (data.pump !== undefined) setPump(data.pump);
        if (data.led !== undefined) setLed(data.led);
      }),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [on]);

  // Initial data fetch
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [latestRes, actuatorRes, alertsRes, fishRes, healthRes] = await Promise.allSettled([
        api.getLatest(),
        api.getActuatorState(),
        api.getActiveAlerts(),
        api.getFishCount(),
        api.getFishHealth(),
      ]);

      if (latestRes.status === 'fulfilled' && latestRes.value.data) {
        const d = latestRes.value.data;
        setSensors({
          temp_c: { value: d.temp_c ?? 0, unit: '\u00B0C', status: d.status ?? 'ok' },
          pH: { value: d.pH ?? 0, unit: 'pH', status: d.status ?? 'ok' },
          do_mg_l: { value: d.do_mg_l ?? 0, unit: 'mg/L', status: d.status ?? 'ok' },
        });
      }
      if (actuatorRes.status === 'fulfilled' && actuatorRes.value.data) {
        const s = actuatorRes.value.data;
        setPump(!!s.pump);
        setLed(!!s.led);
      }
      if (alertsRes.status === 'fulfilled' && Array.isArray(alertsRes.value.data)) {
        setAlerts(alertsRes.value.data.slice(0, 5));
      }
      if (fishRes.status === 'fulfilled' && fishRes.value.data) {
        setFishData(fishRes.value.data);
      }
      if (healthRes.status === 'fulfilled' && healthRes.value.data) {
        setHealthData(healthRes.value.data);
      }
    } catch {
      // Silently handle — data will come via socket
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, []);

  const handleFeed = async () => {
    setFeedLoading(true);
    try {
      await api.triggerFeed();
    } catch {
      // noop
    }
    setTimeout(() => setFeedLoading(false), 3000);
  };

  const handlePump = async () => {
    setPumpLoading(true);
    try {
      await api.togglePump();
      setPump((p) => !p);
    } catch {
      // noop
    }
    setPumpLoading(false);
  };

  const handleLed = async () => {
    setLedLoading(true);
    try {
      await api.toggleLed();
      setLed((l) => !l);
    } catch {
      // noop
    }
    setLedLoading(false);
  };

  const handleDismissAlert = (alertId: string) => {
    api.acknowledgeAlert(alertId);
    setAlerts((prev) => prev.filter((a) => a.alertId !== alertId));
  };

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
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
            <Text style={[styles.connectionText, { color: connected ? '#34d399' : '#f87171' }]}>
              {connected ? 'Live' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Alerts */}
        {alerts.length > 0 && (
          <View style={styles.section}>
            {alerts.map((alert) => (
              <AlertBanner
                key={alert.alertId}
                message={alert.message}
                severity={alert.severity}
                onAcknowledge={() => handleDismissAlert(alert.alertId)}
              />
            ))}
          </View>
        )}

        {/* Live Telemetry */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Telemetry</Text>
          <View style={styles.sensorGrid}>
            <SensorCard
              label="Temperature"
              value={sensors.temp_c.value}
              unit={sensors.temp_c.unit}
              status={sensors.temp_c.status}
              min={15}
              max={35}
              color="#3b82f6"
              icon="\uD83C\uDF21\uFE0F"
            />
            <SensorCard
              label="pH Level"
              value={sensors.pH.value}
              unit={sensors.pH.unit}
              status={sensors.pH.status}
              min={0}
              max={14}
              color="#10b981"
              icon="\uD83E\uddEA"
            />
          </View>
          <View style={styles.sensorGrid}>
            <SensorCard
              label="Dissolved O\u2082"
              value={sensors.do_mg_l.value}
              unit={sensors.do_mg_l.unit}
              status={sensors.do_mg_l.status}
              min={0}
              max={15}
              color="#8b5cf6"
              icon="\uD83D\uDCA8"
            />
            <View style={styles.sensorPlaceholder}>
              <Text style={styles.placeholderIcon}>📊</Text>
              <Text style={styles.placeholderValue}>
                {sensors.temp_c.value > 0 ? 'Active' : 'Waiting'}
              </Text>
              <Text style={styles.placeholderLabel}>System Status</Text>
              <View style={styles.miniStats}>
                <Text style={styles.miniStat}>3 Sensors</Text>
                <Text style={styles.miniStat}>
                  {connected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Controls</Text>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.feedButton, feedLoading && styles.feedButtonActive]}
              onPress={handleFeed}
              disabled={feedLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.feedIcon}>{feedLoading ? '\u23F3' : '\uD83D\uDC1F'}</Text>
              <Text style={styles.feedLabel}>
                {feedLoading ? 'Feeding...' : 'Feed Fish'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.controlsRow}>
            <ActuatorButton
              icon="\uD83D\uDCA8"
              label="Air Pump"
              active={pump}
              onPress={handlePump}
              loading={pumpLoading}
              color="#06b6d4"
            />
            <View style={{ width: 12 }} />
            <ActuatorButton
              icon="\uD83D\uDCA1"
              label="LED Strip"
              active={led}
              onPress={handleLed}
              loading={ledLoading}
              color="#f59e0b"
            />
          </View>
        </View>

        {/* Fish Health AI */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Fish Analysis</Text>
          <FishHealthCard
            fishCount={fishData.count}
            confidence={fishData.confidence}
            healthStatus={healthData.visualStatus}
            behaviorSummary={healthData.behaviorStatus}
            lastUpdated={fishData.timestamp}
          />
        </View>

        {/* Bottom spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  brandText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f1f5f9',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  sensorGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  sensorPlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  placeholderValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  placeholderLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 8,
  },
  miniStats: {
    gap: 4,
  },
  miniStat: {
    fontSize: 10,
    color: '#475569',
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  feedButton: {
    flex: 1,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  feedButtonActive: {
    backgroundColor: 'rgba(59,130,246,0.25)',
    borderColor: '#3b82f6',
  },
  feedIcon: {
    fontSize: 22,
  },
  feedLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#60a5fa',
  },
});

export default DashboardScreen;
