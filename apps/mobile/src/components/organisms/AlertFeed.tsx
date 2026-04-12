import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSocket } from '../../hooks/useSocket';
import { useApi } from '../../hooks/useApi';

interface Alert {
  alertId: string;
  message: string;
  severity: string;
  createdAt?: string;
}

const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444', EMERGENCY: '#dc2626',
  WARNING: '#fbbf24', INFO: '#60a5fa',
};
const SEV_BG: Record<string, string> = {
  CRITICAL: 'rgba(239,68,68,0.1)', EMERGENCY: 'rgba(220,38,38,0.1)',
  WARNING: 'rgba(251,191,36,0.1)', INFO: 'rgba(96,165,250,0.1)',
};

function AlertRow({ alert, onAck }: { alert: Alert; onAck: () => void }) {
  const sev = alert.severity?.toUpperCase() ?? 'INFO';
  const color = SEV_COLOR[sev] ?? '#60a5fa';
  const bg = SEV_BG[sev] ?? 'rgba(96,165,250,0.1)';
  return (
    <View style={[rowStyles.wrap, { borderLeftColor: color }]}>
      <View style={{ flex: 1 }}>
        <View style={rowStyles.top}>
          <View style={[rowStyles.sevBadge, { backgroundColor: bg }]}>
            <Text style={[rowStyles.sevText, { color }]}>{sev}</Text>
          </View>
          {alert.createdAt && (
            <Text style={rowStyles.time}>{new Date(alert.createdAt).toLocaleTimeString()}</Text>
          )}
        </View>
        <Text style={rowStyles.msg}>{alert.message}</Text>
      </View>
      <TouchableOpacity onPress={onAck} style={rowStyles.ackBtn}>
        <Text style={rowStyles.ackText}>\u2713</Text>
      </TouchableOpacity>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderLeftWidth: 3,
    gap: 10,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sevBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  sevText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  time: { fontSize: 10, color: '#475569' },
  msg: { fontSize: 13, color: '#cbd5e1', lineHeight: 18 },
  ackBtn: { backgroundColor: 'rgba(52,211,153,0.12)', borderRadius: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  ackText: { color: '#34d399', fontSize: 16, fontWeight: '700' },
});

export const AlertFeed: React.FC = () => {
  const { on } = useSocket();
  const { acknowledgeAlert } = useApi();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    return on('alert:new', (d: Alert) => setAlerts(p => [d, ...p].slice(0, 5)));
  }, [on]);

  const handleAck = (id: string) => {
    acknowledgeAlert(id).catch(() => null);
    setAlerts(p => p.filter(a => a.alertId !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>\uD83D\uDD14  Alerts</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{alerts.length}</Text>
        </View>
      </View>
      {alerts.map(a => <AlertRow key={a.alertId} alert={a} onAck={() => handleAck(a.alertId)} />)}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  badge: { backgroundColor: '#ef4444', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
