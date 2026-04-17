import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'http://localhost:3000';

export type SensorReading = {
  sensorId?: number;
  type?: string;
  value?: number;
  unit?: string;
  status?: 'ok' | 'warn' | 'critical';
  timestamp: string;
  pH?: number;
  temp_c?: number;
  do_mg_l?: number;
};

export type AlertPayload = {
  id?: number;
  alertId?: number;
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
  createdAt?: string;
  timestamp?: string;
};

let socket: Socket | null = null;

function getSocket() {
  if (!socket) {
    socket = io(WS_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      timeout: 10000,
      autoConnect: true,
    });
  }

  return socket;
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [telemetry, setTelemetry] = useState<SensorReading | null>(null);
  const [latestAlert, setLatestAlert] = useState<AlertPayload | null>(null);
  const [fishCount, setFishCount] = useState<FishCountPayload | null>(null);
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);

  useEffect(() => {
    const client = getSocket();

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleSensorUpdate = (data: SensorReading) => setTelemetry(data);
    const handleAlert = (data: AlertPayload) => setLatestAlert(data);
    const handleFishCount = (data: FishCountPayload) => setFishCount(data);
    const handleHealthReport = (data: HealthReport) => setHealthReport(data);

    setConnected(client.connected);
    client.on('connect', handleConnect);
    client.on('disconnect', handleDisconnect);
    client.on('sensor:update', handleSensorUpdate);
    client.on('alert:new', handleAlert);
    client.on('fish:count', handleFishCount);
    client.on('health:report', handleHealthReport);

    return () => {
      client.off('connect', handleConnect);
      client.off('disconnect', handleDisconnect);
      client.off('sensor:update', handleSensorUpdate);
      client.off('alert:new', handleAlert);
      client.off('fish:count', handleFishCount);
      client.off('health:report', handleHealthReport);
    };
  }, []);

  const on = <T>(event: string, handler: (payload: T) => void) => {
    const client = getSocket();
    client.on(event, handler as (...args: unknown[]) => void);

    return () => {
      client.off(event, handler as (...args: unknown[]) => void);
    };
  };

  return { connected, telemetry, latestAlert, fishCount, healthReport, on, socket: getSocket() };
}
