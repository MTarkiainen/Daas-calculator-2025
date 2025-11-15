
import React from 'react';

interface SegmentedControlOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, value, onChange, label }) => {
  return (
    <div className="flex items-center space-x-2">
      {label && <span className="text-sm font-medium text-gray-700">{label}:</span>}
      <div className="flex items-center bg-gray-200 p-1 rounded-lg">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none ${
              value === option.value
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-600 hover:bg-gray-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SegmentedControl;
