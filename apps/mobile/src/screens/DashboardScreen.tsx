import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { io } from 'socket.io-client';

/**
 * DashboardScreen - Organism level component
 * Displays live aquarium data and controls
 */
const DashboardScreen = () => {
  const [sensors, setSensors] = useState({
    temp: 24.5,
    ph: 7.2,
    turbidity: 0.1,
  });

  useEffect(() => {
    // Connect to local backend (for simulation)
    const socket = io('http://localhost:3000');
    
    socket.on('sensor:all', (data) => {
      setSensors(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Fishlinic Mobile</Text>
      
      <View style={styles.grid}>
        <SensorCard label="Temperature" value={`${sensors.temp}°C`} color="#3b82f6" />
        <SensorCard label="pH Level" value={sensors.ph.toString()} color="#10b981" />
        <SensorCard label="Turbidity" value={`${sensors.turbidity} NTU`} color="#6366f1" />
      </View>

      <View style={styles.controlPanel}>
        <Text style={styles.sectionTitle}>Quick Controls</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Feed Fish</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Molecule/Atom level subcomponents (Internal for boilerplate speed)
const SensorCard = ({ label, value, color }: { label: string, value: string, color: string }) => (
  <View style={[styles.card, { borderLeftColor: color }]}>
    <Text style={styles.cardLabel}>{label}</Text>
    <Text style={styles.cardValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  content: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  cardLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  cardValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
  },
  controlPanel: {
    marginTop: 8,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default DashboardScreen;
