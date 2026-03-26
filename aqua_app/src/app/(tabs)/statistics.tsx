import React from 'react';
import { Text, View } from 'react-native';
import { BarChart2 } from 'lucide-react-native';

/**
 * Statistics Screen
 * @returns Statistics placeholder
 */
export default function StatisticsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 p-6">
      <BarChart2 size={48} color="#94a3b8" />
      <Text className="text-xl font-semibold text-slate-800 mt-4">Statistics</Text>
      <Text className="text-slate-500 text-center mt-2">
        Monitoring historical health data and trends.
      </Text>
    </View>
  );
}
