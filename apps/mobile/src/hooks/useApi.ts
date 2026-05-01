import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Auto-detect LAN host so a physical phone can reach the dev backend.
// Priority: EXPO_PUBLIC_API_URL → expoConfig hostUri (Expo dev) → localhost
function resolveBase(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ??
    (Constants.manifest2 as any)?.extra?.expoClient?.hostUri ??
    (Constants as any).manifest?.debuggerHost;
  if (hostUri && Platform.OS !== 'web') {
    const host = String(hostUri).split(':')[0];
    if (host && host !== 'localhost') return `http://${host}:3000`;
  }
  return 'http://localhost:3000';
}

export const API_BASE = resolveBase();
const api = axios.create({ baseURL: API_BASE, timeout: 8000 });

export function useApi() {
  return {
    getLatest:          () => api.get('/sensors/latest'),
    getSensorHistory:   (id: number, range: string) => api.get(`/sensors/${id}/readings?range=${range}`),
    getAllSensorHistory: (range: string) => api.get(`/sensors/history?range=${range}`),
    getActiveAlerts:    () => api.get('/alerts/active'),
    acknowledgeAlert:   (id: number) => api.patch(`/alerts/${id}/acknowledge`),
    triggerFeed:        () => api.post('/actuators/feed'),
    togglePump:         (body: { state: boolean }) => api.post('/actuators/pump', body),
    toggleLed:          (body: { state: boolean }) => api.post('/actuators/led', body),
    getActuatorState:   () => api.get('/actuators/state'),
    getFishHealth:      () => api.get('/fish/health'),
    getFishCount:       () => api.get('/fish/count'),
    voiceQuery:         (text: string) => api.post('/voice/query', { text }, { timeout: 60000 }),
    agentQuery:         (text: string, sessionId?: string, signal?: AbortSignal) =>
                          api.post('/voice/agent', { text, sessionId }, { timeout: 90000, signal }),
    agentConfirm:       (tool: string, args: Record<string, unknown>, sessionId?: string) =>
                          api.post('/voice/agent/confirm', { tool, args, sessionId }),
    newChatSession:     () => api.post('/voice/sessions/new'),
    getSessionMessages: (id: string) => api.get(`/voice/sessions/${id}/messages`),
    deleteSession:      (id: string) => api.delete(`/voice/sessions/${id}`),
    listChatSessions:   () => api.get('/voice/chat-sessions'),

    // ── Management ──
    getFeedSchedules:   () => api.get('/management/feed-schedules'),
    createFeedSchedule: (body: { time: string; daysMask?: number; portionSec?: number; enabled?: boolean }) =>
                          api.post('/management/feed-schedules', body),
    updateFeedSchedule: (id: number, body: any) => api.patch(`/management/feed-schedules/${id}`, body),
    deleteFeedSchedule: (id: number) => api.delete(`/management/feed-schedules/${id}`),

    getLightSchedule:   () => api.get('/management/light-schedule'),
    updateLightSchedule:(body: any) => api.patch('/management/light-schedule', body),

    getTankConfig:      () => api.get('/management/tank-config'),
    updateTankConfig:   (body: any) => api.patch('/management/tank-config', body),
    markTankCleaned:    () => api.post('/management/tank-config/mark-cleaned'),
  };
}
