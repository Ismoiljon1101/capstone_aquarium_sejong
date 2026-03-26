import React from 'react';
import { Text, View, FlatList } from 'react-native';
import { Bell, AlertTriangle } from 'lucide-react-native';

const MOCK_ALERTS = [
  { id: '1', title: 'Anomaly Detected', message: 'Water temperature exceeded 28°C', time: '10m ago', type: 'warning' },
  { id: '2', title: 'Feeding Scheduled', message: 'Automatic feeder triggered successfully', time: '1h ago', type: 'info' },
];

/**
 * Alerts Screen
 * @returns AI Notification center placeholder
 */
export default function AlertsScreen() {
  return (
    <View className="flex-1 bg-slate-50 p-6 pt-16">
      <View className="flex-row items-center mb-6">
        <Bell size={28} color="#1e293b" strokeWidth={2.5} />
        <Text className="text-2xl font-bold text-slate-900 ml-3">AI Notifications</Text>
      </View>

      <FlatList
        data={MOCK_ALERTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-slate-100 flex-row items-start">
            <View className="bg-amber-100 p-2 rounded-full mr-4">
              <AlertTriangle size={20} color="#d97706" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 font-semibold">{item.title}</Text>
              <Text className="text-slate-500 text-sm mt-1">{item.message}</Text>
              <Text className="text-slate-400 text-xs mt-2 italic">{item.time}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
