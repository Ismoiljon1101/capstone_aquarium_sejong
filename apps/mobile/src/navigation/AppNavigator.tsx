import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import DashboardScreen  from '../screens/DashboardScreen';
import AlertsScreen     from '../screens/AlertsScreen';
import ControlsScreen   from '../screens/ControlsScreen';
import FishHealthScreen from '../screens/FishHealthScreen';
import HistoryScreen    from '../screens/HistoryScreen';
import SettingsScreen   from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type TabDef = {
  name: string;
  icon: IoniconName;
  iconActive: IoniconName;
  component: React.ComponentType<any>;
  hidden?: boolean;
};

// Visible primary destinations (4) + hidden routes for Alerts/Settings
// (Alerts and Settings are reached via header bell + avatar)
const TABS: TabDef[] = [
  { name: 'Dashboard', icon: 'home-outline',     iconActive: 'home',     component: DashboardScreen },
  { name: 'Controls',  icon: 'flash-outline',    iconActive: 'flash',    component: ControlsScreen },
  { name: 'Fish AI',   icon: 'fish-outline',     iconActive: 'fish',     component: FishHealthScreen },
  { name: 'History',   icon: 'bar-chart-outline', iconActive: 'bar-chart', component: HistoryScreen },
  { name: 'Alerts',    icon: 'notifications-outline', iconActive: 'notifications', component: AlertsScreen, hidden: true },
  { name: 'Settings',  icon: 'settings-outline', iconActive: 'settings', component: SettingsScreen, hidden: true },
];

export default function AppNavigator() {
  const insets = useSafeAreaInsets();
  const tabBar = {
    ...styles.bar,
    height: Platform.OS === 'web' ? 68 : 56 + insets.bottom,
    paddingBottom: Platform.OS === 'web' ? 10 : insets.bottom + 4,
  };

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => {
          const tab = TABS.find(t => t.name === route.name);
          return {
            headerShown: false,
            tabBarStyle: tab?.hidden ? { display: 'none' } : tabBar,
            tabBarActiveTintColor: '#38bdf8',
            tabBarInactiveTintColor: '#64748b',
            tabBarLabelStyle: styles.label,
            tabBarItemStyle: tab?.hidden ? { display: 'none' } : undefined,
            tabBarButton: tab?.hidden ? () => null : undefined,
            tabBarIcon: ({ focused, color }) => (
              <View style={[styles.wrap, focused && styles.active]}>
                <Ionicons
                  name={focused ? (tab?.iconActive ?? tab?.icon ?? 'home') : (tab?.icon ?? 'home')}
                  size={22}
                  color={color}
                />
              </View>
            ),
          };
        }}
      >
        {TABS.map(t => (
          <Tab.Screen key={t.name} name={t.name} component={t.component} />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#080f1e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 6,
    elevation: 0,
    shadowOpacity: 0,
  },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2, marginTop: 2 },
  wrap:  { width: 44, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: 'rgba(56,189,248,0.12)' },
});
