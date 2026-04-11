import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApi } from '../../hooks/useApi';
import ActuatorButton from '../molecules/ActuatorButton';

export const ControlPanel: React.FC = () => {
  const { triggerFeed, togglePump, toggleLed } = useApi();
  const [pump, setPump] = useState(false);
  const [led, setLed] = useState(false);
  const [feeding, setFeeding] = useState(false);

  const handleFeed = async () => {
    setFeeding(true);
    await triggerFeed().catch(() => null);
    setTimeout(() => setFeeding(false), 3000);
  };

  const handlePump = async () => {
    await togglePump().catch(() => null);
    setPump(p => !p);
  };

  const handleLed = async () => {
    await toggleLed().catch(() => null);
    setLed(l => !l);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>⚙️  Hardware Controls</Text>
      <View style={styles.stack}>
        <ActuatorButton icon="🍖" label="Manual Feed" active={feeding} onPress={handleFeed} loading={feeding} color="#3b82f6" />
        <ActuatorButton icon="💨" label="Air Pump"    active={pump}    onPress={handlePump}  color="#6366f1" />
        <ActuatorButton icon="💡" label="Lighting"    active={led}     onPress={handleLed}   color="#f59e0b" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 24,
  },
  title: { color: '#f1f5f9', fontSize: 18, fontWeight: '700', marginBottom: 14 },
  stack: { gap: 10 },
});
