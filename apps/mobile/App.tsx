import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { usePushToken } from './src/hooks/usePushToken';
import { hydrateRuntimeConfig } from './src/lib/runtime-config';

function AppInner() {
  usePushToken();

  useEffect(() => {
    void hydrateRuntimeConfig();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
