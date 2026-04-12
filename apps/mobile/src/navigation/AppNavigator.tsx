import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ControlsScreen from '../screens/ControlsScreen';
import FishHealthScreen from '../screens/FishHealthScreen';
import HistoryScreen from '../screens/HistoryScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Dashboard: '\uD83C\uDFE0',
  Alerts: '\uD83D\uDD14',
  Controls: '\u2699\uFE0F',
  Fish: '\u2764\uFE0F',
  History: '\uD83D\uDCC8',
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#64748b',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>
              {TAB_ICONS[route.name] ?? ''}
            </Text>
          ),
          tabBarLabelStyle: styles.tabLabel,
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Alerts" component={AlertsScreen} />
        <Tab.Screen name="Controls" component={ControlsScreen} />
        <Tab.Screen name="Fish" component={FishHealthScreen} options={{ title: 'Fish Health' }} />
        <Tab.Screen name="History" component={HistoryScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0f172a',
    borderTopColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 1,
    paddingTop: 4,
    height: 60,
  },
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
