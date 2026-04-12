import { registerRootComponent } from 'expo';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <SafeAreaProvider style={{ backgroundColor: '#020617' }}>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
