"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

/**
 * Custom hook for real-time Socket.IO communication.
 * Listens to telemetry, alerts, fish counting, and actuator events.
 */
export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [alert, setAlert] = useState<any>(null);
  const [fishData, setFishData] = useState<any>(null);
  const [serialStatus, setSerialStatus] = useState<any>(null);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // Support both legacy and new names
    socket.on("telemetry", (data) => setTelemetry(data));
    socket.on("telemetry:update", (data) => setTelemetry(data));
    socket.on("sensor:update", (data) => setTelemetry(data));
    
    socket.on("alert:new", (data) => setAlert(data));
    socket.on("fish:count", (data) => setFishData((prev: any) => ({ ...prev, count: data })));
    socket.on("health:report", (data) => setFishData((prev: any) => ({ ...prev, health: data })));
    
    socket.on("serial:status", (data) => setSerialStatus(data));
    socket.on("feeder:event", (data) => console.log("[feeder:event]", data));

    return () => {
      socket.disconnect();
    };
  }, []);

  return { 
    connected, 
    telemetry, 
    alert, 
    fishData, 
    serialStatus 
  };
}
