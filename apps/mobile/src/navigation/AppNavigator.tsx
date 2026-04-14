import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';

import DashboardScreen from '../screens/DashboardScreen';
import AlertsScreen    from '../screens/AlertsScreen';
import ControlsScreen  from '../screens/ControlsScreen';
import FishHealthScreen from '../screens/FishHealthScreen';
import SettingsScreen  from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Dashboard', icon: '🏠', component: DashboardScreen },
  { name: 'Alerts',    icon: '🔔', component: AlertsScreen },
  { name: 'Controls',  icon: '⚡', component: ControlsScreen },
  { name: 'Fish AI',   icon: '🐟', component: FishHealthScreen },
  { name: 'Settings',  icon: '⚙️', component: SettingsScreen },
];

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={[styles.wrap, focused && styles.active]}>
      <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
    </View>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => {
          const tab = TABS.find(t => t.name === route.name);
          return {
            headerShown: false,
            tabBarStyle: styles.bar,
            tabBarActiveTintColor: '#38bdf8',
            tabBarInactiveTintColor: '#475569',
            tabBarLabelStyle: styles.label,
            tabBarIcon: ({ focused }) => <TabIcon icon={tab?.icon ?? ''} focused={focused} />,
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
    height: Platform.OS === 'web' ? 68 : 82,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'web' ? 10 : 26,
    elevation: 0,
    shadowOpacity: 0,
  },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2, marginTop: 2 },
  wrap:  { width: 40, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: 'rgba(56,189,248,0.12)' },
});
