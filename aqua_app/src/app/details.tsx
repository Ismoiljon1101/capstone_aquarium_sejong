import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { router, Stack } from 'expo-router';
import { ChevronLeft, Info, Thermometer, Droplets } from 'lucide-react-native';

/**
 * Details Screen
 * @returns Specific tank/fish details view
 */
export default function DetailsScreen() {
  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      
      <View className="p-6 pt-16 bg-blue-600 rounded-b-[40px] shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <ChevronLeft size={28} color="white" />
        </TouchableOpacity>
        
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-3xl font-bold">Tank A-12</Text>
            <Text className="text-blue-100 font-medium">Tropical Environment</Text>
          </View>
          <View className="bg-white/20 p-4 rounded-3xl">
            <Info size={32} color="white" />
          </View>
        </View>
      </View>

      <View className="p-6 space-y-6">
        <Text className="text-xl font-bold text-slate-900">Live Statistics</Text>
        
        <View className="flex-row items-center bg-slate-50 p-5 rounded-3xl border border-slate-100">
          <Thermometer size={24} color="#ef4444" />
          <View className="ml-4">
            <Text className="text-slate-500 text-sm">Temperature</Text>
            <Text className="text-slate-900 font-bold text-lg">24.5 °C</Text>
          </View>
        </View>

        <View className="flex-row items-center bg-slate-50 p-5 rounded-3xl border border-slate-100">
          <Droplets size={24} color="#3b82f6" />
          <View className="ml-4">
            <Text className="text-slate-500 text-sm">Water Quality</Text>
            <Text className="text-slate-900 font-bold text-lg">98% Pure</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
