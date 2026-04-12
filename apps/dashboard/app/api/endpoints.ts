/**
 * Single source of truth for all API URLs.
 * All components and hooks should import from here.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const API = {
  // Sensors
  sensors: {
    list: `${BASE}/sensors`,
    latest: `${BASE}/sensors/latest`,
    readings: (id: number, range: string) => `${BASE}/sensors/${id}/readings?range=${range}`,
  },

  // Actuators
  actuators: {
    feed: `${BASE}/actuators/feed`,
    pump: `${BASE}/actuators/pump`,
    led: `${BASE}/actuators/led`,
    state: `${BASE}/actuators/state`,
  },

  // Alerts
  alerts: {
    list: `${BASE}/alerts`,
    active: `${BASE}/alerts/active`,
    acknowledge: (id: number) => `${BASE}/alerts/${id}/acknowledge`,
  },

  // Fish
  fish: {
    count: `${BASE}/fish/count`,
    growth: `${BASE}/fish/growth`,
    health: `${BASE}/fish/health`,
    healthHistory: `${BASE}/fish/health/history`,
  },

  // Vision
  vision: {
    analyze: `${BASE}/vision/analyze`,
    latestReport: `${BASE}/vision/latest-report`,
  },

  // Voice
  voice: {
    query: `${BASE}/voice/query`,
    sessions: `${BASE}/voice/sessions`,
  },
} as const;
