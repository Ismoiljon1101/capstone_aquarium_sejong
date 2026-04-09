import React from 'react';
import { Camera, ShieldCheck } from 'lucide-react';

interface FishCountBadgeProps {
  count: number;
  confidence: number;
  timestamp: string;
}

/**
 * Molecule: Displays AI fish counting results with confidence score and timestamp.
 */
export const FishCountBadge: React.FC<FishCountBadgeProps> = ({ count, confidence, timestamp }) => {
  return (
    <div className="glass p-3 rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Camera className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <div className="text-xs opacity-60">Fish Count</div>
          <div className="text-lg font-bold">{count} Individuals</div>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1 text-[10px] text-green-400">
          <ShieldCheck className="w-3 h-3" />
          {(confidence * 100).toFixed(0)}% Conf
        </div>
        <div className="text-[10px] opacity-40">{new Date(timestamp).toLocaleTimeString()}</div>
      </div>
    </div>
  );
};
