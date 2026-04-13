import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ControlsScreen from '../screens/ControlsScreen';
import FishHealthScreen from '../screens/FishHealthScreen';
import HistoryScreen from '../screens/HistoryScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Dashboard', icon: '\uD83C\uDFE0', component: DashboardScreen },
  { name: 'Alerts',    icon: '\uD83D\uDD14', component: AlertsScreen },
  { name: 'Controls',  icon: '\u26A1',       component: ControlsScreen },
  { name: 'Fish AI',   icon: '\uD83D\uDC1F', component: FishHealthScreen },
  { name: 'History',   icon: '\uD83D\uDCC8', component: HistoryScreen },
];

function TabBarIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={[iconStyles.wrap, focused && iconStyles.active]}>
      <Text style={[iconStyles.icon, focused && iconStyles.iconActive]}>{icon}</Text>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  wrap: {
    width: 40,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    backgroundColor: 'rgba(56,189,248,0.12)',
  },
  icon: { fontSize: 18, opacity: 0.6 },
  iconActive: { opacity: 1 },
});

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
            tabBarIcon: ({ focused }) => <TabBarIcon icon={tab?.icon ?? ''} focused={focused} />,
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
    backgroundColor: '#0a1628',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    height: Platform.OS === 'web' ? 68 : 80,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'web' ? 10 : 24,
    elevation: 0,
    shadowOpacity: 0,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginTop: 2,
  },
});
