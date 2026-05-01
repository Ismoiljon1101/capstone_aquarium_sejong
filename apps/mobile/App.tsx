import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import AppNavigator from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <KeyboardProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </KeyboardProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
