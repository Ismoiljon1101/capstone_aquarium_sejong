import React from 'react';
import { StatusBadge } from '../atoms/StatusBadge';
import { History } from 'lucide-react';

interface FeederStatusProps {
  lastFed: string;
  nextScheduled?: string;
  status: string;
}

/**
 * Molecule: Displays feeder status, historical data, and scheduled actions.
 */
export const FeederStatus: React.FC<FeederStatusProps> = ({ lastFed, nextScheduled, status }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm opacity-70">
          <History className="w-4 h-4" />
          <span>Last fed:</span>
        </div>
        <span className="text-sm font-semibold">{lastFed}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm opacity-70">
          <History className="w-4 h-4" />
          <span>Next scheduled:</span>
        </div>
        <span className="text-sm font-semibold">{nextScheduled || 'Not set'}</span>
      </div>
      <div className="mt-1">
        <StatusBadge status={status} />
      </div>
    </div>
  );
};
