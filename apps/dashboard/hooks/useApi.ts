"use client";

import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

/**
 * Custom hook for REST API interactions with NestJS backend.
 * Matches the endpoints defined in services/backend.
 */
export function useApi() {
  // Sensors
  const getLatest = () => api.get('/sensors/latest');
  const getSensorHistory = (id: number, range: string) => api.get(`/sensors/${id}/readings?range=${range}`);

  // Actuators
  const triggerFeed = (duration: number = 3) => api.post('/actuators/feed', { duration });
  const togglePump = (state?: boolean) => api.post('/actuators/pump', { state });
  const toggleLed = (state?: boolean) => api.post('/actuators/led', { state });
  const getActuatorState = () => api.get('/actuators/state');

  // Alerts
  const getActiveAlerts = () => api.get('/alerts/active');
  const getAlerts = () => api.get('/alerts');
  const acknowledgeAlert = (id: string | number) => api.patch(`/alerts/${id}/acknowledge`);

  // Fish
  const getFishCount = () => api.get('/fish/count');
  const getFishHealth = () => api.get('/fish/health');
  const getFishGrowth = () => api.get('/fish/growth');
  const getFishHealthHistory = () => api.get('/fish/health/history');

  // Vision
  const triggerVisionAnalysis = () => api.post('/vision/analyze');
  const getLatestVisionReport = () => api.get('/vision/latest-report');

  // Voice
  const sendVoiceQuery = (text: string, snapshotId?: number) =>
    api.post('/voice/query', { text, snapshotId });

  // Legacy compat
  const getHistory = async (range: string = "24h") => {
    const res = await api.get(`/sensors/0/readings?range=${range}`);
    return res.data;
  };
  const getStatus = () => api.get('/sensors/latest');

  return {
    getLatest,
    getSensorHistory,
    triggerFeed,
    togglePump,
    toggleLed,
    getActuatorState,
    getActiveAlerts,
    getAlerts,
    acknowledgeAlert,
    getFishCount,
    getFishHealth,
    getFishGrowth,
    getFishHealthHistory,
    triggerVisionAnalysis,
    getLatestVisionReport,
    sendVoiceQuery,
    getHistory,
    getStatus,
  };
}
