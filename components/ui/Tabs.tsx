import React from 'react';

interface TabsProps {
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ children }) => {
  return (
    <div className="flex space-x-8 border-b border-slate-200">
      {children}
    </div>
  );
};

interface TabProps {
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

export const Tab: React.FC<TabProps> = ({ children, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-1 py-4 text-sm font-semibold border-b-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 rounded-t-sm
        ${
          isActive
            ? 'border-chg-active-blue text-chg-active-blue'
            : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
        }`}
    >
      {children}
    </button>
  );
};
