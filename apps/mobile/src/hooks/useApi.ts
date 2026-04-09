import axios from 'axios';

const API_BASE = "http://localhost:3001";

/**
 * React Native API Hook (Mobile Parity)
 */
export function useApi() {
  const triggerFeed = async () => axios.post(`${API_BASE}/feed`);
  const getLatest = async () => axios.get(`${API_BASE}/latest`);

  return { triggerFeed, getLatest };
}
