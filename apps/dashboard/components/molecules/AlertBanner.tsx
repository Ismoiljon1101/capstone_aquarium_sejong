import React from 'react';
import { StatusDot } from '../atoms/StatusDot';
import { X } from 'lucide-react';

interface AlertBannerProps {
  message: string;
  severity: string;
  onAcknowledge?: () => void;
}

/**
 * Molecule: A banner for active alerts with a pulsing dot and acknowledge action.
 */
export const AlertBanner: React.FC<AlertBannerProps> = ({ message, severity, onAcknowledge }) => {
  const isCritical = severity.toLowerCase() === 'critical' || severity.toLowerCase() === 'emergency';
  
  return (
    <div className={`p-3 rounded-lg flex items-center justify-between gap-3 animate-pulse-slow ${
      isCritical ? 'bg-red-500/20 border border-red-500/50' : 'bg-yellow-500/20 border border-yellow-500/50'
    }`}>
      <div className="flex items-center gap-3">
        <StatusDot status={isCritical ? 'critical' : 'warn'} />
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onAcknowledge && (
        <button onClick={onAcknowledge} className="p-1 hover:bg-white/10 rounded">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
