import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GaugeRing from '../atoms/GaugeRing';
import StatusBadge from '../atoms/StatusBadge';

interface SensorCardProps {
  label: string;
  value: number;
  unit: string;
  status: string;
  min: number;
  max: number;
  color: string;
  icon: string;
}

const SensorCard: React.FC<SensorCardProps> = ({
  label,
  value,
  unit,
  status,
  min,
  max,
  color,
  icon,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <StatusBadge status={status} />
      </View>
      <View style={styles.body}>
        <GaugeRing value={value} min={min} max={max} color={color} size={72} strokeWidth={5} />
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color }]}>{value.toFixed(1)}</Text>
          <Text style={styles.unit}>{unit}</Text>
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 20,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  valueContainer: {
    flex: 1,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
  },
  unit: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  label: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
});

export default SensorCard;
