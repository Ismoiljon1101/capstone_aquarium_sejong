import React from 'react';

interface SensorValueProps {
  value: number | string;
  unit: string;
}

/**
 * Atom: Displays a sensor reading value and its unit.
 */
export const SensorValue: React.FC<SensorValueProps> = ({ value, unit }) => {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-bold text-gradient">
        {typeof value === 'number' ? value.toFixed(2) : value}
      </span>
      <span className="text-sm font-medium opacity-70" style={{ color: "rgb(var(--text-secondary))" }}>
        {unit}
      </span>
    </div>
  );
};
