import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { API_BASE } from './useApi';

export function usePushToken() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    registerToken();
  }, []);
}

async function registerToken() {
  try {
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
