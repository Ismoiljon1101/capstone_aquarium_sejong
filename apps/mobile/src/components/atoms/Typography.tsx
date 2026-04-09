import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';

/**
 * // ATOM: Typography
 * // Purpose: Centralized text handling for the Fishlinic ecosystem.
 * // Rule: Ensures all 'Titles', 'Weights', and 'Colors' follow the 2026 design system.
 */

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'label' | 'value';
  children: React.ReactNode;
}

const Typography: React.FC<TypographyProps> = ({ variant = 'label', children, style, ...props }) => {
  // // Mapping variants to pre-defined styles
  const variantStyle = styles[variant];

  return (
    <Text style={[styles.base, variantStyle, style]} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  // // Core text foundations
  base: {
    color: '#ffffff',
    fontFamily: 'System', // // Defaulting to system font in 2026 for performance
  },
  h1: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  h2: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  label: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '400',
  },
  value: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default Typography;
