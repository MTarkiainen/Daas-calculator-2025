import React from 'react';

interface ToggleProps {
  isEnabled: boolean;
  onToggle: (isEnabled: boolean) => void;
  label: string;
}

export const Toggle: React.FC<ToggleProps> = ({ isEnabled, onToggle, label }) => {
  return (
    <label htmlFor="toggle" className="flex items-center cursor-pointer">
      <div className="relative">
        <input id="toggle" type="checkbox" className="sr-only" checked={isEnabled} onChange={() => onToggle(!isEnabled)} />
        <div className={`block w-10 h-6 rounded-full transition-colors ${isEnabled ? 'bg-brand-600' : 'bg-gray-300'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isEnabled ? 'translate-x-4' : ''}`}></div>
      </div>
      <div className="ml-3 text-sm text-gray-300 font-medium">
        {label}
      </div>
    </label>
  );
};