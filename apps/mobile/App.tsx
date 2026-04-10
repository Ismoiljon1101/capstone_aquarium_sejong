import { registerRootComponent } from 'expo';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView } from 'react-native';
import DashboardScreen from './src/screens/DashboardScreen';

/**
 * Fishlinic Mobile - Main Application Entry Point
 * Architecture: Atomic Design
 */
function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <DashboardScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Match Dashboard Background
  },
});

registerRootComponent(App);
