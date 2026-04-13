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
  const [sensorData, setSensorData] = useState<any>(null);
  const [latestAlert, setLatestAlert] = useState<any>(null);
  const [fishCount, setFishCount] = useState<any>(null);
  const [healthReport, setHealthReport] = useState<any>(null);
  const [actuatorState, setActuatorState] = useState<any>(null);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on('sensor:update',  (data) => setSensorData(data));
    socket.on('alert:new',      (data) => setLatestAlert(data));
    socket.on('fish:count',     (data) => setFishCount(data));
    socket.on('health:report',  (data) => setHealthReport(data));
    socket.on('actuator:state', (data) => setActuatorState(data));

    return () => {
      socket.disconnect();
    };
  }, []);

  return { 
    connected,
    sensorData, 
    latestAlert, 
    fishCount, 
    healthReport, 
    actuatorState 
  };
}
