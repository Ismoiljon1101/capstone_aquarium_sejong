import React from 'react';
import { Text, View } from 'react-native';
import { Activity } from 'lucide-react-native';

/**
 * Actions Screen
 * @returns Actions placeholder
 */
export default function ActionsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 p-6">
      <Activity size={48} color="#94a3b8" />
      <Text className="text-xl font-semibold text-slate-800 mt-4">Actions</Text>
      <Text className="text-slate-500 text-center mt-2">
        Trigger manual adjustments or automated health responses.
      </Text>
    </View>
  );
}
