import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type BadgeStatus = 'ok' | 'warn' | 'critical' | 'good' | 'average' | 'alert';

interface StatusBadgeProps {
  status: BadgeStatus | string;
  label?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ok: { bg: 'rgba(16,185,129,0.15)', text: '#34d399' },
  good: { bg: 'rgba(16,185,129,0.15)', text: '#34d399' },
  warn: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' },
  warning: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' },
  average: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' },
  critical: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
  alert: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
  emergency: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
};

const LABELS: Record<string, string> = {
  ok: 'Normal',
  good: 'Good',
  warn: 'Warning',
  warning: 'Warning',
  average: 'Average',
  critical: 'Critical',
  alert: 'Alert',
  emergency: 'Emergency',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.ok;
  const displayLabel = label ?? LABELS[status] ?? status;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <View style={[styles.dot, { backgroundColor: colors.text }]} />
      <Text style={[styles.text, { color: colors.text }]}>{displayLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default StatusBadge;
