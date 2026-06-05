import { useCallback, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getApiBase, subscribeApiBase } from '../lib/runtime-config';
import { replacePort } from './useApi';

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
  overallScore?: number;
  createdAt?: string;
  timestamp?: string;
};

let socket: Socket | null = null;
let socketUrl = '';

function resolveSocketUrl() {
  return process.env.EXPO_PUBLIC_WS_URL ?? replacePort(getApiBase(), 3000);
}

function getSocket(forceReconnect = false) {
  const nextUrl = resolveSocketUrl();

  if (!socket || forceReconnect || socketUrl !== nextUrl) {
    socket?.removeAllListeners();
    socket?.disconnect();
    socketUrl = nextUrl;
    socket = io(nextUrl, {
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
    let client = getSocket();

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleSensorUpdate = (data: SensorReading) => setTelemetry(data);
    const handleAlert = (data: AlertPayload) => setLatestAlert(data);
    const handleFishCount = (data: FishCountPayload) => setFishCount(data);
    const handleHealthReport = (data: HealthReport) => setHealthReport(data);

    const bind = (current: Socket) => {
      setConnected(current.connected);
      current.on('connect', handleConnect);
      current.on('disconnect', handleDisconnect);
      current.on('sensor:update', handleSensorUpdate);
      current.on('alert:new', handleAlert);
      current.on('fish:count', handleFishCount);
      current.on('health:report', handleHealthReport);
    };

    const unbind = (current: Socket) => {
      current.off('connect', handleConnect);
      current.off('disconnect', handleDisconnect);
      current.off('sensor:update', handleSensorUpdate);
      current.off('alert:new', handleAlert);
      current.off('fish:count', handleFishCount);
      current.off('health:report', handleHealthReport);
    };

    bind(client);

    const unsubscribe = subscribeApiBase(() => {
      unbind(client);
      client = getSocket(true);
      bind(client);
    });

    return () => {
      unsubscribe();
      unbind(client);
    };
  }, []);

  const on = useCallback(<T>(event: string, handler: (payload: T) => void) => {
    const client = getSocket();
    client.on(event, handler as (...args: unknown[]) => void);
    return () => { client.off(event, handler as (...args: unknown[]) => void); };
  }, []);

  return { connected, telemetry, latestAlert, fishCount, healthReport, on, socket: getSocket() };
}
