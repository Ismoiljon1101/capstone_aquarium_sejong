import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

/**
 * // ATOM: Card
 * // Purpose: Provides a standardized 'Glassmorphism' container for dashboard modules.
 * // Rule: Strictly presentational. No business logic allowed.
 */
interface CardProps extends ViewProps {
  // // Custom left-accent color for status indication
  accentColor?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, accentColor, style, ...props }) => {
  // // Compose logic: Base style + optional accent color + user-provided styles
  return (
    <View 
      style={[
        styles.base, 
        accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 4 } : null,
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  // // Base Glassmorphism styling for 2026 aesthetics
  base: {
    backgroundColor: '#0f172a', // // Deep slate for dark mode
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)', // // Subtle border for glass effect
  },
});

export default Card;
