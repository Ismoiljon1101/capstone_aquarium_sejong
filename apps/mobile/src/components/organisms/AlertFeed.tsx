import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSocket } from '../../hooks/useSocket';
import { useApi } from '../../hooks/useApi';
import AlertBanner from '../molecules/AlertBanner';

interface Alert {
  alertId: string;
  message: string;
  severity: string;
}

export const AlertFeed: React.FC = () => {
  const { on } = useSocket();
  const { acknowledgeAlert } = useApi();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const unsub = on('alert:new', (data: Alert) => {
      setAlerts(prev => [data, ...prev].slice(0, 5));
    });
    return unsub;
  }, [on]);

  const handleDismiss = (alertId: string) => {
    acknowledgeAlert(alertId).catch(() => null);
    setAlerts(prev => prev.filter(a => a.alertId !== alertId));
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>🔔  Active Alerts</Text>
      {alerts.length > 0 ? (
        alerts.map(alert => (
          <AlertBanner
            key={alert.alertId}
            message={alert.message}
            severity={alert.severity}
            onAcknowledge={() => handleDismiss(alert.alertId)}
          />
        ))
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>All systems nominal. No active alerts.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  title: { color: '#f1f5f9', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: { color: '#64748b', fontSize: 13, fontStyle: 'italic' },
});
