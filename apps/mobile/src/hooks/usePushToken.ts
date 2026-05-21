import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_BASE } from './useApi';

/** Push token registration — silently no-ops on Expo Go and web. */
export function usePushToken() {
  useEffect(() => {
    // expo-notifications is not supported in Expo Go (SDK 53+) and not needed on web.
    // Skip silently to prevent native module crash.
    const isExpoGo = Constants.executionEnvironment === 'storeClient';
    if (Platform.OS === 'web' || isExpoGo) return;
    registerToken();
  }, []);
}

async function registerToken() {
  try {
    // Dynamic import so the module never even loads in Expo Go / web bundles.
    const Notifications = await import('expo-notifications');

    const { status: existing } = await Notifications.getPermissionsAsync();
    const { status } = existing === 'granted'
      ? { status: existing }
      : await Notifications.requestPermissionsAsync();

    if (status !== 'granted') return;

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    if (!token) return;

    await fetch(`${API_BASE}/management/tank-config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pushToken: token }),
    });
  } catch {
    // silently fail — push is non-critical
  }
}

