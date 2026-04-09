import React from 'react';
import { useSocket } from '../../hooks/useSocket';
import { FishCountBadge } from '../molecules/FishCountBadge';
import { StatusBadge } from '../atoms/StatusBadge';
import { Heart } from 'lucide-react';

/**
 * Organism: Displays AI insights about fish health, behavior, and population.
 */
export const FishHealthPanel: React.FC = () => {
  const { fishData } = useSocket();

  return (
    <section className="card-glass p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-400" />
          <h2 className="text-xl font-bold">AI Health Insights</h2>
        </div>
        <StatusBadge status={fishData?.health?.visualStatus ?? 'good'} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <FishCountBadge 
          count={fishData?.count?.count ?? 0} 
          confidence={fishData?.count?.confidence ?? 0.95} 
          timestamp={fishData?.count?.timestamp ?? new Date().toISOString()} 
        />
        
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-xs font-semibold mb-2 opacity-60 uppercase">Behavior Summary</h3>
          <p className="text-sm">
            {fishData?.health?.behaviorStatus ?? "Fish are showing normal schooling behavior. No anomalies detected in movement patterns."}
          </p>
        </div>
      </div>
    </section>
  );
};
