import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

/**
 * Fishlinic Mobile — Main Entry Point
 * Architecture: Atomic Design + React Navigation Bottom Tabs
 * Backend: NestJS on port 3000 (WebSocket + REST)
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
