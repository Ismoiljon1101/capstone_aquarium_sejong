import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const api = axios.create({ baseURL: API_BASE, timeout: 8000 });

export function useApi() {
  return {
    getLatest:          () => api.get('/sensors/latest'),
    getSensorHistory:   (id: number, range: string) => api.get(`/sensors/${id}/readings?range=${range}`),
    getActiveAlerts:    () => api.get('/alerts/active'),
    acknowledgeAlert:   (id: number) => api.patch(`/alerts/${id}/acknowledge`),
    triggerFeed:        () => api.post('/actuators/feed'),
    togglePump:         () => api.post('/actuators/pump'),
    toggleLed:          () => api.post('/actuators/led'),
    getActuatorState:   () => api.get('/actuators/state'),
    getFishHealth:      () => api.get('/fish/health'),
    getFishCount:       () => api.get('/fish/count'),
    voiceQuery:         (text: string) => api.post('/voice/query', { text }),
    getVoiceSessions:   () => api.get('/voice/sessions'),
  };
}
