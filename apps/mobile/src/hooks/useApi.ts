import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * useApi — all REST calls to NestJS backend.
 * Covers sensors, actuators, alerts, fish endpoints.
 */
export function useApi() {
  /** GET /sensors/latest */
  const getLatestReadings = async () => {
    const res = await axios.get(`${API_BASE}/sensors/latest`);
    return res.data;
  };

  /** GET /sensors/:id/readings?range=24h|1w|1m */
  const getSensorHistory = async (id: number, range: '24h' | '1w' | '1m') => {
    const res = await axios.get(`${API_BASE}/sensors/${id}/readings?range=${range}`);
    return res.data;
  };

  /** POST /actuators/feed */
  const triggerFeed = async () => {
    const res = await axios.post(`${API_BASE}/actuators/feed`);
    return res.data;
  };

  /** POST /actuators/pump */
  const triggerPump = async (state: boolean) => {
    const res = await axios.post(`${API_BASE}/actuators/pump`, { state });
    return res.data;
  };

  /** POST /actuators/led */
  const toggleLed = async (state: boolean) => {
    const res = await axios.post(`${API_BASE}/actuators/led`, { state });
    return res.data;
  };

  /** GET /alerts/active */
  const getAlerts = async () => {
    const res = await axios.get(`${API_BASE}/alerts/active`);
    return res.data;
  };

  /** PATCH /alerts/:id/acknowledge */
  const acknowledgeAlert = async (id: number) => {
    const res = await axios.patch(`${API_BASE}/alerts/${id}/acknowledge`);
    return res.data;
  };

  /** GET /fish/health */
  const getFishHealth = async () => {
    const res = await axios.get(`${API_BASE}/fish/health`);
    return res.data;
  };

  /** GET /fish/count */
  const getFishCount = async () => {
    const res = await axios.get(`${API_BASE}/fish/count`);
    return res.data;
  };

  return {
    getLatestReadings,
    getSensorHistory,
    triggerFeed,
    triggerPump,
    toggleLed,
    getAlerts,
    acknowledgeAlert,
    getFishHealth,
    getFishCount,
  };
}
