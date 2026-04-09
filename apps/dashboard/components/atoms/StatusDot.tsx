import React from 'react';

interface StatusDotProps {
  status: 'ok' | 'warn' | 'critical' | string;
}

/**
 * Atom: A pulsing dot indicator for live connection or critical alerts.
 */
export const StatusDot: React.FC<StatusDotProps> = ({ status }) => {
  const colorClass = 
    status === 'ok' ? 'bg-green-400' :
    status === 'warn' ? 'bg-yellow-400' : 'bg-red-500';

  return (
    <div className="relative flex h-3 w-3">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorClass} opacity-75`}></span>
      <span className={`relative inline-flex rounded-full h-3 w-3 ${colorClass}`}></span>
    </div>
  );
};
