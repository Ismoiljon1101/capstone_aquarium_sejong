import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';
import { useApi } from './useApi';

export interface SensorReading {
  value: number;
  unit: string;
  status: 'ok' | 'warn' | 'critical';
}

export type SensorMap = Record<string, SensorReading>;

export function useSensors(): SensorMap {
  const { on } = useSocket();
  const api = useApi();
  const [sensors, setSensors] = useState<SensorMap>({});

  // Load snapshot from REST on mount
  useEffect(() => {
    api.getLatest()
      .then(r => {
        const rows: any[] = Array.isArray(r.data) ? r.data : [];
        setSensors(prev => {
          const next = { ...prev };
          rows.forEach((s: any) => {
            if (s.type && s.value != null) {
              next[s.type] = { value: Number(s.value), unit: s.unit ?? '', status: s.status ?? 'ok' };
            }
          });
          return next;
        });
      })
      .catch(() => null);
  }, []);

  // Live updates via socket
  useEffect(() => {
    return on('sensor:update', (d: any) => {
      if (d?.type) {
        setSensors(prev => ({
          ...prev,
          [d.type]: { value: Number(d.value), unit: d.unit ?? '', status: d.status ?? 'ok' },
        }));
      }
    });
  }, [on]);

  return sensors;
}

/** Build a short context string for Veronica */
export function sensorContext(sensors: SensorMap, fishCount?: number): string {
  const f = (k: string, dec = 1) => sensors[k]?.value?.toFixed(dec) ?? '–';
  const st = (k: string) => sensors[k]?.status ?? 'ok';
  return [
    `Tank readings: pH ${f('pH')} (${st('pH')})`,
    `temp ${f('temp_c')}°C (${st('temp_c')})`,
    `dissolved O₂ ${f('do_mg_l')} mg/L (${st('do_mg_l')})`,
    `CO₂ ${f('CO2')} ppm (${st('CO2')})`,
    fishCount != null ? `fish count ${fishCount}` : '',
  ].filter(Boolean).join(', ') + '.';
}
