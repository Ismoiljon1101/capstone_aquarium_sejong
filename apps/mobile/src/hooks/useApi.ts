import axios from 'axios';

const API_BASE = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export function useApi() {
  const triggerFeed = () => api.post('/actuators/feed');
  const togglePump = () => api.post('/actuators/pump');
  const toggleLed = () => api.post('/actuators/led');
  const getActuatorState = () => api.get('/actuators/state');
  const getLatest = () => api.get('/sensors/latest');
  const getActiveAlerts = () => api.get('/alerts/active');
  const acknowledgeAlert = (id: string) => api.patch(`/alerts/${id}/acknowledge`);
  const getFishCount = () => api.get('/fish/count');
  const getFishHealth = () => api.get('/fish/health');
  const voiceQuery = (text: string) => api.post('/voice/query', { text });
  const getVoiceSessions = () => api.get('/voice/sessions');

  return {
    triggerFeed,
    togglePump,
    toggleLed,
    getActuatorState,
    getLatest,
    getActiveAlerts,
    acknowledgeAlert,
    getFishCount,
    getFishHealth,
    voiceQuery,
    getVoiceSessions,
  };
}
