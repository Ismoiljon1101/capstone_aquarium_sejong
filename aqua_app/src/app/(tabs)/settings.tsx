import React from 'react';
import { Text, View } from 'react-native';
import { Settings } from 'lucide-react-native';

/**
 * Settings Screen
 * @returns Settings placeholder
 */
export default function SettingsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 p-6">
      <Settings size={48} color="#94a3b8" />
      <Text className="text-xl font-semibold text-slate-800 mt-4">Settings</Text>
      <Text className="text-slate-500 text-center mt-2">
        Manage your preferences, thresholds, and notifications.
      </Text>
    </View>
  );
}
