import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconButtonProps {
  icon: keyof typeof LucideIcons;
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

/**
 * Atom: A reusable button with an icon and text.
 */
export const IconButton: React.FC<IconButtonProps> = ({ 
  icon, 
  label, 
  onClick, 
  variant = 'primary', 
  disabled = false 
}) => {
  const Icon = LucideIcons[icon] as any;
  const variantClass = 
    variant === 'primary' ? 'btn-primary' : 
    variant === 'secondary' ? 'btn-secondary' : 'btn-danger';

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`btn ${variantClass} btn-sm flex items-center gap-2 w-full justify-center transition-all active:scale-95`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span className="font-medium">{label}</span>
    </button>
  );
};
