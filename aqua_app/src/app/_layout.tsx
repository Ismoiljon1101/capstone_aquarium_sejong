import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

/**
 * Root Layout
 * @returns Root layout with Safe Area and Status Bar
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Slot />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
