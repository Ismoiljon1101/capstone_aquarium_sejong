import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface StatusDotProps {
  status: 'ok' | 'warn' | 'critical';
  size?: number;
}

const COLORS = {
  ok: '#34d399',
  warn: '#fbbf24',
  critical: '#f87171',
};

const StatusDot: React.FC<StatusDotProps> = ({ status, size = 8 }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const color = COLORS[status];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulse,
          {
            width: size * 2.5,
            height: size * 2.5,
            borderRadius: size * 1.25,
            backgroundColor: color,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    opacity: 0.2,
  },
  dot: {
    zIndex: 1,
  },
});

export default StatusDot;
