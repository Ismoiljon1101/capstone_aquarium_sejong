import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
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
    agentQuery:         (text: string, sessionId?: string) => api.post('/voice/agent', { text, sessionId }, { timeout: 90000 }),
    agentConfirm:       (tool: string, args: Record<string, unknown>) => api.post('/voice/agent/confirm', { tool, args }),
    newChatSession:     () => api.post('/voice/sessions/new'),
    getSessionMessages: (id: string) => api.get(`/voice/sessions/${id}/messages`),
    deleteSession:      (id: string) => api.delete(`/voice/sessions/${id}`),
    getVoiceSessions:   () => api.get('/voice/sessions'),
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
