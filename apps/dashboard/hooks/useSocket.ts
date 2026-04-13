"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// Backend emits: sensor:update, alert:new, fish:count, health:report, actuator:state
const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000";

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [fishData, setFishData] = useState<any>(null);
  const [actuatorState, setActuatorState] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("sensor:update", (d) => setTelemetry(d));
    socket.on("telemetry", (d) => setTelemetry(d));
    socket.on("telemetry:update", (d) => setTelemetry(d));

    socket.on("alert:new", (d) => setAlerts((p) => [d, ...p].slice(0, 20)));

    socket.on("fish:count", (d) =>
      setFishData((p: any) => ({ ...p, count: d }))
    );
    socket.on("health:report", (d) =>
      setFishData((p: any) => ({ ...p, health: d }))
    );

    socket.on("actuator:state", (d) => setActuatorState(d));

    return () => { socket.disconnect(); };
  }, []);

  const dismissAlert = (alertId: string) =>
    setAlerts((p) => p.filter((a) => a.alertId !== alertId));

  const clearAlerts = () => setAlerts([]);

  // Legacy single-alert compat
  const alert = alerts[0] ?? null;

  return {
    connected,
    telemetry,
    alert,
    alerts,
    fishData,
    actuatorState,
    dismissAlert,
    clearAlerts,
  };
}
