import React from 'react';
import { useSocket } from '../../hooks/useSocket';
import { SensorCard } from '../molecules/SensorCard';
import { Activity } from 'lucide-react';

/**
 * Organism: Displays real-time sensor readings from the smart aquarium.
 * Automatically updates via useSocket.
 */
export const LiveTelemetry: React.FC = () => {
  const { telemetry, connected } = useSocket();

  // Mapping based on "CORRECTIONS" from user regarding field names
  const sensors = [
    { label: 'pH Level', value: telemetry?.pH ?? 7.0, unit: 'pH', min: 0, max: 14, type: 'pH' },
    { label: 'Temperature', value: telemetry?.temp_c ?? 25.0, unit: '°C', min: 20, max: 35, type: 'temp_c' },
    { label: 'Dissolved Oxygen', value: telemetry?.do_mg_l ?? 7.5, unit: 'mg/L', min: 0, max: 12, type: 'do_mg_l' },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className={`w-5 h-5 ${connected ? 'text-green-400' : 'text-red-400'}`} />
          Live Telemetry
        </h2>
        <span className="text-xs opacity-50">{connected ? 'Streaming JSON' : 'Offline'}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sensors.map(s => (
          <SensorCard 
            key={s.label}
            label={s.label}
            value={s.value}
            unit={s.unit}
            status={telemetry?.status ?? 'ok'}
            min={s.min}
            max={s.max}
          />
        ))}
      </div>
    </section>
  );
};
