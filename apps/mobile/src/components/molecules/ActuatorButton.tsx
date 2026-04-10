import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';

interface ActuatorButtonProps {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
  loading?: boolean;
  color: string;
}

const ActuatorButton: React.FC<ActuatorButtonProps> = ({
  icon,
  label,
  active,
  onPress,
  loading = false,
  color,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        active && { backgroundColor: `${color}20`, borderColor: color },
      ]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Text style={styles.icon}>{icon}</Text>
      )}
      <Text style={[styles.label, active && { color }]}>{label}</Text>
      <View style={[styles.statusPill, active ? { backgroundColor: color } : styles.statusOff]}>
        <Text style={[styles.statusText, !active && { color: '#64748b' }]}>
          {active ? 'ON' : 'OFF'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  icon: {
    fontSize: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusOff: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});

export default ActuatorButton;
