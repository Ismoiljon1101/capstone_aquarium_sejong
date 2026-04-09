import React from 'react';

interface StatusBadgeProps {
  status: 'ok' | 'warn' | 'critical' | 'good' | 'average' | 'alert' | string;
}

/**
 * Atom: A colored pill-style badge representing the health status.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toLowerCase();
  const colorClass = 
    normalized === 'ok' || normalized === 'good' ? 'status-good' :
    normalized === 'warn' || normalized === 'average' ? 'status-warning' : 'status-danger';

  return (
    <div className={`badge ${colorClass} text-[10px] px-2 py-0.5 uppercase font-bold tracking-wider`}>
      {status}
    </div>
  );
};
