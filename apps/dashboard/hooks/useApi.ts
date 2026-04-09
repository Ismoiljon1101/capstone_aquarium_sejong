"use client";

import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Custom hook for REST API interactions.
 * Handles feeding, scheduling, and sensor history.
 */
export function useApi() {
  const triggerFeed = async (duration: number = 3) => {
    return await axios.post(`${API_BASE}/feed`, { duration });
  };

  const setSchedule = async (schedule: any) => {
    return await axios.post(`${API_BASE}/schedule`, schedule);
  };

  const getHistory = async (range: string = "24h") => {
    const res = await axios.get(`${API_BASE}/history?range=${range}`);
    return res.data;
  };

  const getStatus = async () => {
    const res = await axios.get(`${API_BASE}/status`);
    return res.data;
  };

  const getLatest = async () => {
    const res = await axios.get(`${API_BASE}/latest`);
    return res.data;
  };

  const triggerActuator = async (actuatorId: number, type: string, state: boolean) => {
    return await axios.post(`${API_BASE}/actuators/state`, { actuatorId, type, state });
  };

  return {
    triggerFeed,
    setSchedule,
    getHistory,
    getStatus,
    getLatest,
    triggerActuator
  };
}
