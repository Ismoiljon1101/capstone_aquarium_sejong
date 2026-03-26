import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Fish, Wifi, WifiOff, ChevronRight } from 'lucide-react-native';
import { fetchStatus } from '../../services/api';

/**
 * Aquaman Home Screen
 * @returns Home screen with branding and backend status
 */
export default function HomeScreen() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getStatus = async () => {
      const data = await fetchStatus();
      setStatus(data);
      setLoading(false);
    };
    getStatus();
  }, []);

  return (
    <View className="flex-1 bg-slate-50 p-6 pt-16">
      <View className="items-center mb-10">
        <View className="bg-blue-600 p-4 rounded-2xl mb-4 shadow-lg">
          <Fish size={40} color="white" />
        </View>
        <Text className="text-4xl font-bold text-slate-900 tracking-tight">Aquaman</Text>
        <Text className="text-sm font-medium text-slate-500 uppercase tracking-widest mt-1">
          Fish health monitoring system
        </Text>
      </View>

      <TouchableOpacity 
        onPress={() => router.push('/details')}
        className="bg-white p-5 rounded-3xl mb-6 shadow-sm border border-slate-100 flex-row items-center justify-between"
      >
        <View className="flex-row items-center">
          <View className="bg-blue-100 p-3 rounded-2xl mr-4">
            <Fish size={24} color="#2563eb" />
          </View>
          <View>
            <Text className="text-slate-900 font-bold">Tank A-12</Text>
            <Text className="text-slate-500 text-sm">Active Monitoring</Text>
          </View>
        </View>
        <ChevronRight size={20} color="#94a3b8" />
      </TouchableOpacity>

      <View className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-slate-800">System Status</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : status ? (
            <View className="flex-row items-center bg-green-100 px-3 py-1 rounded-full">
              <Wifi size={16} color="#16a34a" className="mr-1" />
              <Text className="text-green-700 font-medium text-xs">Connected</Text>
            </View>
          ) : (
            <View className="flex-row items-center bg-red-100 px-3 py-1 rounded-full">
              <WifiOff size={16} color="#dc2626" className="mr-1" />
              <Text className="text-red-700 font-medium text-xs">Offline</Text>
            </View>
          )}
        </View>

        {status && (
          <View className="space-y-2">
            <Text className="text-slate-500 text-sm">Server: {status.project}</Text>
            <Text className="text-slate-500 text-sm">Version: {status.version}</Text>
            <Text className="text-slate-400 text-xs mt-2 italic">
              Last synced: {new Date(status.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
