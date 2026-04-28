import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useSocket } from '../hooks/useSocket';
import { useApi } from '../hooks/useApi';

interface Props {
  title: string;
  subtitle?: string;
  branded?: boolean;
  back?: boolean;
}

export default function AppHeader({ title, subtitle, branded, back }: Props) {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const { connected, on } = useSocket();
  const api = useApi();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (back) return;
    api.getActiveAlerts().then(r => {
      if (Array.isArray(r.data)) setAlertCount(r.data.length);
    }).catch(() => null);

    const offNew = on('alert:new', () => setAlertCount(c => c + 1));
    return offNew;
  }, [on, back]);

  const goAlerts = () => {
    Haptics.selectionAsync();
    nav.navigate('Alerts');
  };
  const goSettings = () => {
    Haptics.selectionAsync();
    nav.navigate('Settings');
  };
  const goBack = () => {
    Haptics.selectionAsync();
    nav.navigate('Dashboard');
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 10 }]}>
      <View style={styles.row}>
        {/* Back button (only when back=true) */}
        {back && (
          <TouchableOpacity
            onPress={goBack} activeOpacity={0.7}
            accessibilityLabel="Back" accessibilityRole="button"
            style={[styles.iconBtn, { marginRight: 8 }]}
          >
            <Ionicons name="chevron-back" size={24} color="#e2e8f0" />
          </TouchableOpacity>
        )}

        {/* Left: title + connection */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={[
                styles.title,
                branded && { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {!back && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: connected ? '#34d399' : '#94a3b8' }} />}
          </View>
          {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>

        {/* Right: bell + avatar (hidden when back=true) */}
        {!back && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={goAlerts} activeOpacity={0.7}
              accessibilityLabel={`Notifications, ${alertCount} unread`} accessibilityRole="button"
              style={styles.iconBtn}
            >
              <Ionicons name="notifications-outline" size={22} color="#e2e8f0" />
              {alertCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{alertCount > 9 ? '9+' : String(alertCount)}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goSettings} activeOpacity={0.7}
              accessibilityLabel="Settings and profile" accessibilityRole="button"
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>F</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#020617',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f1f5f9',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#020617',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 11,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0891b2',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});
