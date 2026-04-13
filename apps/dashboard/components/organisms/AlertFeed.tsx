import React from 'react';
import { useSocket } from '../../hooks/useSocket';
import { AlertBanner } from '../molecules/AlertBanner';
import { Bell } from 'lucide-react';

/**
 * Organism: Displays a feed of active alerts received via Socket.IO.
 */
export const AlertFeed: React.FC = () => {
  const { latestAlert } = useSocket();

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="w-5 h-5 text-yellow-400" />
        <h2 className="text-xl font-bold">Active Alerts</h2>
      </div>
      
      {latestAlert ? (
        <AlertBanner 
          message={latestAlert.message} 
          severity={latestAlert.severity} 
          onAcknowledge={() => console.log('Ack', latestAlert.alertId)}
        />
      ) : (
        <div className="text-sm opacity-40 italic py-4 text-center glass rounded-lg border border-dashed border-white/10">
          All systems nominal. No active alerts.
        </div>
      )}
    </section>
  );
};
