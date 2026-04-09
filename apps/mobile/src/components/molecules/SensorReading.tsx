import React from 'react';
import Card from '../atoms/Card';
import Typography from '../atoms/Typography';
import { StyleSheet, View } from 'react-native';

/**
 * // MOLECULE: SensorReading
 * // Purpose: Orchestrates atoms to display a complete sensor data point.
 * // Rule: Logic-free composition. Uses Card and Typography atoms.
 */

interface SensorReadingProps {
  label: string;
  value: string;
  color: string;
}

const SensorReading: React.FC<SensorReadingProps> = ({ label, value, color }) => {
  // // Compose atoms: Card (Primitive) + Typography (Label) + Typography (Value)
  return (
    <Card accentColor={color} style={styles.container}>
      <Typography variant="label">{label}</Typography>
      <Typography variant="value" style={styles.valueText}>{value}</Typography>
    </Card>
  );
};

const styles = StyleSheet.create({
  // // Component-specific layout (Molecule scale)
  container: {
    width: '48%', // // Grid sizing logic shared between atoms
    marginBottom: 16,
  },
  valueText: {
    marginTop: 4,
  },
});

export default SensorReading;
