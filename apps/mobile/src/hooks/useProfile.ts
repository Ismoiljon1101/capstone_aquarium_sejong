import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Profile {
  name: string;
  email: string;
  tankName: string;
}

const KEY = 'fishlinic_profile';
const DEFAULT: Profile = { name: 'Aquarist', email: '', tankName: 'My Tank' };

let cache: Profile = DEFAULT;
const listeners = new Set<(p: Profile) => void>();

async function load(): Promise<Profile> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) cache = { ...DEFAULT, ...JSON.parse(raw) };
  } catch {}
  return cache;
}

async function save(patch: Partial<Profile>) {
  cache = { ...cache, ...patch };
  try { await AsyncStorage.setItem(KEY, JSON.stringify(cache)); } catch {}
  listeners.forEach(fn => fn(cache));
}

load();

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(cache);

  useEffect(() => {
    let mounted = true;
    load().then(p => { if (mounted) setProfile(p); });
    const fn = (p: Profile) => setProfile({ ...p });
    listeners.add(fn);
    return () => { mounted = false; listeners.delete(fn); };
  }, []);

  const update = useCallback((patch: Partial<Profile>) => save(patch), []);
  return { profile, update };
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'F';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
