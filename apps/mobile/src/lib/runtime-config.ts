import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const API_URL_KEY = 'fishlinic_api_url';

const listeners = new Set<(apiBase: string) => void>();

function resolveDefaultApiBase(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  const hostUri =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
    (Constants.manifest2 as { extra?: { expoClient?: { hostUri?: string } } } | null)?.extra?.expoClient?.hostUri ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

  if (hostUri && Platform.OS !== 'web') {
    const host = String(hostUri).split(':')[0];
    if (host && host !== 'localhost') return `http://${host}:3000`;
  }

  return 'http://localhost:3000';
}

const defaultApiBase = resolveDefaultApiBase();
let apiBaseCache = defaultApiBase;

function notify() {
  listeners.forEach(listener => listener(apiBaseCache));
}

export function getDefaultApiBase(): string {
  return defaultApiBase;
}

export function getApiBase(): string {
  return apiBaseCache;
}

export function subscribeApiBase(listener: (apiBase: string) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function hydrateRuntimeConfig(): Promise<string> {
  try {
    const stored =
      Platform.OS === 'web'
        ? globalThis.localStorage?.getItem(API_URL_KEY)
        : await AsyncStorage.getItem(API_URL_KEY);

    if (stored?.trim()) {
      apiBaseCache = stored.trim();
      notify();
    }
  } catch {
    // Keep the detected default base URL.
  }

  return apiBaseCache;
}

export async function saveApiBase(nextApiBase: string): Promise<string> {
  const trimmed = nextApiBase.trim() || defaultApiBase;
  apiBaseCache = trimmed;

  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(API_URL_KEY, trimmed);
    } else {
      await AsyncStorage.setItem(API_URL_KEY, trimmed);
    }
  } catch {
    // Keep the in-memory value even if persistence fails.
  }

  notify();
  return apiBaseCache;
}

void hydrateRuntimeConfig();
