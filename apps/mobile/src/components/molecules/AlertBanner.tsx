import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import StatusDot from '../atoms/StatusDot';

interface AlertBannerProps {
  message: string;
  severity: 'critical' | 'emergency' | 'warning' | string;
  onAcknowledge?: () => void;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ message, severity, onAcknowledge }) => {
  const isCritical = severity === 'critical' || severity === 'emergency';
  const borderColor = isCritical ? '#ef4444' : '#f59e0b';
  const bgColor = isCritical ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)';

  return (
    <View style={[styles.banner, { borderLeftColor: borderColor, backgroundColor: bgColor }]}>
      <View style={styles.content}>
        <StatusDot status={isCritical ? 'critical' : 'warn'} size={7} />
        <View style={styles.textContainer}>
          <Text style={[styles.severity, { color: borderColor }]}>
            {severity.toUpperCase()}
          </Text>
          <Text style={styles.message} numberOfLines={2}>{message}</Text>
        </View>
      </View>
      {onAcknowledge && (
        <TouchableOpacity style={styles.dismissBtn} onPress={onAcknowledge}>
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    marginBottom: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  severity: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  dismissBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dismissText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
});

export default AlertBanner;
