import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ControlsScreen from '../screens/ControlsScreen';
import FishHealthScreen from '../screens/FishHealthScreen';
import HistoryScreen from '../screens/HistoryScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Dashboard', icon: '\uD83C\uDFE0', label: 'Home',     component: DashboardScreen },
  { name: 'Alerts',    icon: '\uD83D\uDD14', label: 'Alerts',   component: AlertsScreen },
  { name: 'Controls',  icon: '\u26A1',       label: 'Controls', component: ControlsScreen },
  { name: 'Fish',      icon: '\uD83D\uDC1F', label: 'Fish AI',  component: FishHealthScreen },
  { name: 'History',   icon: '\uD83D\uDCC8', label: 'History',  component: HistoryScreen },
];

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={[tabStyles.wrap, focused && tabStyles.wrapActive]}>
      <Text style={tabStyles.icon}>{icon}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrap: { width: 40, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  wrapActive: { backgroundColor: 'rgba(59,130,246,0.15)' },
  icon: { fontSize: 18 },
});

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => {
          const tab = TABS.find(t => t.name === route.name);
          return {
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: '#3b82f6',
            tabBarInactiveTintColor: '#64748b',
            tabBarLabelStyle: styles.tabLabel,
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={tab?.icon ?? ''} label={tab?.label ?? ''} focused={focused} />
            ),
          };
        }}
      >
        {TABS.map(t => (
          <Tab.Screen
            key={t.name}
            name={t.name}
            component={t.component}
            options={{ tabBarLabel: t.label }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0a1628',
    borderTopColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
});
