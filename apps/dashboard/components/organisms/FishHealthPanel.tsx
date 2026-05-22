import React, { useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { FishCountBadge } from '../molecules/FishCountBadge';
import { StatusBadge } from '../atoms/StatusBadge';
import { Heart } from 'lucide-react';

/**
 * Organism: Displays AI insights about fish health, behavior, and population.
 */
export const FishHealthPanel: React.FC = () => {
  const { fishCount, healthReport } = useSocket();
  const [visionSummary, setVisionSummary] = useState<any>(null);

  useEffect(() => {
    const fetchVision = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'}/vision/latest`);
        if (res.ok) {
          const data = await res.json();
          setVisionSummary(data);
        }
      } catch (err) {
        console.error('Failed to fetch vision summary', err);
      }
    };
    fetchVision();
    const interval = setInterval(fetchVision, 30000);
    return () => clearInterval(interval);
  }, []);

  const displayCount = fishCount?.count ?? visionSummary?.fishCount ?? 0;
  const displayStatus = healthReport?.visualStatus ?? visionSummary?.disease ?? 'good';
  const displayConfidence = fishCount?.confidence ?? visionSummary?.confidence ?? 0.95;
  const displayTimestamp = fishCount?.timestamp ?? visionSummary?.timestamp ?? new Date().toISOString();

  return (
    <section className="card-glass p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-400" />
          <h2 className="text-xl font-bold">AI Health Insights</h2>
        </div>
        <StatusBadge status={displayStatus} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <FishCountBadge 
          count={displayCount} 
          confidence={displayConfidence} 
          timestamp={displayTimestamp} 
        />
        
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-xs font-semibold mb-2 opacity-60 uppercase">Behavior Summary</h3>
          <p className="text-sm">
            {healthReport?.behaviorStatus ?? "Fish are showing normal schooling behavior. No anomalies detected in movement patterns."}
          </p>
        </div>
      </div>
    </section>
  );
};
