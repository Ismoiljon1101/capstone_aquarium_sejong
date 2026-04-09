import React from 'react';

interface GaugeRingProps {
  value: number;
  min: number;
  max: number;
  color?: string;
}

/**
 * Atom: A simple circular ring SVG to represent a metric relative to its min/max.
 */
export const GaugeRing: React.FC<GaugeRingProps> = ({ value, min, max, color = "rgb(var(--accent-primary))" }) => {
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  const strokeDasharray = `${percentage}, 100`;

  return (
    <div className="relative w-16 h-16">
      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
        <path
          className="stroke-white/10"
          strokeWidth="3.8"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          style={{ stroke: color }}
          strokeDasharray={strokeDasharray}
          strokeWidth="3.8"
          strokeLinecap="round"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
    </div>
  );
};
