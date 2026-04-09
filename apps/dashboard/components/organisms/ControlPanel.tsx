import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { ActuatorButton } from '../molecules/ActuatorButton';
import { FeederStatus } from '../molecules/FeederStatus';
import { Settings2 } from 'lucide-react';

/**
 * Organism: Provides hardware control for feeder, pump, and LED.
 */
export const ControlPanel: React.FC = () => {
  const { triggerFeed, triggerActuator } = useApi();
  const [states, setStates] = useState({ pump: false, led: false });

  const handleFeed = async () => {
    await triggerFeed(3);
  };

  const handleToggle = async (type: 'pump' | 'led', id: number) => {
    const newState = !states[type];
    await triggerActuator(id, type.toUpperCase(), newState);
    setStates(prev => ({ ...prev, [type]: newState }));
  };

  return (
    <section className="card-glass p-6 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Settings2 className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-bold">Hardware Controls</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <ActuatorButton 
            type="FEEDER" 
            icon="Activity" 
            label="Manual Feed" 
            state={false} 
            onClick={handleFeed} 
          />
          <FeederStatus lastFed="10:30 AM" status="ok" />
        </div>
        
        <div className="space-y-3">
          <ActuatorButton 
            type="AIR_PUMP" 
            icon="Wind" 
            label="Air Pump" 
            state={states.pump} 
            onClick={() => handleToggle('pump', 2)} 
          />
          <ActuatorButton 
            type="LED_STRIP" 
            icon="Lightbulb" 
            label="Lighting" 
            state={states.led} 
            onClick={() => handleToggle('led', 3)} 
          />
        </div>
      </div>
    </section>
  );
};
