import React from 'react';
import { GaugeRing } from '../atoms/GaugeRing';
import { SensorValue } from '../atoms/SensorValue';
import { StatusBadge } from '../atoms/StatusBadge';

interface SensorCardProps {
  label: string;
  value: number;
  unit: string;
  status: string;
  min: number;
  max: number;
}

/**
 * Molecule: Combines a gauge, sensor value, and status badge for a single metric.
 */
export const SensorCard: React.FC<SensorCardProps> = ({ label, value, unit, status, min, max }) => {
  return (
    <div className="card p-4 flex flex-col items-center gap-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
      <div className="w-full flex justify-between items-center mb-1">
        <span className="text-xs font-semibold uppercase tracking-wider opacity-60">{label}</span>
        <StatusBadge status={status} />
      </div>
      <GaugeRing value={value} min={min} max={max} />
      <SensorValue value={value} unit={unit} />
    </div>
  );
};
