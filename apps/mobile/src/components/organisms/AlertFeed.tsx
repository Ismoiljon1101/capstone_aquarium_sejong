import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSocket } from '../../hooks/useSocket';
import { useApi } from '../../hooks/useApi';

interface Alert { alertId: string; message: string; severity: string; createdAt?: string; }

const SEV: Record<string, { color: string; icon: string }> = {
  CRITICAL:  { color: '#ef4444', icon: '\uD83D\uDED1' },
  EMERGENCY: { color: '#dc2626', icon: '\u26A0\uFE0F' },
  WARNING:   { color: '#fbbf24', icon: '\u26A0\uFE0F' },
  INFO:      { color: '#60a5fa', icon: '\u2139\uFE0F' },
};

function AlertRow({ alert, onAck }: { alert: Alert; onAck: () => void }) {
  const sev = alert.severity?.toUpperCase() ?? 'INFO';
  const { color, icon } = SEV[sev] ?? SEV.INFO;
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: '#0f172a',
      borderRadius: 14, borderCurve: 'continuous',
      padding: 14, marginBottom: 8,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
      borderLeftWidth: 3, borderLeftColor: color,
      gap: 12,
      boxShadow: `0 1px 4px ${color}10`,
    }}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text selectable style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 18 }} numberOfLines={2}>
          {alert.message}
        </Text>
        {alert.createdAt && (
          <Text style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>
            {new Date(alert.createdAt).toLocaleTimeString()}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={onAck} style={{
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 8, borderCurve: 'continuous',
      }}>
        <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700' }}>Dismiss</Text>
      </TouchableOpacity>
    </View>
  );
}

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
    <View style={{ marginBottom: 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.5 }}>Alerts</Text>
        <View style={{
          backgroundColor: '#ef4444', width: 22, height: 22, borderRadius: 11,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
            {alerts.length}
          </Text>
        </View>
      </View>
      {alerts.map(a => <AlertRow key={a.alertId} alert={a} onAck={() => handleAck(a.alertId)} />)}
    </View>
  );
};
