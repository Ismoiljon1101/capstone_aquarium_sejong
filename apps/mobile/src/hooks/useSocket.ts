import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'http://localhost:3000';

export type SensorReading = {
  pH: number;
  temp_c: number;
  do_mg_l: number;
  timestamp: string;
};

export type AlertPayload = {
  id: number;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: string;
};

export type FishCountPayload = {
  count: number;
  timestamp: string;
};

export type HealthReport = {
  phStatus: 'ok' | 'warn' | 'critical';
  tempStatus: 'ok' | 'warn' | 'critical';
  doStatus: 'ok' | 'warn' | 'critical';
  overallScore: number;
  createdAt: string;
};

/**
 * useSocket — connects to NestJS Socket.IO gateway.
 * Listens for all 4 real-time events and exposes typed state.
 */
export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [telemetry, setTelemetry] = useState<SensorReading | null>(null);
  const [latestAlert, setLatestAlert] = useState<AlertPayload | null>(null);
  const [fishCount, setFishCount] = useState<FishCountPayload | null>(null);
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);

  useEffect(() => {
    const socket: Socket = io(WS_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('sensor:update', (data: SensorReading) => setTelemetry(data));
    socket.on('alert:new', (data: AlertPayload) => setLatestAlert(data));
    socket.on('fish:count', (data: FishCountPayload) => setFishCount(data));
    socket.on('health:report', (data: HealthReport) => setHealthReport(data));

    return () => { socket.disconnect(); };
  }, []);

  return { connected, telemetry, latestAlert, fishCount, healthReport };
}
