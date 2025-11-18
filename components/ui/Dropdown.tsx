import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // This function will be passed to children to close the dropdown
  const closeDropdown = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {/* FIX: Property 'onClick' does not exist on type 'unknown'.
                Safely access the original onClick prop by casting to any and checking its type,
                then wrap it to ensure the dropdown closes after the action. */}
            {React.Children.map(children, child => {
              if (React.isValidElement(child)) {
                const originalOnClick = (child.props as any)?.onClick;
                return React.cloneElement(child, {
                  onClick: () => {
                    if (typeof originalOnClick === 'function') {
                      originalOnClick();
                    }
                    closeDropdown();
                  },
                });
              }
              return child;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface DropdownItemProps {
  onClick: () => void;
  children: ReactNode;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({ onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      role="menuitem"
    >
      {children}
    </button>
  );
};
