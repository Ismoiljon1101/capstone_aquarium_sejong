import React from 'react';
import { IconButton } from '../atoms/IconButton';
import * as LucideIcons from 'lucide-react';

interface ActuatorButtonProps {
  type: string;
  icon: keyof typeof LucideIcons;
  label: string;
  state: boolean;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Molecule: Combines an icon button with state-aware styling for hardware control.
 */
export const ActuatorButton: React.FC<ActuatorButtonProps> = ({ 
  type, 
  icon, 
  label, 
  state, 
  onClick, 
  disabled 
}) => {
  return (
    <div className="flex flex-col gap-2">
      <IconButton 
        icon={icon} 
        label={`${label}: ${state ? 'ON' : 'OFF'}`} 
        onClick={onClick}
        variant={state ? 'primary' : 'secondary'}
        disabled={disabled}
      />
    </div>
  );
};
