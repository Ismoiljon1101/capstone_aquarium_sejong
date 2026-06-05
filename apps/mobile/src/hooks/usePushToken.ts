import { useEffect } from "react";
import { Platform } from "react-native";
import { getApiBase } from "../lib/runtime-config";

/** Push token registration — silently no-ops on Expo Go and web. */
export function usePushToken() {
  useEffect(() => {
    if (Platform.OS === "web") return;
    registerToken();
  }, []);
}

async function registerToken() {
  try {
    const { default: Notifications } = await import("expo-notifications");

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    if (!token) return;

    await fetch(`${getApiBase()}/management/tank-config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pushToken: token }),
    });
  } catch {
    // silently fail — push is non-critical
  }
}
