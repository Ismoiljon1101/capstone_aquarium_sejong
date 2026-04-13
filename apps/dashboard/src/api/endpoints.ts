/**
 * ENDPOINTS — single source of truth for all backend API URLs.
 * Mirrors api-contracts.md exactly.
 * Import this instead of hardcoding URLs in components.
 */

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';

export const ENDPOINTS = {
  sensors: {
    latest:   `${BASE}/sensors/latest`,
    readings: (id: number, range: string) => `${BASE}/sensors/${id}/readings?range=${range}`,
  },
  actuators: {
    feed:      `${BASE}/actuators/feed`,
    pump:      `${BASE}/actuators/pump`,
    led:       `${BASE}/actuators/led`,
    emergency: `${BASE}/actuators/emergency-off`,
    state:     `${BASE}/actuators/state`,
  },
  alerts: {
    active:      `${BASE}/alerts/active`,
    acknowledge: (id: number) => `${BASE}/alerts/${id}/acknowledge`,
  },
  fish: {
    count:   `${BASE}/fish/count`,
    growth:  `${BASE}/fish/growth`,
    health:  `${BASE}/fish/health`,
    history: `${BASE}/fish/health/history`,
  },
  vision:  { analyze: `${BASE}/vision/analyze` },
  voice:   { query:   `${BASE}/voice/query` },
} as const;
